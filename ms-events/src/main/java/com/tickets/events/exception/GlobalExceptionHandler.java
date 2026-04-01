package com.tickets.events.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

import jakarta.validation.ConstraintViolationException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
@Slf4j
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

    @ExceptionHandler(EventNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<ErrorResponse> handleEventNotFoundException(EventNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("EVENT_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(InvalidEventStateException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<InvalidStateErrorResponse> handleInvalidEventStateException(InvalidEventStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new InvalidStateErrorResponse("INVALID_EVENT_STATE", ex.getMessage(), ex.getCurrentStatus()));
    }

    @ExceptionHandler(TiersAlreadyConfiguredException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<ErrorResponse> handleTiersAlreadyConfiguredException(TiersAlreadyConfiguredException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse("TIERS_ALREADY_CONFIGURED", ex.getMessage()));
    }

    @ExceptionHandler(InvalidTierConfigurationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> handleInvalidTierConfigurationException(InvalidTierConfigurationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("INVALID_TIER_CONFIGURATION", ex.getMessage()));
    }

    @ExceptionHandler(InvalidPriceException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> handleInvalidPriceException(InvalidPriceException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("INVALID_PRICE", ex.getMessage()));
    }

    @ExceptionHandler(InvalidQuotaException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> handleInvalidQuotaException(InvalidQuotaException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("INVALID_QUOTA", ex.getMessage()));
    }

    @ExceptionHandler(InvalidEarlyBirdValidityException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<TierTypeErrorResponse> handleInvalidEarlyBirdValidityException(InvalidEarlyBirdValidityException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new TierTypeErrorResponse("INVALID_EARLY_BIRD_VALIDITY", ex.getMessage(), "EARLY_BIRD"));
    }

    @ExceptionHandler(QuotaExceedsCapacityException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<QuotaErrorResponse> handleQuotaExceedsCapacityException(QuotaExceedsCapacityException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new QuotaErrorResponse("QUOTA_EXCEEDS_CAPACITY", ex.getMessage(), ex.getTotalQuota(), ex.getEventCapacity()));
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

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ValidationErrorResponse> handleConstraintViolationException(ConstraintViolationException ex) {
        Map<String, String> details = new HashMap<>();
        ex.getConstraintViolations().forEach(
            violation -> details.put(violation.getPropertyPath().toString(), violation.getMessage())
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ValidationErrorResponse("VALIDATION_ERROR", "Invalid request data", details));
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ValidationErrorResponse> handleHandlerMethodValidationException(HandlerMethodValidationException ex) {
        Map<String, String> details = new HashMap<>();
        ex.getAllValidationResults().forEach(result ->
            result.getResolvableErrors().forEach(error ->
                details.put(result.getMethodParameter().getParameterName(), error.getDefaultMessage())
            )
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ValidationErrorResponse("VALIDATION_ERROR", "Invalid request data", details));
    }

    @ExceptionHandler(TierNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<ErrorResponse> handleTierNotFoundException(TierNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("TIER_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(TierQuotaInsufficientException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<ErrorResponse> handleTierQuotaInsufficientException(TierQuotaInsufficientException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse("TIER_QUOTA_EXHAUSTED", ex.getMessage()));
    }

    @ExceptionHandler(EventHasNoTiersException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public ResponseEntity<ErrorResponse> handleEventHasNoTiersException(EventHasNoTiersException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(new ErrorResponse("EVENT_HAS_NO_TIERS", ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedServiceException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseEntity<ErrorResponse> handleUnauthorizedServiceException(UnauthorizedServiceException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ErrorResponse("UNAUTHORIZED", ex.getMessage()));
    }

    @ExceptionHandler(EventUpdateNotAllowedException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> handleEventUpdateNotAllowedException(EventUpdateNotAllowedException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("EVENT_UPDATE_NOT_ALLOWED", ex.getMessage()));
    }

    @ExceptionHandler(RoomHasEventsException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<RoomHasEventsErrorResponse> handleRoomHasEventsException(RoomHasEventsException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new RoomHasEventsErrorResponse("ROOM_HAS_EVENTS", ex.getMessage(), ex.getEventTitles()));
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred while processing the request"));
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
    public static class QuotaErrorResponse {
        private String error;
        private String message;
        private Integer totalQuota;
        private Integer eventCapacity;
    }

    @Data
    @AllArgsConstructor
    public static class TierTypeErrorResponse {
        private String error;
        private String message;
        private String tierType;
    }

    @Data
    @AllArgsConstructor
    public static class InvalidStateErrorResponse {
        private String error;
        private String message;
        private String currentStatus;
    }
    
    @Data
    @AllArgsConstructor
    public static class ValidationErrorResponse {
        private String error;
        private String message;
        private Map<String, String> details;
    }

    @Data
    @AllArgsConstructor
    public static class RoomHasEventsErrorResponse {
        private String error;
        private String message;
        private List<String> events;
    }
}
