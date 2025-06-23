import React, { useState, useEffect, useRef } from "react";
import "../styles/HomePage.css";
import CreditCard from "../components/CreditCard";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [productPicture, setProductPicture] = useState(null);
  const [purchaseProductId, setPurchaseProductId] = useState(null);
  const [isEditingId, setIsEditingId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef(null);
  const formRef = useRef(null);

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

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const newProduct = await response.json();

      setName("");
      setDescription("");
      setPrice("");
      setQuantity("");
      setSelectedFile(null);

      formRef.current.reset();

      if (selectedFile) {
        await handleUploadProductPicture(newProduct.id);
        setSelectedFile(null);
      } else {
        fetchProducts();
      }
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

        setProducts(ps => 
          ps.map(p => 
            p.id === productId
            ? {...p, pictureVersion: Date.now()}
            :p
          )
        )
      fetchProducts();
    } catch (error) {
      console.error("Error uploading product picture:", error);
    }
  };

  const handleDeleteProduct = async (id) => {
    const ok = window.confirm(
      "Are you sure you want to delete this item? This action cannot be undone."
    );
    if (!ok) return;

    try {
      const response = await fetch(`http://localhost:8080/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete (status ${response.status})`);
      }

      fetchProducts();
    } catch (error) {
      console.error("Error deleting product: ", error);
    }
  };

  const handleUpdateProduct = async (e) => {
  e.preventDefault();
  const id = isEditingId;
    const updated = {
      productPicture,
      name,
      description,
      price: +price,
      quantity: +quantity,
    };

      const response = await fetch(`http://localhost:8080/api/products/${id}`, {
         method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
        if(!response.ok) throw new Error(response.statusText);
    setIsEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setQuantity("");
    formRef.current.reset();
    if(selectedFile){
      await handleUploadProductPicture(id);
    }
    fetchProducts();
  }
  

  const handlePurchase = (productId) => {
    setIsOpen(true);
    setPurchaseProductId(productId);
  };

  const handleClickOutside = (e) => {
    if (isOpen && cardRef.current && !cardRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="home-container">
      <div className="product-form">
        <h1>Home</h1>
        <h1>List an item:</h1>
        {/** Script block below is to clear form input fields after submission */}

        <form onSubmit={isEditingId ? handleUpdateProduct : handleSubmit} id="productForm" ref={formRef}>
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
          <label className="custom-file-upload">
            Upload picture
            <input
              type="file"
              accept="image/*, .jpg, .jpeg, .png"
              className="product-input-field"
              onChange={handleFileChange}
            />
          </label>

          <button className="submit" type="submit">
            {isEditingId ? "Save Changes" : "Post"}
          </button>
        </form>

        {products.length > 0 && (
          <h1 className="items-for-sale-header">Items for sale: </h1>
        )}
      </div>

      

      <div className="product-grid-container">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} id={`${product.id}`} className="product-item">
              <div className="product-buttons">
                <div className="product-edit-button">
                
                  <button onClick={() => {
                    setIsEditingId(product.id);
                    setName(product.name);
                    setDescription(product.description);
                    setPrice(product.price);
                    setQuantity(product.quantity)
                    

                    document.getElementById(`${product.id}`)
                    .scrollIntoView({ behavior: "smooth" });
                  }}>edit</button>
                </div>
                <div className="product-delete-button">
                  <button onClick={() => handleDeleteProduct(product.id)}>
                    delete
                  </button>
                </div>
              </div>
              {product.pictureType ? (
                <div className="product-image">
                  <img
                  key={`pic-${product.id}-${product.pictureVersion || product.pictureType}`}
                    src={`http://localhost:8080/api/product/${product.id}/picture`}
                    alt={product.name}
                  ></img>
                </div>
              ) : (
                <div className="no-picture">No image yet</div>
              )}
    <div className="product-info-section">
  {isEditingId === product.id ? (
    // Inline edit form
    <form
      onSubmit={handleUpdateProduct}
      className="inline-edit-form"
    >
    <input
      type="file"
      accept="image/*, .jpg, .jpeg, .png"
      className="product-input-field"
      onChange={handleFileChange}
    >
      </input>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <input
        type="text"
        value={description}
        onChange={e => setDescription(e.target.value)}
        required
      />
      <input
        type="number"
        value={price}
        onChange={e => setPrice(e.target.value)}
        required
      />
      <input
        type="number"
        value={quantity}
        onChange={e => setQuantity(e.target.value)}
        required
      />

      <button type="submit">Save</button>
      <button
        type="button"
        onClick={() => {
          setIsEditingId(null);
          setName("");
          setDescription("");
          setPrice("");
          setQuantity("");
        }}
      >
        Cancel
      </button>
    </form>
  ) : (
  
    <>
     <div class="logo-card">
                <div class="logo-design">
                    <div class="gothic-crown">
                        <img
                  key={`pic-${product.id}-${product.pictureVersion || product.pictureType}`}
                    src={`http://localhost:8080/api/product/${product.id}/picture`}
                    className="product-image"
                    alt={product.name}
                  ></img>
                        <div class="crown-stars">
                            <div class="crown-star">✦</div>
                            <div class="crown-star">✧</div>
                            <div class="crown-star">✦</div>
                        </div>
                    </div>
                </div>
                <div class="logo-text">{product.name}</div>
                <div class="logo-description">{product.description}</div>
                 <p className="product-price">Price: ${product.price}</p>
      <p className="product-quantity">Quantity: {product.quantity}</p>
            </div>
             </>
  )}
</div>
              

              <div className="purchase-button">
                {!(isOpen && purchaseProductId === product.id) && (
                 
                  <button 
                    onMouseDown={e => e.stopPropagation()}
                    onClick={() => {
                      handlePurchase(product.id);
                    }}
                  >
                    Purchase
                  </button>
                )}

              

                {isOpen && purchaseProductId == product.id && (
                  
                  <div className="credit-card-window" ref={cardRef}>
                    {purchaseProductId == product.id && <CreditCard />}
                  </div>
                )}

              </div>
              {isOpen && purchaseProductId === product.id && (
                  <div className="cancel-button">
                  <button>Cancel</button>
                  </div>
                )}

              {product.pictureType == null && (
       <>
                 <input
              type="file"
              accept="image/*, .jpg, .jpeg, .png"
              className="product-input-field"
              onChange={handleFileChange}
            />
          
    
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
                  </>
              )}
            </div>
            
          ))
        ) : (
          <div className="no-products-available">
            <p>No products listed.</p>
          </div>
        )}
      </div>
    </div>
    
  );
};

export default HomePage;
