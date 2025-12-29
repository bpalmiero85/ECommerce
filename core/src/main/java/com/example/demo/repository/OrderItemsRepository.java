package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.OrderItem;

public interface OrderItemsRepository extends JpaRepository<OrderItem, Long> {
  
}
