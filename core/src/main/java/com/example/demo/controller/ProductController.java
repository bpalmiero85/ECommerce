package com.example.demo.controller;

import java.util.List;
import java.util.Optional;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.example.demo.model.Product;
import com.example.demo.service.ProductService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000", methods = {
    RequestMethod.GET,
    RequestMethod.OPTIONS
}, allowedHeaders = "*", allowCredentials = "true")
public class ProductController {

  private final ProductService productService;

  public ProductController(ProductService productService) {
    this.productService = productService;
  }

  @CrossOrigin(origins = "http://localhost:3000")
  @GetMapping("/products")
  public List<Product> getAllProducts(
      @RequestParam(value = "category", required = false) String category,
      @RequestParam(value = "featured", required = false) Boolean featured,
      @RequestParam(value = "newArrival", required = false) Boolean newArrival) {
    if (Boolean.TRUE.equals(featured) && category != null && !category.isBlank()) {
      return productService.getFeaturedProductsByCategory(category);
    }
    if (Boolean.TRUE.equals(featured)) {
      return productService.getFeaturedProducts();
    }
    if (Boolean.TRUE.equals(newArrival) && category != null && !category.isBlank()) {
      return productService.getNewArrivalsByCategory(category);
    }
    if (Boolean.TRUE.equals(newArrival)) {
      return productService.getNewArrivals();
    }
    if (category != null && !category.isBlank()) {
      return productService.getProductCategory(category);
    }
    return productService.getAllProducts();
  }

  @GetMapping("/products/featured")
  public List<Product> getFeatured() {
    return productService.getFeaturedProducts();
  }

  @GetMapping("/products/new-arrivals")
  public List<Product> getNewArrivals() {
    return productService.getNewArrivals();
  }

  @GetMapping("/products/category/{category}")
  public ResponseEntity<List<Product>> getProductByCategory(@PathVariable String category) {
    List<Product> products = productService.getProductCategory(category);

    return ResponseEntity.ok(products);
  }

  @GetMapping("/products/{id}")
  public ResponseEntity<Product> getProductById(@PathVariable Long id) {
    Optional<Product> product = productService.getProductById(id);
    return product.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
  }

  @GetMapping("/product/{id}/picture")
  public ResponseEntity<byte[]> getProductPicture(@PathVariable Long id) {
    Optional<Product> product = productService.getProductById(id);

    if (product.isEmpty()) {
      return ResponseEntity.notFound().build();
    }

    Product prod = product.get();
    byte[] data = prod.getProductPictureFile();
    if (data == null || data.length == 0) {
      return ResponseEntity.notFound().build();
    }
    MediaType mediaType = MediaType.parseMediaType(prod.getPictureType());
    return ResponseEntity.ok().contentType(mediaType).body(data);

  }
}
