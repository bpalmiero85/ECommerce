package com.example.demo.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.OrderStatus;
import com.example.demo.repository.OrderRepository;
import com.example.demo.service.OrderEmailService;
import com.example.demo.service.OrderService;

import lombok.Getter;
import lombok.Setter;

@RestController
@RequestMapping("/api/admin/orders")
public class OrderController {
  private final OrderService orderService;
  private final OrderRepository orderRepository;
  private final OrderEmailService orderEmailService;

  public OrderController(OrderService orderService, OrderRepository orderRepository, OrderEmailService orderEmailService) {
    this.orderService = orderService;
    this.orderRepository = orderRepository;
    this.orderEmailService = orderEmailService;
  }

  @PatchMapping("/{orderId}/label")
  public ResponseEntity<Order> markLabelCreated(@PathVariable Long orderId) {
    Order updated = orderService.generateLabel(orderId);
    return ResponseEntity.ok(updated);
  }

  @PatchMapping("/follow-up/{orderId}")
  public ResponseEntity<Order> markFollowUp(@PathVariable Long orderId) {
    Order updated = orderService.markFollowUp(orderId);
    return ResponseEntity.ok(updated);
  }

  @PatchMapping("/unmark-follow-up/{orderId}")
  public ResponseEntity<Order> unmarkFollowUp(@PathVariable Long orderId) {
    Order updated = orderService.unmarkFollowUp(orderId);
    return ResponseEntity.ok(updated);
  }

  @PatchMapping("/follow-up/{orderId}/follow-up-notes")
  public ResponseEntity<Order> saveFollowUpNotes(@PathVariable Long orderId, @RequestBody Map<String, String> body) {
    String followUpNotes = body.get("followUpNotes");
    Order updated = orderService.saveFollowUpNotes(orderId, followUpNotes);
    return ResponseEntity.ok(updated);
  }

  @PatchMapping("/follow-up/{orderId}/resolved")
  public ResponseEntity<Order> markResolved(@PathVariable Long orderId) {
    Order updated = orderService.markResolved(orderId);
    return ResponseEntity.ok(updated);
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

  @PostMapping("/{orderId}/send-shipping-confirmation")
  public ResponseEntity<?> sendShippingConfirmation(@PathVariable Long orderId) {
    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

    if (order.getOrderStatus() != OrderStatus.SHIPPED) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is not marked SHIPPED.");
    }
    if (order.getTrackingNumber() == null || order.getTrackingNumber().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tracking number is missing.");
    }

    orderEmailService.sendShippingConfirmation(order);

    return ResponseEntity.ok(Map.of("ok", true));

  }

  @PostMapping(consumes = "application/json")
  public Order createOrder(@RequestBody CreateOrderRequest req) {
    OrderStatus status = (req.getStatus() == null) ? OrderStatus.PAID : req.getStatus();

    BigDecimal shippingTotal = (req.getShippingTotal() == null) ? BigDecimal.ZERO : req.getShippingTotal();
    BigDecimal taxTotal = (req.getTaxTotal() == null) ? BigDecimal.ZERO : req.getTaxTotal();
    BigDecimal discountTotal = (req.getDiscountTotal() == null) ? BigDecimal.ZERO : req.getDiscountTotal();

    // This param exists in your OrderService signature but is not used
    // (subtotalIgnored).
    // Keep it stable. (You can pass req.getTotal() too, but it’s ignored anyway.)
    BigDecimal subtotalIgnored = BigDecimal.ZERO;

    Order created = orderService.createOrderWithItems(
        req.getName(),
        req.getEmail(),
        req.getShippingAddress1(),
        req.getShippingAddress2(),
        req.getShippingCity(),
        req.getShippingState(),
        req.getShippingZip(),

        subtotalIgnored,
        status,
        req.getItems(),
        shippingTotal,
        taxTotal,
        discountTotal);

        if (created.getOrderStatus() == OrderStatus.PAID) {
          orderEmailService.sendOrderConfirmation(created);
        }
        return created;
  }

  @Getter
  @Setter
  public static class CreateOrderRequest {
    private String name;
    private String email;
    private String shippingAddress1;
    private String shippingAddress2;
    private String shippingCity;
    private String shippingState;
    private String shippingZip;

    // NOT used by OrderService (subtotalIgnored).
    private BigDecimal total;

    private OrderStatus status;
    private List<OrderItem> items;

    private BigDecimal shippingTotal;
    private BigDecimal taxTotal;
    private BigDecimal discountTotal;

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

  @GetMapping("/search/email/{email}")
  public List<Order> getOrdersWithEmail(@PathVariable String email) {
    return orderService.getOrdersWithEmail(email);
  }

  @GetMapping("/follow-up")
  public List<Order> getOrdersNeedingFollowUp() {
    return orderService.getFollowUpQueue();
  }
}