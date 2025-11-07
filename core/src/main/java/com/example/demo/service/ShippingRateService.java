package com.example.demo.service;

import com.example.demo.model.BaseRateOption;
import com.example.demo.model.BaseRateOptionRatesInner;
import com.example.demo.model.BaseRatesQuery;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;

@Service
public class ShippingRateService {

  private final UspsV3Client uspsClient;

  @Value("${usps.origin-zip:43001}")
  private String originZip;

  public ShippingRateService(UspsV3Client uspsClient) {
    this.uspsClient = uspsClient;
  }

  /**
   * call USPS v3
   * (JSON + OAuth) under the hood and adapt the response to BaseRateOption.
   */
  public BaseRateOption getBaseRateForParcel(
      String destinationZip,
      double weightOunces,
      double lengthInches,
      double widthInches,
      double heightInches
  ) {
    // v3 supports pounds
    int pounds = (int) Math.floor(weightOunces / 16.0);
    double ouncesRemainder = weightOunces - (pounds * 16.0);

    // Call USPS v3 client
    List<UspsV3Client.UspsPostage> postages = uspsClient.getDomesticRates(
        getOriginZipFromCommon(),
        destinationZip,
        pounds,
        round2(ouncesRemainder),
        lengthInches,
        widthInches,
        heightInches,
        true // machinable default
    );

    // Adapt to existing JSON-shaped model
    BaseRateOption out = new BaseRateOption();
    if (!postages.isEmpty()) {
      BigDecimal min = postages.stream()
          .map(p -> p.rate)
          .min(BigDecimal::compareTo)
          .orElse(BigDecimal.ZERO);
      out.setTotalBasePrice(min);
    }

    List<BaseRateOptionRatesInner> lines = postages.stream().map(p -> {
      BaseRateOptionRatesInner line = new BaseRateOptionRatesInner();
      line.setDescription(p.service); // USPS service name
      line.setPriceType("RETAIL");    // keep label; underlying price may be retail/commercial based on client
      line.setPrice(p.rate);
      line.setSKU(null);
      return line;
    }).collect(Collectors.toList());

    out.setRates(lines);
    return out;
  }

  // helper to pull the shared origin ZIP you configured
  private String getOriginZipFromCommon() {
    return originZip;
  }

  private double round2(double v) {
    return new BigDecimal(v).setScale(2, RoundingMode.HALF_UP).doubleValue();
  }
}