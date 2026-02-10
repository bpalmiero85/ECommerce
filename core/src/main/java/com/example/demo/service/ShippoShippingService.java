package com.example.demo.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;

import com.example.demo.dto.ShipFromAddressDTO;
import com.example.demo.model.Order;
import com.example.demo.repository.OrderRepository;

/**
 * Shippo API version is pinned at the account level (Dashboard → API Settings).
 * Current pinned version: 2018-02-08.
 *
 * This service relies on that pinned version to ensure stable request/response
 * behavior and to avoid unexpected breaking changes from Shippo "Latest"
 * updates.
 *
 * Billing behavior (including pay-as-you-go label charges beyond the free
 * 30-label allowance) is NOT affected by the API version.
 *
 * Do NOT switch to "Latest" without reviewing Shippo release notes and
 * validating label creation, rates, and transactions in a test environment.
 */

public class ShippoShippingService {
  // TEMPORARY ship-from address
  // Will be replaced with UPS Store mailbox address once mailbox agreement is
  // finalized

  @Value("${shipping.from.name}")
  private String fromName;

  @Value("${shipping.from.street}")
  private String fromStreet;

  @Value("${shipping.from.city}")
  private String fromCity;

  @Value("${shipping.from.state}")
  private String fromState;

  @Value("${shipping.from.zip}")
  private String fromZip;

  @Value("${shipping.from.country}")
  private String fromCountry;

  private ShipFromAddressDTO buildFromAddress() {
    return new ShipFromAddressDTO(
        fromName,
        fromStreet,
        fromCity,
        fromState,
        fromZip,
        fromCountry);
  }

}
