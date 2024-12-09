package com.example.demo.controller;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.model.Product;
import com.example.demo.service.ProductService;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api")
public class ProductController {

  private final ProductService productService;

  public ProductController(ProductService productService) {
    this.productService = productService;
  }

  @PostMapping("/product")
  public ResponseEntity<Product> saveProduct(@RequestBody Product product) {
    Product newProduct = productService.saveProduct(product);
    return ResponseEntity.ok(newProduct);
  }

  @PostMapping("/product/{productId}/{productPIcture}")
  public ResponseEntity<String> uploadProductPicture(@PathVariable Long productId, @RequestParam("file") MultipartFile file) {
    try {
      byte[] pictureData = file.getBytes();
      productService.saveProductPicture(productId, pictureData);
      return ResponseEntity.ok("Product picture uploaded successfully!");
    } catch (IOException e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload profile picture");
    }
  }

  @CrossOrigin(origins = "http://localhost:3000")
  @GetMapping("/products")
  public List<Product> getAllProducts() {
    return productService.getAllProducts();
  }

  @GetMapping("/products/{id}")
  public ResponseEntity<Product> getProductById(@PathVariable Long id) {
    Optional<Product> product = productService.getProductById(id);
    return product.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
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
