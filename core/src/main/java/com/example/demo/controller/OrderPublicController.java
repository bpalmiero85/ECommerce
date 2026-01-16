package com.example.demo.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.OrderStatus;
import com.example.demo.service.OrderService;

@RestController
@RequestMapping("/api/orders")
public class OrderPublicController {

  private final OrderService orderService;

  public OrderPublicController(OrderService orderService) {
    this.orderService = orderService;
  }

  @PostMapping
  public java.util.Map<String, Object> createOrder(@RequestBody CreateOrderRequest req) {

    if (req.getItems() == null || req.getItems().isEmpty()) {
      throw new IllegalArgumentException("Order must contain at least one item");
    }

    List<OrderItem> items = req.getItems().stream().map(i -> {
      OrderItem it = new OrderItem();
      it.setProductId(i.getProductId());
      it.setQuantity(i.getQuantity());
      // DO NOT rely on client for name/price/material; service should snapshot those
      // from Product
      return it;
    }).toList();

    OrderStatus status = (req.getStatus() == null) ? OrderStatus.PAID : req.getStatus();

    Order saved = orderService.createOrderWithItems(
        req.getName(),
        req.getEmail(),
        req.getTotal(),
        status,
        items);

    return java.util.Map.of(
        "orderId", saved.getOrderId(),
        "status", saved.getOrderStatus().name());
  }

  public static class CreateOrderRequest {
    private String name;
    private String email;
    private BigDecimal total;
    private OrderStatus status;
    private List<CreateOrderItem> items;

    public String getName() {
      return name;
    }

    public void setName(String name) {
      this.name = name;
    }

    public String getEmail() {
      return email;
    }

    public void setEmail(String email) {
      this.email = email;
    }

    public BigDecimal getTotal() {
      return total;
    }

    public void setTotal(BigDecimal total) {
      this.total = total;
    }

    public OrderStatus getStatus() {
      return status;
    }

    public void setStatus(OrderStatus status) {
      this.status = status;
    }

    public List<CreateOrderItem> getItems() {
      return items;
    }

    public void setItems(List<CreateOrderItem> items) {
      this.items = items;
    }
  }

  public static class CreateOrderItem {
    private Long productId;
    private String productName;
    private int quantity;
    private BigDecimal unitPrice;

    public Long getProductId() {
      return productId;
    }

    public void setProductId(Long productId) {
      this.productId = productId;
    }

    public String getProductName() {
      return productName;
    }

    public void setProductName(String productName) {
      this.productName = productName;
    }

    public int getQuantity() {
      return quantity;
    }

    public void setQuantity(int quantity) {
      this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
      return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
      this.unitPrice = unitPrice;
    }
  }
}