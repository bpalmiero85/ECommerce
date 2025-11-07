package com.example.demo.service;

import com.example.demo.config.UspsApiProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
@ConditionalOnProperty(prefix = "usps.api", name = "enabled", havingValue = "true", matchIfMissing = true)
public class UspsV3Client {

  private final WebClient http;
  private final UspsApiProperties props;

  // simple in-memory token cache
  private volatile String accessToken;
  private volatile java.time.Instant expiresAt = java.time.Instant.EPOCH;

  public UspsV3Client(WebClient.Builder builder, UspsApiProperties props) {
    this.http = builder.baseUrl(props.getBaseUrl()).build();
    this.props = props;
  }

  // ===== OAuth bearer helper =====
  private synchronized String bearer() {
    if (accessToken == null || java.time.Instant.now().isAfter(expiresAt.minusSeconds(60))) {
      var token = WebClient.create()
        .post().uri(props.getTokenUrl(accessToken))
        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
        .body(BodyInserters
          .fromFormData("grant_type", "client_credentials")
          .with("client_id", props.getClientId())
          .with("client_secret", props.getClientSecret()))
        .retrieve()
        .bodyToMono(TokenResponse.class)
        .block();

      if (token == null || token.access_token == null) {
        throw new UpstreamException("Failed to obtain USPS OAuth token");
      }
      accessToken = token.access_token;
      long ttl = (token.expires_in > 0 ? token.expires_in : 1800);
      expiresAt = java.time.Instant.now().plusSeconds(ttl);
    }
    return "Bearer " + accessToken;
  }

  // ===== v3 prices call (JSON) =====
  public List<UspsPostage> getDomesticRates(
      String originZip,
      String destinationZip,
      int pounds,
      double ounces,
      double lengthInches,
      double widthInches,
      double heightInches,
      boolean machinable
  ) {
    try {
      DomesticPricesRequest req = new DomesticPricesRequest();
      // Adjust these fields to match the USPS v3 Domestic Prices spec you selected
      req.mailClass = "PRIORITY";           // parameterize later if you want
      req.originZIPCode = originZip;
      req.destinationZIPCode = destinationZip;
      req.pounds = pounds;
      req.ounces = round2(ounces);
      req.length = round2(lengthInches);
      req.width  = round2(widthInches);
      req.height = round2(heightInches);
      req.machinable = machinable;

      DomesticPricesResponse resp = http.post()
        .uri("/prices/v3/domestic")         // confirm exact path in the USPS v3 docs
        .header(HttpHeaders.AUTHORIZATION, bearer())
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(req)
        .retrieve()
        .bodyToMono(DomesticPricesResponse.class)
        .block();

      if (resp == null || resp.postages == null || resp.postages.isEmpty()) {
        throw new UpstreamException("No rates returned from USPS v3");
      }

      List<UspsPostage> out = new ArrayList<>();
      for (DomesticPricesResponse.Postage p : resp.postages) {
        BigDecimal price = firstNonNullMoney(p.commercialPrice, p.price);
        if (price != null && p.serviceName != null) {
          out.add(new UspsPostage(p.serviceName, price));
        }
      }
      if (out.isEmpty()) {
        throw new UpstreamException("USPS v3 returned rates but none were mappable to (service, price)");
      }
      return out;

    } catch (UpstreamException e) {
      throw e;
    } catch (Exception e) {
      throw new UpstreamException("USPS v3 call failed: " + e.getMessage(), e);
    }
  }

  // ===== helpers & DTOs =====

  private static double round2(double v) {
    return new java.math.BigDecimal(v).setScale(2, java.math.RoundingMode.HALF_UP).doubleValue();
  }
  private static BigDecimal firstNonNullMoney(BigDecimal... vals) {
    for (BigDecimal v : vals) if (v != null) return v;
    return null;
  }

  // token response (adjust names if your token endpoint differs)
  private static class TokenResponse {
    public String access_token;
    public long   expires_in;
  }

  // Minimal request DTO — align with USPS v3 schema you are using
  private static class DomesticPricesRequest {
    public String mailClass;
    public String originZIPCode;
    public String destinationZIPCode;
    public Integer pounds;
    public Double  ounces;
    public Double  length;
    public Double  width;
    public Double  height;
    public Boolean machinable;
  }

  // Minimal response DTO — align with USPS v3 schema you are using
  private static class DomesticPricesResponse {
    public List<Postage> postages;
    private static class Postage {
      public String serviceName;
      public BigDecimal price;           // retail
      public BigDecimal commercialPrice; // if present for your app
    }
  }

  // === public shape you already use in ShippingRateService ===
  public static class UspsPostage {
    public final String service;
    public final BigDecimal rate;
    public UspsPostage(String service, BigDecimal rate) {
      this.service = service; this.rate = rate;
    }
  }

  public static class UpstreamException extends RuntimeException {
    public UpstreamException(String message) { super(message); }
    public UpstreamException(String message, Throwable cause) { super(message, cause); }
  }
}