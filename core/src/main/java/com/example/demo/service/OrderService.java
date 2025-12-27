package com.example.demo.service;

import java.math.BigDecimal;
import java.util.Date;

import org.springframework.stereotype.Service;

import com.example.demo.model.Order;
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
}
