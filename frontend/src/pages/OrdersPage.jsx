import React, { useCallback, useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import "../styles/OrdersPage.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [auth, setAuth] = useState(null);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState("active");
  const [authFailed, setAuthFailed] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [shippedOrdersCount, setShippedOrdersCount] = useState(0);
  const [searchResults, setSearchResults] = useState(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchMeta, setSearchMeta] = useState(null);
  const [searchLoading, setSearchLoading] = useState(null);
  const [isSearchShown, setIsSearchShown] = useState(false);
  const isSearching = !!searchMeta;
  const displayOrders = Array.isArray(searchResults) ? searchResults : orders;
  const isRefreshingRef = React.useRef(false);
  const initialLoadedRef = React.useRef(false);
  const pollingRef = React.useRef(null);
  const SHIPPING_TEMPLATE_ID = "template_wqi7wms";
  const EMAILJS_SERVICE_ID = "service_1wp75sm";
  const EMAILJS_PUBLIC_KEY = "ZkQfANdcZnMH2U1KL";

  const buildTrackingUrl = (carrier, trackingNumber) => {
    const c = (carrier || "").toLowerCase();
    const t = (trackingNumber || "").trim();

    if (!t) return "";
    if (c.includes("usps"))
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(
        t,
      )}`;
    if (c.includes("ups"))
      return `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(
        t,
      )}`;
    if (c.includes("fedex"))
      return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(
        t,
      )}`;

    return "";
  };

  const orderStatusEndpoint = useCallback(() => {
    if (orderStatus === "active") {
      return `${API_BASE}/api/admin/orders/status/active`;
    }
    if (orderStatus === "shipped") {
      return `${API_BASE}/api/admin/orders/status/shipped`;
    }
    if (orderStatus === "completed") {
      return `${API_BASE}/api/admin/orders/status/completed`;
    }
    if (orderStatus === "cancelled") {
      return `${API_BASE}/api/admin/orders/status/cancelled`;
    }
    if (orderStatus === "archived") {
      return `${API_BASE}/api/admin/orders/status/archived`;
    }
    return null;
  }, [orderStatus]);

  const openItemModal = (item) => {
    setSelectedItem(item);
    setIsItemModalOpen(true);
  };

  const handleToggleSearch = () => {
    setIsSearchShown((prev) => !prev);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setSelectedItem(null);
  };

  const handleChooseOrderStatus = (status) => {
    setOrderStatus(status);
  };

  const promptForAuth = useCallback(() => {
    const username = window.prompt("Admin username:");
    if (!username) return null;
    const password = window.prompt("Admin password:");
    if (!password) return null;
    return btoa(`${username}:${password}`);
  }, []);

  const verifyAuth = useCallback(async (token) => {
    const res = await fetch(`${API_BASE}/api/admin/orders/status/active`, {
      method: "GET",
      headers: { Authorization: `Basic ${token}` },
      credentials: "include",
    });
    return res.ok;
  }, []);

  useEffect(() => {
    if (auth) return;
    if (authAttempted) return;

    setAuthAttempted(true);

    const token = promptForAuth();
    if (!token) {
      setAuthFailed(true);
      setAuth(null);
      setAuthVerified(false);
      return;
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
  }, [auth, authAttempted, promptForAuth, verifyAuth]);

  const authedFetch = useCallback(
    async (url, options = {}) => {
      if (!auth) throw new Error("Missing admin authorization");
      if (!url) throw new Error("Orders URL is null/undefined");

      const headers = new Headers(options.headers || {});
      headers.set("Authorization", `Basic ${auth}`);

      let res;
      try {
        res = await fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });
      } catch (err) {
        console.error("[authedFetch] FETCH THREW:", err);
        throw err;
      }

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
          setAuth(null);
          throw new Error("Invalid username or password");
        }

        setAuthFailed(false);
        setAuth(token);
        return retryRes;
      }

      return res;
    },
    [auth, promptForAuth],
  );

  const fetchCounts = useCallback(async () => {
    const [activeRes, shippedRes] = await Promise.all([
      authedFetch(`${API_BASE}/api/admin/orders/status/active`),
      authedFetch(`${API_BASE}/api/admin/orders/status/shipped`),
    ]);

    const active = activeRes.ok
      ? JSON.parse((await activeRes.text()) || "[]")
      : [];
    const shipped = shippedRes.ok
      ? JSON.parse((await shippedRes.text()) || "[]")
      : [];

    setActiveOrdersCount(Array.isArray(active) ? active.length : 0);
    setShippedOrdersCount(Array.isArray(shipped) ? shipped.length : 0);
  }, [authedFetch]);

  const clearSearch = () => {
    setSearchResults(null);
    setSearchMeta(null);
    setSearchEmail("");
    setIsSearchShown(false);
  };

  const handleSearchEmail = async (order) => {
    if (!auth) return;

    const email = (searchEmail || "").trim();
    if (!email) {
      clearSearch();
      return;
    }
    setSearchLoading(true);

    try {
      const resp = await authedFetch(
        `${API_BASE}/api/admin/orders/search/email/${encodeURIComponent(email)}`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      if (!resp.ok) {
        throw new Error(`Couldn't find orders with email: ${email}`);
      }
      const data = await resp.json();
      setSearchResults(data);
      setSearchMeta({ type: "email", value: email });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMarkShipped = async (order) => {
    const confirm = window.confirm("Are you sure you want to mark shipped?");

    if (!confirm) {
      return;
    }

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
        },
      );
      if (!res.ok) return;
      const updated = await res.json().catch(() => null);

      const resolvedEmail = String(
        (updated && updated.orderEmail) || (order && order.orderEmail) || "",
      ).trim();

      if (!resolvedEmail) {
        console.error("EmailJS NOT sent: resolvedEmail is empty", {
          updatedEmail: updated?.orderEmail,
          orderEmail: order?.orderEmail,
          orderId,
        });
        throw new Error(
          "Cannot send shipping email: customer email is missing.",
        );
      }

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        SHIPPING_TEMPLATE_ID,
        {
          to_email: resolvedEmail,
          customer_name: (updated?.orderName ?? order.orderName) || "",
          order_id: updated?.orderId ?? order.orderId,
          carrier: updated?.carrier ?? carrier,
          tracking_number: updated?.trackingNumber ?? trackingNumber,
          tracking_url: buildTrackingUrl(
            updated?.carrier ?? carrier,
            updated?.trackingNumber ?? trackingNumber,
          ),
        },
        EMAILJS_PUBLIC_KEY,
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

  const handleMarkDelivered = async (order) => {
    const confirm = window.confirm("Are you sure you want to mark delivered?");

    if (!confirm) {
      return;
    }

    const orderId = order.orderId;

    try {
      const res = await authedFetch(
        `${API_BASE}/api/admin/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "DELIVERED",
          }),
        },
      );

      if (!res.ok) return;

      await fetchOrders();
      return res;
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to mark as delivered");
    }
  };

  const handleResendTracking = async (order) => {
    const confirm = window.confirm("Resend tracking (shipping) email?");

    if (!confirm) {
      return;
    }
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        SHIPPING_TEMPLATE_ID,
        {
          to_email: order.orderEmail,
          customer_name: order.orderName,
          order_id: order.orderId,
          carrier: order.carrier,
          tracking_number: order.trackingNumber,
          tracking_url: buildTrackingUrl(order.carrier, order.trackingNumber),
        },
        EMAILJS_PUBLIC_KEY,
      );
      alert(`Tracking email resent to ${order.orderEmail}`);
    } catch (e) {
      console.error("Resend tracking failed:", e);
      alert("Failed to resend tracking email.");
    }
  };
  const fetchOrders = useCallback(async () => {
    try {
      setError(null);

      const url = orderStatusEndpoint();
      const res = await authedFetch(url, { method: "GET" });

      if (res.status === 401 || res.status === 403) {
        setAuthVerified(false);
        setAuthFailed(true);
        setAuth(null);
        return;
      }

      if (!res.ok) throw new Error(`Failed to load orders (${res.status})`);

      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      setOrders(Array.isArray(data) ? data : []);
      setAuthVerified(true);
    } catch (e) {
      console.error("[fetchOrders] error:", e);
      setError(e?.message || "Failed to load orders.");
    }
  }, [authedFetch, orderStatusEndpoint]);

  const refreshOrdersAndCounts = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      await fetchCounts();
      await fetchOrders();
    } finally {
      isRefreshingRef.current = false;
    }
  }, [fetchCounts, fetchOrders]);

  useEffect(() => {
    if (!auth) return;

    const startPolling = () => {
      if (pollingRef.current) return;
      pollingRef.current = setInterval(refreshOrdersAndCounts, 3000);
    };

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) stopPolling();
      else if (initialLoadedRef.current) startPolling();
    };
    let cancelled = false;

    (async () => {
      await refreshOrdersAndCounts();
      if (cancelled) return;

      initialLoadedRef.current = true;

      if (!document.hidden) startPolling();
    })();

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopPolling();
    };
  }, [auth, refreshOrdersAndCounts]);

  useEffect(() => {
    if (!auth) return;
    if (!initialLoadedRef.current) return;
    refreshOrdersAndCounts();
  }, [auth, orderStatus, refreshOrdersAndCounts]);

  const handleArchiveOrder = async (order) => {
    const confirm = window.confirm(
      "Are you sure you want to archive this order?",
    );

    if (!confirm) {
      return;
    }
    const orderId = order.orderId;

    try {
      const res = await authedFetch(
        `${API_BASE}/api/admin/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ARCHIVED" }),
        },
      );
      if (!res.ok) throw new Error("Failed to archive order");
      await fetchOrders();
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to archive order");
    }
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
              setError(null);
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

  return (
    <div className="orders-panel">
      <div className="search-button-container">
        <button
          type="button"
          className="search-button"
          onClick={isSearchShown ? clearSearch : handleToggleSearch}
        >
          🔍 {isSearchShown ? "Hide Search" : "Search by Email"}
        </button>
      </div>
      {isSearchShown && (
        <div className="orders-search-bar">
          <label className="orders-search-label" htmlFor="emailSearch">
            Email Address:
          </label>

          <div className="orders-search-row">
            <input
              id="emailSearch"
              type="text"
              className="search-input"
              value={searchEmail}
              onChange={(e) => {
                const next = e.target.value;
                setSearchEmail(next);

                if (!next.trim()) {
                  setSearchResults(null);
                  setSearchMeta(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchEmail();
                if (e.key === "Escape") {
                  setIsSearchShown(false);
                  clearSearch();
                }
              }}
            />

            <button
              type="button"
              className="orders-search-btn"
              onClick={handleSearchEmail}
              disabled={searchLoading}
            >
              Search
            </button>

            <button
              type="button"
              className="orders-reset-btn"
              onClick={clearSearch}
              disabled={searchLoading}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      <div className="orders-panel-header">
        <h1 className={isSearching ? "orders-title-highlight" : "orders-title"}>
          {isSearching ? (
            <>
              Showing orders for:
              <br />
              <span className="orders-search-email">{searchMeta.value}</span>
            </>
          ) : (
            "Orders"
          )}
        </h1>

        <button type="button" className="orders-refresh" onClick={fetchOrders}>
          Refresh
        </button>
      </div>

      {!isSearchShown && (
        <div className="choose-order-status">
          <button
            type="button"
            className={
              orderStatus === "active"
                ? "orders-header-button active"
                : "orders-header-button"
            }
            disabled={isSearching}
            onClick={() => handleChooseOrderStatus("active")}
          >
            ACTIVE
            {activeOrdersCount > 0 && (
              <span className="orders-badge">{activeOrdersCount}</span>
            )}
          </button>

          <button
            type="button"
            className={
              orderStatus === "shipped"
                ? "orders-header-button active"
                : "orders-header-button"
            }
            disabled={isSearching}
            onClick={() => handleChooseOrderStatus("shipped")}
          >
            SHIPPED
            {shippedOrdersCount > 0 && (
              <span className="orders-badge">{shippedOrdersCount}</span>
            )}
          </button>

          <button
            type="button"
            className={
              orderStatus === "completed"
                ? "orders-header-button active"
                : "orders-header-button"
            }
            disabled={isSearching}
            onClick={() => handleChooseOrderStatus("completed")}
          >
            COMPLETED
          </button>

          <button
            type="button"
            className={
              orderStatus === "cancelled"
                ? "orders-header-button active"
                : "orders-header-button"
            }
            disabled={isSearching}
            onClick={() => handleChooseOrderStatus("cancelled")}
          >
            CANCELLED
          </button>

          <button
            type="button"
            className={
              orderStatus === "archived"
                ? "orders-header-button active"
                : "orders-header-button"
            }
            disabled={isSearching}
            onClick={() => handleChooseOrderStatus("archived")}
          >
            ARCHIVED
          </button>
        </div>
      )}

      {error && <div className="orders-error">{error}</div>}

      {isSearching && (
        <div className="orders-search-hint">
          Click Reset button to return to tabs.
        </div>
      )}

      {displayOrders.length === 0 ? (
        <div className="orders-empty">
          {searchMeta ? "No matches for that search." : "No orders yet."}
        </div>
      ) : (
        <div className="orders-list">
          {displayOrders.map((o) => {
            return (
              <div key={o.orderId} className="orders-card">
                <div className="orders-card-header">
                  <div className="orders-card-title">Order #{o.orderId}</div>
                  <div className="orders-card-status">{o.orderStatus}</div>
                </div>

                <div className="orders-card-body">
                  <div className="orders-field">
                    <span className="orders-field-label">Name</span>
                    <span className="orders-field-value">{o.orderName}</span>
                  </div>

                  <div className="orders-field">
                    <span className="orders-field-label">Email</span>
                    <span className="orders-field-value">{o.orderEmail}</span>
                  </div>

                  <div className="orders-field">
                    <span className="orders-field-label">Address Line 1</span>
                    <span className="orders-field-value">
                      {o.shippingAddress1}
                    </span>
                  </div>

                  <div className="orders-field">
                    <span className="orders-field-label">Address Line 2</span>
                    <span className="orders-field-value">
                      {o.shippingAddress2}
                    </span>
                  </div>

                  <div className="orders-field">
                    <span className="orders-field-label">City</span>
                    <span className="orders-field-value">{o.shippingCity}</span>
                  </div>

                  <div className="orders-field">
                    <span className="orders-field-label">State</span>
                    <span className="orders-field-value">
                      {o.shippingState}
                    </span>
                  </div>

                  <div className="orders-field">
                    <span className="orders-field-label">ZIP</span>
                    <span className="orders-field-value">{o.shippingZip}</span>
                  </div>

                  <div className="orders-field">
                    <span className="orders-field-label">Subtotal</span>
                    <span className="orders-field-value">
                      ${Number(o.subtotal ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="orders-field">
                    <span className="orders-field-label">Tax</span>
                    <span className="orders-field-value">
                      ${Number(o.taxTotal ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="orders-field">
                    <span className="orders-field-label">Shipping</span>
                    <span className="orders-field-value">
                      ${Number(o.shippingTotal ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="orders-field">
                    <span className="orders-field-label">Discount</span>
                    <span className="orders-field-value">
                      -${Number(o.discountTotal ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="orders-field">
                    <span className="orders-field-label">Customer Paid</span>
                    <span className="orders-field-value">
                      ${Number(o.orderTotal ?? 0).toFixed(2)}
                    </span>
                  </div>

                  {orderStatus !== "active" && o.trackingNumber && (
                    <div className="orders-field">
                      <span className="orders-field-label">Tracking</span>
                      <span className="orders-field-value">
                        {o.carrier} • {o.trackingNumber}
                      </span>
                    </div>
                  )}
                </div>

                <div className="orders-card-actions">
                  {o.orderStatus === "PAID" && (
                    <button type="button" onClick={() => handleMarkShipped(o)}>
                      Mark shipped
                    </button>
                  )}

                  {orderStatus === "shipped" &&
                    o.orderStatus === "SHIPPED" &&
                    o.trackingNumber &&
                    !o.deliveredAt && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleResendTracking(o)}
                        >
                          Resend tracking
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkDelivered(o)}
                        >
                          Mark delivered
                        </button>
                      </>
                    )}

                  {orderStatus === "completed" &&
                    o.orderStatus === "DELIVERED" && (
                      <button
                        type="button"
                        onClick={() => handleArchiveOrder(o)}
                      >
                        Archive
                      </button>
                    )}
                </div>

                {o.items?.length > 0 && (
                  <ul className="orders-items">
                    {o.items.map((it) => (
                      <li key={it.id} className="orders-item">
                        <button
                          type="button"
                          className="order-product-button"
                          onClick={() => openItemModal(it)}
                        >
                          {it.productName}
                        </button>
                        <span className="orders-item-meta">
                          × {it.quantity} @ ${Number(it.unitPrice).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isItemModalOpen && selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeItemModal}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100dvh",
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
              maxHeight: "90dvh",
              overflowY: "auto",
              boxSizing: "border-box",
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
                src={`${API_BASE}/api/product/${selectedItem.productId}/picture?version=${Date.now()}`}
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
