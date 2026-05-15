package com.financetracker;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories
public class FinanceTrackerApplication {

    public static void main(String[] args) {
        configureGeminiFromDotenv();
        SpringApplication.run(FinanceTrackerApplication.class, args);
    }

    private static void configureGeminiFromDotenv() {
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

            String apiKey = firstNonBlank(
                    System.getenv("GEMINI_API_KEY"),
                    System.getenv("GOOGLE_GEMINI_API_KEY"),
                    dotenv.get("GEMINI_API_KEY"),
                    dotenv.get("GOOGLE_GEMINI_API_KEY")
            );
            setSystemPropertyIfMissing("gemini.api.key", apiKey);

            String model = firstNonBlank(
                    System.getenv("GEMINI_MODEL"),
                    dotenv.get("GEMINI_MODEL")
            );
            setSystemPropertyIfMissing("gemini.model", model);
        } catch (Exception ignored) {
            // Ignore dotenv loading errors; Spring properties/env vars remain the source of truth.
        }
    }

    private static void setSystemPropertyIfMissing(String key, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        String current = System.getProperty(key);
        if (current == null || current.isBlank()) {
            System.setProperty(key, value.trim());
        }
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

}
