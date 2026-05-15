package com.financetracker.service;

import com.financetracker.dto.TransactionDTO;
import com.financetracker.dto.VoiceTransactionDTO;
import com.financetracker.entity.Category;
import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class VoiceExpenseService {

    private final GeminiService geminiService;
    private final TransactionService transactionService;
    private final CategoryService categoryService;

    public TransactionDTO createTransactionFromVoice(String text, User user) {
        VoiceTransactionDTO parsed = geminiService.parseVoiceTransaction(text);

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setAmount(BigDecimal.valueOf(parsed.getAmount()));
        transaction.setType(resolveType(parsed.getType()));
        transaction.setDescription(parsed.getDescription());
        transaction.setTransactionDate(resolveDate(parsed.getDate()).atStartOfDay());
        transaction.setNotes("Auto-created from voice input");

        resolveCategory(parsed.getCategory(), transaction.getType()).ifPresent(transaction::setCategory);

        Transaction saved = transactionService.createTransaction(transaction);
        return toDto(saved);
    }

    private Transaction.TransactionType resolveType(String type) {
        String normalized = type != null ? type.trim().toLowerCase(Locale.ROOT) : "expense";
        return "income".equals(normalized) ? Transaction.TransactionType.INCOME : Transaction.TransactionType.EXPENSE;
    }

    private LocalDate resolveDate(String date) {
        if (date == null || date.isBlank()) {
            return LocalDate.now();
        }
        return LocalDate.parse(date.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
    }

    private Optional<Category> resolveCategory(String categoryName, Transaction.TransactionType type) {
        Category.CategoryType categoryType = type == Transaction.TransactionType.INCOME
                ? Category.CategoryType.INCOME
                : Category.CategoryType.EXPENSE;

        if (categoryName != null && !categoryName.isBlank()) {
            Optional<Category> direct = categoryService.findByNameAndTypeIgnoreCase(categoryName, categoryType);
            if (direct.isPresent()) {
                return direct;
            }
        }

        if (type == Transaction.TransactionType.INCOME) {
            return categoryService.findByNameAndTypeIgnoreCase("Salary", Category.CategoryType.INCOME)
                    .or(() -> categoryService.getCategoriesByType(Category.CategoryType.INCOME).stream().findFirst());
        }

        return categoryService.getFallbackExpenseCategory();
    }

    private TransactionDTO toDto(Transaction transaction) {
        TransactionDTO dto = new TransactionDTO();
        dto.setId(transaction.getId());
        dto.setAmount(transaction.getAmount());
        dto.setDescription(transaction.getDescription());
        dto.setNotes(transaction.getNotes());
        dto.setTransactionDate(transaction.getTransactionDate());
        dto.setType(transaction.getType() != null ? transaction.getType().name() : null);
        dto.setCategoryId(transaction.getCategory() != null ? transaction.getCategory().getId() : null);
        dto.setCategoryName(transaction.getCategory() != null ? transaction.getCategory().getName() : null);
        dto.setUserId(transaction.getUser() != null ? transaction.getUser().getId() : null);
        dto.setCreatedAt(transaction.getCreatedAt());
        dto.setUpdatedAt(transaction.getUpdatedAt());
        return dto;
    }
}


