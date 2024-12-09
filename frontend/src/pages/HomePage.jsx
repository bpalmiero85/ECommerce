import React, { useState, useEffect } from "react";
import "../styles/HomePage.css";
import ProductPicture from "../components/ProductPicture";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedFile, setSelectedFile] = useState(null); 
  const [productPicture, setProductPicture] = useState(null);

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
    } catch (error) {
      console.error("Error submitting product", error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]); 
      console.log("File selected:", e.target.files[0]);
    } else {
      console.error("No file selected");
    }
  };

  const handleUploadProductPicture = async (productId) => {
    if (!productId) {
      console.error("Product ID is required to upload a picture");
      return;
    }
  
    if (!selectedFile) {
      console.error("No file selected for upload");
      return;
    }
  
    console.log("Selected file for upload:", selectedFile); 
  
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
  
      const response = await fetch(
        `http://localhost:8080/api/product/${productId}/uploadPicture`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );
  
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Picture uploaded successfully:", data);
  
      setProductPicture(data.productPicture);
      fetchProducts(); 
    } catch (error) {
      console.error("Error uploading product picture:", error);
    }
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

<input
    type="file"
    className="product-input-field"
    onChange={handleFileChange} 
  />
  <button
    type="button"
    onClick={() => handleUploadProductPicture(products.id)}
  >
    Upload Picture
  </button>

        <button type="submit">Submit</button>
      </form>

      <div className="product-grid-container">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="product-item">
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <p>Price: ${product.price}</p>
              <p>Quantity on hand: {product.quantity}</p>
              <button
  type="button"
  className="upload-product-picture-button"
  onClick={() => {
    if (selectedFile) {
      handleUploadProductPicture(product.id); 
    } else {
      console.error("No file selected for upload");
    }
  }}
>
  Upload Picture
</button>
              <ProductPicture productId={product.id} onUpload={fetchProducts} />
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