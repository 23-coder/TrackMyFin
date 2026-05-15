package com.financetracker.controller;

import com.financetracker.dto.TransactionDTO;
import com.financetracker.dto.TransactionRequest;
import com.financetracker.entity.Category;
import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import com.financetracker.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<TransactionDTO> createTransaction(@Valid @RequestBody TransactionRequest request,
                                                       Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        
        // Convert TransactionRequest to Transaction entity
        Transaction transaction = new Transaction();
        transaction.setAmount(request.getAmount());
        transaction.setDescription(request.getDescription());
        transaction.setType(Transaction.TransactionType.valueOf(request.getType()));
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setNotes(request.getNotes());
        transaction.setUser(user);
        
        // Set category if provided
        if (request.getCategoryId() != null) {
            Category category = new Category();
            category.setId(request.getCategoryId());
            transaction.setCategory(category);
        }
        
        Transaction savedTransaction = transactionService.createTransaction(transaction);
        TransactionDTO dto = mapToDTO(savedTransaction);
        return ResponseEntity.ok(dto);
    }

    private TransactionDTO mapToDTO(Transaction transaction) {
        TransactionDTO dto = new TransactionDTO();
        dto.setId(transaction.getId());
        dto.setAmount(transaction.getAmount());
        dto.setDescription(transaction.getDescription());
        dto.setNotes(transaction.getNotes());
        dto.setTransactionDate(transaction.getTransactionDate());
        dto.setType(transaction.getType() != null ? transaction.getType().name() : null);
        dto.setCategoryId(transaction.getCategory() != null ? transaction.getCategory().getId() : null);
        dto.setCategoryName(transaction.getCategory() != null ? transaction.getCategory().getName() : null); // Add category name
        dto.setUserId(transaction.getUser() != null ? transaction.getUser().getId() : null);
        dto.setCreatedAt(transaction.getCreatedAt());
        dto.setUpdatedAt(transaction.getUpdatedAt());
        return dto;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<TransactionDTO>> getUserTransactions(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Transaction> transactions = transactionService.getUserTransactions(user);
        List<TransactionDTO> dtos = transactions.stream().map(this::mapToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<TransactionDTO>> getTransactionsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Transaction> transactions = transactionService.getUserTransactionsByDateRange(user, startDate, endDate);
        List<TransactionDTO> dtos = transactions.stream().map(this::mapToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionDTO> getTransaction(@PathVariable Long id) {
        return transactionService.getTransactionById(id)
                .map(transaction -> ResponseEntity.ok(mapToDTO(transaction)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionDTO> updateTransaction(@PathVariable Long id,
                                                       @Valid @RequestBody TransactionRequest request,
                                                       Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return transactionService.getTransactionById(id)
                .filter(existingTransaction -> existingTransaction.getUser().getId().equals(user.getId()))
                .map(existingTransaction -> {
                    // Update the existing transaction with new data
                    existingTransaction.setAmount(request.getAmount());
                    existingTransaction.setDescription(request.getDescription());
                    existingTransaction.setType(Transaction.TransactionType.valueOf(request.getType()));
                    existingTransaction.setTransactionDate(request.getTransactionDate());
                    existingTransaction.setNotes(request.getNotes());
                    
                    // Set category if provided
                    if (request.getCategoryId() != null) {
                        Category category = new Category();
                        category.setId(request.getCategoryId());
                        existingTransaction.setCategory(category);
                    } else {
                        existingTransaction.setCategory(null);
                    }
                    
                    Transaction updatedTransaction = transactionService.updateTransaction(existingTransaction);
                    return ResponseEntity.ok(mapToDTO(updatedTransaction));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return transactionService.getTransactionById(id)
                .filter(transaction -> transaction.getUser().getId().equals(user.getId()))
                .map(transaction -> {
                    transactionService.deleteTransaction(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, BigDecimal>> getTransactionSummary(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        BigDecimal totalIncome = transactionService.getTotalIncome(user);
        BigDecimal totalExpenses = transactionService.getTotalExpenses(user);
        BigDecimal netBalance = transactionService.getNetBalance(user);

        Map<String, BigDecimal> summary = Map.of(
                "totalIncome", totalIncome,
                "totalExpenses", totalExpenses,
                "netBalance", netBalance
        );

        return ResponseEntity.ok(summary);
    }
}
