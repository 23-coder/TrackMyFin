package com.financetracker.controller;

import com.financetracker.dto.BillExtractRequest;
import com.financetracker.dto.ExpenseSummaryResponse;
import com.financetracker.entity.Expense;
import com.financetracker.entity.User;
import com.financetracker.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping("/summary/current-month")
    public ResponseEntity<ExpenseSummaryResponse> getCurrentMonthSummary(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        ExpenseSummaryResponse summary = expenseService.getCurrentMonthSummary(user);
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/extract-and-save")
    public ResponseEntity<Map<String, Object>> extractAndSaveExpenses(
            @RequestBody BillExtractRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        if (request == null || request.getBillImage() == null || request.getBillImage().isBlank()) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Bill image is required");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            List<Expense> saved = expenseService.extractAndSaveExpensesFromBill(user, request.getBillImage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", saved.size());
            response.put("message", "Expenses extracted and saved successfully");
            response.put("expenses", saved);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("Failed to extract and save expenses from bill: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(error);
        }
    }
}

