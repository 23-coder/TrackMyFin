package com.financetracker.service;

import com.financetracker.entity.Salary;
import com.financetracker.entity.User;
import com.financetracker.repository.SalaryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SalaryService {

    private final SalaryRepository salaryRepository;

    public Salary createSalary(Salary salary) {
        log.info("Creating salary: {}", salary.getDescription());
        return salaryRepository.save(salary);
    }

    public List<Salary> getUserSalaries(User user) {
        log.info("Getting salaries for user: {}", user.getEmail());
        return salaryRepository.findByUserOrderBySalaryDateDesc(user);
    }

    public List<Salary> getUserSalariesByDateRange(User user, LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Getting salaries for user: {} between {} and {}", user.getEmail(), startDate, endDate);
        return salaryRepository.findByUserAndSalaryDateBetweenOrderBySalaryDateDesc(user, startDate, endDate);
    }

    public Optional<Salary> getSalaryById(Long id) {
        return salaryRepository.findById(id);
    }

    public Salary updateSalary(Salary salary) {
        log.info("Updating salary: {}", salary.getId());
        return salaryRepository.save(salary);
    }

    public void deleteSalary(Long id) {
        log.info("Deleting salary: {}", id);
        salaryRepository.deleteById(id);
    }

    public BigDecimal getTotalSalaries(User user) {
        log.info("🔍 Getting total salaries for user: {}", user.getEmail());
        BigDecimal total = salaryRepository.sumAmountByUser(user);
        log.info("💰 Total salaries found: {}", total);
        return total != null ? total : BigDecimal.ZERO;
    }

    public BigDecimal getSalariesByDateRange(User user, LocalDateTime startDate, LocalDateTime endDate) {
        log.info("🔍 Getting salaries for user: {} between {} and {}", user.getEmail(), startDate, endDate);
        BigDecimal total = salaryRepository.sumAmountByUserAndDateBetween(user, startDate, endDate);
        log.info("💰 Monthly salaries found: {}", total);
        return total != null ? total : BigDecimal.ZERO;
    }
}