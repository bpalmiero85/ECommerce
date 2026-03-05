package com.example.demo.dto;

import java.math.BigDecimal;

import com.example.demo.model.DiscountType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DiscountCreateRequestDTO {
  private String discountCode;
  private DiscountType type;
  private BigDecimal percentOff;
  private BigDecimal dollarOff;
  private boolean enabled;
  private boolean returningCustomerOnly;

}
