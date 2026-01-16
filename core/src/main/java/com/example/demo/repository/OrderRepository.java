package com.example.demo.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.Order;
import com.example.demo.model.OrderStatus;

public interface OrderRepository extends JpaRepository<Order, Long> {
  List<Order> findByOrderStatusOrderByCreatedAtAsc(OrderStatus status);

  @EntityGraph(attributePaths = "items")
  List<Order> findAllByOrderStatusNotInOrderByCreatedAtAsc(List<OrderStatus> statuses);

  @EntityGraph(attributePaths = "items")
  List<Order> findAllByOrderByCreatedAtDesc();

  @EntityGraph(attributePaths = "items")
  List<Order> findByCreatedAtBetween(Instant start, Instant end);

  @EntityGraph(attributePaths = "items")
  List<Order> findByOrderStatusAndCreatedAtBetween(OrderStatus status, Instant start, Instant end);

   @EntityGraph(attributePaths = "items")
  List<Order> findByOrderStatusInAndCreatedAtBetween(List<OrderStatus> statuses, Instant start, Instant end);

}
