package com.example.demo.model;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DiscountValidateResponse {
  private boolean applied;
  private String message;
  private BigDecimal discountTotal = BigDecimal.ZERO;
  private boolean freeShippingApplied;
  private BigDecimal finalShippingTotal = BigDecimal.ZERO;
}
