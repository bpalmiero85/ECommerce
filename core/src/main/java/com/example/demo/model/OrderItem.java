package com.example.demo.model;

import java.math.BigDecimal;
import javax.persistence.*;

import lombok.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "order_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class OrderItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "order_id")
  @JsonBackReference
  private Order order;

  @Column(nullable = false)
  private Long productId;

  @Column(nullable = false)
  private String productName;

  @Column(nullable = false)
  private int quantity;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal unitPrice;
}
