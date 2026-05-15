package com.financetracker.repository;

import com.financetracker.entity.Budget;
import com.financetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUserAndIsActiveTrueOrderByStartDateDesc(User user);

    List<Budget> findByUserOrderByStartDateDesc(User user);

    List<Budget> findByUserAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            User user, LocalDate endDate, LocalDate startDate);
}
