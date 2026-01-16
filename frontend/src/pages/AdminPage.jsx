import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const [isPictureUploaded, setIsPictureUploaded] = useState(false);
  const [croppingStatus, setCroppingStatus] = useState(false);
  const [metricsRefreshKey, setMetricsRefreshKey] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [authFailed, setAuthFailed] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const formRef = useRef(null);
  const mainFileRef = useRef(null);
  const editFileRef = useRef(null);
  const cardFileRefs = useRef({});
  const createDescriptionRef = useRef(null);
  const editDescriptionRef = useRef(null);
  const CATEGORIES = [
    "Fidgets & Sensory",
    "Jewelry",
    "Figurines",
    "Accessories",
    "Home Decor",
    "Custom Orders",
    "Garbage Ghouls",
  ];

  const [auth, setAuth] = useState(null);

  const promptForAuth = useCallback(() => {
    const username = window.prompt("Admin username:");
    if (!username) return null;
    const password = window.prompt("Admin password:");
    if (!password) return null;
    return btoa(`${username}:${password}`);
  }, []);

  const verifyAuth = useCallback(async (token) => {
    const res = await fetch(
      "http://localhost:8080/api/admin/products/sold-out",
      {
        method: "GET",
        headers: { Authorization: `Basic ${token}` },
        credentials: "include",
      }
    );
    return res.ok;
  }, []);

  const authedFetch = useCallback(
    async (url, options = {}) => {
      if (!auth) throw new Error("Missing admin authorization");

      const headers = new Headers(options.headers || {});
      headers.set("Authorization", `Basic ${auth}`);

      const res = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      if (res.status === 401) {
        const token = promptForAuth();
        if (!token) {
          setAuthFailed(true);
          setAuth(null);
          throw new Error("Invalid username or password");
        }

        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set("Authorization", `Basic ${token}`);
        const retryRes = await fetch(url, {
          ...options,
          headers: retryHeaders,
          credentials: "include",
        });

        if (retryRes.status === 401) {
          setAuthFailed(true);
          setAuthVerified(false);
          setAuth(null);
          throw new Error("Invalid username or password");
        }

        setAuthFailed(false);
        setAuth(token);
        setAuthVerified(true);

        return retryRes;
      }
      return res;
    },
    [auth, promptForAuth]
  );

  useEffect(() => {
    if (!isDashboardOpen) return;
    if (!authVerified) return;

    let cancelled = false;

    (async () => {
      try {
        setMetricsLoading(true);

        const res = await authedFetch(
          "http://localhost:8080/api/admin/metrics/summary",
          { method: "GET" }
        );

        if (!res.ok) throw new Error(`Failed metrics (${res.status})`);
        const data = await res.json();

        if (!cancelled) setMetrics(data);
      } catch (e) {
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setMetricsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDashboardOpen, authedFetch, authVerified, metricsRefreshKey]);

  useEffect(() => {
    if (authVerified) return;
    if (authAttempted) return; // don't keep prompting

    setAuthAttempted(true);

    const token = promptForAuth();
    if (!token) {
      setAuthFailed(true);
      setAuth(null);
      setAuthVerified(false);
      return; // ✅ no throw
    }

    (async () => {
      const ok = await verifyAuth(token);

      if (!ok) {
        setAuthFailed(true);
        setAuth(null);
        setAuthVerified(false);
        return;
      }

      setAuthFailed(false);
      setAuth(token);
      setAuthVerified(true);
    })();
  }, [authVerified, authAttempted, promptForAuth, verifyAuth]);

  const notifyProductsChanged = useCallback((payload) => {
    try {
      window.dispatchEvent(
        new CustomEvent("products:changed", { detail: payload })
      );
    } catch (e) {
      console.error("products:changed dispatch failed", e);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const base = "http://localhost:8080/api/products";
      const qs =
        filterCategory && filterCategory.trim()
          ? `?category=${encodeURIComponent(
              filterCategory.trim()
            )}&_=${Date.now()}`
          : `?_=${Date.now()}`;
      const url = `${base}${qs}`;

      let response;
      if (activeTab === "all") {
        response = await fetch(url, { method: "GET", cache: "no-store" });
      } else if (activeTab === "low-stock") {
        response = await authedFetch(
          "http://localhost:8080/api/admin/products/low-stock",
          { method: "GET" }
        );
      } else if (activeTab === "sold-out") {
        response = await authedFetch(
          "http://localhost:8080/api/admin/products/sold-out",
          { method: "GET" }
        );
      }

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products", error);
    }
  }, [filterCategory, activeTab, authedFetch]);

  useEffect(() => {
    if (!editDescriptionRef.current) return;
    if (editDescriptionRef.current) {
      const id = requestAnimationFrame(() => {
        editDescriptionRef.current.style.height = "auto";
        editDescriptionRef.current.style.height =
          editDescriptionRef.current.scrollHeight + "px";
      });
      return () => cancelAnimationFrame(id);
    }
  }, [isEditingId, description]);

  useEffect(() => {
    if (!auth) return;
    fetchProducts();
  }, [auth, fetchProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !category.trim()) {
      alert("Please select a category before saving changes.");
      return;
    }

    try {
      const response = await authedFetch(
        "http://localhost:8080/api/admin/product",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            price: parseFloat(price),
            quantity: parseInt(quantity, 10),
            category,
            featured: isFeatured,
            newArrival: isNewArrival,
          }),
        }
      );

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const newProduct = await response.json();

      setName("");
      setDescription("");
      setPrice("");
      setQuantity("");
      setCategory("");
      setIsFeatured(false);
      setIsNewArrival(false);
      if (mainFileRef.current) mainFileRef.current.value = "";

      const fileToUpload = selectedFile;
      setSelectedFile(null);

      if (fileToUpload) {
        await handleUploadProductPicture(newProduct.id, fileToUpload);
      } else {
        fetchProducts();
      }

      notifyProductsChanged({
        type: "create",
        id: newProduct.id,
        category: newProduct.category,
        newArrival: !!newProduct.newArrival,
        featured: !!newProduct.featured,
      });
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

  const handleUploadProductPicture = async (productId, file) => {
    if (!productId)
      return console.error("Product ID is required to upload a picture");
    if (!file) return console.error("No file selected for upload");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authedFetch(
        `http://localhost:8080/api/admin/product/${productId}/uploadPicture`,
        { method: "POST", body: formData }
      );

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      await response.json();
      fetchProducts();

      notifyProductsChanged({ type: "picture-upload", id: productId });
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
      const response = await authedFetch(
        `http://localhost:8080/api/admin/products/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete (status ${response.status})`);
      }

      fetchProducts();

      notifyProductsChanged({
        type: "delete",
        id,
      });
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

    const id = isEditingId;

    const updated = {
      name,
      description,
      price: +price,
      quantity: +quantity,
      category,
      featured: isFeatured,
      newArrival: isNewArrival,
    };

    try {
      const response = await authedFetch(
        `http://localhost:8080/api/admin/products/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update: ${response.status} ${response.statusText}`
        );
      }

      const saved = await response.json();
      setProducts((prev) => prev.map((p) => (p.id === id ? saved : p)));

      if (selectedFile) {
        await handleUploadProductPicture(id, selectedFile);
      }

      setIsEditingId(null);
      setName("");
      setDescription("");
      setPrice("");
      setQuantity("");
      setCategory("");
      setSelectedFile(null);
      setIsFeatured(false);
      setIsNewArrival(false);
      if (editFileRef.current) editFileRef.current.value = "";

      await fetchProducts();

      notifyProductsChanged({
        type: "update",
        id,
        category: updated.category,
        newArrival: !!updated.newArrival,
        featured: !!updated.featured,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenMetricsDashboard = () => {
    setMetrics(null);
    setIsDashboardOpen(true);
    setMetricsRefreshKey((k) => k + 1);
  };

  if (authFailed) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "black",
          color: "red",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          zIndex: 999999,
          padding: 40,
        }}
      >
        <div>
          <h2>ACCESS DENIED</h2>
          <p>Invalid admin credentials.</p>

          <button
            type="button"
            onClick={() => {
              setAuthFailed(false);
              setAuthVerified(false);
              setAuth(null);
              setAuthAttempted(false);
            }}
            style={{ marginTop: 12 }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!authVerified) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "black",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          zIndex: 999999,
          padding: 40,
        }}
      >
        <div>
          <h2>Admin login required</h2>
        </div>
      </div>
    );
  }

  if (!auth) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "black",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          zIndex: 999999,
          padding: 40,
        }}
      >
        <div>
          <h2>Admin login required</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="home-container">
        <div className="admin-tabs">
          <button
            className={activeTab === "all" ? "active-tab" : ""}
            onClick={() => setActiveTab("all")}
          >
            All Products
          </button>

          <button
            className={activeTab === "low-stock" ? "active-tab" : ""}
            onClick={() => setActiveTab("low-stock")}
          >
            Low Stock
          </button>

          <button
            className={activeTab === "sold-out" ? "active-tab" : ""}
            onClick={() => setActiveTab("sold-out")}
          >
            Sold Out
          </button>
        </div>
        <div>
          <button type="button" onClick={handleOpenMetricsDashboard}>
            DASHBOARD
          </button>

          {isDashboardOpen && (
            <div
              className="metrics-backdrop"
              onClick={() => setIsDashboardOpen(false)}
            >
              <div
                className="metrics-dashboard"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="metrics-actions">
                  <button
                    type="button"
                    onClick={() => setMetricsRefreshKey((k) => k + 1)}
                  >
                    Refresh
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDashboardOpen(false)}
                  >
                    <strong>X</strong>
                  </button>
                </div>
                {!metrics && !metricsLoading && (
                  <div>Failed to load metrics. Please try again.</div>
                )}
                {metricsLoading && metrics === null && (
                  <div>Loading metrics...</div>
                )}
                {metrics && !metricsLoading && (
                  <div className="metrics-grid">
                    {Object.entries(metrics).map(([key, value]) => (
                      <div key={key} className="metric-card">
                        <div className="metric-label">{key}</div>
                        <div className="metric-value">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="product-form">
          <h1>Admin Home</h1>
          <h3>List an item:</h3>
          {isEditingId === null && (
            <form onSubmit={handleSubmit} id="productForm" ref={formRef}>
              <input
                type="text"
                placeholder="Name"
                className="product-input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <textarea
                placeholder="Description"
                className="product-input-field-description"
                ref={createDescriptionRef}
                value={description}
                onChange={(e) => {
                  if (createDescriptionRef.current) {
                    createDescriptionRef.current.style.height = "auto";
                    createDescriptionRef.current.style.height =
                      createDescriptionRef.current.scrollHeight + "px";
                  }
                  setDescription(e.target.value);
                }}
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
                <label className="input-label">
                  <strong>Category:</strong>
                </label>
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
                <div className="check-boxes">
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
                  <div className="new-select">
                    <label
                      className="featured-flag"
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <input
                        type="checkbox"
                        checked={isNewArrival}
                        onChange={(e) => setIsNewArrival(e.target.checked)}
                      />
                      New Arrival
                    </label>
                  </div>
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
          )}

          {products.length > 0 && (
            <h1 className="items-for-sale-header">Items for sale: </h1>
          )}
        </div>
        <div className="product-grid-container">
          {products.length > 0 ? (
            products.map((product) => (
              <div key={product.id} className="product-card">
                {product.featured && (
                  <span className="badge-purple">Featured</span>
                )}
                {product.newArrival && (
                  <span className="badge-purple">New Arrival!</span>
                )}

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
                          setIsFeatured(!!product.featured);
                          setIsNewArrival(!!product.newArrival);

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
                        key={isEditingId || "none"}
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

                        <label>
                          Name:
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </label>

                        <label>
                          Description:
                          <textarea
                            ref={editDescriptionRef}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                          />
                        </label>

                        <label>
                          Price:
                          <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                          />
                        </label>

                        <label>
                          Quantity:
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                          />
                        </label>

                        <label>
                          Category:
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
                          <label>
                            New Arrivals
                            <input
                              type="checkbox"
                              checked={isNewArrival}
                              onChange={(e) =>
                                setIsNewArrival(e.target.checked)
                              }
                            />
                          </label>
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
                            setIsNewArrival(false);
                            if (editFileRef.current) {
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

                          <p className="product-price">
                            Price: ${product.price}
                          </p>
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
                          handleUploadProductPicture(product.id, selectedFile);
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
    </>
  );
};

export default AdminPage;
