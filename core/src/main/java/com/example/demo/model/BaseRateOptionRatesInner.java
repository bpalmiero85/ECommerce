package com.example.demo.model;

import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.fasterxml.jackson.annotation.JsonTypeName;
import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;

import javax.annotation.Generated;

import org.springframework.validation.annotation.Validated;

/**
 * BaseRateOptionRatesInner
 */

@JsonTypeName("BaseRateOption_rates_inner")
@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", date = "2025-05-03T18:31:05.408937-04:00[America/New_York]")
public class BaseRateOptionRatesInner {

  private String SKU;

  private String description;

  private String priceType;

  private BigDecimal price;

  public BaseRateOptionRatesInner SKU(String SKU) {
    this.SKU = SKU;
    return this;
  }

  /**
   * Stock Keeping Unit for this rate.
   * 
   * @return SKU
   */

  @Schema(name = "SKU", description = "Stock Keeping Unit for this rate.", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("SKU")
  public String getSKU() {
    return SKU;
  }

  public void setSKU(String SKU) {
    this.SKU = SKU;
  }

  public BaseRateOptionRatesInner description(String description) {
    this.description = description;
    return this;
  }

  /**
   * Human-readable description of the rate.
   * 
   * @return description
   */

  @Schema(name = "description", description = "Human-readable description of the rate.", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("description")
  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public BaseRateOptionRatesInner priceType(String priceType) {
    this.priceType = priceType;
    return this;
  }

  /**
   * Type of price (RETAIL, COMMERCIAL, etc.).
   * 
   * @return priceType
   */

  @Schema(name = "priceType", description = "Type of price (RETAIL, COMMERCIAL, etc.).", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("priceType")
  public String getPriceType() {
    return priceType;
  }

  public void setPriceType(String priceType) {
    this.priceType = priceType;
  }

  public BaseRateOptionRatesInner price(BigDecimal price) {
    this.price = price;
    return this;
  }

  /**
   * Postage amount for this line item.
   * 
   * @return price
   */
  @Validated
  @Schema(name = "price", description = "Postage amount for this line item.", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("price")
  public BigDecimal getPrice() {
    return price;
  }

  public void setPrice(BigDecimal price) {
    this.price = price;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    BaseRateOptionRatesInner baseRateOptionRatesInner = (BaseRateOptionRatesInner) o;
    return Objects.equals(this.SKU, baseRateOptionRatesInner.SKU) &&
        Objects.equals(this.description, baseRateOptionRatesInner.description) &&
        Objects.equals(this.priceType, baseRateOptionRatesInner.priceType) &&
        Objects.equals(this.price, baseRateOptionRatesInner.price);
  }

  @Override
  public int hashCode() {
    return Objects.hash(SKU, description, priceType, price);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class BaseRateOptionRatesInner {\n");
    sb.append("    SKU: ").append(toIndentedString(SKU)).append("\n");
    sb.append("    description: ").append(toIndentedString(description)).append("\n");
    sb.append("    priceType: ").append(toIndentedString(priceType)).append("\n");
    sb.append("    price: ").append(toIndentedString(price)).append("\n");
    sb.append("}");
    return sb.toString();
  }

  /**
   * Convert the given object to string with each line indented by 4 spaces
   * (except the first line).
   */
  private String toIndentedString(Object o) {
    if (o == null) {
      return "null";
    }
    return o.toString().replace("\n", "\n    ");
  }
}
