package com.example.demo.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.demo.model.Product;
import com.example.demo.repository.ProductRepository;

@Service
public class ProductService {

  private final ProductRepository productRepository;

  public ProductService(ProductRepository productRepository) {
    this.productRepository = productRepository;
  }

  public Product saveProduct(Product product) {
    return productRepository.save(product);
  }

  public List<Product> getAllProducts() {
    return productRepository.findAll();
  }

  public Optional<Product> getProductById(Long id) {
    return productRepository.findById(id);
  }

  public Product saveProductPicture(Long id, byte[] productPictureData) {

    Optional<Product> productOptional = productRepository.findById(id);
    if (productOptional.isPresent()) {
      Product product = productOptional.get();
      product.setProductPictureFile(productPictureData);
      product.setPictureVersion(System.currentTimeMillis());
      return productRepository.save(product);
    } else {
      throw new RuntimeException("Product not found");
    }

  }

  public Product updateProduct(Long id, Product updatedProduct) {
    Optional<Product> existingProduct = productRepository.findById(id);
    if (existingProduct.isPresent()) {
      Product product = existingProduct.get();
      product.setName(updatedProduct.getName());
      product.setDescription(updatedProduct.getDescription());
      product.setPrice(updatedProduct.getPrice());
      product.setQuantity(updatedProduct.getQuantity());
      product.setPictureVersion(System.currentTimeMillis());
      return productRepository.save(product);
    } else {
      throw new RuntimeException("Product not found");
    }
  }

  public void deleteProduct(Long id) {
    if (productRepository.existsById(id)) {
      productRepository.deleteById(id);
    } else {
      throw new IllegalArgumentException("Product with id " + id + " does not exist");
    }

  }
}
