package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.FreeShipping;

public interface FreeShippingRepository extends JpaRepository<FreeShipping, Long> {
  Optional<FreeShipping> findByEnabledTrue();
}
