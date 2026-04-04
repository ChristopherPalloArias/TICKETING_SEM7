package com.tickets.events.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "event")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Event {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "room_id", nullable = false)
    private UUID roomId;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_id", insertable = false, updatable = false)
    private Room room;

    @OneToMany(mappedBy = "event", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Tier> tiers = new ArrayList<>();
    
    @Column(nullable = false, length = 150)
    private String title;
    
    @Column(nullable = false, length = 1000)
    private String description;
    
    @Column(nullable = false)
    private LocalDateTime date;
    
    @Column(nullable = false)
    private Integer capacity;
    
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private EventStatus status;
    
    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "subtitle", length = 300)
    private String subtitle;

    @Column(name = "location", length = 300)
    private String location;

    @Column(name = "director", length = 200)
    private String director;

    @Column(name = "cast_members", length = 500)
    private String castMembers;

    @Column(name = "duration")
    private Integer duration;

    @Column(name = "tag", length = 100)
    private String tag;

    @Column(name = "is_limited", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isLimited = false;

    @Column(name = "is_featured", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isFeatured = false;

    @Column(name = "enable_seats", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean enableSeats = false;

    @Column(name = "author", length = 200)
    private String author;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP AT TIME ZONE 'UTC'")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP AT TIME ZONE 'UTC'")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
        if (status == null) {
            status = EventStatus.DRAFT;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
