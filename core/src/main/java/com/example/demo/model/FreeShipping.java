package com.example.demo.model;

import java.math.BigDecimal;
import java.time.Instant;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.persistence.Table;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "free_shipping_rules")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FreeShipping {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank
  @Column(nullable = false)
  private String name;

  @NotNull
  @DecimalMin("0.00")
  @Column(nullable = false, name = "min_subtotal", precision = 10, scale = 2)
  private BigDecimal minSubtotal;

  @Column(nullable = false)
  private boolean enabled = true;

  @Column(name="starts_at")
  private Instant startsAt;

  @Column(name="ends_at")
  private Instant endsAt;

  @PrePersist
  private void onCreate() {
    Instant now = Instant.now();
    if (createdAt == null)
      createdAt = now;
    if (updatedAt == null)
      updatedAt = now;
  }

  @PreUpdate
  private void onUpdate() {
    updatedAt = Instant.now();
  }

  @Column(nullable = false, name = "created_at", updatable = false)
  private Instant createdAt;

  @Column(nullable = false, name = "updated_at")
  private Instant updatedAt;
}
