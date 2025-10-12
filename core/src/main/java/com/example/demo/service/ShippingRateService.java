package com.example.demo.service;

import com.example.demo.config.UspsXmlProperties;
import com.example.demo.model.BaseRateOption;
import com.example.demo.model.BaseRateOptionRatesInner;
import com.example.demo.model.BaseRatesQuery;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;

@Service
public class ShippingRateService {

  private final UspsXmlClient xmlClient;
  private final UspsXmlProperties xmlProps;

  @Value("${usps.origin-zip:43001}")
  private String originZip;

  public ShippingRateService(UspsXmlClient xmlClient, UspsXmlProperties xmlProps) {
    this.xmlClient = xmlClient;
    this.xmlProps = xmlProps;
  }

  /**
   * Keep the same signature your controller expects, but we’ll build a RateV4
   * request under the hood and adapt the USPS XML response to BaseRateOption.
   */
  public BaseRateOption getBaseRateForParcel(
      String destinationZip,
      double weightOunces,
      double lengthInches,
      double widthInches,
      double heightInches
  ) {
    // Pounds + ounces (USPS RateV4 wants both).
    int pounds = (int) Math.floor(weightOunces / 16.0);
    double ouncesRemainder = weightOunces - (pounds * 16.0);

    // Build XML
    String xml = xmlClient.buildRateV4Request(
        xmlProps.getUserId(),
        xmlProps.getBaseUrl() != null ? getOriginZipFromCommon() : getOriginZipFromCommon(), // origin ZIP
        destinationZip,
        pounds,
        round2(ouncesRemainder),
        lengthInches,
        widthInches,
        heightInches,
        true // machinable default
    );

    // Call USPS
    String responseXml = xmlClient.rateV4RequestXml(xml);

    // Parse services
    List<UspsXmlClient.UspsPostage> postages = xmlClient.parsePostages(responseXml);

    // Adapt to your existing JSON-shaped model
    BaseRateOption out = new BaseRateOption();
    if (!postages.isEmpty()) {
      // choose the cheapest as totalBasePrice
      BigDecimal min = postages.stream()
          .map(p -> p.rate)
          .min(BigDecimal::compareTo)
          .orElse(BigDecimal.ZERO);
      out.setTotalBasePrice(min);
    }

    List<BaseRateOptionRatesInner> lines = postages.stream().map(p -> {
      BaseRateOptionRatesInner line = new BaseRateOptionRatesInner();
      line.setDescription(p.service);      // show USPS service name
      line.setPriceType("RETAIL");         // WebTools returns retail by default
      line.setPrice(p.rate);
      line.setSKU(null);                   // not applicable here
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