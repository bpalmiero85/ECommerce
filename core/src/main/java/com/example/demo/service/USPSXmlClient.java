package com.example.demo.service;

import com.example.demo.config.UspsXmlProperties;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.xml.parsers.DocumentBuilderFactory;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.w3c.dom.*;

@Component
public class UspsXmlClient {

  private final String baseUrl;
  private final RestTemplate http;

  public UspsXmlClient(UspsXmlProperties props) {
    this.baseUrl = props.getBaseUrl(); // e.g. https://secure.shippingapis.com/ShippingAPI.dll
    this.http = new RestTemplate();
    // ensure UTF-8 for XML strings in/out
    this.http.getMessageConverters().add(0, new StringHttpMessageConverter(StandardCharsets.UTF_8));
  }

  /** Build a USPS RateV4 XML payload. */
  public String buildRateV4Request(
      String userId,
      String originZip,
      String destinationZip,
      int pounds,
      double ounces,
      double lengthInches,
      double widthInches,
      double heightInches,
      boolean machinable) {
    // Service PRIORITY gets you Priority Mail retail quotes; you can experiment
    // with others.
    // Size is REGULAR unless length>12 || width>12 || height>12 (then LARGE).
    String size = (lengthInches > 12 || widthInches > 12 || heightInches > 12) ? "LARGE" : "REGULAR";

    return "<RateV4Request USERID=\"" + escape(userId) + "\">" +
        "<Revision>2</Revision>" +
        "<Package ID=\"1ST\">" +
        "<Service>PRIORITY</Service>" +
        "<ZipOrigination>" + escape(originZip) + "</ZipOrigination>" +
        "<ZipDestination>" + escape(destinationZip) + "</ZipDestination>" +
        "<Pounds>" + pounds + "</Pounds>" +
        "<Ounces>" + String.format(java.util.Locale.US, "%.2f", ounces) + "</Ounces>" +
        "<Container>RECTANGULAR</Container>" +
        "<Size>" + size + "</Size>" +
        "<Width>" + String.format(java.util.Locale.US, "%.2f", widthInches) + "</Width>" +
        "<Length>" + String.format(java.util.Locale.US, "%.2f", lengthInches) + "</Length>" +
        "<Height>" + String.format(java.util.Locale.US, "%.2f", heightInches) + "</Height>" +
        "<Machinable>" + (machinable ? "true" : "false") + "</Machinable>" +
        "</Package>" +
        "</RateV4Request>";
  }

  /**
   * Call the USPS endpoint using GET ?API=RateV4&XML=... and return the raw XML
   * string.
   */
  public String rateV4RequestXml(String xmlPayload) {
    try {
      String encodedXml = URLEncoder.encode(xmlPayload, StandardCharsets.UTF_8);
      String url = baseUrl + "?API=RateV4&XML=" + encodedXml;
      String body = http.getForObject(url, String.class);

      // Quick sanity check to ease debugging
      if (body == null || body.isBlank()) {
        throw new UpstreamException("Empty response from USPS");
      }
      return body;
    } catch (Exception e) {
      throw new UpstreamException("USPS WebTools call failed: " + e.getMessage(), e);
    }
  }

  /** Parse <Postage> entries from a RateV4Response. */
  public List<UspsPostage> parsePostages(String responseXml) {
    List<UspsPostage> out = new ArrayList<>();
    try {
      // If we got HTML (common when blocked), fail fast with a snippet
      String head = responseXml.stripLeading().toLowerCase();
      if (!head.startsWith("<")) {
        throw new UpstreamException("Non-XML response from USPS: " +
            responseXml.substring(0, Math.min(300, responseXml.length())));
      }
      if (head.startsWith("<html")) {
        throw new UpstreamException("HTML error from USPS: " +
            responseXml.substring(0, Math.min(300, responseXml.length())));
      }

      Document doc = DocumentBuilderFactory.newInstance().newDocumentBuilder()
          .parse(new java.io.ByteArrayInputStream(responseXml.getBytes(StandardCharsets.UTF_8)));
      doc.getDocumentElement().normalize();

      // USPS sometimes returns <Error> at the root or under <RateV4Response>
      NodeList errorNodes = doc.getElementsByTagName("Error");
      if (errorNodes != null && errorNodes.getLength() > 0) {
        String description = textContent(doc, "Description");
        if (description == null || description.isBlank())
          description = "Unknown USPS error";
        throw new UpstreamException("USPS Error: " + description);
      }

      NodeList postageNodes = doc.getElementsByTagName("Postage");
      for (int i = 0; i < postageNodes.getLength(); i++) {
        Element p = (Element) postageNodes.item(i);
        String service = textContent(p, "MailService");
        String rateStr = textContent(p, "Rate"); // Retail rate
        if ((rateStr == null || rateStr.isBlank())) {
          rateStr = textContent(p, "CommercialRate");
        }
        if (service != null && rateStr != null) {
          service = service.replaceAll("<[^>]+>", "").replace("&amp;", "&");
          out.add(new UspsPostage(service, new BigDecimal(rateStr.trim())));
        }
      }

      if (out.isEmpty()) {
        throw new UpstreamException("No <Postage> entries found. Raw preview: " +
            responseXml.substring(0, Math.min(300, responseXml.length())));
      }
      return out;
    } catch (UpstreamException ue) {
      throw ue;
    } catch (Exception e) {
      throw new UpstreamException("Failed to parse USPS RateV4Response XML. Preview: " +
          responseXml.substring(0, Math.min(300, responseXml.length())), e);
    }
  }

  private static String textContent(Element parent, String tag) {
    NodeList nl = parent.getElementsByTagName(tag);
    if (nl == null || nl.getLength() == 0)
      return null;
    return nl.item(0).getTextContent();
  }

  private static String textContent(Document doc, String tag) {
    NodeList nl = doc.getElementsByTagName(tag);
    if (nl == null || nl.getLength() == 0)
      return null;
    return nl.item(0).getTextContent();
  }

  private static String escape(String s) {
    if (s == null)
      return "";
    return s.replace("&", "&amp;").replace("<", "&lt;").replace("\"", "&quot;");
  }

  /** Simple value holder for parsed postage lines. */
  public static class UspsPostage {
    public final String service;
    public final BigDecimal rate;

    public UspsPostage(String service, BigDecimal rate) {
      this.service = service;
      this.rate = rate;
    }
  }

  /** Marker for upstream/WebTools failures with a human-readable message. */
  public static class UpstreamException extends RuntimeException {
    public UpstreamException(String message) {
      super(message);
    }

    public UpstreamException(String message, Throwable cause) {
      super(message, cause);
    }
  }
}
