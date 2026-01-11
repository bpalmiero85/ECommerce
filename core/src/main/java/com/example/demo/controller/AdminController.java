package com.example.demo.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.model.Product;
import com.example.demo.service.ProductService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
  private final ProductService productService;

  public AdminController(ProductService productService) {
    this.productService = productService;
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

  @PostMapping("/product")
  public ResponseEntity<Product> saveProduct(@RequestBody Product product) {
    Product newProduct = productService.saveProduct(product);
    return ResponseEntity.ok(newProduct);
  }

  @PostMapping(value = "/product/{productId}/uploadPicture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Product> uploadProductPicture(@PathVariable Long productId,
      @RequestParam("file") MultipartFile file) throws IOException {
    Product product = productService.getProductById(productId).orElseThrow();
    product.setProductPictureFile(file.getBytes());
    product.setPictureType(file.getContentType());
    Product updated = productService.saveProduct(product);
    return ResponseEntity.ok(updated);
  }

  @PutMapping("/products/{id}")
  public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product product) {
    Product updatedProduct = productService.updateProduct(id, product);
    return ResponseEntity.ok(updatedProduct);
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
