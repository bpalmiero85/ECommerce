package com.example.demo.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.OrderStatus;
import com.example.demo.repository.OrderRepository;

@Service
public class OrderService {

  private final OrderRepository orderRepository;

  public OrderService(OrderRepository orderRepository) {
    this.orderRepository = orderRepository;
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
  public Order createOrderWithItems(String name, String email, BigDecimal total, OrderStatus status,
      List<OrderItem> items) {
    Order order = new Order();
    order.setOrderName(name);
    order.setOrderEmail(email);
    order.setOrderTotal(total);
    order.setOrderStatus(status);
    if (items != null) {
      for (OrderItem it : items) {
        order.addItem(it);
      }
    }

    return orderRepository.save(order);
  }

  public List<Order> getAllOrders() {
    return orderRepository.findAllByOrderByCreatedAtDesc();
  }

  public List<Order> getAllActiveOrders() {
    List<OrderStatus> status = List.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.SHIPPED);
    List<Order> order = orderRepository.findAllByOrderStatusNotInOrderByCreatedAtAsc(status);
    return order;

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

  public List<Order> findOrderByStatus(OrderStatus status) {
    List<Order> order = orderRepository.findByOrderStatusOrderByCreatedAtAsc(status);
    return order;

  }

}