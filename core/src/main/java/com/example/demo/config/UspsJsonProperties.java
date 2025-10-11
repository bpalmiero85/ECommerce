package com.example.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "usps.json")
public class UspsJsonProperties {

  private boolean enabled = true;

  /** Base URL for the USPS JSON Pricing API (e.g. https://api.usps.com/prices/v3) */
  private String apiBase;

  /** Ship-from ZIP used when building rate requests */
  private String originZip;

  public boolean isEnabled() {
    return enabled;
  }
  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public String getApiBase() {
    return apiBase;
  }
  public void setApiBase(String apiBase) {
    this.apiBase = apiBase;
  }

  public String getOriginZip() {
    return originZip;
  }
  public void setOriginZip(String originZip) {
    this.originZip = originZip;
  }
  // add this field
private String userId;

// add these methods
public String getUserId() { return userId; }
public void setUserId(String userId) { this.userId = userId; }
}