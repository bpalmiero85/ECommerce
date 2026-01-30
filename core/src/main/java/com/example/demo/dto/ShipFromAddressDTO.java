package com.example.demo.dto;

import org.hibernate.annotations.GenericGenerator;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShipFromAddressDTO {
  private String name;
  private String street1;
  private String city;
  private String state;
  private String zip;
  private String country;
}
