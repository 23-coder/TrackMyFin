package com.financetracker;

import com.financetracker.entity.Category;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.service.CategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class CategoryServiceTest {

    @Mock CategoryRepository categoryRepository;
    @InjectMocks CategoryService categoryService;

    private Category expenseCategory;
    private Category incomeCategory;

    @BeforeEach
    void setUp() {
        expenseCategory = new Category();
        expenseCategory.setId(1L);
        expenseCategory.setName("Food");
        expenseCategory.setType(Category.CategoryType.EXPENSE);
        expenseCategory.setDefault(false);

        incomeCategory = new Category();
        incomeCategory.setId(2L);
        incomeCategory.setName("Salary");
        incomeCategory.setType(Category.CategoryType.INCOME);
        incomeCategory.setDefault(true);
    }

    @Test
    void createCategory_savesWhenNameIsUnique() {
        when(categoryRepository.existsByNameAndType("Food", Category.CategoryType.EXPENSE))
                .thenReturn(false);
        doReturn(expenseCategory).when(categoryRepository).save(expenseCategory);

        Category result = categoryService.createCategory(expenseCategory);

        assertThat(result).isEqualTo(expenseCategory);
        verify(categoryRepository).save(expenseCategory);
    }

    @Test
    void createCategory_throwsWhenDuplicate() {
        when(categoryRepository.existsByNameAndType("Food", Category.CategoryType.EXPENSE))
                .thenReturn(true);

        assertThatThrownBy(() -> categoryService.createCategory(expenseCategory))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already exists");

        verify(categoryRepository, never()).save(any());
    }

    @Test
    void getAllCategories_returnsAll() {
        List<Category> expected = List.of(expenseCategory, incomeCategory);
        when(categoryRepository.findAll()).thenReturn(expected);

        List<Category> result = categoryService.getAllCategories();

        assertThat(result).hasSize(2).containsExactlyInAnyOrder(expenseCategory, incomeCategory);
    }

    @Test
    void getCategoriesByType_filtersCorrectly() {
        when(categoryRepository.findByTypeOrderByName(Category.CategoryType.EXPENSE))
                .thenReturn(List.of(expenseCategory));

        List<Category> result = categoryService.getCategoriesByType(Category.CategoryType.EXPENSE);

        assertThat(result).containsExactly(expenseCategory);
    }

    @Test
    void getDefaultCategories_returnsOnlyDefaults() {
        when(categoryRepository.findByIsDefaultTrueOrderByName())
                .thenReturn(List.of(incomeCategory));

        List<Category> result = categoryService.getDefaultCategories();

        assertThat(result).containsExactly(incomeCategory);
    }

    @Test
    void getCategoryById_returnsOptionalWhenFound() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(expenseCategory));

        Optional<Category> result = categoryService.getCategoryById(1L);

        assertThat(result).isPresent().contains(expenseCategory);
    }

    @Test
    void getCategoryById_returnsEmptyWhenNotFound() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Category> result = categoryService.getCategoryById(99L);

        assertThat(result).isEmpty();
    }

    @Test
    void updateCategory_savesAndReturns() {
        doReturn(expenseCategory).when(categoryRepository).save(expenseCategory);

        Category result = categoryService.updateCategory(expenseCategory);

        assertThat(result).isEqualTo(expenseCategory);
        verify(categoryRepository).save(expenseCategory);
    }

    @Test
    void deleteCategory_delegatesToRepository() {
        doNothing().when(categoryRepository).deleteById(1L);

        categoryService.deleteCategory(1L);

        verify(categoryRepository).deleteById(1L);
    }

    @Test
    void initializeDefaultCategories_skipsWhenCategoriesExist() {
        when(categoryRepository.count()).thenReturn(5L);

        categoryService.initializeDefaultCategories();

        verify(categoryRepository, never()).save(any());
    }

    @Test
    void initializeDefaultCategories_createsDefaultsWhenEmpty() {
        when(categoryRepository.count()).thenReturn(0L);
        when(categoryRepository.existsByNameAndType(any(), any())).thenReturn(false);
        doAnswer(inv -> inv.getArgument(0)).when(categoryRepository).save(any());

        categoryService.initializeDefaultCategories();

        // 4 income + 6 expense default categories
        verify(categoryRepository, times(10)).save(any());
    }

    @Test
    void getFallbackExpenseCategory_returnsBillsWhenPresent() {
        when(categoryRepository.findByNameIgnoreCaseAndType("Bills", Category.CategoryType.EXPENSE))
                .thenReturn(Optional.of(expenseCategory));

        Optional<Category> result = categoryService.getFallbackExpenseCategory();

        assertThat(result).isPresent();
    }

    @Test
    void findByNameAndTypeIgnoreCase_returnsEmptyForBlankName() {
        Optional<Category> result = categoryService.findByNameAndTypeIgnoreCase("  ", Category.CategoryType.EXPENSE);

        assertThat(result).isEmpty();
        verifyNoInteractions(categoryRepository);
    }
}
