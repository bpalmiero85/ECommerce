import React, { useState } from 'react'
import Cards from 'react-credit-cards'
import 'react-credit-cards/es/styles-compiled.css'

export default function CreditCard() {
  const [card, setCard] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: '',
    focused: ''
  })

  const handleInput = e => {
    const { name, value } = e.target
    setCard(prev => ({ ...prev, [name]: value }))
  }
  const handleFocus = e => {
    setCard(prev => ({ ...prev, focused: e.target.name }))
  }

  return (
    <div style={{marginBottom: "1rem"}}>
    <div className="card-image">
      <Cards
        number={card.number}
        name={card.name}
        expiry={card.expiry}
        cvc={card.cvc}
        focused={card.focused}
      />
      </div>

      <form>
        <input
         className="credit-card-input"
          name="number"
          placeholder="Card Number"
          value={card.number}
          onChange={handleInput}
          onFocus={handleFocus}
        />
        <input
          className="credit-card-input"
          name="name"
          placeholder="Name"
          value={card.name}
          onChange={handleInput}
          onFocus={handleFocus}
        />
        <input
          className="credit-card-input"
          name="expiry"
          placeholder="MM/YY"
          value={card.expiry}
          onChange={handleInput}
          onFocus={handleFocus}
        />
        <input
          className="credit-card-input"
          name="cvc"
          placeholder="CVC"
          value={card.cvc}
          onChange={handleInput}
          onFocus={handleFocus}
        />
      </form>
    </div>
  )
}