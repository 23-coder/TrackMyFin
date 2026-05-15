package com.financetracker.service;

import com.financetracker.dto.BillExtractResponse;
import com.financetracker.dto.ExtractedExpense;
import com.financetracker.dto.VoiceTransactionDTO;
import com.financetracker.exception.InvalidGeminiResponseException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
public class GeminiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String modelName;

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1/models/{model}:generateContent";

    // Max retries on 429 rate-limit responses
    private static final int MAX_RETRIES = 3;

    public GeminiService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public BillExtractResponse extractExpensesFromBill(String base64Image, String mimeType) {
        try {
            String effectiveApiKey = apiKey != null ? apiKey.trim() : "";
            if (effectiveApiKey.isEmpty() || "your-gemini-api-key-here".equalsIgnoreCase(effectiveApiKey)) {
                log.error("Gemini API key is missing or placeholder value is configured");
                return errorResponse("Gemini API key is missing. Configure gemini.api.key or GEMINI_API_KEY and retry.");
            }

            log.info("Starting expense extraction from bill image [{}] using model: {}", mimeType, modelName);

            // Decode base64 to validate format
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);

            String prompt = """
                    You are an expert financial document parser.

                    From this bill image, extract:
                    1) title -> store or merchant name
                    2) amount -> final payable amount (prefer GRAND TOTAL, then TOTAL, then AMOUNT PAID)
                    3) date -> transaction date in YYYY-MM-DD
                    4) category -> one of Food, Grocery, Travel, Shopping, Medical, Other

                    Rules:
                    - Prefer GRAND TOTAL over subtotal.
                    - Ignore GST/tax breakdown lines.
                    - If multiple dates exist, choose transaction date.
                    - Return strict JSON only (no markdown, no extra text).

                    Output format:
                    {
                      "title": "",
                      "amount": 0,
                      "date": "",
                      "category": ""
                    }
                    """;

            String responseText = callGeminiAPIWithRetry(prompt, imageBytes, mimeType, effectiveApiKey);
            log.info("Gemini API response received, parsing...");
            return parseGeminiResponse(responseText);

        } catch (IllegalArgumentException e) {
            log.error("Invalid base64 image: {}", e.getMessage());
            return errorResponse("Invalid image format. Please upload a valid PNG or JPG file.");

        } catch (GeminiQuotaException e) {
            log.error("Gemini quota exceeded: {}", e.getMessage());
            return errorResponse(
                "Gemini API quota exceeded (free tier limit reached). " +
                "Please wait a few minutes and try again, or upgrade your Google AI API plan."
            );

        } catch (Exception e) {
            log.error("Error extracting expenses from bill: {}", e.getMessage(), e);
            return errorResponse("Error processing bill: " + e.getMessage());
        }
    }

    public Map<String, Object> getGeminiHealthStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("service", "gemini");
        status.put("model", modelName);
        status.put("timestamp", LocalDateTime.now());

        String effectiveApiKey = apiKey != null ? apiKey.trim() : "";
        boolean keyConfigured = !effectiveApiKey.isEmpty()
                && !"your-gemini-api-key-here".equalsIgnoreCase(effectiveApiKey);
        status.put("apiKeyConfigured", keyConfigured);

        if (!keyConfigured) {
            status.put("status", "DOWN");
            status.put("apiReachable", false);
            status.put("message", "Gemini API key is missing. Set GEMINI_API_KEY or gemini.api.key.");
            return status;
        }

        try {
            pingGemini(effectiveApiKey);
            status.put("status", "UP");
            status.put("apiReachable", true);
            status.put("message", "Gemini API is reachable.");
        } catch (Exception e) {
            status.put("status", "DOWN");
            status.put("apiReachable", false);
            status.put("message", e.getMessage());
        }

        return status;
    }

    public VoiceTransactionDTO parseVoiceTransaction(String userInput) {
        String input = userInput != null ? userInput.trim() : "";
        if (input.isEmpty()) {
            throw new InvalidGeminiResponseException("Voice input text is empty.");
        }

        String effectiveApiKey = apiKey != null ? apiKey.trim() : "";
        if (effectiveApiKey.isEmpty() || "your-gemini-api-key-here".equalsIgnoreCase(effectiveApiKey)) {
            throw new IllegalStateException("Gemini API key is missing. Configure gemini.api.key or GEMINI_API_KEY.");
        }

        String prompt = """
                Convert the following sentence into structured financial transaction JSON.

                Sentence: %s

                Return ONLY valid JSON in this format:
                {
                "amount": number,
                "type": "income" or "expense",
                "category": string,
                "description": string,
                "date": string (YYYY-MM-DD)
                }

                Rules:

                * 'spent', 'paid', 'bought' -> expense
                * 'received', 'earned', 'salary' -> income
                * Detect category automatically (Food, Travel, Shopping, Bills, etc.)
                * If date is not mentioned, use today's date
                * Do not return explanation, only JSON
                """.formatted(input);

        try {
            String responseText = callGeminiTextAPIWithRetry(prompt, effectiveApiKey);
            String jsonString = extractJsonFromResponse(responseText);

            VoiceTransactionDTO dto = objectMapper.readValue(jsonString, VoiceTransactionDTO.class);
            validateVoiceTransactionDto(dto);
            normalizeVoiceTransactionDto(dto);
            return dto;
        } catch (InvalidGeminiResponseException e) {
            throw e;
        } catch (Exception e) {
            throw new InvalidGeminiResponseException("Gemini returned invalid JSON for voice expense.", e);
        }
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /**
     * Calls the Gemini API with exponential-backoff retry on 429 responses.
     */
    private String callGeminiAPIWithRetry(String prompt, byte[] imageBytes, String mimeType, String effectiveApiKey) throws Exception {
        int attempt = 0;
        long waitMs = 2000; // start at 2 s

        while (attempt < MAX_RETRIES) {
            try {
                return callGeminiAPI(prompt, imageBytes, mimeType, effectiveApiKey);
            } catch (HttpClientErrorException.TooManyRequests e) {
                attempt++;
                log.warn("Gemini rate limit hit (attempt {}/{}). Retrying in {}ms...", attempt, MAX_RETRIES, waitMs);
                if (attempt >= MAX_RETRIES) {
                    throw new GeminiQuotaException(
                        "Gemini API free-tier quota exhausted after " + MAX_RETRIES + " retries."
                    );
                }
                Thread.sleep(waitMs);
                waitMs *= 2; // exponential backoff
            } catch (HttpClientErrorException e) {
                // Other 4xx errors — parse the message cleanly
                String friendlyMessage = extractGeminiError(e.getResponseBodyAsString());
                log.error("Gemini API error {}: {}", e.getStatusCode(), friendlyMessage);
                throw new RuntimeException("Gemini API error: " + friendlyMessage);
            }
        }
        throw new GeminiQuotaException("Gemini API quota exceeded.");
    }

    private String callGeminiAPI(String prompt, byte[] imageBytes, String mimeType, String effectiveApiKey) throws Exception {
        String url = GEMINI_API_URL.replace("{model}", modelName);

        Map<String, Object> requestBody = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();

        Map<String, Object> content = new HashMap<>();
        List<Map<String, Object>> parts = new ArrayList<>();

        // Text prompt
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);
        parts.add(textPart);

        // Image (re-encode only once, from already-decoded bytes)
        Map<String, Object> imagePart = new HashMap<>();
        Map<String, Object> inlineData = new HashMap<>();
        inlineData.put("mime_type", mimeType); // use actual detected type (webp, png, jpeg, etc.)
        inlineData.put("data", Base64.getEncoder().encodeToString(imageBytes));
        imagePart.put("inline_data", inlineData);
        parts.add(imagePart);

        content.put("parts", parts);
        contents.add(content);
        requestBody.put("contents", contents);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", effectiveApiKey);

        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);
        String response = restTemplate.postForObject(url, entity, String.class);

        log.debug("Gemini raw response: {}", response);

        return extractTextFromGeminiResponse(response);
    }

    private String callGeminiTextAPIWithRetry(String prompt, String effectiveApiKey) throws Exception {
        int attempt = 0;
        long waitMs = 2000;

        while (attempt < MAX_RETRIES) {
            try {
                return callGeminiTextAPI(prompt, effectiveApiKey);
            } catch (HttpClientErrorException.TooManyRequests e) {
                attempt++;
                log.warn("Gemini rate limit hit for voice parsing (attempt {}/{}). Retrying in {}ms...",
                        attempt, MAX_RETRIES, waitMs);
                if (attempt >= MAX_RETRIES) {
                    throw new GeminiQuotaException("Gemini API free-tier quota exhausted after retries.");
                }
                Thread.sleep(waitMs);
                waitMs *= 2;
            } catch (HttpClientErrorException e) {
                String friendlyMessage = extractGeminiError(e.getResponseBodyAsString());
                throw new RuntimeException("Gemini API error: " + friendlyMessage);
            }
        }
        throw new GeminiQuotaException("Gemini API quota exceeded.");
    }

    private String callGeminiTextAPI(String prompt, String effectiveApiKey) throws Exception {
        String encodedApiKey = URLEncoder.encode(effectiveApiKey, StandardCharsets.UTF_8);
        String url = GEMINI_API_URL.replace("{model}", modelName) + "?key=" + encodedApiKey;

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(textPart));
        requestBody.put("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);
        String response = restTemplate.postForObject(url, entity, String.class);
        log.debug("Gemini raw voice response: {}", response);
        return extractTextFromGeminiResponse(response);
    }

    private String extractTextFromGeminiResponse(String response) throws Exception {
        JsonNode jsonResponse = objectMapper.readTree(response);
        if (jsonResponse.has("candidates") && jsonResponse.get("candidates").isArray()) {
            JsonNode candidate = jsonResponse.get("candidates").get(0);
            if (candidate.has("content") && candidate.get("content").has("parts")) {
                JsonNode textNode = candidate.get("content").get("parts").get(0);
                if (textNode.has("text")) {
                    return textNode.get("text").asText();
                }
            }
        }

        throw new Exception("Unable to extract text from Gemini API response");
    }

    private void pingGemini(String effectiveApiKey) throws Exception {
        String url = GEMINI_API_URL.replace("{model}", modelName);

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", "Reply with OK only.");

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(textPart));
        requestBody.put("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", effectiveApiKey);

        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);
        String response = restTemplate.postForObject(url, entity, String.class);
        if (response == null || response.isBlank()) {
            throw new RuntimeException("Gemini API returned empty response.");
        }
    }

    /**
     * Extracts a clean error message from a Gemini error JSON body.
     */
    private String extractGeminiError(String errorBody) {
        try {
            JsonNode root = objectMapper.readTree(errorBody);
            JsonNode error = root.get("error");
            if (error != null) {
                int code = error.has("code") ? error.get("code").asInt() : 0;
                String message = error.has("message") ? error.get("message").asText() : errorBody;
                if (code == 429) {
                    return "Gemini API free-tier quota exceeded. Please wait and try again.";
                }
                if (message.toLowerCase().contains("api key not found")
                        || message.toLowerCase().contains("api key not valid")
                        || message.toLowerCase().contains("invalid api key")) {
                    return "Gemini API key is missing or invalid. Check gemini.api.key and Google AI Studio key restrictions.";
                }
                // Return just the first sentence to avoid dumping the full error
                int dotIdx = message.indexOf('.');
                return dotIdx > 0 ? message.substring(0, dotIdx + 1) : message;
            }
        } catch (Exception ignored) {
            // fallback below
        }
        // As last resort, truncate raw body
        return errorBody.length() > 200 ? errorBody.substring(0, 200) + "..." : errorBody;
    }

    private BillExtractResponse parseGeminiResponse(String responseText) {
        try {
            log.info("Parsing Gemini response...");
            String jsonString = extractJsonFromResponse(responseText);
            log.debug("Extracted JSON: {}", jsonString);

            JsonNode root = objectMapper.readTree(jsonString);

            // Preferred strict schema:
            // {"title":"...","amount":123.45,"date":"YYYY-MM-DD","category":"Food"}
            if (root.has("title") || root.has("amount") || root.has("category")) {
                String title = root.has("title") && !root.get("title").isNull()
                        ? root.get("title").asText().trim()
                        : null;
                String category = root.has("category") && !root.get("category").isNull()
                        ? root.get("category").asText().trim()
                        : "Other";
                String dateStr = root.has("date") && !root.get("date").isNull()
                        ? root.get("date").asText().trim()
                        : null;

                BigDecimal amount = BigDecimal.ZERO;
                if (root.has("amount") && !root.get("amount").isNull()) {
                    amount = new BigDecimal(root.get("amount").asText());
                }

                if (amount.signum() <= 0) {
                    return errorResponse("No valid amount found in bill. Please enter details manually.");
                }

                LocalDate parsedDate;
                try {
                    parsedDate = (dateStr != null && !dateStr.isBlank())
                            ? LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE)
                            : LocalDate.now();
                } catch (Exception ignored) {
                    parsedDate = LocalDate.now();
                }

                ExtractedExpense extracted = new ExtractedExpense();
                extracted.setDescription(title != null && !title.isBlank() ? title : "Expense from bill");
                extracted.setAmount(amount);
                extracted.setCategory(category != null && !category.isBlank() ? category : "Other");
                extracted.setDate(parsedDate);
                extracted.setMerchant(title);

                List<ExtractedExpense> expenses = new ArrayList<>();
                expenses.add(extracted);

                return new BillExtractResponse(
                        expenses,
                        title,
                        "Bill processed successfully. Found 1 expense.",
                        true
                );
            }

            String merchant = root.has("merchant") && !root.get("merchant").isNull()
                    ? root.get("merchant").asText() : null;
            String dateStr  = root.has("date") && !root.get("date").isNull()
                    ? root.get("date").asText() : null;

            List<ExtractedExpense> expenses = new ArrayList<>();
            JsonNode expensesNode = root.get("expenses");
            if (expensesNode != null && expensesNode.isArray()) {
                for (JsonNode expNode : expensesNode) {
                    ExtractedExpense extracted = new ExtractedExpense();
                    extracted.setDescription(
                        expNode.has("description") ? expNode.get("description").asText() : "Unknown item");
                    extracted.setAmount(expNode.has("amount")
                        ? new BigDecimal(expNode.get("amount").asText()) : BigDecimal.ZERO);
                    extracted.setCategory(
                        expNode.has("category") ? expNode.get("category").asText() : "Other");
                    extracted.setMerchant(merchant);

                    // Parse date with fallback to today
                    try {
                        if (dateStr != null && !dateStr.isBlank()) {
                            extracted.setDate(LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE));
                        } else {
                            extracted.setDate(LocalDate.now());
                        }
                    } catch (Exception e) {
                        log.warn("Could not parse date '{}', defaulting to today", dateStr);
                        extracted.setDate(LocalDate.now());
                    }

                    expenses.add(extracted);
                }
            }

            if (expenses.isEmpty()) {
                log.warn("No expenses found in Gemini response");
                return errorResponse("No expenses could be extracted from the bill. Please enter details manually.");
            }

            return new BillExtractResponse(
                expenses,
                merchant,
                "Bill processed successfully. Found " + expenses.size() + " expense(s).",
                true
            );

        } catch (Exception e) {
            log.error("Error parsing Gemini response: {}", e.getMessage(), e);
            return errorResponse("Error parsing bill data. Please enter the details manually.");
        }
    }

    private String extractJsonFromResponse(String responseText) {
        // Strip markdown code blocks if Gemini wraps response in ```json ... ```
        String text = responseText.trim();
        if (text.startsWith("```")) {
            int firstNewline = text.indexOf('\n');
            int lastBacktick = text.lastIndexOf("```");
            if (firstNewline != -1 && lastBacktick > firstNewline) {
                text = text.substring(firstNewline + 1, lastBacktick).trim();
            }
        }
        // Find outer JSON object
        int startIdx = text.indexOf('{');
        int endIdx   = text.lastIndexOf('}');
        if (startIdx != -1 && endIdx != -1) {
            return text.substring(startIdx, endIdx + 1);
        }
        return text;
    }

    private void validateVoiceTransactionDto(VoiceTransactionDTO dto) {
        if (dto == null) {
            throw new InvalidGeminiResponseException("Gemini returned an empty payload.");
        }
        if (dto.getAmount() == null || dto.getAmount() <= 0) {
            throw new InvalidGeminiResponseException("Gemini response has invalid amount.");
        }

        String type = dto.getType() != null ? dto.getType().trim().toLowerCase(Locale.ROOT) : "";
        if (!"income".equals(type) && !"expense".equals(type)) {
            throw new InvalidGeminiResponseException("Gemini response has invalid transaction type.");
        }
    }

    private void normalizeVoiceTransactionDto(VoiceTransactionDTO dto) {
        dto.setType(dto.getType().trim().toLowerCase(Locale.ROOT));
        dto.setCategory(dto.getCategory() != null && !dto.getCategory().isBlank() ? dto.getCategory().trim() : "Other");
        dto.setDescription(dto.getDescription() != null && !dto.getDescription().isBlank() ? dto.getDescription().trim() : "Voice transaction");

        if (dto.getDate() == null || dto.getDate().isBlank()) {
            dto.setDate(LocalDate.now().toString());
            return;
        }

        try {
            LocalDate parsed = LocalDate.parse(dto.getDate().trim(), DateTimeFormatter.ISO_LOCAL_DATE);
            dto.setDate(parsed.toString());
        } catch (Exception e) {
            throw new InvalidGeminiResponseException("Gemini response contains invalid date format.");
        }
    }

    private BillExtractResponse errorResponse(String message) {
        return new BillExtractResponse(new ArrayList<>(), null, message, false);
    }

    // Marker exception for quota exhaustion
    private static class GeminiQuotaException extends RuntimeException {
        public GeminiQuotaException(String message) {
            super(message);
        }
    }
}
