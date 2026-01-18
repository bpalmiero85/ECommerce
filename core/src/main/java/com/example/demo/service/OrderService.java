package com.example.demo.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.OrderStatus;
import com.example.demo.model.Product;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.ProductRepository;

@Service
public class OrderService {

  private final OrderRepository orderRepository;
  private final ProductRepository productRepository;

  public OrderService(OrderRepository orderRepository, ProductRepository productRepository) {
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
  }

  public Order createOrder(String name, String email, BigDecimal total, OrderStatus status) {
    Order order = new Order();
    order.setOrderName(name);
    order.setOrderEmail(email);
    order.setOrderTotal(total);
    order.setOrderStatus(status);

    return orderRepository.save(order);
  }

  @Transactional
  public Order createOrderWithItems(String name, String email, BigDecimal subtotalIgnored, OrderStatus status,
      List<OrderItem> items, BigDecimal shippingTotal, BigDecimal taxTotal, BigDecimal discountTotal) {

    if (items == null || items.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order must contain at least one item");
    }

    Order order = new Order();
    order.setOrderName(name);
    order.setOrderEmail(email);
    order.setOrderStatus(status);
    order.setShippingTotal(shippingTotal != null ? shippingTotal : BigDecimal.ZERO);
    order.setTaxTotal(taxTotal != null ? taxTotal : BigDecimal.ZERO);
    order.setDiscountTotal(discountTotal != null ? discountTotal : BigDecimal.ZERO);

    BigDecimal subtotal = BigDecimal.ZERO;

    for (OrderItem it : items) {

      Product p = productRepository.findById(it.getProductId()).orElseThrow();

      // ✅ Snapshot “sale-time” values (required by schema)
      it.setProductName(p.getName());
      it.setUnitPrice(p.getPrice());
      it.setMaterialCostAtSale(p.getMaterialCost());

      // ✅ accumulate subtotal (unitPrice * quantity)
      BigDecimal lineTotal = it.getUnitPrice()
          .multiply(BigDecimal.valueOf(it.getQuantity()));
      subtotal = subtotal.add(lineTotal);

      order.addItem(it);

      int newQty = p.getQuantity() - it.getQuantity();
      if (newQty < 0) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Not enough stock");
      }
      p.setQuantity(newQty);
      p.setSoldOut(newQty <= 0);
      productRepository.save(p);
    }

    // ✅ set order money fields AFTER loop
    order.setSubtotal(subtotal);

    // ✅ total = subtotal + shipping + tax - discount
    order.setOrderTotal(
        order.getSubtotal()
            .add(order.getShippingTotal())
            .add(order.getTaxTotal())
            .subtract(order.getDiscountTotal()));

    return orderRepository.save(order);
  }

  public Order save(Order order) {
    return orderRepository.save(order);
  }

  public List<Order> getAllOrders() {
    return orderRepository.findAllByOrderByCreatedAtDesc();
  }

  @Transactional(readOnly = true)
  public List<Order> getAllActiveOrders() {
    return orderRepository.findWithItemsByStatuses(
        List.of(OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED));
  }

  public List<Order> getShippedOrders() {
    return findOrderByStatus(OrderStatus.SHIPPED);
  }

  public List<Order> getCompletedOrders() {
    return findOrderByStatus(OrderStatus.DELIVERED);
  }

  public List<Order> getCancelledOrders() {
    return findOrderByStatus(OrderStatus.CANCELLED);
  }

  public List<Order> getArchivedOrders() {
    return findOrderByStatus(OrderStatus.ARCHIVED);
  }

  @Transactional
  public Order updateOrderStatus(Long orderId, OrderStatus newStatus, String carrier, String trackingNumber) {
    Order order = orderRepository.findById(orderId).orElseThrow();
    order.setOrderStatus(newStatus);

    if (newStatus == OrderStatus.SHIPPED) {
      if (order.getShippedAt() == null) {
        order.setShippedAt(Instant.now());
      }

      if (carrier != null && !carrier.isBlank()) {
        order.setCarrier(carrier.trim());
      }

      if (trackingNumber != null && !trackingNumber.isBlank()) {
        order.setTrackingNumber(trackingNumber.trim());
      }
    }

    if (carrier != null && !carrier.isBlank()) {
      order.setCarrier(carrier.trim());
    }
    if (trackingNumber != null && !trackingNumber.isBlank()) {
      order.setTrackingNumber(trackingNumber.trim());
    }

    if (newStatus == OrderStatus.DELIVERED) {
      if (order.getDeliveredAt() == null) {
        order.setDeliveredAt(Instant.now());
      }
    }

    return orderRepository.save(order);
  }

  @Transactional(readOnly = true)
  public List<Order> findOrderByStatus(OrderStatus status) {
    return orderRepository.findWithItemsByStatus(status);

  }

}