package com.example.demo.controller;

import java.math.BigDecimal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Order;
import com.example.demo.model.OrderStatus;
import com.example.demo.service.OrderService;


@RestController
@RequestMapping("/api/orders")
public class OrderController {
  private final OrderService orderService;

  public OrderController(OrderService orderService) {
    this.orderService = orderService;
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
  
}
