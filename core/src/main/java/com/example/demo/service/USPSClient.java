package com.example.demo.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.example.demo.model.BaseRatesQuery;
import com.example.demo.model.BaseRateOption;

@Service
public class USPSClient {
  private final WebClient web;

    public USPSClient(WebClient.Builder b) {
      this.web = b.baseUrl("https://api/usps.com/prices/v3").build();
    }

    public BaseRateOption getBaseRate(BaseRatesQuery q) {
      return web  
        .post()
        .uri("/base-rates/search")
        .bodyValue(q)
        .retrieve()
        .bodyToMono(BaseRateOption.class)
        .block();
    }
  }

