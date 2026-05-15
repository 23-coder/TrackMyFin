package com.financetracker;

import com.financetracker.entity.Category;
import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class TransactionServiceTest {

    @Mock TransactionRepository transactionRepository;
    @Mock CategoryRepository categoryRepository;
    @InjectMocks TransactionService transactionService;

    private User user;
    private Category category;
    private Transaction transaction;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");

        category = new Category();
        category.setId(10L);
        category.setName("Food");
        category.setType(Category.CategoryType.EXPENSE);

        transaction = new Transaction();
        transaction.setId(1L);
        transaction.setAmount(BigDecimal.valueOf(500));
        transaction.setType(Transaction.TransactionType.EXPENSE);
        transaction.setCategory(category);
        transaction.setUser(user);
        transaction.setTransactionDate(LocalDateTime.now());
    }

    @Test
    void createTransaction_savesAndReturns() {
        when(categoryRepository.findById(10L)).thenReturn(Optional.of(category));
        doReturn(transaction).when(transactionRepository).save(transaction);

        Transaction result = transactionService.createTransaction(transaction);

        assertThat(result).isEqualTo(transaction);
        verify(transactionRepository).save(transaction);
    }

    @Test
    void createTransaction_throwsWhenCategoryNotFound() {
        when(categoryRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.createTransaction(transaction))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Category not found");
    }

    @Test
    void getUserTransactions_returnsOrderedList() {
        List<Transaction> expected = List.of(transaction);
        when(transactionRepository.findByUserOrderByTransactionDateDesc(user)).thenReturn(expected);

        List<Transaction> result = transactionService.getUserTransactions(user);

        assertThat(result).isEqualTo(expected);
        verify(transactionRepository).findByUserOrderByTransactionDateDesc(user);
    }

    @Test
    void getTotalIncome_returnsValueFromRepository() {
        when(transactionRepository.sumAmountByUserAndType(user, Transaction.TransactionType.INCOME))
                .thenReturn(BigDecimal.valueOf(10000));

        BigDecimal result = transactionService.getTotalIncome(user);

        assertThat(result).isEqualByComparingTo(BigDecimal.valueOf(10000));
    }

    @Test
    void getTotalIncome_returnsZeroWhenRepositoryReturnsNull() {
        when(transactionRepository.sumAmountByUserAndType(user, Transaction.TransactionType.INCOME))
                .thenReturn(null);

        BigDecimal result = transactionService.getTotalIncome(user);

        assertThat(result).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void getTotalExpenses_returnsZeroWhenRepositoryReturnsNull() {
        when(transactionRepository.sumAmountByUserAndType(user, Transaction.TransactionType.EXPENSE))
                .thenReturn(null);

        BigDecimal result = transactionService.getTotalExpenses(user);

        assertThat(result).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void getNetBalance_subtractsExpensesFromIncome() {
        when(transactionRepository.sumAmountByUserAndType(user, Transaction.TransactionType.INCOME))
                .thenReturn(BigDecimal.valueOf(10000));
        when(transactionRepository.sumAmountByUserAndType(user, Transaction.TransactionType.EXPENSE))
                .thenReturn(BigDecimal.valueOf(3000));

        BigDecimal result = transactionService.getNetBalance(user);

        assertThat(result).isEqualByComparingTo(BigDecimal.valueOf(7000));
    }

    @Test
    void deleteTransaction_delegatesToRepository() {
        doNothing().when(transactionRepository).deleteById(1L);

        transactionService.deleteTransaction(1L);

        verify(transactionRepository).deleteById(1L);
    }

    @Test
    void updateTransaction_savesAndReturns() {
        when(categoryRepository.findById(10L)).thenReturn(Optional.of(category));
        doReturn(transaction).when(transactionRepository).save(transaction);

        Transaction result = transactionService.updateTransaction(transaction);

        assertThat(result).isEqualTo(transaction);
        verify(transactionRepository).save(transaction);
    }

    @Test
    void getTransactionById_returnsOptional() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(transaction));

        Optional<Transaction> result = transactionService.getTransactionById(1L);

        assertThat(result).isPresent().contains(transaction);
    }

    @Test
    void getUserTransactionsByDateRange_delegatesCorrectly() {
        LocalDateTime start = LocalDateTime.now().minusDays(30);
        LocalDateTime end = LocalDateTime.now();
        List<Transaction> expected = List.of(transaction);
        when(transactionRepository.findByUserAndTransactionDateBetweenOrderByTransactionDateDesc(user, start, end))
                .thenReturn(expected);

        List<Transaction> result = transactionService.getUserTransactionsByDateRange(user, start, end);

        assertThat(result).isEqualTo(expected);
    }
}
