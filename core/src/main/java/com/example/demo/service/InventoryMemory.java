package com.example.demo.service;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class InventoryMemory {
  private final ConcurrentHashMap<Long, AtomicInteger> stock = new ConcurrentHashMap<>();

  public void setStock(long id, int qty) {
    stock.put(id, new AtomicInteger(qty));
  }

  public boolean hasKey(long id){
    return stock.containsKey(id);
  }

  public void seedIfAbsent(long id, int qty){
    stock.putIfAbsent(id, new AtomicInteger(qty));
  }

  public int getAvailable(long id) {
    AtomicInteger ai = stock.get(id);
    return ai == null ? 0 : ai.get();
  }

  public boolean reserveOne(long id) {
    stock.putIfAbsent(id, new AtomicInteger(0));
    AtomicInteger ai = stock.get(id);
    while (true) {
      int cur = ai.get();
      if (cur <= 0) return false;
      if (ai.compareAndSet(cur, cur - 1)) return true;
    }
  }

  public void unreserveOne(long id) {
    stock.computeIfPresent(id, (k, ai) -> { ai.incrementAndGet(); return ai; });
  }
}