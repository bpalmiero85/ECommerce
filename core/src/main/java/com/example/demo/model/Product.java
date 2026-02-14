package com.example.demo.model;

import java.math.BigDecimal;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.Table;

import org.hibernate.annotations.Type;

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

  @Column(name = "material_cost", nullable = false, precision = 10, scale = 2)
  private BigDecimal materialCost = BigDecimal.ZERO;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false, columnDefinition = "text")
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

  @Column(name = "product_archived", nullable = false)
  private boolean productArchived = false;

  @JsonIgnore
  @Type(type = "org.hibernate.type.BinaryType")
  @Column(name = "product_picture_file")
  private byte[] productPictureFile;

}
