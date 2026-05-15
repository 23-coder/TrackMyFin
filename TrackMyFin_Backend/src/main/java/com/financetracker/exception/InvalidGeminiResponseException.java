package com.financetracker.exception;

public class InvalidGeminiResponseException extends RuntimeException {

    public InvalidGeminiResponseException(String message) {
        super(message);
    }

    public InvalidGeminiResponseException(String message, Throwable cause) {
        super(message, cause);
    }
}

