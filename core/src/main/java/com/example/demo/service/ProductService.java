package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.model.Product;
import com.example.demo.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductService {

  private final ProductRepository productRepository;
  private final InventoryMemory inventory;

  public Product saveProduct(Product product) {
    if (product.getCategory() == null || product.getCategory().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category is required when posting a product.");
    }
    product.setSoldOut(product.getQuantity() <= 0);
    Product saved = productRepository.save(product);
    inventory.setStock(saved.getId(), saved.getQuantity());
    return saved;
  }

  public List<Product> getAllProducts() {
    List<Product> list = productRepository.findByProductArchivedFalseOrderByIdDesc();

    list.forEach(p -> inventory.seedIfAbsent(p.getId(), p.getQuantity()));
    return list;
  }

  public List<Product> getArchivedProducts() {
    return productRepository.findByProductArchivedTrueOrderByIdDesc();
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

  public List<Product> getProductCategory(String category) {
    List<Product> list = productRepository.findByCategoryIgnoreCaseAndProductArchivedFalseOrderByNameAsc(category);
    list.forEach(p -> inventory.seedIfAbsent(p.getId(), p.getQuantity()));
    return list;
  }

  public Product updateProduct(Long id, Product updatedProduct) {
    Optional<Product> existingProduct = productRepository.findById(id);
    if (existingProduct.isPresent()) {
      Product product = existingProduct.get();
      product.setName(updatedProduct.getName());
      product.setDescription(updatedProduct.getDescription());
      product.setPrice(updatedProduct.getPrice());
      product.setQuantity(updatedProduct.getQuantity());
      product.setSoldOut(product.getQuantity() <= 0);
      product.setCategory(updatedProduct.getCategory());
      product.setFeatured(updatedProduct.isFeatured());
      product.setNewArrival(updatedProduct.isNewArrival());
      product.setPictureVersion(System.currentTimeMillis());
      Product saved = productRepository.save(product);

      inventory.setStock(saved.getId(), saved.getQuantity());
      return saved;
    } else {
      throw new RuntimeException("Product not found");
    }
  }

  public List<Product> getFeaturedProducts() {
    List<Product> list = productRepository.findByFeaturedTrueAndProductArchivedFalseOrderByNameAsc();
    list.forEach(p -> inventory.seedIfAbsent(p.getId(), p.getQuantity()));
    return list;

  }

  public List<Product> getLowStockProducts() {
    return productRepository.findByQuantityAndSoldOutIsFalseAndProductArchivedFalseOrderByNameAsc(1);
  }

  public List<Product> getFeaturedProductsByCategory(String category) {
    List<Product> list = productRepository
        .findByCategoryIgnoreCaseAndFeaturedTrueAndProductArchivedFalseOrderByNameAsc(category);
    list.forEach(p -> inventory.seedIfAbsent(p.getId(), p.getQuantity()));
    return list;
  }

  public List<Product> getNewArrivals() {
    List<Product> list = productRepository.findByNewArrivalTrueAndProductArchivedFalseOrderByNameAsc();
    list.forEach(p -> inventory.seedIfAbsent(p.getId(), p.getQuantity()));
    return list;
  }

  public List<Product> getNewArrivalsByCategory(String category) {
    List<Product> list = productRepository
        .findByCategoryIgnoreCaseAndNewArrivalTrueAndProductArchivedFalseOrderByNameAsc(category);
    list.forEach(p -> inventory.seedIfAbsent(p.getId(), p.getQuantity()));
    return list;
  }

  public List<Product> getSoldOutProducts() {
    return productRepository.findBySoldOutTrueAndProductArchivedFalseOrderByNameAsc();
  }

  public void archiveProduct(Long id) {
    Product product = productRepository.findById(id).orElseThrow();

    product.setProductArchived(true);

    productRepository.save(product);
  }

  public Product toggleArchive(Long id) {
    Product product = productRepository.findById(id).orElseThrow();

    product.setProductArchived(!product.isProductArchived());

    return productRepository.save(product);
  }

  public void deleteProduct(Long id) {
    if (productRepository.existsById(id)) {
      productRepository.deleteById(id);
    } else {
      throw new IllegalArgumentException("Product with id " + id + " does not exist");
    }

  }
}
