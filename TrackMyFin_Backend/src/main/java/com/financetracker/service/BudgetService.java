package com.financetracker.service;

import com.financetracker.entity.Budget;
import com.financetracker.entity.User;
import com.financetracker.repository.BudgetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;

    public Budget createBudget(Budget budget) {
        return budgetRepository.save(budget);
    }

    public List<Budget> getUserBudgets(User user) {
        return budgetRepository.findByUserOrderByStartDateDesc(user);
    }

    public List<Budget> getActiveBudgets(User user) {
        return budgetRepository.findByUserAndIsActiveTrueOrderByStartDateDesc(user);
    }

    public List<Budget> getCurrentBudgets(User user) {
        LocalDate today = LocalDate.now();
        return budgetRepository.findByUserAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                user, today, today);
    }

    public Optional<Budget> getBudgetById(Long id) {
        return budgetRepository.findById(id);
    }

    public Budget updateBudget(Budget budget) {
        return budgetRepository.save(budget);
    }

    public void deleteBudget(Long id) {
        budgetRepository.deleteById(id);
    }
}
