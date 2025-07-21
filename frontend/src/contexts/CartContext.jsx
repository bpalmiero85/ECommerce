import React, { createContext, useState } from "react";

export const CartContext = createContext({
  cartItems: [],
  addToCart: () => {}
})

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  function addToCart(product){
    setCartItems(prev => [...prev, product]);

  }
  return (
    <CartContext.Provider value={{ cartItems, addToCart }}>
      {children}
    </CartContext.Provider>
  )
}