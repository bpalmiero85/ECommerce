package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.DiscountValidateRequest;
import com.example.demo.model.DiscountValidateResponse;
import com.example.demo.service.DiscountService;

@RestController
@RequestMapping("/api/discounts")
public class CheckoutDiscountController {
  private final DiscountService discountService;

  public CheckoutDiscountController(DiscountService discountService) {
    this.discountService = discountService;
  }

  @PostMapping("/validate")
  public ResponseEntity<DiscountValidateResponse> validateDiscount(@RequestBody DiscountValidateRequest request) {

    DiscountValidateResponse response = discountService.validateDiscount(
        request.getCode(),
        request.getEmail(),
        request.getSubtotal(),
        request.getShippingTotal()
      );

    return ResponseEntity.ok(response);
  }
}
