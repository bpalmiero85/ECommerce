package com.example.demo.service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import javax.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.example.demo.model.Order;

@Service
public class OrderEmailService {
  private final JavaMailSender mailSender;

  @Value("${spring.mail.username:}")
  private String fromEmail;

  @Value("${mail.from-name:Goth & Glitter}")
  private String fromName;

  @Value("${app.timezone:America/New_York}")
  private String timezone;

  public OrderEmailService(JavaMailSender mailSender) {
    this.mailSender = mailSender;
  }

  private boolean emailConfigured() {
    return fromEmail != null && !fromEmail.isBlank();
  }

  public void sendOrderConfirmation(Order order) {
    if (!emailConfigured())
      return;
    String subject = "Your Goth & Glitter Order #" + order.getOrderId();
    String body = buildOrderConfirmationBody(order);
    send(order.getOrderEmail(), subject, body);
  }

  public void sendShippingConfirmation(Order order) {
    if (!emailConfigured())
      return;
    String subject = "Your Goth & Glitter Order #" + order.getOrderId() + " has shipped";
    String body = buildShippingConfirmationBody(order);

    send(order.getOrderEmail(), subject, body);
  }

  private void send(String to, String subject, String textBody) {
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
      helper.setTo(to);
      helper.setSubject(subject);
      helper.setText(textBody, false);

      helper.setFrom(fromEmail, fromName);

      mailSender.send(message);
    } catch (Exception e) {
      throw new RuntimeException("Failed to send email: " + subject, e);
    }
  }

  private String buildOrderConfirmationBody(Order order) {
    String timeLine = DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a z")
        .withZone(ZoneId.of(timezone))
        .format(order.getCreatedAt() != null ? order.getCreatedAt() : java.time.Instant.now());

    return ""
        + "Hi " + safe(order.getOrderName()) + ",\n"
        + timeLine + "\n"
        + "Thank you so much for your order from Goth & Glitter! 🖤🩸💀🔮\n\n"
        + "Your order has been successfully placed.\n\n"
        + "Orders ship on the next business day. Business days are Monday through Friday, excluding holidays — so orders placed on Friday, over the weekend, or on holidays ship the following business day.\n\n"
        + "🧾 Order Details:\n\n"
        + "Order #: " + order.getOrderId() + "\n"
        + "Order Total: $" + (order.getOrderTotal() != null ? order.getOrderTotal() : "0.00") + "\n\n"
        + "We’ll send you another email as soon as your order ships with tracking information.\n\n"
        + "If you have any questions or need to update anything, just reply to this email — we’re happy to help!\n\n"
        + "Thanks again for supporting Goth & Glitter 💀💖\n"
        + "— The Goth & Glitter Team\n";
  }

  private String buildShippingConfirmationBody(Order order) {
    String tracking = safe(order.getTrackingNumber());
    String carrier = safe(order.getCarrier());
    String trackingUrl = buildTrackingUrl(carrier, tracking);

    return ""
        + "Hi " + safe(order.getOrderName()) + ",\n\n"
        + "Your Goth & Glitter order has shipped! 🖤✨\n\n"
        + "Order #: " + order.getOrderId() + "\n"
        + "Carrier: " + (carrier.isBlank() ? "N/A" : carrier) + "\n"
        + "Tracking: " + (tracking.isBlank() ? "N/A" : tracking) + "\n\n"
        + "Track your package here! -> " + (tracking.isBlank() ? "N/A" : trackingUrl + "\n\n")
        + "Thanks again for supporting Goth & Glitter 💀💖\n"
        + "— The Goth & Glitter Team\n";
  }

  private String buildTrackingUrl(String carrier, String trackingNumber) {
    if (carrier == null || trackingNumber == null)
      return "";
    String c = carrier.trim().toLowerCase();
    String t = trackingNumber.trim();

    if (c.contains("ups")) {
      return "https://www.ups.com/track?tracknum=" + t;
    }
    if (c.contains("usps")) {
      return "https://tools.usps.com/go/TrackConfirmAction?tLabels=" + t;
    }
    if (c.contains("fedex")) {
      return "https://www.fedex.com/fedextrack/?trknbr=" + t;
    }
    return "";
  }

  private String safe(String s) {
    return s == null ? " " : s.trim();
  }
}
