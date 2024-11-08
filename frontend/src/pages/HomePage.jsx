import { useState, useEffect } from "react";
import "../styles/HomePage.css";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/products", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      setProducts(data);
    } catch (error) {
      console.error("Error fetching products", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8080/api/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: name,
          description: description,
          price: parseFloat(price),
          quantity: parseInt(quantity, 10),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      setName("");
      setDescription("");
      setQuantity("");

      fetchProducts();
    } catch (error) {}
  };

  return (
    <div className="home-container">
      <h1>Home</h1>
      <p>This is the Home Page</p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          className="product-input-field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Description"
          className="product-input-field"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="$Price"
          className="product-input-field"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Quantity on hand"
          className="product-input-field"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        <button type="submit" onChange={handleSubmit}>
          Submit
        </button>
        <button type="button" className="upload-product-picture-button">
          Upload Pictures
        </button>
      </form>

      <div className="product-grid-container">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="product-item">
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <p>Price: ${product.price}</p>
              <p>Quantity on hand: {product.quantity}</p>
            </div>
          ))
        ) : (
          <p>No products available.</p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
