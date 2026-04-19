package com.example.demo.dto;

import java.math.BigDecimal;

public class CartItemsResponseDTO {
  public Long id;
  public String name;
  public BigDecimal price;
  public String imageUrl;
  public int qty;
  public Double weightOunces;
  public Double lengthInches;
  public Double widthInches;
  public Double heightInches;

  public CartItemsResponseDTO(
      Long id,
      String name,
      BigDecimal price,
      String imageUrl,
      int qty,
      Double weightOunces,
      Double lengthInches,
      Double widthInches,
      Double heightInches) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.imageUrl = imageUrl;
    this.qty = qty;

    this.weightOunces = weightOunces;
    this.lengthInches = lengthInches;
    this.widthInches = widthInches;
    this.heightInches = heightInches;
  }
}
