package com.financetracker.controller;

import com.financetracker.dto.SalaryRequest;
import com.financetracker.dto.SalaryResponse;
import com.financetracker.entity.Salary;
import com.financetracker.entity.User;
import com.financetracker.service.SalaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/salaries")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class SalaryController {

    private final SalaryService salaryService;

    @PostMapping
    public ResponseEntity<SalaryResponse> createSalary(@Valid @RequestBody SalaryRequest request,
                                                     Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Creating salary for user: {}", user.getEmail());

            Salary salary = new Salary();
            salary.setAmount(request.getAmount());
            salary.setDescription(request.getDescription());
            salary.setSalaryDate(request.getDate() != null ? request.getDate() : LocalDateTime.now());
            salary.setUser(user);

            Salary savedSalary = salaryService.createSalary(salary);
            return ResponseEntity.ok(mapToResponse(savedSalary));
        } catch (Exception e) {
            log.error("Error creating salary: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<SalaryResponse>> getUserSalaries(Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Getting salaries for user: {}", user.getEmail());

            List<Salary> salaries = salaryService.getUserSalaries(user);
            List<SalaryResponse> responses = salaries.stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("Error getting salaries: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaryResponse> getSalary(@PathVariable Long id, Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            
            return salaryService.getSalaryById(id)
                    .filter(salary -> salary.getUser().getId().equals(user.getId()))
                    .map(salary -> ResponseEntity.ok(mapToResponse(salary)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error getting salary: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalaryResponse> updateSalary(@PathVariable Long id,
                                                     @Valid @RequestBody SalaryRequest request,
                                                     Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            
            return salaryService.getSalaryById(id)
                    .filter(existingSalary -> existingSalary.getUser().getId().equals(user.getId()))
                    .map(existingSalary -> {
                        existingSalary.setAmount(request.getAmount());
                        existingSalary.setDescription(request.getDescription());
                        if (request.getDate() != null) {
                            existingSalary.setSalaryDate(request.getDate());
                        }
                        
                        Salary updatedSalary = salaryService.updateSalary(existingSalary);
                        return ResponseEntity.ok(mapToResponse(updatedSalary));
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error updating salary: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSalary(@PathVariable Long id, Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            
            return salaryService.getSalaryById(id)
                    .filter(salary -> salary.getUser().getId().equals(user.getId()))
                    .map(salary -> {
                        salaryService.deleteSalary(id);
                        return ResponseEntity.ok().<Void>build();
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error deleting salary: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    private SalaryResponse mapToResponse(Salary salary) {
        return SalaryResponse.builder()
                .id(salary.getId().toString())
                .amount(salary.getAmount())
                .description(salary.getDescription())
                .date(salary.getSalaryDate())
                .build();
    }
}