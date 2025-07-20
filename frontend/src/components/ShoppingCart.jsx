import { useState } from "react"
import "../styles/ShoppingCart.css"

const ShoppingCart = () => {
  const [isCartOpen, setIsCartOpen] = useState(false)

  const handleClickCart = () => {
    return (
      <div className="shopping-cart-container">
          
      </div>
    )
  }
  return(
    <div className="cart-logo-container">
    <a className="cart-image" style={{ background: "transparent" }}>
    <h1>🛒</h1>
    </a>
    </div>
  )
}
export default ShoppingCart