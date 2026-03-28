package com.tickets.msnotifications.controller;

import com.tickets.msnotifications.dto.*;
import com.tickets.msnotifications.service.NotificationService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Validated
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/{reservationId}")
    public ResponseEntity<List<NotificationResponse>> getByReservationId(
            @PathVariable UUID reservationId) {
        return ResponseEntity.ok(notificationService.getByReservationId(reservationId));
    }

    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<PagedNotificationResponse> getByBuyerId(
            @PathVariable UUID buyerId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(notificationService.getByBuyerId(buyerId, page, size));
    }

    @PatchMapping("/buyer/{buyerId}/read-all")
    public ResponseEntity<MarkAllReadResponse> markAllRead(@PathVariable UUID buyerId) {
        int count = notificationService.markAllReadByBuyerId(buyerId);
        return ResponseEntity.ok(new MarkAllReadResponse(count));
    }

    @GetMapping("/buyer/{buyerId}/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(@PathVariable UUID buyerId) {
        long count = notificationService.countUnreadByBuyerId(buyerId);
        return ResponseEntity.ok(new UnreadCountResponse(count));
    }

    @PatchMapping("/buyer/{buyerId}/archive-all")
    public ResponseEntity<ArchiveAllResponse> archiveAll(@PathVariable UUID buyerId) {
        int count = notificationService.archiveAllByBuyerId(buyerId);
        return ResponseEntity.ok(new ArchiveAllResponse(count));
    }
}
