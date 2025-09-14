import React, { useState, useEffect, useRef } from "react";
import "../styles/AdminPage.css";
import "../styles/ProductPage.css";
import "../styles/DescriptionMore.css";
import ProductPicture from "../components/ProductPicture";

const AdminPage = () => {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [productPicture, setProductPicture] = useState(null);
  const [isEditingId, setIsEditingId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPictureUploaded, setIsPictureUploaded] = useState(false);
  const [croppingStatus, setCroppingStatus] = useState(false);
  const [category, setCategory] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const formRef = useRef(null);
  const mainFileRef = useRef(null);
  const editFileRef = useRef(null);
  const cardFileRefs = useRef({});
  const CATEGORIES = [
    "Fidgets & Sensory",
    "Jewelry",
    "Figurines",
    "Accessories",
    "Home Decor",
    "Custom Orders",
    "Garbage Ghouls",
  ];

  const fetchProducts = async () => {
    try {
      const base = "http://localhost:8080/api/products";
      const qs = filterCategory && filterCategory.trim()
        ? `?category=${encodeURIComponent(filterCategory.trim())}&_=${Date.now()}`
        : `?_=${Date.now()}`;
        const url = `${base}${qs}`;

      const response = await fetch(url, { method: "GET", cache: "no-store" });
      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filterCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !category.trim()) {
      alert("Please select a category before saving changes.");
      return;
    }

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
          category,
          featured: isFeatured,
        }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const newProduct = await response.json();

      setName("");
      setDescription("");
      setPrice("");
      setQuantity("");
      setSelectedFile(null);
      setIsFeatured(false);
      if (mainFileRef.current) mainFileRef.current.value = "";

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
      const file = e?.target?.files?.[0];
      if (file) setSelectedFile(file);
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

    if (!isEditingId) {
      console.error("No product selected to edit");
      return;
    }
    console.log("Saving product: ", isEditingId, {
      name,
      description,
      price,
      quantity,
      category,
      featured: isFeatured,
    });
    const id = isEditingId;
    const updated = {
      name,
      description,
      price: +price,
      quantity: +quantity,
      category,
      featured: isFeatured,
    };
  
    try {
      const response = await fetch(`http://localhost:8080/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!response.ok) {
        throw new Error(`Failed to update: ${response.statusText}`);
      }
      const saved = await response.json();
      setProducts(prev => prev.map(p => p.id === id ? saved : p));
      if (selectedFile) {
        console.log("Uploading picture...");
        const formData = new FormData();
        formData.append("file", selectedFile);

        const picRes = await fetch(
          `http://localhost:8080/api/product/${id}/uploadPicture`,
          {
            method: "POST",
            body: formData,
          }
        );
        console.log("<- Pic upload status: ", picRes.status, picRes.statusText);
        const picText = await picRes.text();
        console.log("<- Pic upload body: ", picText);
        if (!picRes.ok)
          throw new Error(`Image upload failed: ${picRes.status}: ${picText}`);
      }
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, pictureVersion: Date.now() } : p
        )
      );
      console.log("Update succeeded, refreshing list...");
      setIsEditingId(null);
      setName("");
      setDescription("");
      setPrice("");
      setQuantity("");
      setCategory("");
      setSelectedFile(null);
      if (editFileRef.current) editFileRef.current.value = "";

      await fetchProducts();
    } catch (error) {
      console.error(error);
    } finally {
      console.groupEnd();
    }
  };

  return (
    <div className="home-container">
      <div className="product-form">
        <h1>Home</h1>
        <h1>List an item:</h1>
        <form
          onSubmit={isEditingId ? handleUpdateProduct : handleSubmit}
          id="productForm"
          ref={formRef}
        >
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
          <div className="category-select">
            <label>Category: </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="" disabled>
                -- Select a category --
              </option>
              {CATEGORIES.filter((category) => category).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className="featured-select">
              <label
                className="featured-flag"
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                Featured
              </label>
            </div>
          </div>

          <label className="custom-file-upload">
            Upload picture
            <input
              ref={mainFileRef}
              type="file"
              accept="image/*, .jpg, .jpeg, .png"
              className="product-input-field"
              onChange={(e) => handleFileChange(e)}
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
            <div key={product.id} className="product-card">
             {product.featured && <span className="badge-purple">Featured</span>}
              <div id={`${product.id}`} className="product-item">
                <div className="product-buttons">
                  <ProductPicture
                    productId={product.id}
                    onUpload={() => fetchProducts()}
                    setIsPictureUploaded={setIsPictureUploaded}
                    setCroppingStatus={setCroppingStatus}
                  />
                   
                  <div className="product-edit-button">
                    <button
                      onClick={() => {
                        setIsEditingId(product.id);
                        setName(product.name);
                        setDescription(product.description);
                        setPrice(product.price);
                        setQuantity(product.quantity);
                        setCategory(product.category);
                        setProductPicture(product.productPicture);
                        setIsFeatured(!!product.featured); // note: property name from API is 'featured'

                        document
                          .getElementById(`${product.id}`)
                          .scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      edit
                    </button>
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
                      key={`pic-${product.id}-${
                        product.pictureVersion || product.pictureType
                      }`}
                      src={`http://localhost:8080/api/product/${
                        product.id
                      }/picture?version=${
                        product.pictureVersion || Date.now()
                      }`}
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
                    key={isEditingId || 'none'}
                      onSubmit={handleUpdateProduct}
                      className="inline-edit-form"
                    >
                      <input
                        ref={editFileRef}
                        type="file"
                        accept="image/*, .jpg, .jpeg, .png"
                        className="product-input-field"
                        onChange={(e) => handleFileChange(e)}
                      ></input>

                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />

                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                      />

                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                      />

                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                      />

                      <label>Category: </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                        <label>
                        Featured
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                      ></input>
                      </label>

                      <button className="edit-button" type="submit">
                        Save
                      </button>
                      <button
                        className="edit-button"
                        type="button"
                        onClick={() => {
                          setIsEditingId(null);
                          setName("");
                          setDescription("");
                          setPrice("");
                          setQuantity("");
                          setCategory("");
                          setSelectedFile(null);
                          setIsFeatured(false);
                          if(editFileRef.current){
                            editFileRef.current.value = "";
                          }
                        }}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="admin-product-container">
                        <div className="product-name">{product.name}</div>
                        <div className="product-category">
                          Category: {product.category}
                        </div>

                        <div className="product-description">
                          {product.description}
                        </div>

                        <p className="product-price">Price: ${product.price}</p>
                        <p className="product-quantity">
                          Quantity: {product.quantity}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {product.pictureType == null && (
                <>
                  <input
                    ref={(el) => (cardFileRefs.current[product.id] = el)}
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

export default AdminPage;
