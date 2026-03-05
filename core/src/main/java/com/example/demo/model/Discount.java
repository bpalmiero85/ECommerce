package com.example.demo.model;

import java.math.BigDecimal;
import java.time.Instant;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.persistence.Table;
import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "discounts")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Discount {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long discountId;

  @NotBlank
  @Column(name = "discount_code", nullable = false, unique = true, length = 50)
  private String discountCode;

  @NotNull
  @Enumerated(EnumType.STRING)
  @Column(name = "discount_type", nullable = false, length = 30)
  private DiscountType type;

  @DecimalMin("0.01")
  @DecimalMax("100.00")
  @Column(name = "percent_off", precision = 5, scale = 2)
  private BigDecimal percentOff;

  @DecimalMin("0.01")
  @Column(name = "dollar_off", precision = 10, scale = 2)
  private BigDecimal dollarOff;

  @Column(name = "starts_at")
  private Instant startsAt;

  @Column(name = "ends_at")
  private Instant endsAt;

  @Column(nullable = false)
  private boolean enabled = true;

  @Column(nullable = false, name = "returning_customer_only")
  private boolean returningCustomerOnly = false;

  @PrePersist
  @PreUpdate
  private void save() {
    if (discountCode != null) {
      discountCode = discountCode.trim().toUpperCase();
    }
    if (type == DiscountType.PERCENT_OFF) {
      if (percentOff == null) {
        throw new IllegalStateException("percentOff is required for PERCENT_OFF discounts.");
      }
      dollarOff = null;

    } else if (type == DiscountType.DOLLAR_OFF) {
      if (dollarOff == null) {
        throw new IllegalStateException("dollarOff is required for DOLLAR_OFF discounts.");
      }
      percentOff = null;
    } else if (type == DiscountType.FREE_SHIPPING) {
      percentOff = null;
      dollarOff = null;
    }
    Instant now = Instant.now();
    if (createdAt == null)
      createdAt = now;

    updatedAt = now;
  }

  @Column(nullable = false, name = "created_at", updatable = false)
  private Instant createdAt;

  @Column(nullable = false, name = "updated_at")
  private Instant updatedAt;
}
