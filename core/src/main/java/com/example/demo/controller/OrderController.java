package com.example.demo.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.OrderStatus;
import com.example.demo.service.OrderService;

import lombok.Getter;
import lombok.Setter;

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
      @RequestBody Map<String, String> body) {

    String statusRaw = body.get("status");
    if (statusRaw == null || statusRaw.isBlank()) {
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

  @PostMapping(consumes = "application/json")
  public Order createOrder(@RequestBody CreateOrderRequest req) {
    // default if not sent
    OrderStatus status = (req.getStatus() == null) ? OrderStatus.PAID : req.getStatus();

    return orderService.createOrderWithItems(
        req.getName(),
        req.getEmail(),
        req.getTotal(),
        status,
        req.getItems());
  }

  @Getter
  @Setter
  public static class CreateOrderRequest {
    private String name;
    private String email;
    private BigDecimal total;
    private OrderStatus status;
    private List<OrderItem> items; // <-- this makes your JSON work
  }

  @GetMapping("/all")
  public List<Order> getOrders() {
    return orderService.getAllOrders();
  }

  @GetMapping("/status/{status}")
  public List<Order> getOrdersWithStatus(@PathVariable OrderStatus status) {
    return orderService.findOrderByStatus(status);
  }

  @GetMapping("/status/shipped")
  public List<Order> getShippedOrders() {
    return orderService.getShippedOrders();
  }

  @GetMapping("/status/completed")
  public List<Order> getDeliveredOrders() {
    return orderService.getCompletedOrders();
  }

  @GetMapping("/status/cancelled")
  public List<Order> getCancelledOrders() {
    return orderService.getCancelledOrders();
  }

  @GetMapping("/status/active")
  public List<Order> getActiveOrders() {
    return orderService.getAllActiveOrders();
  }

  @GetMapping("/status/archived")
  public List<Order> getArchivedOrders() {
    return orderService.getArchivedOrders();
  }
}