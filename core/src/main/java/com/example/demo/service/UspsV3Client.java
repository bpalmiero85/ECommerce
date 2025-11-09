package com.example.demo.service;

import com.example.demo.config.UspsApiProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@ConditionalOnProperty(prefix = "usps.api", name = "enabled", havingValue = "true", matchIfMissing = true)
public class UspsV3Client {

  private final WebClient pricesClient;
  private final UspsApiProperties props;

  private volatile String accessToken;
  private volatile Instant expiresAt = Instant.EPOCH;

  public UspsV3Client(WebClient.Builder builder, UspsApiProperties props) {
    this.props = props;

    if (isBlank(props.getBaseUrl())) {
      throw new IllegalStateException("usps.api.base-url is blank");
    }
    if (isBlank(props.getTokenUrl())) {
      throw new IllegalStateException("usps.api.token-url is blank");
    }
    if (isBlank(props.getClientId())) {
      throw new IllegalStateException("usps.api.client-id is blank (not bound)");
    }
    if (isBlank(props.getClientSecret())) {
      throw new IllegalStateException("usps.api.client-secret is blank (not bound)");
    }

    System.out.println("[USPS] baseUrl         = " + props.getBaseUrl());
    System.out.println("[USPS] tokenUrl        = " + props.getTokenUrl());
    System.out.println("[USPS] clientId prefix = " +
        props.getClientId().substring(0, Math.min(8, props.getClientId().length())));

    this.pricesClient = builder
        .baseUrl(props.getBaseUrl().replaceAll("/+$", ""))
        .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
        .build();
  }

  private static boolean isBlank(String s) {
    return s == null || s.trim().isEmpty();
  }

  // ========= OAuth bearer helper =========
  private synchronized String bearer() {
    if (accessToken != null && Instant.now().isBefore(expiresAt.minusSeconds(60))) {
      return "Bearer " + accessToken;
    }

    System.out.println("[USPS] Fetching new OAuth token...");
    System.out.println("[USPS] Using clientId prefix: " +
        props.getClientId().substring(0, Math.min(8, props.getClientId().length())));
    System.out.println("[USPS] clientSecret length: " + props.getClientSecret().length());

    TokenRequest body = new TokenRequest(
        "client_credentials",
        props.getClientId(),
        props.getClientSecret()
    );

    try {
      TokenResponse token = WebClient.builder()
          .build()
          .post()
          .uri(props.getTokenUrl())
          .contentType(MediaType.APPLICATION_JSON)
          .accept(MediaType.APPLICATION_JSON)
          .bodyValue(body)
          .retrieve()
          .bodyToMono(TokenResponse.class)
          .block();

      if (token == null || token.access_token == null) {
        throw new UpstreamException("Failed to obtain USPS OAuth token (empty response)");
      }

      this.accessToken = token.access_token;
      long ttl = (token.expires_in > 0 ? token.expires_in : 1800);
      this.expiresAt = Instant.now().plusSeconds(ttl);

      System.out.println("[USPS] Obtained token; expires in " + ttl + "s");
      return "Bearer " + accessToken;
    } catch (WebClientResponseException e) {
      System.out.println("[USPS] Token error: " + e.getStatusCode() + " body=" + e.getResponseBodyAsString());
      throw new UpstreamException("USPS OAuth failed: " + e.getRawStatusCode() + " " + e.getStatusText(), e);
    } catch (Exception e) {
      throw new UpstreamException("USPS OAuth failed: " + e.getMessage(), e);
    }
  }

  private static class TokenRequest {
    public final String grant_type;
    public final String client_id;
    public final String client_secret;

    public TokenRequest(String grant_type, String client_id, String client_secret) {
      this.grant_type = grant_type;
      this.client_id = client_id;
      this.client_secret = client_secret;
    }
  }

  private static class TokenResponse {
    public String access_token;
    public long expires_in;
  }

  // ========= /prices/v3/base-rates/search =========
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
      double totalPounds = pounds + (ounces / 16.0);
      if (totalPounds <= 0) {
        throw new IllegalArgumentException("Weight must be > 0");
      }

      DomesticBaseRatesRequest req = new DomesticBaseRatesRequest();
      req.originZIPCode = originZip;
      req.destinationZIPCode = destinationZip;
      req.weight = round2(totalPounds);
      req.length = round2(lengthInches);
      req.width = round2(widthInches);
      req.height = round2(heightInches);
      req.mailClass = "PRIORITY_MAIL";
      req.processingCategory = machinable ? "MACHINABLE" : "NON_MACHINABLE";
      req.rateIndicator = "SP";
      req.destinationEntryFacilityType = "NONE";
      req.priceType = "RETAIL";

      String raw = pricesClient.post()
          .uri("/base-rates/search")
          .header(HttpHeaders.AUTHORIZATION, bearer())
          .contentType(MediaType.APPLICATION_JSON)
          .bodyValue(req)
          .retrieve()
          .bodyToMono(String.class)
          .block();

      System.out.println("[USPS] /base-rates/search raw response: " + raw);

      DomesticBaseRatesResponse resp = JsonUtils.fromJson(raw, DomesticBaseRatesResponse.class);

      if (resp == null || resp.rates == null || resp.rates.isEmpty()) {
        throw new UpstreamException("No rate returned from USPS Domestic Prices API");
      }

      List<UspsPostage> out = new ArrayList<>();

      for (DomesticBaseRatesResponse.Rate r : resp.rates) {
        BigDecimal price = firstNonNullMoney(r.commercialPrice, r.price);
        if (price != null) {
          String name =
              (r.description != null && !r.description.isBlank())
                  ? r.description
                  : (r.mailClass != null ? r.mailClass : "USPS SERVICE");
          out.add(new UspsPostage(name, price));
        }
      }

      if (out.isEmpty()) {
        throw new UpstreamException("USPS Domestic Prices API returned rates but none had a usable price");
      }

      return out;

    } catch (UpstreamException e) {
      throw e;
    } catch (WebClientResponseException e) {
      System.out.println("[USPS] Prices API error: " + e.getStatusCode() + " body=" + e.getResponseBodyAsString());
      throw new UpstreamException("USPS v3 call failed: " + e.getRawStatusCode() + " " + e.getStatusText(), e);
    } catch (Exception e) {
      throw new UpstreamException("USPS v3 call failed: " + e.getMessage(), e);
    }
  }

  private static class DomesticBaseRatesRequest {
    public String originZIPCode;
    public String destinationZIPCode;
    public double weight;
    public double length;
    public double width;
    public double height;
    public String mailClass;
    public String processingCategory;
    public String rateIndicator;
    public String destinationEntryFacilityType;
    public String priceType;
  }

  @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
  private static class DomesticBaseRatesResponse {
    public BigDecimal totalBasePrice;
    public List<Rate> rates;

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class Rate {
      public String SKU;
      public String description;
      public String priceType;
      public BigDecimal price;
      public BigDecimal commercialPrice;
      public Double weight;
      public Double dimWeight;
      public String mailClass;
      public String zone;
      public String processingCategory;
      public String destinationEntryFacilityType;
      public String rateIndicator;
    }
  }

  public static class UspsPostage {
    public final String service;
    public final BigDecimal rate;

    public UspsPostage(String service, BigDecimal rate) {
      this.service = service;
      this.rate = rate;
    }
  }

  public static class UpstreamException extends RuntimeException {
    public UpstreamException(String message) { super(message); }
    public UpstreamException(String message, Throwable cause) { super(message, cause); }
  }

  private static double round2(double v) {
    return new BigDecimal(v).setScale(2, java.math.RoundingMode.HALF_UP).doubleValue();
  }

  private static BigDecimal firstNonNullMoney(BigDecimal... vals) {
    for (BigDecimal v : vals) if (v != null) return v;
    return null;
  }

  private static class JsonUtils {
    private static final com.fasterxml.jackson.databind.ObjectMapper MAPPER =
        new com.fasterxml.jackson.databind.ObjectMapper();

    static <T> T fromJson(String json, Class<T> type) {
      try {
        return MAPPER.readValue(json, type);
      } catch (Exception e) {
        System.out.println("[USPS] Failed to map JSON: " + e.getMessage());
        return null;
      }
    }
  }
}