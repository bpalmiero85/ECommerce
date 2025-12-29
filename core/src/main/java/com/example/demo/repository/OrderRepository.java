package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.example.demo.model.Order;
import com.example.demo.model.OrderStatus;

public interface OrderRepository extends JpaRepository <Order, Long> {
  List<Order> findByOrderStatus(OrderStatus status);

  @EntityGraph(attributePaths = "items")
  List<Order> findAllByOrderByCreatedAtDesc();
}
