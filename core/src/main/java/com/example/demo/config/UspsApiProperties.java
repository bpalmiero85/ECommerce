package com.example.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "usps.api")
public class UspsApiProperties {
  private boolean enabled = true;

  private String baseUrl = "https://apis.usps.com/prices/v3";
 private String tokenUrl = "https://apis.usps.com/oauth2/v3/token";

  private String clientId; 
  private String clientSecret;
  private String scope;

  private String originZip = "43065";


  public String getScope() {
    return scope;
  }
  public void setScope(String scope) {
    this.scope = scope;
  }
  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public String getBaseUrl() {
    return baseUrl;
  }
  public void setBaseUrl(String baseUrl) {
    this.baseUrl = baseUrl;
  }

  public String getTokenUrl() {
    return tokenUrl;
  }

  public void setTokenUrl(String tokenUrl) {
    this.tokenUrl = tokenUrl;
  }

  public String getClientId() {
    return clientId;
  }

  public void setClientId(String clientId) {
    this.clientId = clientId;
  }

  public String getClientSecret() {
    return clientSecret;
  }

  public void setClientSecret(String clientSecret) {
    this.clientSecret = clientSecret;
  }

  public String getOriginZip() {
    return originZip;
  }

  public void setOriginZip(String originZip) {
    this.originZip = originZip;
  }



}
