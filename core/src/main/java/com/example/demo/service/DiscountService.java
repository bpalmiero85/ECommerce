package com.example.demo.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.demo.model.Discount;
import com.example.demo.model.DiscountValidateResponse;
import com.example.demo.repository.DiscountRepository;

@Service
public class DiscountService {
  private final DiscountRepository discountRepository;
  private final OrderService orderService;

  public DiscountService(DiscountRepository discountRepository, OrderService orderService) {
    this.discountRepository = discountRepository;
    this.orderService = orderService;
  }

  public DiscountValidateResponse validateDiscount(
      String code,
      String email,
      BigDecimal subtotal) {
    DiscountValidateResponse res = new DiscountValidateResponse();
    if (code == null || code.isBlank()) {
      res.setApplied(false);
      res.setMessage("No discount code entered.");
      return res;
    }
    String normalizedCode = code.trim().toUpperCase();
    String normalizedEmail = (email == null) ? "" : email.trim().toLowerCase();

    Optional<Discount> discountOpt = discountRepository.findByDiscountCodeIgnoreCaseAndEnabledTrue(normalizedCode);

    if (discountOpt.isEmpty()) {
      res.setApplied(false);
      res.setMessage("Invalid or expired discount code.");
      return res;
    }

    Discount discount = discountOpt.get();
    BigDecimal safeSubtotal = (subtotal == null) ? BigDecimal.ZERO : subtotal.setScale(2, RoundingMode.HALF_UP);

    if (discount.isReturningCustomerOnly()) {
      if (normalizedEmail.isBlank()) {
        res.setApplied(false);
        res.setMessage("This code is for returning customers. Please enter your order email.");
        return res;
      }
      boolean isReturning = orderService.hasPreviousOrder(normalizedEmail);
      if (!isReturning) {
        res.setApplied(false);
        res.setMessage("This code is only for returning customers.");
        return res;
      }
    }

    if (discount.getPercentOff() != null && safeSubtotal.compareTo(BigDecimal.ZERO) > 0) {
      BigDecimal pct = discount.getPercentOff().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
      BigDecimal discountTotal = safeSubtotal.multiply(pct).setScale(2, RoundingMode.HALF_UP);
      if (discountTotal.compareTo(safeSubtotal) > 0) {
        discountTotal = safeSubtotal;
      }
      res.setDiscountTotal(discountTotal);
    }
    res.setApplied(true);
    res.setMessage("Discount applied.");

    return res;
  }

}
