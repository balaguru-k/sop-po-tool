package sop_po.config.exceptions;

import java.util.HashMap;
import java.util.Map;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

import lombok.extern.slf4j.Slf4j;

@ControllerAdvice
@Slf4j
public class ErrorHandler {

    @ExceptionHandler
    public ResponseEntity<Object> handleException(ResponseStatusException exc) {
        Map<String, Object> error = createErrorResponse(exc.getReason());
        log.error("Operational Exception occurred - {}", error.get("timestamp"), exc);

        return new ResponseEntity<>(error, exc.getStatusCode());
    }

    @ExceptionHandler
    public ResponseEntity<Object> handleException(Exception exc) {
        Map<String, Object> error = createErrorResponse(exc.getLocalizedMessage());
        log.error("General Exception occurred - {}", error.get("timestamp"), exc);

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler
    public ResponseEntity<Object> handleValidationExceptions(MethodArgumentNotValidException exc) {
        Map<String, String> errors = new HashMap<>();
        exc.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        Map<String, Object> error = createErrorResponse("Validation failed", errors);
        log.error("Validation error - {}", error.get("timestamp"), exc);

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }

    private Map<String, Object> createErrorResponse(String message, Map<String, String> errors) {
        Map<String, Object> response = createErrorResponse(message);
        response.put("errors", errors);
        return response;
    }

}

