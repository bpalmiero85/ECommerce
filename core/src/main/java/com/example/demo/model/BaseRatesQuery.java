package com.example.demo.model;

import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.NonNull;

import javax.annotation.Generated;

/**
 * BaseRatesQuery
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", date = "2025-05-03T18:31:05.408937-04:00[America/New_York]")
public class BaseRatesQuery {

  private String originZIPCode;

  private String destinationZIPCode;

  private BigDecimal weight;

  private BigDecimal length;

  private BigDecimal width;

  private BigDecimal height;

  private String mailClass;

  private String processingCategory;

  private String rateIndicator;

  private String destinationEntryFacilityType;

  private String priceType;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
  private LocalDate mailingDate;

  /**
   * Default constructor
   * 
   * @deprecated Use
   *             {@link BaseRatesQuery#BaseRatesQuery(String, String, BigDecimal, BigDecimal, BigDecimal, BigDecimal, String, String, String, String, String, LocalDate)}
   */
  @Deprecated
  public BaseRatesQuery() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public BaseRatesQuery(String originZIPCode, String destinationZIPCode, BigDecimal weight, BigDecimal length,
      BigDecimal width, BigDecimal height, String mailClass, String processingCategory, String rateIndicator,
      String destinationEntryFacilityType, String priceType, LocalDate mailingDate) {
    this.originZIPCode = originZIPCode;
    this.destinationZIPCode = destinationZIPCode;
    this.weight = weight;
    this.length = length;
    this.width = width;
    this.height = height;
    this.mailClass = mailClass;
    this.processingCategory = processingCategory;
    this.rateIndicator = rateIndicator;
    this.destinationEntryFacilityType = destinationEntryFacilityType;
    this.priceType = priceType;
    this.mailingDate = mailingDate;
  }

  public BaseRatesQuery originZIPCode(String originZIPCode) {
    this.originZIPCode = originZIPCode;
    return this;
  }

  /**
   * The originating ZIP Code™ for the package.
   * 
   * @return originZIPCode
   */
  @NonNull
  @Schema(name = "originZIPCode", description = "The originating ZIP Code™ for the package.", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("originZIPCode")
  public String getOriginZIPCode() {
    return originZIPCode;
  }

  public void setOriginZIPCode(String originZIPCode) {
    this.originZIPCode = originZIPCode;
  }

  public BaseRatesQuery destinationZIPCode(String destinationZIPCode) {
    this.destinationZIPCode = destinationZIPCode;
    return this;
  }

  /**
   * The destination ZIP Code™ for the package.
   * 
   * @return destinationZIPCode
   */
  @NonNull
  @Schema(name = "destinationZIPCode", description = "The destination ZIP Code™ for the package.", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("destinationZIPCode")
  public String getDestinationZIPCode() {
    return destinationZIPCode;
  }

  public void setDestinationZIPCode(String destinationZIPCode) {
    this.destinationZIPCode = destinationZIPCode;
  }

  public BaseRatesQuery weight(BigDecimal weight) {
    this.weight = weight;
    return this;
  }

  /**
   * Weight of the package in pounds.
   * 
   * @return weight
   */
  @NonNull
  @Validated
  @Schema(name = "weight", description = "Weight of the package in pounds.", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("weight")
  public BigDecimal getWeight() {
    return weight;
  }

  public void setWeight(BigDecimal weight) {
    this.weight = weight;
  }

  public BaseRatesQuery length(BigDecimal length) {
    this.length = length;
    return this;
  }

  /**
   * Package length in inches.
   * 
   * @return length
   */
  @NonNull
  @Validated
  @Schema(name = "length", description = "Package length in inches.", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("length")
  public BigDecimal getLength() {
    return length;
  }

  public void setLength(BigDecimal length) {
    this.length = length;
  }

  public BaseRatesQuery width(BigDecimal width) {
    this.width = width;
    return this;
  }

  /**
   * Package width in inches.
   * 
   * @return width
   */
  @NonNull
  @Validated
  @Schema(name = "width", description = "Package width in inches.", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("width")
  public BigDecimal getWidth() {
    return width;
  }

  public void setWidth(BigDecimal width) {
    this.width = width;
  }

  public BaseRatesQuery height(BigDecimal height) {
    this.height = height;
    return this;
  }

  /**
   * Package height in inches.
   * 
   * @return height
   */
  @NonNull
  @Validated
  @Schema(name = "height", description = "Package height in inches.", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("height")
  public BigDecimal getHeight() {
    return height;
  }

  public void setHeight(BigDecimal height) {
    this.height = height;
  }

  public BaseRatesQuery mailClass(String mailClass) {
    this.mailClass = mailClass;
    return this;
  }

  /**
   * Mail service requested (e.g. PRIORITY_MAIL).
   * 
   * @return mailClass
   */
  @NonNull
  @Schema(name = "mailClass", description = "Mail service requested (e.g. PRIORITY_MAIL).", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("mailClass")
  public String getMailClass() {
    return mailClass;
  }

  public void setMailClass(String mailClass) {
    this.mailClass = mailClass;
  }

  public BaseRatesQuery processingCategory(String processingCategory) {
    this.processingCategory = processingCategory;
    return this;
  }

  /**
   * MACHINABLE or NONSTANDARD.
   * 
   * @return processingCategory
   */
  @NonNull
  @Schema(name = "processingCategory", description = "MACHINABLE or NONSTANDARD.", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("processingCategory")
  public String getProcessingCategory() {
    return processingCategory;
  }

  public void setProcessingCategory(String processingCategory) {
    this.processingCategory = processingCategory;
  }

  public BaseRatesQuery rateIndicator(String rateIndicator) {
    this.rateIndicator = rateIndicator;
    return this;
  }

  /**
   * Rate ingredient code (e.g. SP for Single Piece).
   * 
   * @return rateIndicator
   */
  @NonNull
  @Schema(name = "rateIndicator", description = "Rate ingredient code (e.g. SP for Single Piece).", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("rateIndicator")
  public String getRateIndicator() {
    return rateIndicator;
  }

  public void setRateIndicator(String rateIndicator) {
    this.rateIndicator = rateIndicator;
  }

  public BaseRatesQuery destinationEntryFacilityType(String destinationEntryFacilityType) {
    this.destinationEntryFacilityType = destinationEntryFacilityType;
    return this;
  }

  /**
   * Facility type (e.g. NONE, DESTINATION_NETWORK_DISTRIBUTION_CENTER).
   * 
   * @return destinationEntryFacilityType
   */
  @NonNull
  @Schema(name = "destinationEntryFacilityType", description = "Facility type (e.g. NONE, DESTINATION_NETWORK_DISTRIBUTION_CENTER).", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("destinationEntryFacilityType")
  public String getDestinationEntryFacilityType() {
    return destinationEntryFacilityType;
  }

  public void setDestinationEntryFacilityType(String destinationEntryFacilityType) {
    this.destinationEntryFacilityType = destinationEntryFacilityType;
  }

  public BaseRatesQuery priceType(String priceType) {
    this.priceType = priceType;
    return this;
  }

  /**
   * RETAIL, COMMERCIAL, CONTRACT, or NSA.
   * 
   * @return priceType
   */
  @NonNull
  @Schema(name = "priceType", description = "RETAIL, COMMERCIAL, CONTRACT, or NSA.", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("priceType")
  public String getPriceType() {
    return priceType;
  }

  public void setPriceType(String priceType) {
    this.priceType = priceType;
  }

  public BaseRatesQuery mailingDate(LocalDate mailingDate) {
    this.mailingDate = mailingDate;
    return this;
  }

  /**
   * The date the package will be mailed (YYYY-MM-DD).
   * 
   * @return mailingDate
   */
  @NonNull
  @Validated
  @Schema(name = "mailingDate", description = "The date the package will be mailed (YYYY-MM-DD).", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("mailingDate")
  public LocalDate getMailingDate() {
    return mailingDate;
  }

  public void setMailingDate(LocalDate mailingDate) {
    this.mailingDate = mailingDate;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    BaseRatesQuery baseRatesQuery = (BaseRatesQuery) o;
    return Objects.equals(this.originZIPCode, baseRatesQuery.originZIPCode) &&
        Objects.equals(this.destinationZIPCode, baseRatesQuery.destinationZIPCode) &&
        Objects.equals(this.weight, baseRatesQuery.weight) &&
        Objects.equals(this.length, baseRatesQuery.length) &&
        Objects.equals(this.width, baseRatesQuery.width) &&
        Objects.equals(this.height, baseRatesQuery.height) &&
        Objects.equals(this.mailClass, baseRatesQuery.mailClass) &&
        Objects.equals(this.processingCategory, baseRatesQuery.processingCategory) &&
        Objects.equals(this.rateIndicator, baseRatesQuery.rateIndicator) &&
        Objects.equals(this.destinationEntryFacilityType, baseRatesQuery.destinationEntryFacilityType) &&
        Objects.equals(this.priceType, baseRatesQuery.priceType) &&
        Objects.equals(this.mailingDate, baseRatesQuery.mailingDate);
  }

  @Override
  public int hashCode() {
    return Objects.hash(originZIPCode, destinationZIPCode, weight, length, width, height, mailClass, processingCategory,
        rateIndicator, destinationEntryFacilityType, priceType, mailingDate);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class BaseRatesQuery {\n");
    sb.append("    originZIPCode: ").append(toIndentedString(originZIPCode)).append("\n");
    sb.append("    destinationZIPCode: ").append(toIndentedString(destinationZIPCode)).append("\n");
    sb.append("    weight: ").append(toIndentedString(weight)).append("\n");
    sb.append("    length: ").append(toIndentedString(length)).append("\n");
    sb.append("    width: ").append(toIndentedString(width)).append("\n");
    sb.append("    height: ").append(toIndentedString(height)).append("\n");
    sb.append("    mailClass: ").append(toIndentedString(mailClass)).append("\n");
    sb.append("    processingCategory: ").append(toIndentedString(processingCategory)).append("\n");
    sb.append("    rateIndicator: ").append(toIndentedString(rateIndicator)).append("\n");
    sb.append("    destinationEntryFacilityType: ").append(toIndentedString(destinationEntryFacilityType)).append("\n");
    sb.append("    priceType: ").append(toIndentedString(priceType)).append("\n");
    sb.append("    mailingDate: ").append(toIndentedString(mailingDate)).append("\n");
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
