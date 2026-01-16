package com.example.demo.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.OrderStatus;
import com.example.demo.repository.OrderRepository;

@Service
public class MetricsService {

  private final OrderRepository orderRepository;

  public MetricsService(OrderRepository orderRepository) {
    this.orderRepository = orderRepository;
  }

  public Map<String, Object> getSummary() {
    ZoneId zone = ZoneId.of("America/New_York");

    Instant startToday = LocalDate.now(zone).atStartOfDay(zone).toInstant();
    Instant now = Instant.now();
    Instant start7d = LocalDate.now(zone).minusDays(6).atStartOfDay(zone).toInstant();

    // choose which statuses count as “real orders” for metrics
    List<OrderStatus> included = List.copyOf(EnumSet.of(
        OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED));

    List<Order> todayOrders = orderRepository.findByOrderStatusInAndCreatedAtBetween(included, startToday, now);
    List<Order> last7DaysOrders = orderRepository.findByOrderStatusInAndCreatedAtBetween(included, start7d, now);

    BigDecimal todayGross = sumOrderTotals(todayOrders);
    BigDecimal todayShipping = sumShipping(todayOrders);
    BigDecimal todayTax = sumTax(todayOrders);
    BigDecimal todayNetRevenue = todayGross.subtract(todayShipping).subtract(todayTax); // “pure revenue” (not
                                                                                        // subtracting material yet)

    BigDecimal todayMaterial = sumMaterialCostAtSale(todayOrders);
    BigDecimal todayProfitAfterMaterial = todayNetRevenue.subtract(todayMaterial);

    Map<String, Object> out = new HashMap<>();
    out.put("todayOrders", todayOrders.size());
    out.put("last7DaysOrders", last7DaysOrders.size());
    out.put("todayGrossRevenue", todayGross);
    out.put("todayNetRevenueMinusShipTax", todayNetRevenue);
    out.put("todayMaterialCost", todayMaterial);
    out.put("todayProfitAfterMaterial", todayProfitAfterMaterial);
    return out;
  }

  private BigDecimal sumOrderTotals(List<Order> orders) {
    return orders.stream()
        .map(o -> o.getOrderTotal() == null ? BigDecimal.ZERO : o.getOrderTotal())
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  private BigDecimal sumShipping(List<Order> orders) {
    return orders.stream()
        .map(o -> o.getShippingTotal() == null ? BigDecimal.ZERO : o.getShippingTotal())
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  private BigDecimal sumTax(List<Order> orders) {
    return orders.stream()
        .map(o -> o.getTaxTotal() == null ? BigDecimal.ZERO : o.getTaxTotal())
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  private BigDecimal sumMaterialCostAtSale(List<Order> orders) {
    return orders.stream()
        .flatMap(o -> o.getItems().stream())
        .map(i -> lineMaterial(i))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  private BigDecimal lineMaterial(OrderItem i) {
    BigDecimal unit = i.getMaterialCostAtSale() == null ? BigDecimal.ZERO : i.getMaterialCostAtSale();
    return unit.multiply(BigDecimal.valueOf(i.getQuantity()));
  }
}
