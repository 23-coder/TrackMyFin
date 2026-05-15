package com.financetracker.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VoiceExpenseRequest {

    @NotBlank(message = "text is required")
    private String text;
}

