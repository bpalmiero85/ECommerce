package com.example.demo.service;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.stereotype.Service;

import com.example.demo.config.UspsJsonProperties;
import com.example.demo.model.BaseRateOption;
import com.example.demo.model.BaseRatesQuery;
import java.math.RoundingMode;

@Service
public class ShippingRateService {

  private final USPSClient uspsClient;
  private final UspsJsonProperties uspsProps;

  public ShippingRateService(USPSClient uspsClient, UspsJsonProperties uspsProps) {
    this.uspsClient = uspsClient;
    this.uspsProps = uspsProps;
  }

  /**
   * Convenience method to fetch a single/base rate for a rectangular parcel via USPS JSON API.
   *
   * @param destinationZip  5-digit destination ZIP
   * @param weightOunces    total package weight in ounces (we'll convert to pounds)
   * @param lengthInches    outer length
   * @param widthInches     outer width
   * @param heightInches    outer height
   * @return BaseRateOption returned by USPS API
   */
  public BaseRateOption getBaseRateForParcel(
      String destinationZip,
      double weightOunces,
      double lengthInches,
      double widthInches,
      double heightInches
  ) {

    // Convert oz -> lb with 2 decimal places (USPS expects pounds in JSON model we generated)
    BigDecimal weightPounds = BigDecimal
        .valueOf(weightOunces / 16.0)
        .setScale(2, RoundingMode.HALF_UP);

    // Build the JSON API query. These fields map to your generated BaseRatesQuery.
    BaseRatesQuery query = new BaseRatesQuery(
        uspsProps.getOriginZip(),                    // originZIPCode
        destinationZip,                              // destinationZIPCode
        BigDecimal.valueOf(Math.max(0.01, weightPounds.doubleValue())), // weight (lb) min-guard
        BigDecimal.valueOf(lengthInches),            // length
        BigDecimal.valueOf(widthInches),             // width
        BigDecimal.valueOf(heightInches),            // height
        "PRIORITY_MAIL",                             // mailClass (example default)
        "MACHINABLE",                                // processingCategory
        "SP",                                        // rateIndicator (Single Piece)
        "NONE",                                      // destinationEntryFacilityType
        "RETAIL",                                    // priceType (RETAIL/COMMERCIAL/etc.)
        LocalDate.now()                              // mailingDate
    );

    return uspsClient.getBaseRate(query);
  }
}