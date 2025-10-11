package com.example.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "usps.xml")
public class UspsXmlProperties {
  private boolean enabled = true;

  private String baseUrl;
  private String userId;

  public boolean isEnabled() {
    return enabled;
  }
  public void setEnabled(boolean enabled){
    this.enabled = enabled;
  }
  public String getBaseUrl() {
    return baseUrl;
  }
  public void setBaseUrl(String baseUrl){
    this.baseUrl = baseUrl;
  }
  public String getUserId(){
    return userId;
  }
  public void setUserId(String userId){
    this.userId = userId;
  }
}
