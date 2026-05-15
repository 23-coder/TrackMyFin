package com.financetracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseSummaryResponse {
    private double totalSpending;
    private Map<String, Double> categoryWiseBreakdown;
}

