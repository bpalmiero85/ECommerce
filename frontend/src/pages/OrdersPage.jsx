import React, { useCallback, useEffect, useState } from "react";
import emailjs from "@emailjs/browser";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [auth, setAuth] = useState(null);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState("active");

  const SHIPPING_TEMPLATE_ID = "template_wqi7wms";
  const EMAILJS_SERVICE_ID = "service_1wp75sm";
  const EMAILJS_PUBLIC_KEY = "ZkQfANdcZnMH2U1KL";

  const buildTrackingUrl = (carrier, trackingNumber) => {
    const c = (carrier || "").toLowerCase();
    const t = (trackingNumber || "").trim();

    if (!t) return "";
    if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(t)}`;
    if (c.includes("ups")) return `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(t)}`;
    if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(t)}`;

    return "";
  };

  const orderStatusEndpoint = useCallback(() => {
    if (orderStatus === "active") {
      return "http://localhost:8080/api/admin/orders/status/active-orders";
    }
    if (orderStatus === "shipped") {
      return "http://localhost:8080/api/admin/orders/status/shipped";
    }
    if (orderStatus === "completed") {
      return "http://localhost:8080/api/admin/orders/status/completed";
    }
    if (orderStatus === "cancelled") {
      return "http://localhost:8080/api/admin/orders/status/cancelled";
    }
    return null;
  }, [orderStatus]);

  const openItemModal = (item) => {
    setSelectedItem(item);
    setIsItemModalOpen(true);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setSelectedItem(null);
  };

  const handleChooseOrderStatus = (status) => {
    if (status === "active") {
      setOrderStatus(status);
    } else if (status === "completed") {
      setOrderStatus(status);
    } else if (status === "cancelled") {
      setOrderStatus(status);
    } else if (status === "shipped") {
      setOrderStatus(status);
    } else {
      setOrderStatus(null);
    }
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

  const handleMarkShipped = async (order) => {
    const orderId = order.orderId;
    const carrier = window.prompt("Carrier (ex: USPS, FedEx):") || "";
    const trackingNumber = window.prompt("Tracking Number:") || "";

    try {
      const res = await authedFetch(
        `${API_BASE}/api/admin/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "SHIPPED",
            carrier,
            trackingNumber,
          }),
        }
      );
      if (!res.ok) return;
      const updated = await res.json().catch(() => null);

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        SHIPPING_TEMPLATE_ID,
        {
          to_email: updated?.orderEmail ?? order.orderEmail,
          customer_name: updated?.orderName ?? order.orderName,
          order_id: updated?.orderId ?? order.orderId,
          carrier: updated?.carrier ?? carrier,
          tracking_number: updated?.trackingNumber ?? trackingNumber,
          tracking_url: buildTrackingUrl(
            updated?.carrier ?? carrier,
            updated?.trackingNumber ?? trackingNumber
          ),
        },
        EMAILJS_PUBLIC_KEY
      );
      await fetchOrders();
      console.log("ship payload:", { orderId, carrier, trackingNumber });
      console.log("shipping email sent for:", orderId);
      return res;
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to mark as shipped");
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const res = await authedFetch(orderStatusEndpoint(), {
        method: "GET",
      });

      if (!res.ok) throw new Error(`Failed to load orders (${res.status})`);

      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load orders.");
    }
  }, [authedFetch, orderStatusEndpoint]);

  useEffect(() => {
    if (!auth) return;
    fetchOrders();
  }, [auth, orderStatus, fetchOrders]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <h1>Orders</h1>
      <div className="choose-order-status">
        <button
          type="button"
          style={{ backgroundColor: "lightBlue" }}
          onClick={() => {
            handleChooseOrderStatus("active");
          }}
        >
          ACTIVE
        </button>
        <button
          type="button"
          style={{ backgroundColor: "lightblue" }}
          onClick={() => {
            handleChooseOrderStatus("shipped");
          }}
        >
          SHIPPED
        </button>

        <button
          type="button"
          style={{ backgroundColor: "lightBlue" }}
          onClick={() => {
            handleChooseOrderStatus("completed");
          }}
        >
          COMPLETED
        </button>
        <button
          type="button"
          style={{ backgroundColor: "lightBlue" }}
          onClick={() => {
            handleChooseOrderStatus("cancelled");
          }}
        >
          CANCELLED
        </button>
      </div>

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
              <th>Actions</th>
              <th>Order ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Total</th>
              <th>Status</th>
              <th>Tracking</th>
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
                  {/* Actions */}
                  <td>
                    {o.orderStatus === "PAID" && (
                      <button onClick={() => handleMarkShipped(o)}>
                        Mark shipped
                      </button>
                    )}
                  </td>

                  {/* Order ID */}
                  <td>{o.orderId}</td>

                  {/* Name */}
                  <td>{o.orderName}</td>

                  {/* Email */}
                  <td>{o.orderEmail}</td>

                  {/* Total */}
                  <td>${Number(o.orderTotal).toFixed(2)}</td>

                  {/* Status */}
                  <td>{o.orderStatus}</td>

                  {/* Tracking */}
                  <td>
                    {o.trackingNumber && (o.orderStatus === "SHIPPED" || o.orderStatus === "DELIVERED") && (
                      <>
                        <div>{o.carrier}</div>
                        <div style={{ fontSize: 12, color: "#ccc" }}>
                          {o.trackingNumber}
                        </div>
                      </>
                    )}
                  </td>

                  {/* Created */}
                  <td>
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
                  </td>
                </tr>
                {o.items && o.items.length > 0 && (
                  <tr>
                    <td colSpan="8">
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
