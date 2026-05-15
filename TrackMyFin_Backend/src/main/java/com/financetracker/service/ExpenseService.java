package com.financetracker.service;

import com.financetracker.dto.BillExtractResponse;
import com.financetracker.dto.ExpenseSummaryResponse;
import com.financetracker.dto.ExtractedExpense;
import com.financetracker.entity.Expense;
import com.financetracker.entity.User;
import com.financetracker.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class ExpenseService {

    private final GeminiService geminiService;
    private final ExpenseRepository expenseRepository;

    public List<Expense> extractAndSaveExpensesFromBill(User user, String billImage) {
        if (billImage == null || billImage.isBlank()) {
            throw new IllegalArgumentException("Bill image is required");
        }

        String rawImage = billImage.trim();
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
        }

        BillExtractResponse response = geminiService.extractExpensesFromBill(base64Image, mimeType);
        if (response == null || !response.isSuccess()) {
            String message = response != null ? response.getMessage() : "Unable to process bill";
            throw new IllegalStateException(message);
        }

        List<Expense> toSave = response.getExpenses().stream()
                .filter(exp -> exp != null && exp.getAmount() != null && exp.getAmount().signum() > 0)
                .map(exp -> mapExtractedExpense(user, exp, response.getMerchant()))
                .toList();

        if (toSave.isEmpty()) {
            throw new IllegalStateException("No valid expense found in bill");
        }

        return expenseRepository.saveAll(toSave);
    }

    @Transactional(readOnly = true)
    public ExpenseSummaryResponse getCurrentMonthSummary(User user) {
        LocalDateTime start = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime end = start.plusMonths(1).minusNanos(1);

        BigDecimal total = expenseRepository.sumAmountByUserAndDateBetween(user, start, end);
        List<Object[]> rawCategorySums = expenseRepository.sumAmountByCategoryForUserAndDateBetween(user, start, end);

        Map<String, Double> categoryWiseBreakdown = new LinkedHashMap<>();
        for (Object[] row : rawCategorySums) {
            String category = row[0] == null || row[0].toString().isBlank() ? "Other" : row[0].toString();
            BigDecimal amount = (BigDecimal) row[1];
            categoryWiseBreakdown.put(category, amount.doubleValue());
        }

        return new ExpenseSummaryResponse(total.doubleValue(), categoryWiseBreakdown);
    }

    private Expense mapExtractedExpense(User user, ExtractedExpense extracted, String merchant) {
        Expense expense = new Expense();
        expense.setUser(user);
        expense.setTitle(resolveTitle(extracted, merchant));
        expense.setAmount(extracted.getAmount());
        expense.setDate(extracted.getDate() != null ? extracted.getDate().atStartOfDay() : LocalDateTime.now());
        expense.setCategory(normalizeCategory(extracted.getCategory()));
        expense.setSource("BILL_UPLOAD");
        expense.setCreatedAt(LocalDateTime.now());
        return expense;
    }

    private String resolveTitle(ExtractedExpense extracted, String merchant) {
        if (extracted.getDescription() != null && !extracted.getDescription().isBlank()) {
            return extracted.getDescription().trim();
        }
        if (merchant != null && !merchant.isBlank()) {
            return merchant.trim();
        }
        return "Expense from bill";
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return "Other";
        }
        String normalized = category.trim();
        String lower = normalized.toLowerCase();

        if (lower.contains("food") || lower.contains("restaurant") || lower.contains("cafe")) {
            return "Food";
        }
        if (lower.contains("grocery") || lower.contains("supermarket")) {
            return "Grocery";
        }
        if (lower.contains("travel") || lower.contains("transport") || lower.contains("fuel") || lower.contains("taxi")) {
            return "Travel";
        }
        if (lower.contains("shop") || lower.contains("clothes") || lower.contains("electronic")) {
            return "Shopping";
        }
        if (lower.contains("medical") || lower.contains("pharmacy") || lower.contains("hospital")) {
            return "Medical";
        }

        return "Other";
    }
}

