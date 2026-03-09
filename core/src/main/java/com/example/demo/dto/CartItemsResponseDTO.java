package com.example.demo.dto;

import java.math.BigDecimal;

public class CartItemsResponseDTO {
  public Long id;
  public String name;
  public BigDecimal price;
  public String imageUrl;
  public int qty;

  public CartItemsResponseDTO(Long id, String name, BigDecimal price, String imageUrl, int qty) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.imageUrl = imageUrl;
    this.qty = qty;
  }
}
