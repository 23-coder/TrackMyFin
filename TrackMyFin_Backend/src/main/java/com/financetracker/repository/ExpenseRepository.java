package com.financetracker.repository;

import com.financetracker.entity.Expense;
import com.financetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUserAndDateBetweenOrderByDateDesc(User user, LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.user = :user AND e.date BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByUserAndDateBetween(@Param("user") User user,
                                             @Param("startDate") LocalDateTime startDate,
                                             @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COALESCE(e.category, 'Other'), COALESCE(SUM(e.amount), 0) " +
            "FROM Expense e WHERE e.user = :user AND e.date BETWEEN :startDate AND :endDate " +
            "GROUP BY e.category ORDER BY COALESCE(SUM(e.amount), 0) DESC")
    List<Object[]> sumAmountByCategoryForUserAndDateBetween(@Param("user") User user,
                                                             @Param("startDate") LocalDateTime startDate,
                                                             @Param("endDate") LocalDateTime endDate);
}

