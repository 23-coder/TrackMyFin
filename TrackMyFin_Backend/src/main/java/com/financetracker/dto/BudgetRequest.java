package com.financetracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BudgetRequest {
    private String name;
    private BigDecimal amount;
    private Long categoryId;
    private String period; // WEEKLY, MONTHLY, QUARTERLY, YEARLY
    private LocalDate startDate;
    private LocalDate endDate;
}
