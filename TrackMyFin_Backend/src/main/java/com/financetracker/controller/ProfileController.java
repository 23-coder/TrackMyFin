package com.financetracker.controller;

import com.financetracker.dto.ProfileRequest;
import com.financetracker.dto.ProfileResponse;
import com.financetracker.entity.User;
import com.financetracker.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProfileController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userService.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            ProfileResponse response = new ProfileResponse(
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getAddress(),
                user.getDateOfBirth(),
                user.getBio()
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new ProfileResponse(null, null, null, null, null, null, null, 
                      "Error retrieving profile: " + e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            @Valid @RequestBody ProfileRequest request,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userService.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            
            // Check if email is changing and if new email already exists
            if (!user.getEmail().equals(request.getEmail()) && 
                userService.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest()
                    .body(new ProfileResponse(null, null, null, null, null, null, null, 
                          "Email already exists"));
            }
            
            // Handle password change if provided
            if (request.getCurrentPassword() != null && request.getNewPassword() != null) {
                if (!userService.verifyPassword(user, request.getCurrentPassword())) {
                    return ResponseEntity.badRequest()
                        .body(new ProfileResponse(null, null, null, null, null, null, null, 
                              "Current password is incorrect"));
                }
                
                if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                    return ResponseEntity.badRequest()
                        .body(new ProfileResponse(null, null, null, null, null, null, null, 
                              "New passwords do not match"));
                }
                
                userService.changePassword(user, request.getNewPassword());
            }
            
            // Update profile information
            User updatedUser = userService.updateProfile(user, 
                request.getFirstName(),
                request.getLastName(),
                request.getEmail(),
                request.getPhone(),
                request.getAddress(),
                request.getDateOfBirth(),
                request.getBio()
            );
            
            ProfileResponse response = new ProfileResponse(
                updatedUser.getFirstName(),
                updatedUser.getLastName(),
                updatedUser.getEmail(),
                updatedUser.getPhoneNumber(),
                updatedUser.getAddress(),
                updatedUser.getDateOfBirth(),
                updatedUser.getBio(),
                "Profile updated successfully"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new ProfileResponse(null, null, null, null, null, null, null, 
                      "Error updating profile: " + e.getMessage()));
        }
    }
}