package com.example.demo.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.OrderStatus;
import com.example.demo.service.OrderService;

@RestController
@RequestMapping("/api/orders")
public class OrderPublicController {

  private final OrderService orderService;

  public OrderPublicController(OrderService orderService) {
    this.orderService = orderService;
  }

  @PostMapping
  public java.util.Map<String, Object> createOrder(@RequestBody CreateOrderRequest req) {

    if (req.getItems() == null || req.getItems().isEmpty()) {
      throw new IllegalArgumentException("Order must contain at least one item");
    }

    // Build OrderItem entities from request items
    List<OrderItem> items = req.getItems().stream().map(i -> {
      OrderItem it = new OrderItem();
      it.setProductId(i.getProductId());
      it.setQuantity(i.getQuantity());
      return it;
    }).toList();

    // Default status
    OrderStatus status = (req.getStatus() == null) ? OrderStatus.PAID : req.getStatus();

    // Totals coming from client (these MUST be sent by frontend)
    BigDecimal shippingTotal = (req.getShippingTotal() == null) ? BigDecimal.ZERO : req.getShippingTotal();
    BigDecimal taxTotal = (req.getTaxTotal() == null) ? BigDecimal.ZERO : req.getTaxTotal();
    BigDecimal discountTotal = (req.getDiscountTotal() == null) ? BigDecimal.ZERO : req.getDiscountTotal();

    // PROVE what you received
    System.out.println("PUBLIC ORDER INCOMING: shipping=" + shippingTotal
        + " tax=" + taxTotal
        + " discount=" + discountTotal
        + " items=" + items.size());

    Order saved = orderService.createOrderWithItems(
        req.getName(),
        req.getEmail(),
        req.getShippingAddress1(),
        req.getShippingAddress2(),
        req.getShippingCity(),
        req.getShippingState(),
        req.getShippingZip(),
        BigDecimal.ZERO,
        status,
        items,
        shippingTotal,
        taxTotal,
        discountTotal);

    saved.setShippingAddress1(req.getShippingAddress1());
    saved.setShippingAddress2(req.getShippingAddress2());
    saved.setShippingCity(req.getShippingCity());
    saved.setShippingState(req.getShippingState());
    saved.setShippingZip(req.getShippingZip());

    saved = orderService.save(saved);

    return java.util.Map.of(
        "orderId", saved.getOrderId(),
        "status", saved.getOrderStatus().name());
  }

  public static class CreateOrderRequest {
    private String name;
    private String email;
    private String shippingAddress1;
    private String shippingAddress2;
    private String shippingCity;
    private String shippingState;
    private String shippingZip;
    private OrderStatus status;
    private List<CreateOrderItem> items;

    private BigDecimal shippingTotal;
    private BigDecimal taxTotal;
    private BigDecimal discountTotal;

    public String getName() {
      return name;
    }

    public void setName(String name) {
      this.name = name;
    }

    public String getEmail() {
      return email;
    }

    public void setEmail(String email) {
      this.email = email;
    }

    public String getShippingAddress1() {
      return shippingAddress1;
    }

    public void setShippingAddress1(String shippingAddress1) {
      this.shippingAddress1 = shippingAddress1;
    }

    public String getShippingAddress2() {
      return shippingAddress2;
    }

    public void setShippingAddress2(String shippingAddress2) {
      this.shippingAddress2 = shippingAddress2;
    }

    public String getShippingCity() {
      return shippingCity;
    }

    public void setShippingCity(String shippingCity) {
      this.shippingCity = shippingCity;
    }

    public String getShippingState() {
      return shippingState;
    }

    public void setShippingState(String shippingState) {
      this.shippingState = shippingState;
    }

    public String getShippingZip() {
      return shippingZip;
    }

    public void setShippingZip(String shippingZip) {
      this.shippingZip = shippingZip;
    }

    public OrderStatus getStatus() {
      return status;
    }

    public void setStatus(OrderStatus status) {
      this.status = status;
    }

    public List<CreateOrderItem> getItems() {
      return items;
    }

    public void setItems(List<CreateOrderItem> items) {
      this.items = items;
    }

    public BigDecimal getShippingTotal() {
      return shippingTotal;
    }

    public void setShippingTotal(BigDecimal shippingTotal) {
      this.shippingTotal = shippingTotal;
    }

    public BigDecimal getTaxTotal() {
      return taxTotal;
    }

    public void setTaxTotal(BigDecimal taxTotal) {
      this.taxTotal = taxTotal;
    }

    public BigDecimal getDiscountTotal() {
      return discountTotal;
    }

    public void setDiscountTotal(BigDecimal discountTotal) {
      this.discountTotal = discountTotal;
    }
  }

  public static class CreateOrderItem {
    private Long productId;
    private int quantity;

    public Long getProductId() {
      return productId;
    }

    public void setProductId(Long productId) {
      this.productId = productId;
    }

    public int getQuantity() {
      return quantity;
    }

    public void setQuantity(int quantity) {
      this.quantity = quantity;
    }
  }
}
