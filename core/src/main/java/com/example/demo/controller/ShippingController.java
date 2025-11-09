package com.example.demo.controller;

import com.example.demo.model.BaseRateOption;
import com.example.demo.service.ShippingRateService;
import com.example.demo.service.UspsV3Client;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Positive;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/shipping")
public class ShippingController {

  private static final Logger log = LoggerFactory.getLogger(ShippingController.class);
  private final ShippingRateService shippingRateService;

  public ShippingController(ShippingRateService shippingRateService) {
    this.shippingRateService = shippingRateService;
  }

  @PostMapping(
      path = "/rates",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> getRates(@Valid @RequestBody ShippingRateRequest req) {
    try {
      BaseRateOption option = shippingRateService.getBaseRateForParcel(
          req.getDestinationZip(),
          req.getWeightOunces(),
          req.getLengthInches(),
          req.getWidthInches(),
          req.getHeightInches()
      );
      return ResponseEntity.ok(option);

    } catch (UspsV3Client.UpstreamException e) {
      log.error("USPS upstream error: {}", e.getMessage(), e);
      return ResponseEntity.status(502).body(
          Map.of("error", "USPS upstream error", "details", e.getMessage()));
    } catch (IllegalArgumentException e) {
      log.warn("Bad request: {}", e.getMessage());
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    } catch (Exception e) {
      log.error("Unexpected server error", e);
      return ResponseEntity.status(500).body(
          Map.of("error", "Internal Server Error", "details", e.getMessage()));
    }
  }

  // Request DTO with simple validation
  public static class ShippingRateRequest {

    @Pattern(regexp = "^[0-9]{5}(-[0-9]{4})?$",
             message = "destinationZip must be a 5-digit or 9-digit ZIP")
    private String destinationZip;

    @Positive(message = "weightOunces must be > 0")
    private double weightOunces;

    @Positive(message = "lengthInches must be > 0")
    private double lengthInches;

    @Positive(message = "widthInches must be > 0")
    private double widthInches;

    @Positive(message = "heightInches must be > 0")
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

  // ✅ This makes validation errors show a useful JSON body instead of generic 400
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
    Map<String, String> fieldErrors = new HashMap<>();
    for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
      fieldErrors.put(fe.getField(), fe.getDefaultMessage());
    }
    Map<String, Object> body = Map.of(
        "error", "Validation failed",
        "fields", fieldErrors
    );
    return ResponseEntity.badRequest().body(body);
  }
}