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
public class DiscountValidateRequest {
  private String code;
  private String email;
  private String type;
  private BigDecimal percentOff;
  private BigDecimal subtotal;
  private BigDecimal shippingTotal;
}
