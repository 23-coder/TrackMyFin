package com.financetracker;

import com.financetracker.entity.Budget;
import com.financetracker.entity.User;
import com.financetracker.repository.BudgetRepository;
import com.financetracker.service.BudgetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class BudgetServiceTest {

    @Mock BudgetRepository budgetRepository;
    @InjectMocks BudgetService budgetService;

    private User user;
    private Budget budget;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");

        budget = new Budget();
        budget.setId(1L);
        budget.setName("Monthly Groceries");
        budget.setAmount(BigDecimal.valueOf(5000));
        budget.setSpentAmount(BigDecimal.valueOf(1500));
        budget.setPeriod(Budget.BudgetPeriod.MONTHLY);
        budget.setStartDate(LocalDate.now().withDayOfMonth(1));
        budget.setEndDate(LocalDate.now().withDayOfMonth(1).plusMonths(1).minusDays(1));
        budget.setActive(true);
        budget.setUser(user);
    }

    @Test
    void createBudget_savesAndReturns() {
        doReturn(budget).when(budgetRepository).save(budget);

        Budget result = budgetService.createBudget(budget);

        assertThat(result).isEqualTo(budget);
        verify(budgetRepository).save(budget);
    }

    @Test
    void getUserBudgets_returnsAllBudgetsForUser() {
        List<Budget> expected = List.of(budget);
        when(budgetRepository.findByUserOrderByStartDateDesc(user)).thenReturn(expected);

        List<Budget> result = budgetService.getUserBudgets(user);

        assertThat(result).isEqualTo(expected);
        verify(budgetRepository).findByUserOrderByStartDateDesc(user);
    }

    @Test
    void getActiveBudgets_returnsOnlyActiveBudgets() {
        List<Budget> expected = List.of(budget);
        when(budgetRepository.findByUserAndIsActiveTrueOrderByStartDateDesc(user)).thenReturn(expected);

        List<Budget> result = budgetService.getActiveBudgets(user);

        assertThat(result).isEqualTo(expected);
        verify(budgetRepository).findByUserAndIsActiveTrueOrderByStartDateDesc(user);
    }

    @Test
    void getCurrentBudgets_passesTodayDateCorrectly() {
        LocalDate today = LocalDate.now();
        List<Budget> expected = List.of(budget);
        when(budgetRepository.findByUserAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                user, today, today)).thenReturn(expected);

        List<Budget> result = budgetService.getCurrentBudgets(user);

        assertThat(result).isEqualTo(expected);
    }

    @Test
    void getBudgetById_returnsOptionalWhenFound() {
        when(budgetRepository.findById(1L)).thenReturn(Optional.of(budget));

        Optional<Budget> result = budgetService.getBudgetById(1L);

        assertThat(result).isPresent().contains(budget);
    }

    @Test
    void getBudgetById_returnsEmptyWhenNotFound() {
        when(budgetRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Budget> result = budgetService.getBudgetById(99L);

        assertThat(result).isEmpty();
    }

    @Test
    void updateBudget_savesAndReturns() {
        doReturn(budget).when(budgetRepository).save(budget);

        Budget result = budgetService.updateBudget(budget);

        assertThat(result).isEqualTo(budget);
        verify(budgetRepository).save(budget);
    }

    @Test
    void deleteBudget_delegatesToRepository() {
        doNothing().when(budgetRepository).deleteById(1L);

        budgetService.deleteBudget(1L);

        verify(budgetRepository).deleteById(1L);
    }

    @Test
    void budget_getRemainingAmount_calculatesCorrectly() {
        // 5000 - 1500 = 3500
        assertThat(budget.getRemainingAmount()).isEqualByComparingTo(BigDecimal.valueOf(3500));
    }

    @Test
    void budget_getSpentPercentage_calculatesCorrectly() {
        // 1500 / 5000 = 30%
        assertThat(budget.getSpentPercentage()).isEqualTo(30.0);
    }

    @Test
    void budget_getSpentPercentage_returnsZeroWhenAmountIsZero() {
        budget.setAmount(BigDecimal.ZERO);
        assertThat(budget.getSpentPercentage()).isEqualTo(0.0);
    }
}
