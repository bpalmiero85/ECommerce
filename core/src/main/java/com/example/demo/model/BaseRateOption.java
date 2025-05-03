package com.example.demo.model;

import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.validation.annotation.Validated;

import io.swagger.v3.oas.annotations.media.Schema;

import javax.annotation.Generated;

/**
 * BaseRateOption
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", date = "2025-05-03T18:31:05.408937-04:00[America/New_York]")
public class BaseRateOption {

  private BigDecimal totalBasePrice;

  private List<com.example.demo.model.BaseRateOptionRatesInner> rates;

  public BaseRateOption totalBasePrice(BigDecimal totalBasePrice) {
    this.totalBasePrice = totalBasePrice;
    return this;
  }

  /**
   * The total postage price.
   * 
   * @return totalBasePrice
   */
  @Validated
  @Schema(name = "totalBasePrice", description = "The total postage price.", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("totalBasePrice")
  public BigDecimal getTotalBasePrice() {
    return totalBasePrice;
  }

  public void setTotalBasePrice(BigDecimal totalBasePrice) {
    this.totalBasePrice = totalBasePrice;
  }

  public BaseRateOption rates(List<com.example.demo.model.BaseRateOptionRatesInner> rates) {
    this.rates = rates;
    return this;
  }

  public BaseRateOption addRatesItem(BaseRateOptionRatesInner ratesItem) {
    if (this.rates == null) {
      this.rates = new ArrayList<>();
    }
    this.rates.add(ratesItem);
    return this;
  }

  /**
   * Line-item rate details.
   * 
   * @return rates
   */
  @Validated
  @Schema(name = "rates", description = "Line-item rate details.", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
  @JsonProperty("rates")
  public List<com.example.demo.model.BaseRateOptionRatesInner> getRates() {
    return rates;
  }

  public void setRates(List<com.example.demo.model.BaseRateOptionRatesInner> rates) {
    this.rates = rates;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    BaseRateOption baseRateOption = (BaseRateOption) o;
    return Objects.equals(this.totalBasePrice, baseRateOption.totalBasePrice) &&
        Objects.equals(this.rates, baseRateOption.rates);
  }

  @Override
  public int hashCode() {
    return Objects.hash(totalBasePrice, rates);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class BaseRateOption {\n");
    sb.append("    totalBasePrice: ").append(toIndentedString(totalBasePrice)).append("\n");
    sb.append("    rates: ").append(toIndentedString(rates)).append("\n");
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
