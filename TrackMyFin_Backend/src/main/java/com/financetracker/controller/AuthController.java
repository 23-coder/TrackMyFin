package com.financetracker.controller;

import com.financetracker.dto.AuthResponse;
import com.financetracker.dto.LoginRequest;
import com.financetracker.dto.RegisterRequest;
import com.financetracker.entity.Currency;
import com.financetracker.entity.User;
import com.financetracker.security.JwtUtil;
import com.financetracker.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @GetMapping("/currencies")
    public ResponseEntity<List<Map<String, String>>> getCurrencies() {
        List<Map<String, String>> currencies = Arrays.stream(Currency.values())
            .map(c -> Map.of(
                "code", c.name(),
                "displayName", c.getDisplayName(),
                "symbol", c.getSymbol(),
                "displayValue", c.getDisplayValue()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(currencies);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = new User();
            user.setEmail(request.getEmail());
            // Password will be encoded in createUser
            user.setPassword(request.getPassword());
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setPhoneNumber(request.getPhoneNumber());
            
            // Set currency from request, default to USD
            try {
                user.setCurrency(Currency.valueOf(request.getCurrency() != null ? request.getCurrency() : "USD"));
            } catch (IllegalArgumentException e) {
                user.setCurrency(Currency.USD);
            }

            User savedUser = userService.createUser(user);
            String token = jwtUtil.generateToken(savedUser);

            AuthResponse response = new AuthResponse(
                token,
                savedUser.getEmail(),
                savedUser.getFirstName(),
                savedUser.getLastName(),
                savedUser.getCurrency().name(),
                "User registered successfully"
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new AuthResponse(null, null, null, null, null, e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            // Load User entity from DB after authentication
            Optional<User> userOpt = userService.findByEmail(request.getEmail());
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new AuthResponse(null, null, null, null, null, "User not found"));
            }
            User user = userOpt.get();
            String token = jwtUtil.generateToken(user);
            AuthResponse response = new AuthResponse(
                token,
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getCurrency().name(),
                "Login successful"
            );
            return ResponseEntity.ok(response);
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            return ResponseEntity.status(401)
                .body(new AuthResponse(null, null, null, null, null, "Invalid email or password"));
        } catch (org.springframework.security.authentication.DisabledException e) {
            return ResponseEntity.status(401)
                .body(new AuthResponse(null, null, null, null, null, "Account is disabled"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new AuthResponse(null, null, null, null, null, "Login failed: " + e.getMessage()));
        }
    }
}
