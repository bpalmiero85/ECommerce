package com.example.demo.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Order;
import com.example.demo.model.OrderStatus;
import com.example.demo.service.OrderService;



@RestController
@RequestMapping("/api/admin/orders")
public class OrderController {
  private final OrderService orderService;

  public OrderController(OrderService orderService) {
    this.orderService = orderService;
  }

  @PatchMapping("/{orderId}/status")
  public ResponseEntity<Order> updateOrderStatus(
    @PathVariable Long orderId,
    @RequestBody Map<String, String> body
  ) {
    String statusRaw = body.get("status");
    if (statusRaw == null || statusRaw.isBlank()){ 
      return ResponseEntity.badRequest().build();
    }

    OrderStatus newStatus;
    try {
      newStatus = OrderStatus.valueOf(statusRaw.trim().toUpperCase());
    } catch (IllegalArgumentException ex) {
      return ResponseEntity.badRequest().build();
    }

    String carrier = body.get("carrier");
    String trackingNumber = body.get("trackingNumber");
    
    Order updated = orderService.updateOrderStatus(orderId, newStatus, carrier, trackingNumber);
    return ResponseEntity.ok(updated);
  }

  @PostMapping
  public Order createOrder(
    @RequestParam String name,
    @RequestParam String email,
    @RequestParam BigDecimal total,
    @RequestParam (required = false) OrderStatus status
  ) {
    return orderService.createOrder(name, email, total, status);
  }

  @GetMapping("/all")
  public List<Order> getOrders() {
    return orderService.getAllOrders();
  }
  
}
