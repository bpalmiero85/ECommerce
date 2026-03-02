package com.example.demo.controller;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.apache.catalina.connector.Response;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.DiscountCreateRequestDTO;
import com.example.demo.model.Discount;
import com.example.demo.model.Product;
import com.example.demo.service.ProductService;
import com.example.demo.service.DiscountService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
  private final ProductService productService;
  private final DiscountService discountService;

  public AdminController(ProductService productService, DiscountService discountService) {
    this.productService = productService;
    this.discountService = discountService;
  }

  @PatchMapping("/products/{id}/archive-toggle")
  public ResponseEntity<Product> toggleArchive(@PathVariable Long id) {
    Product updated = productService.toggleArchive(id);
    return ResponseEntity.ok(updated);
  }

  @PatchMapping("/discounts/{id}/toggle-enabled")
  public ResponseEntity<Discount> toggleDiscountEnabled(@PathVariable Long id) {
    Discount updated = discountService.toggleEnabled(id);
    return ResponseEntity.ok(updated);
  }

  @GetMapping("/discounts/all")
  public List<Discount> getAllDiscounts() {
    return discountService.getAllDiscounts();
  }

  @GetMapping
  public String adminCheck() {
    return "Admin access OK";
  }

  @GetMapping("/products/sold-out")
  public List<Product> getSoldOut() {
    return productService.getSoldOutProducts();
  }

  @GetMapping("/products/low-stock")
  public List<Product> getLowStock() {
    return productService.getLowStockProducts();
  }

  @GetMapping("/products/archived")
  public List<Product> getArchivedProducts() {
    return productService.getArchivedProducts();
  }

  @PostMapping("/discounts")
  public ResponseEntity<Discount> createDiscount(@RequestBody DiscountCreateRequestDTO request) {
    Discount created = discountService.createDiscount(request);
    return ResponseEntity.ok(created);
  }

  @PostMapping("/product")
  public ResponseEntity<Product> saveProduct(@RequestBody Product product) {
    Product newProduct = productService.saveProduct(product);
    return ResponseEntity.ok(newProduct);
  }

  @PostMapping(value = "/product/{productId}/uploadPicture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Product> uploadProductPicture(@PathVariable Long productId,
      @RequestParam("file") MultipartFile file) throws IOException {
    Product product = productService.getProductById(productId).orElseThrow();

    product.setPictureType(file.getContentType());

    Product updated = productService.saveProductPicture(productId, file.getBytes(), file.getContentType());

    updated.setPictureType(file.getContentType());
    updated = productService.saveProduct(updated);
    return ResponseEntity.ok(updated);
  }

  @PutMapping("/products/{id}")
  public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product product) {
    Product updatedProduct = productService.updateProduct(id, product);
    return ResponseEntity.ok(updatedProduct);
  }

  @DeleteMapping("/discounts/{discountId}/delete")
  public ResponseEntity<Void> deleteDiscount(@PathVariable Long discountId) {
    Optional<Discount> discount = discountService.getDiscountById(discountId);

    if (discount.isPresent()) {
      discountService.deleteDiscount(discountId);
      return ResponseEntity.noContent().build();
    }
    return ResponseEntity.notFound().build();

  }

  @DeleteMapping("/products/{id}")
  public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
    Optional<Product> product = productService.getProductById(id);

    if (product.isPresent()) {
      productService.deleteProduct(id);
      System.out.println("Product deleted successfully");
      return ResponseEntity.noContent().build();

    } else {
      System.out.println("There is no product with that id");
      return ResponseEntity.notFound().build();
    }
  }
}
