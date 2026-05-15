package com.financetracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BillExtractResponse {
    private List<ExtractedExpense> expenses;
    private String merchant;
    private String message;
    private boolean success;
}
