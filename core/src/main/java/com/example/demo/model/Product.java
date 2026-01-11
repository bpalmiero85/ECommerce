package com.example.demo.model;

import java.math.BigDecimal;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.Table;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "product")
public class Product {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private boolean soldOut;

  private String pictureType;

  private long pictureVersion;

  @Column(nullable = false)
  private String name;

  @Lob
  @Column(nullable = false)
  private String description;

  @Column(nullable = false)
  private BigDecimal price;

  @Column(nullable = false)
  private Integer quantity;

  @Column(nullable = false)
  private String category;

  @Column(nullable = false)
  private boolean featured;

  @Column(nullable = false)
  private boolean newArrival;

  @Lob
  @JsonIgnore
  @Column(name = "product_picture_file")
  private byte[] productPictureFile;

}
