import React, { useCallback, useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [auth, setAuth] = useState(null);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  const openItemModal = (item) => {
    setSelectedItem(item);
    setIsItemModalOpen(true);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setSelectedItem(null);
  };

  const promptForAuth = useCallback(() => {
    const username = window.prompt("Admin username:");
    if (!username) return null;
    const password = window.prompt("Admin password:");
    if (!password) return null;
    return btoa(`${username}:${password}`);
  }, []);

  useEffect(() => {
    if (auth) return;
    const token = promptForAuth();
    if (token) setAuth(token);
  }, [auth, promptForAuth]);

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
        if (token) {
          setAuth(token);
          const retryHeaders = new Headers(options.headers || {});
          retryHeaders.set("Authorization", `Basic ${token}`);
          return fetch(url, {
            ...options,
            headers: retryHeaders,
            credentials: "include",
          });
        }
      }

      return res;
    },
    [auth, promptForAuth]
  );

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const API_BASE =
        process.env.REACT_APP_API_BASE || "http://localhost:8080";
      const res = await authedFetch(`${API_BASE}/api/admin/orders/all`, {
        method: "GET",
      });

      if (!res.ok) throw new Error(`Failed to load orders (${res.status})`);

      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load orders.");
    }
  }, [authedFetch]);

  useEffect(() => {
    if (!auth) return;
    fetchOrders();
  }, [auth, fetchOrders]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <h1>Orders</h1>

      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

      <button type="button" onClick={fetchOrders} style={{ marginBottom: 12 }}>
        Refresh
      </button>

      {orders.length === 0 ? (
        <div>No orders yet.</div>
      ) : (
        <table
          width="100%"
          cellPadding="10"
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th>Order ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <React.Fragment key={o.orderId}>
                <tr
                  style={{
                    borderTop: "1px solid #ddd",
                    fontSize: "18px",
                    color: "white",
                  }}
                >
                  <td>{o.orderId}</td>
                  <td>{o.orderName}</td>
                  <td>{o.orderEmail}</td>
                  <td>${Number(o.orderTotal).toFixed(2)}</td>
                  <td>{o.orderStatus}</td>
                  <td>
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
                  </td>
                </tr>
                {o.items && o.items.length > 0 && (
                  <tr>
                    <td colSpan="6">
                      <ul style={{ margin: "6px 0 12px 20px" }}>
                        {o.items.map((it) => (
                          <li key={it.id}>
                            <button
                              className="order-product-button"
                              onClick={() => openItemModal(it)}
                            >
                              {it.productName}
                            </button>{" "}
                            × {it.quantity} @ ${Number(it.unitPrice).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
      {isItemModalOpen && selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeItemModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 12,
              maxWidth: 520,
              width: "100%",
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18, color: "black" }}>
                {selectedItem.productName}
              </h2>
              <button type="button" onClick={closeItemModal}>
                X
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              <img
                src={`${API_BASE}/api/product/${
                  selectedItem.productId
                }/picture?version=${Date.now()}`}
                alt={selectedItem.productName}
                style={{
                  width: "100%",
                  maxHeight: 420,
                  objectFit: "contain",
                  borderRadius: 10,
                  display: "block",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div style={{ marginTop: 10, fontSize: 18, color: "black" }}>
                <div>
                  <strong>Product ID:</strong> {selectedItem.productId}
                </div>
                <div>
                  <strong>Qty:</strong> {selectedItem.quantity}
                </div>
                <div>
                  <strong>Unit price:</strong> $
                  {Number(selectedItem.unitPrice).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
