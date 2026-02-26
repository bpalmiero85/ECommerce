package com.example.demo.repository;

import com.example.demo.model.Discount;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscountRepository extends JpaRepository<Discount, Long> {
  Optional<Discount> findByDiscountCodeIgnoreCaseAndEnabledTrue(String discountCode);

  List<Discount> findByEnabledTrue();

  boolean existsByDiscountCodeIgnoreCase(String discountCode);

}
