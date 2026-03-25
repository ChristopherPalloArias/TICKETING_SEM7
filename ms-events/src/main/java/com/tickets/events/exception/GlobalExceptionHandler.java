package com.tickets.events.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ForbiddenAccessException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity<ErrorResponse> handleForbiddenAccessException(ForbiddenAccessException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new ErrorResponse("FORBIDDEN", ex.getMessage()));
    }
    
    @ExceptionHandler(RoomNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<ErrorResponse> handleRoomNotFoundException(RoomNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("ROOM_NOT_FOUND", ex.getMessage()));
    }
    
    @ExceptionHandler(CapacityExceededException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<CapacityErrorResponse> handleCapacityExceededException(CapacityExceededException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new CapacityErrorResponse(
                "CAPACITY_EXCEEDS_MAXIMUM",
                ex.getMessage(),
                ex.getRoomMaxCapacity()
            ));
    }
    
    @ExceptionHandler(InvalidEventDateException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> handleInvalidEventDateException(InvalidEventDateException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("INVALID_EVENT_DATE", ex.getMessage()));
    }
    
    @ExceptionHandler(EventAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<ErrorResponse> handleEventAlreadyExistsException(EventAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse("EVENT_ALREADY_EXISTS", ex.getMessage()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ValidationErrorResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
        Map<String, String> details = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(
            error -> details.put(error.getField(), error.getDefaultMessage())
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ValidationErrorResponse("VALIDATION_ERROR", "Invalid request data", details));
    }
    
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred while creating the event"));
    }
    
    @Data
    @AllArgsConstructor
    public static class ErrorResponse {
        private String error;
        private String message;
    }
    
    @Data
    @AllArgsConstructor
    public static class CapacityErrorResponse {
        private String error;
        private String message;
        private Integer roomMaxCapacity;
    }
    
    @Data
    @AllArgsConstructor
    public static class ValidationErrorResponse {
        private String error;
        private String message;
        private Map<String, String> details;
    }
}
