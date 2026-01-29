package com.example.demo.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.OneToMany;
import javax.persistence.PrePersist;
import javax.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "orders")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Order {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long orderId;

  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonManagedReference
  private List<OrderItem> items = new ArrayList<>();

  @Column(nullable = false)
  private String orderName;

  @Column(nullable = false)
  private boolean needsFollowUp;

  @Column(columnDefinition = "TEXT")
  private String followUpNotes;

  @Column(nullable = false)
  private boolean labelCreated; 

  @Column
  private Instant followUpResolvedAt;

  @Column(nullable = false)
  private String orderEmail;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal orderTotal = BigDecimal.ZERO;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @Column
  private String trackingNumber;

  @Column
  String shippingAddress1;

  @Column
  String shippingAddress2;

  @Column
  String shippingState;

  @Column
  String shippingCity;

  @Column
  String shippingZip;

  @Column
  private String carrier;

  @Column
  private Instant shippedAt;

  @Column(name="subtotal", nullable = false, precision = 10, scale = 2)
  private BigDecimal subtotal = BigDecimal.ZERO;

  @Column(name="shipping_total", nullable = false, precision = 10, scale = 2)
  private BigDecimal shippingTotal = BigDecimal.ZERO;

  @Column(name="tax_total", nullable = false, precision = 10, scale = 2)
  private BigDecimal taxTotal = BigDecimal.ZERO;

  @Column(name="discount_total", nullable = false, precision = 10, scale = 2)
  private BigDecimal discountTotal = BigDecimal.ZERO;

  @Column
  private Instant deliveredAt;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private OrderStatus orderStatus;

  @PrePersist
  public void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
    if (orderStatus == null) {
      orderStatus = OrderStatus.PAID;
    }
  }

  public void addItem(OrderItem item) {
    items.add(item);
    item.setOrder(this);
  }

  public void removeItem(OrderItem item) {
    if (item == null)
      return;
    items.remove(item);
    item.setOrder(null);
  }

}
