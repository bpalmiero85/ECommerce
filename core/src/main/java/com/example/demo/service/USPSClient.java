package com.example.demo.service;

import com.example.demo.config.UspsJsonProperties;
import com.example.demo.model.BaseRateOption;
import com.example.demo.model.BaseRatesQuery;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import reactor.netty.http.client.HttpClient;
import java.time.Duration;

@Slf4j
@Service
public class USPSClient {

  private final WebClient web;

  public USPSClient(WebClient.Builder builder, UspsJsonProperties props) {
    WebClient.Builder b = builder
        .baseUrl(props.getApiBase())
        .defaultHeader("User-Agent", "GothGlitterStore/1.0 (+http://localhost)");

    // Optional: if you set usps.json.user-id in properties, send it as a header
    // commonly used by JSON APIs.
    if (props.getUserId() != null && !props.getUserId().isBlank()) {
      b.defaultHeader("X-USPS-UserId", props.getUserId().trim());
    }

    // Timeouts for visibility on network stalls
    this.web = b
        .clientConnector(new ReactorClientHttpConnector(
            HttpClient.create()
                .responseTimeout(Duration.ofSeconds(15))
                .compress(true)))
        .build();
  }

  public BaseRateOption getBaseRate(BaseRatesQuery q) {
    log.info("USPS JSON request -> {}", q);

    return web.post()
        .uri("/base-rates/search")
        .bodyValue(q)
        .exchangeToMono(resp -> {
          HttpStatus sc = resp.statusCode();
          if (sc.is2xxSuccessful()) {
            return resp.bodyToMono(BaseRateOption.class).doOnNext(ok -> log.info("USPS JSON response <- {}", ok));
          }
          // Non-2xx: pull text body for debugging
          return resp.bodyToMono(String.class).defaultIfEmpty("")
              .flatMap(body -> {
                String msg = "USPS JSON API error " + sc.value() + " " + sc +
                    (body.isBlank() ? "" : (" | body: " + body));
                log.error(msg);
                return Mono.error(new IllegalStateException(msg));
              });
        })
        .block();
  }
}