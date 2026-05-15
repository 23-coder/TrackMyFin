package com.financetracker.service;

import com.financetracker.dto.DashboardStatsResponse;
import com.financetracker.dto.ExpenseChartResponse;
import com.financetracker.dto.MonthlyData;
import com.financetracker.dto.CategoryExpenseData;
import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import com.financetracker.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final TransactionRepository transactionRepository;
    private final SalaryService salaryService;

    public DashboardStatsResponse getDashboardStats(User user) {
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1).minusSeconds(1);

        return getDashboardStats(user, startOfMonth, endOfMonth);
    }

    public DashboardStatsResponse getDashboardStats(User user, LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Calculating dashboard stats for user: {} from {} to {}", user.getEmail(), startDate, endDate);

        // Total stats (all time)
        BigDecimal totalIncome = getTotalIncome(user);
        BigDecimal totalExpenses = getTotalExpenses(user);
        BigDecimal totalBalance = totalIncome.subtract(totalExpenses);

        // Selected range stats
        BigDecimal monthlyIncome = getIncomeByDateRange(user, startDate, endDate);
        BigDecimal monthlyExpenses = getExpensesByDateRange(user, startDate, endDate);
        
        log.info("📊 FINAL CALCULATIONS - Total Income: {}, Monthly Income: {}, Monthly Expenses: {}, Total Balance: {}", 
                totalIncome, monthlyIncome, monthlyExpenses, totalBalance);

        // Calculate savings rate
        double savingsRate = 0.0;
        if (monthlyIncome.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal savings = monthlyIncome.subtract(monthlyExpenses);
            savingsRate = savings.divide(monthlyIncome, 4, RoundingMode.HALF_UP)
                               .multiply(BigDecimal.valueOf(100))
                               .doubleValue();
        }

        return DashboardStatsResponse.builder()
                .totalBalance(totalBalance.doubleValue())
                .monthlyIncome(monthlyIncome.doubleValue())
                .monthlyExpenses(monthlyExpenses.doubleValue())
                .savingsRate(savingsRate)
                .build();
    }

    public ExpenseChartResponse getExpenseChartData(User user, String range) {
        log.info("Getting expense chart data for user: {} with range: {}", user.getEmail(), range);

        LocalDateTime startDate = getStartDateForRange(range);
        List<Transaction> transactions = transactionRepository
                .findByUserAndTransactionDateBetweenOrderByTransactionDateDesc(user, startDate, LocalDateTime.now());

        // Generate monthly data
        List<MonthlyData> monthlyData = generateMonthlyData(transactions, range);
        
        // Generate category data
        List<CategoryExpenseData> categoryData = generateCategoryData(transactions);

        return ExpenseChartResponse.builder()
                .monthlyData(monthlyData)
                .categoryData(categoryData)
                .build();
    }

    public List<String> getSmartInsights(User user) {
        DashboardStatsResponse stats = getDashboardStats(user);

        List<Transaction> transactions = transactionRepository.findByUserOrderByTransactionDateDesc(user);
        List<Transaction> expenses = transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
                .collect(Collectors.toList());

        List<String> insights = new ArrayList<>();

        String topCategoryInsight = getTopCategoryInsight(expenses);
        if (topCategoryInsight != null) {
            insights.add(topCategoryInsight);
        }

        insights.add(String.format("You are saving %.1f%% of your monthly income", stats.getSavingsRate()));

        String recommendation = getRecommendation(stats.getSavingsRate(), expenses);
        insights.add(recommendation);

        return insights;
    }

    private String getTopCategoryInsight(List<Transaction> expenses) {
        if (expenses.isEmpty()) {
            return "No expense data yet. Start adding expenses to unlock personalized insights";
        }

        Optional<Map.Entry<String, Double>> topCategory = expenses.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getCategory() != null ? t.getCategory().getName() : "Uncategorized",
                        Collectors.summingDouble(t -> t.getAmount().doubleValue())
                ))
                .entrySet()
                .stream()
                .max(Map.Entry.comparingByValue());

        return topCategory
                .map(entry -> entry.getKey() + " is your highest spending category")
                .orElse(null);
    }

    private String getRecommendation(double savingsRate, List<Transaction> expenses) {
        if (savingsRate < 10) {
            return "Your savings rate is low. Consider reducing discretionary spending this month";
        }

        if (savingsRate < 30) {
            return "Good progress. Try increasing your savings by automating a fixed transfer";
        }

        if (expenses.isEmpty()) {
            return "Great start. Keep tracking expenses consistently to maintain your savings";
        }

        Optional<String> topCategory = expenses.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getCategory() != null ? t.getCategory().getName() : "Uncategorized",
                        Collectors.summingDouble(t -> t.getAmount().doubleValue())
                ))
                .entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey);

        return topCategory
                .map(category -> "Try reducing " + category + " expenses to save more")
                .orElse("You are on track. Keep following your current budget strategy");
    }

    private LocalDateTime getStartDateForRange(String range) {
        LocalDateTime now = LocalDateTime.now();
        return switch (range.toLowerCase()) {
            case "12m" -> now.minusMonths(12);
            case "ytd" -> now.withMonth(1).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            default -> now.minusMonths(6); // Default to 6 months
        };
    }

    private List<MonthlyData> generateMonthlyData(List<Transaction> transactions, String range) {
        Map<String, MonthlyData> monthlyMap = new TreeMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");

        // Initialize months with zero values
        LocalDateTime start = getStartDateForRange(range);
        LocalDateTime current = start;
        while (!current.isAfter(LocalDateTime.now())) {
            String monthKey = current.format(formatter);
            monthlyMap.put(monthKey, MonthlyData.builder()
                    .month(monthKey)
                    .amount(0.0)
                    .build());
            current = current.plusMonths(1);
        }

        // Populate with actual expense data
        transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
                .forEach(transaction -> {
                    String monthKey = transaction.getTransactionDate().format(formatter);
                    if (monthlyMap.containsKey(monthKey)) {
                        MonthlyData existing = monthlyMap.get(monthKey);
                        existing.setAmount(existing.getAmount() + transaction.getAmount().doubleValue());
                    }
                });

        return new ArrayList<>(monthlyMap.values());
    }

    private List<CategoryExpenseData> generateCategoryData(List<Transaction> transactions) {
        // Get expense transactions only
        List<Transaction> expenses = transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
                .collect(Collectors.toList());

        if (expenses.isEmpty()) {
            return new ArrayList<>();
        }

        // Calculate total expenses
        double totalExpenses = expenses.stream()
                .mapToDouble(t -> t.getAmount().doubleValue())
                .sum();

        // Group by category and calculate percentages
        Map<String, Double> categoryTotals = expenses.stream()
                .collect(Collectors.groupingBy(
                    t -> t.getCategory() != null ? t.getCategory().getName() : "Uncategorized",
                    Collectors.summingDouble(t -> t.getAmount().doubleValue())
                ));

        return categoryTotals.entrySet().stream()
                .map(entry -> {
                    double percentage = (entry.getValue() / totalExpenses) * 100;
                    return CategoryExpenseData.builder()
                            .name(entry.getKey())
                            .amount(entry.getValue())
                            .percentage(Math.round(percentage * 100.0) / 100.0) // Round to 2 decimal places
                            .build();
                })
                .sorted((a, b) -> Double.compare(b.getAmount(), a.getAmount())) // Sort by amount descending
                .collect(Collectors.toList());
    }

    private BigDecimal getTotalIncome(User user) {
        // Get income from transactions
        BigDecimal transactionIncome = transactionRepository.sumAmountByUserAndType(user, Transaction.TransactionType.INCOME);
        if (transactionIncome == null) {
            transactionIncome = BigDecimal.ZERO;
        }
        
        // Get income from salaries
        BigDecimal salaryIncome = salaryService.getTotalSalaries(user);
        if (salaryIncome == null) {
            salaryIncome = BigDecimal.ZERO;
        }
        
        log.debug("Total income calculation for user {}: transactions={}, salaries={}, total={}", 
                 user.getEmail(), transactionIncome, salaryIncome, transactionIncome.add(salaryIncome));
        
        return transactionIncome.add(salaryIncome);
    }

    private BigDecimal getTotalExpenses(User user) {
        BigDecimal total = transactionRepository.sumAmountByUserAndType(user, Transaction.TransactionType.EXPENSE);
        return total != null ? total : BigDecimal.ZERO;
    }

    private BigDecimal getIncomeByDateRange(User user, LocalDateTime startDate, LocalDateTime endDate) {
        // Get income from transactions
        BigDecimal transactionIncome = transactionRepository.sumAmountByUserAndTypeAndDateBetween(
                user, Transaction.TransactionType.INCOME, startDate, endDate);
        if (transactionIncome == null) {
            transactionIncome = BigDecimal.ZERO;
        }
        
        // Get income from salaries in the date range
        BigDecimal salaryIncome = salaryService.getSalariesByDateRange(user, startDate, endDate);
        if (salaryIncome == null) {
            salaryIncome = BigDecimal.ZERO;
        }
        
        log.debug("Income calculation for user {} from {} to {}: transactions={}, salaries={}, total={}", 
                 user.getEmail(), startDate, endDate, transactionIncome, salaryIncome, transactionIncome.add(salaryIncome));
        
        return transactionIncome.add(salaryIncome);
    }

    private BigDecimal getExpensesByDateRange(User user, LocalDateTime startDate, LocalDateTime endDate) {
        BigDecimal total = transactionRepository.sumAmountByUserAndTypeAndDateBetween(
                user, Transaction.TransactionType.EXPENSE, startDate, endDate);
        return total != null ? total : BigDecimal.ZERO;
    }
}