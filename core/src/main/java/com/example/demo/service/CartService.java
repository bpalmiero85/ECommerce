package com.example.demo.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Session-scoped cart storage backed by in-memory maps.
 * <p>
 * Responsibilities:
 * <ul>
 * <li>Reserve inventory when adding to cart.</li>
 * <li>Keep per-session product quantities.</li>
 * <li>Defer un-reserving/removal to other operations we’ll add next.</li>
 * </ul>
 * Thread-safety: uses ConcurrentHashMap for both the session map and each
 * session's cart map.
 */
@Service
public class CartService {
  /**
   * Shared inventory store injected by Spring; ensures the same instance is used
   * app-wide
   */
  private final InventoryMemory inventory;

  /** sessionId -> (productId -> qty) */
  private final Map<String, Map<Long, Integer>> carts = new ConcurrentHashMap<>();

  /** map for activity timestamps */
  private final Map<String, Long> lastTouched = new ConcurrentHashMap<>();

  /** cart reserve time */
  private static final long CART_TTL_MS = 20 * 60 * 1000;

  /** scheduled activity sweep */
  @Scheduled(fixedRate = 60_000)
  public void expireAbandonedCarts() {
    long now = System.currentTimeMillis();
    for (Map.Entry<String, Long> e : lastTouched.entrySet()) {
      String sid = e.getKey();
      long last = e.getValue();
      if (now - last > CART_TTL_MS) {
        releaseAll(sid);
      }
    }
  }

  public void clearOnly(String sid) {
    carts.remove(sid);
    lastTouched.remove(sid);
  }

  public void touch(String sessionId) {
    lastTouched.put(sessionId, System.currentTimeMillis());
  }

  /** Constructs the cart service with the shared inventory bean */
  public CartService(InventoryMemory inventory) {
    this.inventory = inventory;
  }

  /**
   * Adds exactly one unit of {@code productId} to the cart for {@code sessionId}.
   * <p>
   * Implementation detail: attempts to reserve stock first via
   * {@link InventoryMemory#reserveOne(long)}.
   * Only if the reservation succeeds is the cart updated.
   *
   * @param sessionId the HTTP/session identifier used to key a user's cart
   * @param productId the product to add
   * @return {@code true} if inventory had stock and the item was added;
   *         {@code false} if out of stock
   */
  public boolean addOne(String sessionId, long productId) {
    touch(sessionId);
    // 1) Reserve from inventory first. If reservation fails, do not modify the
    // cart.
    boolean reserved = inventory.reserveOne(productId);
    if (!reserved) {
      // Item out of stock -> do nothing to the cart
      return false;
    }

    // 2) Get or create this session's cart map.
    Map<Long, Integer> cart = carts.computeIfAbsent(sessionId, sid -> new ConcurrentHashMap<>());

    // 3) Increase the quantity for this product by 1 (insert if missing).
    cart.merge(productId, 1, Integer::sum);

    // 4) Success.
    return true;
  }

  public boolean removeOne(String sessionId, long productId) {
    touch(sessionId);
    Map<Long, Integer> cart = carts.get(sessionId);
    if (cart == null || !cart.containsKey(productId)) {
      return false;
    }
    int currentQty = cart.get(productId);
    if (currentQty <= 0) {
      return false;
    }
    if (currentQty == 1) {
      cart.remove(productId);
    } else {
      cart.put(productId, currentQty - 1);
    }
    inventory.unreserveOne(productId);
    if (cart.isEmpty()) {
      carts.remove(sessionId);
    }
    return true;
  }

  public int getQty(String sessionId, long productId) {
    touch(sessionId);
    Map<Long, Integer> cart = carts.get(sessionId);
    if (cart == null) {
      return 0;
    }
    return cart.getOrDefault(productId, 0);
  }

  public Map<Long, Integer> getItems(String sessionId) {
    touch(sessionId);
    Map<Long, Integer> cart = carts.get(sessionId);
    if (cart == null || cart.isEmpty()) {
      return Map.of();
    }
    return java.util.Collections.unmodifiableMap(new java.util.HashMap<>(cart));
  }

  public void releaseAll(String sessionId) {
    Map<Long, Integer> cart = carts.get(sessionId);
    if (cart == null || cart.isEmpty())
      return;

    for (Map.Entry<Long, Integer> cartEntry : cart.entrySet()) {
      long productId = cartEntry.getKey();
      int qty = cartEntry.getValue();
      for (int i = 0; i < qty; i++) {
        inventory.unreserveOne(productId);
      }
    }
    carts.remove(sessionId);
    lastTouched.remove(sessionId);
  }

}
