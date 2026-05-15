package com.financetracker.controller;

import com.financetracker.dto.DashboardStatsResponse;
import com.financetracker.dto.ExpenseChartResponse;
import com.financetracker.entity.User;
import com.financetracker.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Getting dashboard stats for user: {}", user.getEmail());

            DashboardStatsResponse stats;
            if (startDate != null && endDate != null) {
                if (startDate.isAfter(endDate)) {
                    return ResponseEntity.badRequest().build();
                }

                LocalDateTime startDateTime = startDate.atStartOfDay();
                LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay().minusSeconds(1);
                stats = dashboardService.getDashboardStats(user, startDateTime, endDateTime);
            } else {
                stats = dashboardService.getDashboardStats(user);
            }

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting dashboard stats: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/expenses-chart")
    public ResponseEntity<ExpenseChartResponse> getExpenseChart(
            @RequestParam(defaultValue = "6m") String range,
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Getting expense chart for user: {} with range: {}", user.getEmail(), range);
            
            ExpenseChartResponse chartData = dashboardService.getExpenseChartData(user, range);
            return ResponseEntity.ok(chartData);
        } catch (Exception e) {
            log.error("Error getting expense chart: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/insights")
    public ResponseEntity<Map<String, List<String>>> getSmartInsights(Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Getting smart insights for user: {}", user.getEmail());

            List<String> insights = dashboardService.getSmartInsights(user);
            return ResponseEntity.ok(Map.of("insights", insights));
        } catch (Exception e) {
            log.error("Error getting smart insights: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("insights", Collections.emptyList()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Dashboard API is running");
    }
}