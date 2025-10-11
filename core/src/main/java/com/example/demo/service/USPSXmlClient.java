package com.example.demo.service;

import java.math.BigDecimal;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import javax.xml.parsers.DocumentBuilderFactory;

import com.example.demo.config.UspsXmlProperties;
import org.springframework.util.Assert;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;

/**
 * Minimal USPS WebTools XML client (RateV4 domestic).
 * Returns the first available <Rate> or <CommercialRate>.
 */
public class USPSXmlClient {

  private final UspsXmlProperties props;
  private final RestTemplate rest;

  public USPSXmlClient(UspsXmlProperties props, RestTemplate rest) {
    this.props = props;
    this.rest = rest;
  }

  /**
   * Query a simple domestic package rate using RateV4 API.
   *
   * @param originZip      5-digit ZIP, e.g. "43001"
   * @param destinationZip 5-digit ZIP
   * @param pounds         integer pounds (0–70)
   * @param ounces         decimal ounces (0–15.999)
   * @param container      "", "RECTANGULAR", "NONRECTANGULAR", etc.
   * @param size           "REGULAR" or "LARGE"
   * @return BigDecimal price, or null if not found
   */
  public BigDecimal getRateV4(
      String originZip,
      String destinationZip,
      int pounds,
      BigDecimal ounces,
      String container,
      String size
  ) {
    Assert.hasText(props.getUserId(), "usps.xml.user-id must be set");
    Assert.hasText(props.getBaseUrl(), "usps.xml.base-url must be set");

    String xml =
        "<RateV4Request USERID=\"" + escape(props.getUserId()) + "\">" +
          "<Revision>2</Revision>" +
          "<Package ID=\"1ST\">" +
            "<Service>ALL</Service>" +
            "<ZipOrigination>" + escape(originZip) + "</ZipOrigination>" +
            "<ZipDestination>" + escape(destinationZip) + "</ZipDestination>" +
            "<Pounds>" + pounds + "</Pounds>" +
            "<Ounces>" + (ounces == null ? "0" : ounces) + "</Ounces>" +
            "<Container>" + escape(container == null ? "" : container) + "</Container>" +
            "<Size>" + escape(size == null ? "REGULAR" : size) + "</Size>" +
            "<Machinable>true</Machinable>" +
          "</Package>" +
        "</RateV4Request>";

    URI uri = UriComponentsBuilder
        .fromHttpUrl(props.getBaseUrl())
        .queryParam("API", "RateV4")
        .queryParam("XML", xml)
        .build(true)
        .toUri();

    String body = rest.getForObject(uri, String.class);
    if (body == null || body.isBlank()) return null;

    try {
      Document doc = DocumentBuilderFactory.newInstance()
          .newDocumentBuilder()
          .parse(new java.io.ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8)));

      // Prefer CommercialRate; fallback to Rate
      NodeList commercial = doc.getElementsByTagName("CommercialRate");
      if (commercial.getLength() > 0) {
        String v = commercial.item(0).getTextContent().trim();
        return new BigDecimal(v);
      }
      NodeList retail = doc.getElementsByTagName("Rate");
      if (retail.getLength() > 0) {
        String v = retail.item(0).getTextContent().trim();
        return new BigDecimal(v);
      }
      return null;
    } catch (Exception ex) {
      throw new RuntimeException("Failed to parse USPS RateV4 response", ex);
    }
  }

  private static String escape(String s) {
    return s.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&apos;");
  }
}