package com.example.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
public class ShippoRateQuoteService {

    private final WebClient shippoClient;

    @Value("${shippo.carrier.usps}")
    private String uspsCarrierId;

    @Value("${shippo.carrier.ups}")
    private String upsCarrierId;

    @Value("${shipping.from.street1}")
    private String fromStreet1;

    @Value("${shipping.from.city}")
    private String fromCity;

    @Value("${shipping.from.state}")
    private String fromState;

    @Value("${shipping.from.zip}")
    private String fromZip;

    @Value("${shipping.from.country}")
    private String fromCountry;


    public ShippoRateQuoteService(@Value("${shippo.api.key}") String shippoApiKey) {
        this.shippoClient = WebClient.builder()
                .baseUrl("https://api.goshippo.com")
                .defaultHeader("Authorization", "ShippoToken " + shippoApiKey)
                .build();
    }

    public Map<String, Object> quote(
            String toName,
            String toStreet1,
            String toStreet2,
            String toCity,
            String toState,
            String toZip,
            double weightOunces,
            double lengthInches,
            double widthInches,
            double heightInches) {


        Map<String, Object> payload = Map.of(
                "address_from", Map.of(
                        "name", "Goth & Glitter",
                        "street1", fromStreet1,
                        "city", fromCity,
                        "state", fromState,
                        "zip", fromZip,
                        "country", fromCountry),
                // TEMP destination fields for Step 1 wiring; Step 2 will make these real
                "address_to", Map.of(
                        "name", toName,
                        "street1", toStreet1,
                        "street2", toStreet2 == null ? "" : toStreet2,
                        "city", toCity,
                        "state", toState,
                        "zip", toZip,
                        "country", "US"),
                "parcels", List.of(Map.of(
                        "length", String.valueOf(lengthInches),
                        "width", String.valueOf(widthInches),
                        "height", String.valueOf(heightInches),
                        "distance_unit", "in",
                        "weight", String.valueOf(weightOunces),
                        "mass_unit", "oz")),
                "async", false,
                "carrier_accounts", List.of(uspsCarrierId, upsCarrierId)
            );

                

        @SuppressWarnings("unchecked")
        Map<String, Object> shipment = shippoClient.post()
                .uri("/shipments/")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rates = (List<Map<String, Object>>) shipment.get("rates");

        if (rates == null || rates.isEmpty()) {
            return Map.of("cheapest", null, "options", List.of());
        }

        rates.sort(Comparator.comparing(r -> new BigDecimal((String) r.get("amount"))));

        Map<String, Object> cheapest = rates.get(0);
        List<Map<String, Object>> options = rates.size() <= 5 ? rates : rates.subList(0, 5);

        return Map.of("cheapest", cheapest, "options", options);
    }
}