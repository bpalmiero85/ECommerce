package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.model.BaseRateOption;
import com.example.demo.service.ShippingRateService;
import com.example.demo.dto.ShippingRateRequest;

@RestController
@RequestMapping("/api/shipping")
public class ShippingController {

  private final ShippingRateService shippingRateService;

  public ShippingController(ShippingRateService shippingRateService) {
    this.shippingRateService = shippingRateService;
  }

  /**
   * POST /api/shipping/rates
   * Body: ShippingRateRequest (destinationZip, weightOunces, length/width/height in inches)
   * Returns: USPS BaseRateOption
   */
  @PostMapping("/rates")
public ResponseEntity<?> getRates(@RequestBody ShippingRateRequest req) {
  try {
    BaseRateOption option = shippingRateService.getBaseRateForParcel(
        req.getDestinationZip(),
        req.getWeightOunces(),
        req.getLengthInches(),
        req.getWidthInches(),
        req.getHeightInches()
    );
    return ResponseEntity.ok(option);
  } catch (Exception e) {
    // Return a 502 with the USPS error message so you can see it in Thunder Client
    return ResponseEntity.status(502).body(
        java.util.Map.of(
            "error", "Failed to fetch USPS rates",
            "details", e.getMessage()
        )
    );
  }
}
}