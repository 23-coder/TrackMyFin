package com.financetracker.controller;

import com.financetracker.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@Slf4j
@RequiredArgsConstructor
public class HealthController {

    private final GeminiService geminiService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        log.info("Health check requested");
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now());
        response.put("service", "Finance Tracker API");
        response.put("version", "1.0.0");
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health/gemini")
    public ResponseEntity<Map<String, Object>> geminiHealthCheck() {
        log.info("Gemini health check requested");
        Map<String, Object> response = geminiService.getGeminiHealthStatus();
        String status = (String) response.get("status");
        if ("UP".equalsIgnoreCase(status)) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
}