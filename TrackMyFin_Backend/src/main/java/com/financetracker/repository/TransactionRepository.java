package com.financetracker.repository;

import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // Original method with JOIN FETCH to load categories eagerly
    @Query("SELECT t FROM Transaction t LEFT JOIN FETCH t.category WHERE t.user = :user ORDER BY t.transactionDate DESC")
    List<Transaction> findByUserOrderByTransactionDateDesc(@Param("user") User user);

    @Query("SELECT t FROM Transaction t LEFT JOIN FETCH t.category WHERE t.user = :user AND t.transactionDate BETWEEN :startDate AND :endDate ORDER BY t.transactionDate DESC")
    List<Transaction> findByUserAndTransactionDateBetweenOrderByTransactionDateDesc(
            @Param("user") User user, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user = :user AND t.type = :type")
    BigDecimal sumAmountByUserAndType(@Param("user") User user,
                                     @Param("type") Transaction.TransactionType type);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user = :user AND t.type = :type " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByUserAndTypeAndDateBetween(@Param("user") User user,
                                                   @Param("type") Transaction.TransactionType type,
                                                   @Param("startDate") LocalDateTime startDate,
                                                   @Param("endDate") LocalDateTime endDate);
}
