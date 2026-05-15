package com.financetracker.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class VoiceTransactionDTO {

    private Double amount;
    private String type;
    private String category;
    private String description;
    private String date;
}

