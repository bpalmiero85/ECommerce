package com.example.demo.controller;

import java.util.Map;

import javax.servlet.http.HttpSession;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.service.CartService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
  private final CartService cartService;

  @GetMapping("/{id}/qty")
  public int getProductQuantity(@PathVariable Long id, HttpSession session) {
    String sid = session.getId();
    return cartService.getQty(sid, id);
  }

  @GetMapping
  public Map<Long, Integer> getCart(HttpSession session) {
    String sid = session.getId();
    return cartService.getItems(sid);
  }

  @PostMapping("/clear")
  public void clearCart(HttpSession session) {
    String sid = session.getId();
    cartService.releaseAll(sid);
  }

  @PostMapping("/{id}/add")
  public int addProduct(@PathVariable Long id, @RequestParam int qty, HttpSession session) {
    String sid = session.getId();
    int added = 0;

    for (int i = 0; i < qty; i++) {
      if (cartService.addOne(sid, id)) {
        added++;
      } else {
        break;
      }

    }
    return added;

  }

  @PostMapping("/{id}/remove")
  public int removeProduct(@PathVariable Long id, @RequestParam int qty, HttpSession session) {
    String sid = session.getId();
    int removed = 0;

    for (int i = 0; i < qty; i++) {
      if (cartService.removeOne(sid, id)) {
        removed++;
      } else {
        break;
      }

    }
    return removed;
  }

}
