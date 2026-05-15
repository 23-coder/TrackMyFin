package com.financetracker.controller;

import com.financetracker.entity.Budget;
import com.financetracker.entity.User;
import com.financetracker.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    public ResponseEntity<Budget> createBudget(@Valid @RequestBody Budget budget,
                                             Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        budget.setUser(user);
        Budget savedBudget = budgetService.createBudget(budget);
        return ResponseEntity.ok(savedBudget);
    }

    @GetMapping
    public ResponseEntity<List<Budget>> getUserBudgets(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Budget> budgets = budgetService.getUserBudgets(user);
        return ResponseEntity.ok(budgets);
    }

    @GetMapping("/active")
    public ResponseEntity<List<Budget>> getActiveBudgets(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Budget> budgets = budgetService.getActiveBudgets(user);
        return ResponseEntity.ok(budgets);
    }

    @GetMapping("/current")
    public ResponseEntity<List<Budget>> getCurrentBudgets(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Budget> budgets = budgetService.getCurrentBudgets(user);
        return ResponseEntity.ok(budgets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Budget> getBudget(@PathVariable Long id) {
        return budgetService.getBudgetById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Budget> updateBudget(@PathVariable Long id,
                                             @Valid @RequestBody Budget budget,
                                             Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return budgetService.getBudgetById(id)
                .filter(existingBudget -> existingBudget.getUser().getId().equals(user.getId()))
                .map(existingBudget -> {
                    budget.setId(id);
                    budget.setUser(user);
                    return ResponseEntity.ok(budgetService.updateBudget(budget));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(@PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return budgetService.getBudgetById(id)
                .filter(budget -> budget.getUser().getId().equals(user.getId()))
                .map(budget -> {
                    budgetService.deleteBudget(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
