package com.example.demo.controller;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
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

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000", methods = {
    RequestMethod.GET,
    RequestMethod.POST,
    RequestMethod.PUT,
    RequestMethod.DELETE,
    RequestMethod.OPTIONS
}, allowedHeaders = "*", allowCredentials = "true")
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

  @PostMapping(value = "/product/{productId}/uploadPicture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Product> uploadProductPicture(@PathVariable Long productId,
      @RequestParam("file") MultipartFile file) throws IOException {
    Product product = productService.getProductById(productId).orElseThrow();
    product.setProductPictureFile(file.getBytes());
    product.setPictureType(file.getContentType());
    Product updated = productService.saveProduct(product);
    return ResponseEntity.ok(updated);

  }

  @CrossOrigin(origins = "http://localhost:3000")
  @GetMapping("/products")
  public List<Product> getAllProducts(@RequestParam(value= "category", required = false) String category) {
    if(category != null && !category.isBlank()){
      return productService.getProductCategory(category);
    }
    return productService.getAllProducts();
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
