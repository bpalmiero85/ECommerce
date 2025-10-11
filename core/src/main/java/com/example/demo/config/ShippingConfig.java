package com.example.demo.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

import com.example.demo.service.USPSClient;


@Configuration
public class ShippingConfig {

  @Bean
  public WebClient.Builder webClientBuilder() {
    return WebClient.builder();
  }

  @Bean
  @ConditionalOnProperty(prefix = "usps.json", name = "enabled", havingValue = "true", matchIfMissing = true)
  public USPSClient uspsJsonClient(WebClient.Builder builder, UspsJsonProperties jsonProps) {
    return new USPSClient(builder, jsonProps);
  }
}