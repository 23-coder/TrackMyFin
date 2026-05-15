package com.financetracker.controller;

import com.financetracker.dto.BillExtractRequest;
import com.financetracker.dto.BillExtractResponse;
import com.financetracker.dto.ExtractedExpense;
import com.financetracker.entity.Category;
import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import com.financetracker.service.CategoryService;
import com.financetracker.service.GeminiService;
import com.financetracker.service.TransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class BillController {

    private final GeminiService geminiService;
    private final TransactionService transactionService;
    private final CategoryService categoryService;

    @PostMapping({"", "/extract"})
    public ResponseEntity<BillExtractResponse> extractExpensesFromBill(
            @RequestBody BillExtractRequest request,
            Authentication authentication) {

        if (request == null || request.getBillImage() == null || request.getBillImage().isBlank()) {
            log.warn("Empty bill image received");
            return ResponseEntity.badRequest()
                    .body(new BillExtractResponse(
                            new ArrayList<>(),
                            null,
                            "Bill image is required",
                            false
                    ));
        }

        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            log.warn("Unauthorized bill extraction attempt");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new BillExtractResponse(
                            new ArrayList<>(),
                            null,
                            "Authentication is required",
                            false
                    ));
        }

        try {
            log.info("Processing bill extraction request for user {}", user.getEmail());

            String rawImage = request.getBillImage().trim();
            String base64Image = rawImage;
            String mimeType = "image/jpeg";

            if (rawImage.startsWith("data:image")) {
                int mimeEnd = rawImage.indexOf(';');
                int dataStart = rawImage.indexOf(',');
                if (mimeEnd > 5) {
                    mimeType = rawImage.substring(5, mimeEnd);
                }
                if (dataStart > -1 && dataStart + 1 < rawImage.length()) {
                    base64Image = rawImage.substring(dataStart + 1);
                }
                log.info("Detected image MIME type: {}", mimeType);
            }

            BillExtractResponse aiResponse = geminiService.extractExpensesFromBill(base64Image, mimeType);
            if (aiResponse == null) {
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                        .body(new BillExtractResponse(
                                new ArrayList<>(),
                                null,
                                "Unable to extract bill details",
                                false
                        ));
            }

            if (!aiResponse.isSuccess()) {
                log.warn("Bill extraction failed: {}", aiResponse.getMessage());
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(aiResponse);
            }

            List<ExtractedExpense> extractedExpenses = aiResponse.getExpenses() != null
                    ? aiResponse.getExpenses()
                    : new ArrayList<>();

            int importedCount = importExpensesForUser(user, extractedExpenses, aiResponse.getMerchant());
            if (importedCount == 0) {
                log.warn("Bill extraction succeeded but no expense could be imported");
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                        .body(new BillExtractResponse(
                                extractedExpenses,
                                aiResponse.getMerchant(),
                                "Bill read successfully, but no valid expense could be imported.",
                                false
                        ));
            }

            String message = "Bill processed successfully. Imported " + importedCount + " expense(s) to your dashboard.";
            log.info("Bill extraction successful: {} extracted, {} imported", extractedExpenses.size(), importedCount);
            return ResponseEntity.ok(new BillExtractResponse(
                    extractedExpenses,
                    aiResponse.getMerchant(),
                    message,
                    true
            ));
        } catch (Exception e) {
            log.error("Error in bill extraction: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new BillExtractResponse(
                            new ArrayList<>(),
                            null,
                            "Error processing bill: " + e.getMessage(),
                            false
                    ));
        }
    }

    private int importExpensesForUser(User user, List<ExtractedExpense> expenses, String merchant) {
        int importedCount = 0;
        for (ExtractedExpense expense : expenses) {
            try {
                if (expense == null || expense.getAmount() == null || expense.getAmount().signum() <= 0) {
                    continue;
                }

                Transaction transaction = new Transaction();
                transaction.setUser(user);
                transaction.setType(Transaction.TransactionType.EXPENSE);
                transaction.setAmount(expense.getAmount());
                transaction.setDescription(
                        expense.getDescription() != null && !expense.getDescription().isBlank()
                                ? expense.getDescription().trim()
                                : "Expense from bill"
                );
                transaction.setTransactionDate(
                        expense.getDate() != null ? expense.getDate().atStartOfDay() : LocalDateTime.now()
                );
                transaction.setNotes("Auto-imported from bill"
                        + (merchant != null && !merchant.isBlank() ? " - " + merchant : "")
                        + (expense.getCategory() != null && !expense.getCategory().isBlank()
                        ? " (AI category: " + expense.getCategory() + ")"
                        : ""));

                resolveCategory(expense.getCategory()).ifPresent(transaction::setCategory);

                transactionService.createTransaction(transaction);
                importedCount++;
            } catch (Exception ex) {
                log.warn("Skipping one extracted expense due to import error: {}", ex.getMessage());
            }
        }
        return importedCount;
    }

    private Optional<Category> resolveCategory(String aiCategory) {
        if (aiCategory != null && !aiCategory.isBlank()) {
            String normalized = aiCategory.trim();
            Optional<Category> exact = categoryService
                    .findByNameAndTypeIgnoreCase(normalized, Category.CategoryType.EXPENSE);
            if (exact.isPresent()) {
                return exact;
            }

            String lower = normalized.toLowerCase(Locale.ROOT);
            if (lower.contains("grocery") || lower.contains("food") || lower.contains("restaurant")) {
                return categoryService.findByNameAndTypeIgnoreCase("Food", Category.CategoryType.EXPENSE);
            }
            if (lower.contains("transport") || lower.contains("taxi") || lower.contains("fuel")
                    || lower.contains("bus") || lower.contains("train")) {
                return categoryService.findByNameAndTypeIgnoreCase("Transportation", Category.CategoryType.EXPENSE);
            }
            if (lower.contains("health") || lower.contains("medical") || lower.contains("pharmacy")) {
                return categoryService.findByNameAndTypeIgnoreCase("Healthcare", Category.CategoryType.EXPENSE);
            }
            if (lower.contains("bill") || lower.contains("utility") || lower.contains("electric")
                    || lower.contains("water") || lower.contains("internet")) {
                return categoryService.findByNameAndTypeIgnoreCase("Bills", Category.CategoryType.EXPENSE);
            }
            if (lower.contains("shop") || lower.contains("electronic") || lower.contains("clothes")) {
                return categoryService.findByNameAndTypeIgnoreCase("Shopping", Category.CategoryType.EXPENSE);
            }
            if (lower.contains("movie") || lower.contains("game") || lower.contains("entertain")) {
                return categoryService.findByNameAndTypeIgnoreCase("Entertainment", Category.CategoryType.EXPENSE);
            }
        }

        return categoryService.getFallbackExpenseCategory();
    }
}
