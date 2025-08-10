package com.example.demo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.model.Product;
import com.example.demo.service.InventoryMemory;
import com.example.demo.service.ProductService;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
  private final InventoryMemory inventory;
  private final ProductService productService;

  @PostMapping("/{id}/set")
  public void set(@PathVariable long id, @RequestParam int qty) {
    inventory.setStock(id, qty);
  }

  @GetMapping("/{id}/available")
  public int available(@PathVariable long id) {
    ensureSeeded(id);
    return inventory.getAvailable(id);
  }


  @PostMapping("/{id}/reserve") 
  public ResponseEntity<?> reserve(@PathVariable long id) {
    ensureSeeded(id);
    return inventory.reserveOne(id) ? ResponseEntity.ok().build()
        : ResponseEntity.status(409).body("Out of stock");
  }

  @PostMapping("/{id}/unreserve")
  public void unreserve(@PathVariable long id) {
    inventory.unreserveOne(id);
  }

  private void ensureSeeded(long id) {
    if(!inventory.hasKey(id)){
    productService.getProductById(id).ifPresent(p ->
      inventory.setStock(p.getId(), p.getQuantity())
    );
    }
  }
}