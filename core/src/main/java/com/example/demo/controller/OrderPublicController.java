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

    // Your service signature is:
    // createOrderWithItems(String name, String email, BigDecimal subtotalIgnored,
    // OrderStatus status,
    // List<OrderItem> items, BigDecimal shippingTotal, BigDecimal taxTotal,
    // BigDecimal discountTotal)

    Order saved = orderService.createOrderWithItems(
        req.getName(),
        req.getEmail(),
        BigDecimal.ZERO, // subtotalIgnored (service calculates subtotal itself)
        status,
        items,
        shippingTotal,
        taxTotal,
        discountTotal);

    return java.util.Map.of(
        "orderId", saved.getOrderId(),
        "status", saved.getOrderStatus().name());
  }

  public static class CreateOrderRequest {
    private String name;
    private String email;
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
