package com.financetracker.controller;

import com.financetracker.dto.TransactionDTO;
import com.financetracker.dto.VoiceExpenseRequest;
import com.financetracker.entity.User;
import com.financetracker.service.VoiceExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VoiceExpenseController {

    private final VoiceExpenseService voiceExpenseService;

    @PostMapping("/voice-expense")
    public ResponseEntity<TransactionDTO> createVoiceExpense(
            @Valid @RequestBody VoiceExpenseRequest request,
            Authentication authentication) {

        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        TransactionDTO savedTransaction = voiceExpenseService.createTransactionFromVoice(request.getText(), user);
        return ResponseEntity.ok(savedTransaction);
    }
}

