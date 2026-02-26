package com.example.demo.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.demo.model.Discount;
import com.example.demo.model.DiscountType;
import com.example.demo.model.DiscountValidateResponse;
import com.example.demo.repository.DiscountRepository;

@Service
public class DiscountService {
  private final DiscountRepository discountRepository;
  private final OrderService orderService;

  @Value("${SUPPORT_EMAIL}")
  private String supportEmail;

  public DiscountService(DiscountRepository discountRepository, OrderService orderService) {
    this.discountRepository = discountRepository;
    this.orderService = orderService;
  }

  public DiscountValidateResponse validateDiscount(
      String code,
      String email,
      BigDecimal subtotal,
      BigDecimal shippingTotal) {
    DiscountValidateResponse res = new DiscountValidateResponse();
    res.setApplied(false);

    if (code == null || code.isBlank()) {
      res.setMessage("No discount code entered.");
      return res;
    }
    String normalizedCode = code.trim().toUpperCase();
    String normalizedEmail = (email == null) ? "" : email.trim().toLowerCase();

    Optional<Discount> discountOpt = discountRepository.findByDiscountCodeIgnoreCaseAndEnabledTrue(normalizedCode);

    if (discountOpt.isEmpty()) {
      res.setMessage("Invalid or expired discount code.");
      return res;
    }

    Discount discount = discountOpt.get();

    BigDecimal safeShipping = (shippingTotal == null)
        ? BigDecimal.ZERO
        : shippingTotal.setScale(2, RoundingMode.HALF_UP);

    res.setFinalShippingTotal(safeShipping);
    BigDecimal safeSubtotal = (subtotal == null) ? BigDecimal.ZERO : subtotal.setScale(2, RoundingMode.HALF_UP);

    if (discount.isReturningCustomerOnly()) {
      if (normalizedEmail.isBlank()) {
        res.setMessage("This code is for returning customers. Please enter your past order email.");
        return res;
      }
      boolean isReturning = orderService.hasPreviousOrder(normalizedEmail);
      if (!isReturning) {
        res.setMessage("This code is only for returning customers.");
        return res;
      }
    }

    if (discount.getType() == DiscountType.FREE_SHIPPING) {
      res.setMessage("Free shipping applied!");
      res.setFinalShippingTotal(BigDecimal.ZERO);
      res.setDiscountTotal(BigDecimal.ZERO);
      res.setFreeShippingApplied(true);
      res.setApplied(true);
      return res;
    }
    if (discount.getType() == DiscountType.PERCENT_OFF) {
      if (discount.getPercentOff() == null) {
        res.setMessage(
            "Code is valid, but it's not configured correctly. Please contact support at " + supportEmail + ".");
        return res;
      }
      if (safeSubtotal.compareTo(BigDecimal.ZERO) <= 0) {
        res.setMessage("Code accepted, but your cart subtotal is $0. Add items to apply this discount.");
        return res;
      }
      BigDecimal pct = discount.getPercentOff().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
      BigDecimal discountTotal = safeSubtotal.multiply(pct).setScale(2, RoundingMode.HALF_UP);
      if (discountTotal.compareTo(safeSubtotal) > 0) {
        discountTotal = safeSubtotal;
      }
      res.setDiscountTotal(discountTotal);
      res.setApplied(true);
      res.setMessage("Discount applied!");

      return res;
    }

    res.setMessage("Discount code is valid, but cannot be applied. Please contact support at " + supportEmail + ".");
    return res;
  }

}
