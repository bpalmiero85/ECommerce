package com.example.demo.service;

import java.math.BigDecimal;
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

}