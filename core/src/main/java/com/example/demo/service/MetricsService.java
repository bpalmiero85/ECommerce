package com.example.demo.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
import com.example.demo.repository.ProductRepository;

@Service
public class MetricsService {

  private final OrderRepository orderRepository;
  private final ProductRepository productRepository;

  public MetricsService(OrderRepository orderRepository, ProductRepository productRepository) {
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
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
    
    BigDecimal last7DaysGross = sumOrderTotals(last7DaysOrders);
    BigDecimal last7DaysMaterial = sumMaterialCostAtSale(last7DaysOrders);
    

    BigDecimal last7DaysShipping = sumShipping(last7DaysOrders);
    BigDecimal last7DaysTax = sumTax(last7DaysOrders);
    BigDecimal last7DaysNetRevenue = last7DaysGross.subtract(last7DaysShipping).subtract(last7DaysTax);
    BigDecimal last7DaysProfitAfterMaterial = last7DaysNetRevenue.subtract(last7DaysMaterial);

    BigDecimal todayDiscountTotal = sumDiscountTotals(todayOrders);
    BigDecimal last7DaysDiscountTotal = sumDiscountTotals(last7DaysOrders);

    BigDecimal todayGross = sumOrderTotals(todayOrders);
    BigDecimal todayShipping = sumShipping(todayOrders);
    BigDecimal todayTax = sumTax(todayOrders);
    BigDecimal todayNetRevenue = todayGross.subtract(todayShipping).subtract(todayTax); // “pure revenue” (not
                                                                                        // subtracting material yet)

    BigDecimal todayMaterial = sumMaterialCostAtSale(todayOrders);
    BigDecimal todayProfitAfterMaterial = todayNetRevenue.subtract(todayMaterial);

    int lowStockCount = productRepository.findByQuantityAndSoldOutFalseAndProductArchivedFalseOrderByNameAsc(1).size();
    int soldOutCount = productRepository.findBySoldOutTrueAndProductArchivedFalseOrderByNameAsc().size();

    BigDecimal averageOrderValue = last7DaysOrders.isEmpty() ? BigDecimal.ZERO : last7DaysGross.divide(BigDecimal.valueOf(last7DaysOrders.size()), 2, RoundingMode.HALF_UP); 

    int unresolvedFollowUpCount = orderRepository.findByNeedsFollowUpTrueAndFollowUpResolvedAtIsNullOrderByCreatedAtDesc().size();
    int openPaidOrdersCount = orderRepository.findByOrderStatusOrderByCreatedAtAsc(OrderStatus.PAID).size();

    Map<String, Object> out = new HashMap<>();
    out.put("todayOrders", todayOrders.size());
    out.put("last7DaysOrders", last7DaysOrders.size());
    out.put("todayGrossRevenue", todayGross);
    out.put("todayNetRevenueMinusShipTax", todayNetRevenue);
    out.put("todayMaterialCost", todayMaterial);
    out.put("todayProfitAfterMaterial", todayProfitAfterMaterial);
    out.put("unresolvedFollowUpCount", unresolvedFollowUpCount);
    out.put("openPaidOrdersCount", openPaidOrdersCount);
    out.put("last7DaysGrossRevenue", last7DaysGross);
    out.put("last7DaysProfitAfterMaterial", last7DaysProfitAfterMaterial);
    out.put("last7DaysNetRevenue", last7DaysNetRevenue);
    out.put("averageOrderValue", averageOrderValue);
    out.put("todayDiscountTotal", todayDiscountTotal);
    out.put("last7DaysDiscountTotal", last7DaysDiscountTotal);
    out.put("lowStockCount", lowStockCount);
    out.put("soldOutCount", soldOutCount);
    return out;
  }

  private BigDecimal sumDiscountTotals(List<Order> orders) {
    return orders.stream()
      .map(o -> o.getDiscountTotal() == null ? BigDecimal.ZERO : o.getDiscountTotal())
      .reduce(BigDecimal.ZERO, BigDecimal::add); 
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
