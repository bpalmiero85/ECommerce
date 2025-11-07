package com.example.demo.controller;

import com.example.demo.model.BaseRateOption;
import com.example.demo.service.ShippingRateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/shipping")
public class ShippingController {

  private final ShippingRateService shippingRateService;

  public ShippingController(ShippingRateService shippingRateService) {
    this.shippingRateService = shippingRateService;
  }
  private static final Logger log = LoggerFactory.getLogger(ShippingController.class);

  /**
   * POST /api/shipping/rates
   * Body: ShippingRateRequest (destinationZip, weightOunces, lengthInches, widthInches, heightInches)
   * Returns: USPS BaseRateOption (adapted)
   */
  @PostMapping("/rates")
public ResponseEntity<?> getRates(@RequestBody ShippingRateRequest req) {
  try {
    // quick validation to avoid null/empty issues
    if (req.getDestinationZip() == null || req.getDestinationZip().isBlank()) {
      return ResponseEntity.badRequest().body(
          java.util.Map.of("error", "destinationZip is required"));
    }

    BaseRateOption option = shippingRateService.getBaseRateForParcel(
        req.getDestinationZip(),
        req.getWeightOunces(),
        req.getLengthInches(),
        req.getWidthInches(),
        req.getHeightInches()
    );
    return ResponseEntity.ok(option);
  } catch (com.example.demo.service.UspsV3Client.UpstreamException e) {
    // USPS returned an error (XML <Error> or HTTP failure) — surface as 502
    log.error("USPS upstream error: {}", e.getMessage(), e);
    return ResponseEntity.status(502).body(
        java.util.Map.of("error", "USPS upstream error", "details", e.getMessage()));
  } catch (IllegalArgumentException e) {
    // Any bad inputs we detect later
    log.warn("Bad request: {}", e.getMessage());
    return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
  } catch (Exception e) {
    // Anything else — keep it visible for now
    log.error("Unexpected server error", e);
    return ResponseEntity.status(500).body(
        java.util.Map.of("error", "Internal Server Error", "details", e.getMessage()));
  }
}

  // Simple DTO for request body
  public static class ShippingRateRequest {
    private String destinationZip;
    private double weightOunces;
    private double lengthInches;
    private double widthInches;
    private double heightInches;

    public String getDestinationZip() { return destinationZip; }
    public void setDestinationZip(String destinationZip) { this.destinationZip = destinationZip; }

    public double getWeightOunces() { return weightOunces; }
    public void setWeightOunces(double weightOunces) { this.weightOunces = weightOunces; }

    public double getLengthInches() { return lengthInches; }
    public void setLengthInches(double lengthInches) { this.lengthInches = lengthInches; }

    public double getWidthInches() { return widthInches; }
    public void setWidthInches(double widthInches) { this.widthInches = widthInches; }

    public double getHeightInches() { return heightInches; }
    public void setHeightInches(double heightInches) { this.heightInches = heightInches; }
  }
}