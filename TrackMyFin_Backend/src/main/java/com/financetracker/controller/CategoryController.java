package com.financetracker.controller;

import com.financetracker.entity.Category;
import com.financetracker.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<?> createCategory(@Valid @RequestBody Category category) {
        try {
            log.info("Creating category: {}", category);

            // Set default values for required fields if not provided
            if (category.getColor() == null || category.getColor().trim().isEmpty()) {
                // Set default color based on category type
                category.setColor(category.getType() == Category.CategoryType.INCOME ? "#4CAF50" : "#FF5722");
            }

            if (category.getIcon() == null || category.getIcon().trim().isEmpty()) {
                // Set default icon based on category type
                category.setIcon(category.getType() == Category.CategoryType.INCOME ? "💰" : "💸");
            }

            // isDefault is a primitive boolean, so no need to check for null
            // It will default to false automatically

            Category savedCategory = categoryService.createCategory(category);
            return ResponseEntity.ok(savedCategory);
        } catch (Exception e) {
            log.error("Error creating category: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error creating category: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        List<Category> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<Category>> getCategoriesByType(@PathVariable Category.CategoryType type) {
        List<Category> categories = categoryService.getCategoriesByType(type);
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/default")
    public ResponseEntity<List<Category>> getDefaultCategories() {
        List<Category> categories = categoryService.getDefaultCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategory(@PathVariable Long id) {
        return categoryService.getCategoryById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Long id,
                                          @Valid @RequestBody Category category) {
        try {
            log.info("Updating category with id: {}, data: {}", id, category);

            return categoryService.getCategoryById(id)
                    .map(existingCategory -> {
                        // Set the ID to ensure we're updating the correct category
                        category.setId(id);

                        // Preserve required fields from existing category if not provided
                        if (category.getColor() == null || category.getColor().trim().isEmpty()) {
                            category.setColor(existingCategory.getColor());
                        }
                        if (category.getIcon() == null || category.getIcon().trim().isEmpty()) {
                            category.setIcon(existingCategory.getIcon());
                        }

                        // Preserve timestamps from existing category
                        category.setCreatedAt(existingCategory.getCreatedAt());
                        category.setDefault(existingCategory.isDefault());

                        Category updatedCategory = categoryService.updateCategory(category);
                        log.info("Successfully updated category: {}", updatedCategory);
                        return ResponseEntity.ok(updatedCategory);
                    })
                    .orElseGet(() -> {
                        log.warn("Category with id {} not found", id);
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            log.error("Error updating category with id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error updating category: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try {
            log.info("Attempting to delete category with id: {}", id);

            return categoryService.getCategoryById(id)
                    .map(category -> {
                        try {
                            categoryService.deleteCategory(id);
                            log.info("Successfully deleted category with id: {}", id);
                            return ResponseEntity.ok().body(new java.util.HashMap<String, String>() {{
                                put("message", "Category deleted successfully");
                                put("status", "success");
                            }});
                        } catch (org.springframework.dao.DataIntegrityViolationException e) {
                            log.warn("Cannot delete category with id {} due to foreign key constraint: {}", id, e.getMessage());
                            return ResponseEntity.badRequest().body(new java.util.HashMap<String, String>() {{
                                put("message", "Cannot delete category. It has associated transactions. Please delete all transactions in this category first.");
                                put("status", "error");
                                put("errorType", "FOREIGN_KEY_CONSTRAINT");
                            }});
                        } catch (Exception e) {
                            log.error("Unexpected error deleting category with id {}: {}", id, e.getMessage(), e);
                            return ResponseEntity.badRequest().body(new java.util.HashMap<String, String>() {{
                                put("message", "Failed to delete category: " + e.getMessage());
                                put("status", "error");
                                put("errorType", "UNKNOWN");
                            }});
                        }
                    })
                    .orElseGet(() -> {
                        log.warn("Category with id {} not found for deletion", id);
                        return ResponseEntity.status(404).body(new java.util.HashMap<String, String>() {{
                            put("message", "Category not found");
                            put("status", "error");
                            put("errorType", "NOT_FOUND");
                        }});
                    });
        } catch (Exception e) {
            log.error("Error in delete category endpoint for id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body(new java.util.HashMap<String, String>() {{
                put("message", "Internal server error: " + e.getMessage());
                put("status", "error");
                put("errorType", "INTERNAL_ERROR");
            }});
        }
    }

    @PostMapping("/initialize-defaults")
    public ResponseEntity<String> initializeDefaultCategories() {
        categoryService.initializeDefaultCategories();
        return ResponseEntity.ok("Default categories initialized successfully");
    }
}
