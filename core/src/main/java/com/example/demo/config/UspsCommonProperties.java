package com.example.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "usps.api")
public class UspsCommonProperties {
  private String originZip;

  public String getOriginZip(){
    return originZip;
  }
  public void setOriginZip(String originZip){
    this.originZip = originZip;
  }
}
