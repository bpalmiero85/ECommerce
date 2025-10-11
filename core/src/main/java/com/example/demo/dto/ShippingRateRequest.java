package com.example.demo.dto;

public class ShippingRateRequest {
  private String destinationZip;
  private double weightOunces;
  private double lengthInches;
  private double widthInches;
  private double heightInches;

  public String getDestinationZip() {
    return destinationZip;
  }
  public void setDestinationZip(String destinationZip) {
    this.destinationZip = destinationZip;
  }

  public double getWeightOunces() {
    return weightOunces;
  }
  public void setWeightOunces(double weightOunces) {
    this.weightOunces = weightOunces;
  }

  public double getLengthInches() {
    return lengthInches;
  }
  public void setLengthInches(double lengthInches) {
    this.lengthInches = lengthInches;
  }

  public double getWidthInches() {
    return widthInches;
  }
  public void setWidthInches(double widthInches) {
    this.widthInches = widthInches;
  }

  public double getHeightInches() {
    return heightInches;
  }
  public void setHeightInches(double heightInches) {
    this.heightInches = heightInches;
  }
}