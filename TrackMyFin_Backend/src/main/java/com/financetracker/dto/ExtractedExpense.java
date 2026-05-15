package com.financetracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExtractedExpense {
    private String description;
    private BigDecimal amount;
    private String category;  // e.g., "Grocery", "Restaurant", "Electronics"
    private LocalDate date;
    private String merchant;  // Store/Restaurant name
}
