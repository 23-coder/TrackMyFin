package com.financetracker.repository;

import com.financetracker.entity.Salary;
import com.financetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SalaryRepository extends JpaRepository<Salary, Long> {

    List<Salary> findByUserOrderBySalaryDateDesc(User user);

    List<Salary> findByUserAndSalaryDateBetweenOrderBySalaryDateDesc(User user, LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT SUM(s.amount) FROM Salary s WHERE s.user = :user")
    BigDecimal sumAmountByUser(@Param("user") User user);

    @Query("SELECT SUM(s.amount) FROM Salary s WHERE s.user = :user AND s.salaryDate BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByUserAndDateBetween(@Param("user") User user, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}