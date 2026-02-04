import React, { useCallback, useEffect, useState, useRef } from "react";
import { API_BASE_URL } from "../config/api";
import emailjs from "@emailjs/browser";
import "../styles/OrdersPage.css";


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
  const [searchByOrderId, setSearchByOrderId] = useState("");
  const [searchType, setSearchType] = useState("email");
  const [searchMeta, setSearchMeta] = useState(null);
  const [searchLoading, setSearchLoading] = useState(null);
  const [isSearchShown, setIsSearchShown] = useState(false);
  const [editingNotesByOrderId, setEditingNotesByOrderId] = useState({});
  const [orderNotes, setOrderNotes] = useState({});
  const isSearching = !!searchMeta;
  const displayOrders = Array.isArray(searchResults) ? searchResults : orders;
  const isRefreshingRef = useRef(false);
  const initialLoadedRef = useRef(false);
  const pollingRef = useRef(null);
  const notesTextareaRefs = useRef({});
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

  const normalizeNumberedToDash = (line) => line.replace(/^\d+\.\s*/, "- ");

  const orderStatusEndpoint = useCallback(() => {
    if (orderStatus === "active") {
      return `${API_BASE_URL}/api/admin/orders/status/active`;
    }
    if (orderStatus === "shipped") {
      return `${API_BASE_URL}/api/admin/orders/status/shipped`;
    }
    if (orderStatus === "completed") {
      return `${API_BASE_URL}/api/admin/orders/status/completed`;
    }
    if (orderStatus === "cancelled") {
      return `${API_BASE_URL}/api/admin/orders/status/cancelled`;
    }
    if (orderStatus === "archived") {
      return `${API_BASE_URL}/api/admin/orders/status/archived`;
    }
    return null;
  }, [orderStatus]);

  const applyBangShortcut = (value, cursorPos) => {
    const s = String(value ?? "").replace(/\r\n/g, "\n");
    const pos = Math.max(0, Math.min(cursorPos ?? 0, s.length));

    const lineStart = s.lastIndexOf("\n", pos - 1) + 1;
    const lineEndIdx = s.indexOf("\n", lineStart);
    const lineEnd = lineEndIdx === -1 ? s.length : lineEndIdx;

    const originalLine = s.slice(lineStart, lineEnd);

    const numberedBang = /^(\d+)\.\s*!\s*/;
    const dashBang = /^-\s*!\s*/;

    let match;
    let newPrefix;

    if ((match = originalLine.match(numberedBang))) {
      const num = match[1];
      newPrefix = `${num}. [x] `;
    } else if ((match = originalLine.match(dashBang))) {
      newPrefix = `- [x] `;
    } else {
      return { nextValue: s, nextCursor: pos };
    }

    const oldPrefixLen = match[0].length;

    const replacedLine = originalLine.replace(match[0], newPrefix);
    const nextValue = s.slice(0, lineStart) + replacedLine + s.slice(lineEnd);

    const offsetIntoLine = pos - lineStart;

    let nextCursor = pos;
    if (offsetIntoLine <= oldPrefixLen) {
      nextCursor = lineStart + newPrefix.length;
    } else {
      nextCursor = pos + (newPrefix.length - oldPrefixLen);
    }

    return { nextValue, nextCursor };
  };

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

  const escapeHtml = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

      const openPackSlip = (order) => {
  const itemsHtml = (order?.items ?? [])
    .map(
      (it) => `
        <tr>
          <td>${escapeHtml(it?.productName ?? "")}</td>
          <td style="text-align:right;">${Number(it?.quantity ?? 0)}</td>
        </tr>
      `,
    )
    .join("");

  const notes = String(order?.followUpNotes ?? "").trim();

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Pack Slip - Order #${escapeHtml(order?.orderId ?? "")}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
      h1 { margin: 0 0 8px; font-size: 22px; }
      .muted { color: #555; }
      .box { border: 1px solid #ddd; border-radius: 10px; padding: 14px; margin-top: 14px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border-bottom: 1px solid #eee; padding: 8px 6px; }
      th { text-align: left; }
      .two-col { display:flex; gap: 12px; }
      .col { flex: 1; }
      @media print { button { display:none; } }
    </style>
  </head>
  <body>
    <h1>Goth & Glitter Pack Slip</h1>
    <div class="muted">Order #${escapeHtml(order?.orderId ?? "")}</div>

    <div class="two-col">
      <div class="box col">
        <strong>Ship To</strong><br/>
        ${escapeHtml(order?.orderName ?? "")}<br/>
        ${escapeHtml(order?.shippingAddress1 ?? "")}<br/>
        ${escapeHtml(order?.shippingAddress2 ?? "")}<br/>
        ${escapeHtml(order?.shippingCity ?? "")}, ${escapeHtml(order?.shippingState ?? "")} ${escapeHtml(order?.shippingZip ?? "")}
      </div>

      <div class="box col">
        <strong>Customer</strong><br/>
        ${escapeHtml(order?.orderEmail ?? "")}<br/><br/>
        <strong>Status</strong><br/>
        ${escapeHtml(order?.orderStatus ?? "")}
      </div>
    </div>

    <div class="box">
      <strong>Items</strong>
      <table>
        <thead>
          <tr><th>Item</th><th style="text-align:right;">Qty</th></tr>
        </thead>
        <tbody>
          ${itemsHtml || "<tr><td colspan='2'>No items</td></tr>"}
        </tbody>
      </table>
    </div>

    <div class="box">
      <strong>Notes</strong>
      <div style="white-space:pre-wrap; margin-top:8px;">
        ${escapeHtml(notes || "None")}
      </div>
    </div>

    <div style="margin-top:14px;">
      <button type="button" onclick="window.print()">Print</button>
    </div>
  </body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const w = window.open(url, "_blank", "noopener,width=800,height=900");
  if (!w) {
    URL.revokeObjectURL(url);
    alert("Pop-up blocked. Allow pop-ups for this site.");
    return;
  }

  // Cleanup: give the browser a moment to load it, then revoke.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};
  
  const ensureTrailingNumberedLine = (raw) => {
    const s = String(raw ?? "").replace(/\r\n/g, "\n");

    // Empty → start with 1.
    if (!s.trim()) return "1. ";

    const lines = s.split("\n");

    // If it already ends with a numbered prefix, leave it alone
    if (/^\d+\.\s*$/.test(lines[lines.length - 1])) {
      return s;
    }

    // Find the highest existing number
    let max = 0;
    for (const line of lines) {
      const match = line.match(/^(\d+)\.\s*/);
      if (match) {
        max = Math.max(max, Number(match[1]));
      }
    }

    const next = max + 1;

    return s.endsWith("\n") ? `${s}${next}. ` : `${s}\n${next}. `;
  };
  const handleChooseOrderStatus = (status) => {
    setOrderStatus(status);
  };

  const generateShippingLabel = async (orderId) => {
    try {
      const resp = await authedFetch(
        `${API_BASE_URL}/api/admin/orders/${orderId}/label`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );

      if (!resp.ok) throw new Error("Could not create shipping label");
      const data = await resp.json();
      return data;
    } catch (e) {
      console.error("Could not generate shipping label: ", e);
    }
  };

  const toggleXOnCurrentLine = (value, cursorPos) => {
    const s = String(value ?? "").replace(/\r\n/g, "\n");
    const pos = Math.max(0, Math.min(cursorPos ?? 0, s.length));

    const lineStart = s.lastIndexOf("\n", pos - 1) + 1;
    const lineEndIdx = s.indexOf("\n", lineStart);
    const lineEnd = lineEndIdx === -1 ? s.length : lineEndIdx;

    const originalLine = s.slice(lineStart, lineEnd);
    const trimmed = originalLine.trim();

    if (!trimmed) return s;

    const numMatch = originalLine.match(/^(\d+)\.\s*/);
    const dashMatch = originalLine.match(/^-\s*/);

    const prefix = numMatch ? `${numMatch[1]}. ` : dashMatch ? "- " : "";

    const withoutPrefix = trimmed.replace(/^(\d+\.\s*|-\s*)/, "");

    const hasBracketX = /^\[\s*x\s*\]\s*/i.test(withoutPrefix);
    const hasBang = /^!\s*/i.test(withoutPrefix);
    const isChecked = hasBracketX || hasBang;

    const text = withoutPrefix
      .replace(/^\[\s*x\s*\]\s*/i, "")
      .replace(/^!\s*/i, "")
      .trim();

    const nextLine = isChecked ? `${prefix}${text}` : `${prefix}[x] ${text}`;

    return s.slice(0, lineStart) + nextLine + s.slice(lineEnd);
  };

  const handleSaveOrderNotes = async (order) => {
    const orderId = order?.orderId ?? "";
    if (!orderId) return false;

    const rawDraft = orderNotes[orderId] ?? "";
    const cleanedNotes = normalizeOrderNotesForSave(rawDraft);

    try {
      const resp = await authedFetch(
        `${API_BASE_URL}/api/admin/orders/follow-up/${orderId}/follow-up-notes`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followUpNotes: cleanedNotes }),
        },
      );

      if (!resp.ok) {
        setError(`HTTP ${resp.status}`);
        return false;
      }

      const updated = await resp.json().catch(() => null);
      const savedNotes = normalizeOrderNotesForSave(
        updated?.followUpNotes ?? cleanedNotes,
      );
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId ? { ...o, followUpNotes: savedNotes } : o,
        ),
      );
      setOrderNotes((prev) => ({ ...prev, [orderId]: savedNotes }));
      setEditingNotesByOrderId((prev) => ({ ...prev, [orderId]: false }));

      return true;
    } catch (e) {
      console.error("Failed to save order notes:", e);
      return false;
    }
  };

  const toggleNoteLine = (order, lineIndex) => {
    const orderId = order?.orderId;
    if (!orderId) return;

    const raw = String(order.followUpNotes ?? orderNotes[orderId] ?? "");
    const lines = raw.split("\n");
    const line = lines[lineIndex] ?? "";

    const dashPrefix = /^-\s*/;
    const numPrefix = /^(\d+)\.\s*/;

    const isListItem = dashPrefix.test(line) || numPrefix.test(line);
    if (!isListItem) return;

    const withoutPrefix = line.replace(numPrefix, "").replace(dashPrefix, "");

    const hasBracketX = /^\[\s*x\s*\]\s*/i.test(withoutPrefix);
    const hasBang = /^!\s*/i.test(withoutPrefix);
    const isChecked = hasBracketX || hasBang;

    const text = withoutPrefix
      .replace(/^\[\s*x\s*\]\s*/i, "")
      .replace(/^!\s*/i, "")
      .trim();

    const numMatch = line.match(numPrefix);
    const prefix = numMatch ? `${numMatch[1]}. ` : "- ";

    lines[lineIndex] = isChecked ? `${prefix}${text}` : `${prefix}[x] ${text}`;

    setOrderNotes((prev) => ({
      ...prev,
      [orderId]: lines.join("\n"),
    }));
  };

  const handleNotesKeyDown = (orderId, e) => {
    // Ctrl/Cmd + Enter toggles [x] on current line
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();

      const textarea = e.currentTarget;
      const value = textarea.value ?? "";
      const cursor = textarea.selectionStart ?? value.length;

      const nextValue = toggleXOnCurrentLine(value, cursor);

      setOrderNotes((prev) => ({ ...prev, [orderId]: nextValue }));

      // keep cursor in same place (best-effort)
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = cursor;
      });
      return;
    }

    // normal Enter behavior (numbered lines)
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;

    e.preventDefault();

    const textarea = e.currentTarget;
    const value = textarea.value ?? "";
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;

    const before = value.slice(0, start);
    const after = value.slice(end);

    // empty textarea → start at 1.
    if (!value.trim()) {
      const next = "1. ";
      setOrderNotes((prev) => ({ ...prev, [orderId]: next }));

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = next.length;
      });
      return;
    }

    // find last number used (search backward in the text BEFORE cursor)
    const lines = before.split("\n");
    let lastNum = 0;

    for (let i = lines.length - 1; i >= 0; i--) {
      const m = lines[i].match(/^(\d+)\.\s*/);
      if (m) {
        lastNum = Number(m[1]);
        break;
      }
    }

    const nextLine = `\n${lastNum + 1}. `;
    const nextValue = before + nextLine + after;

    setOrderNotes((prev) => ({ ...prev, [orderId]: nextValue }));

    const nextPos = before.length + nextLine.length;
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = nextPos;
    });
  };

  const handleCancelOrderNotes = (order) => {
    const orderId = order?.orderId;
    if (!orderId) return;

    setOrderNotes((prev) => ({
      ...prev,
      [orderId]: order.followUpNotes ?? "",
    }));

    setEditingNotesByOrderId((prev) => ({ ...prev, [orderId]: false }));
  };

  const normalizeOrderNotesForSave = (raw) => {
    const s = String(raw ?? "").replace(/\r\n/g, "\n");
    const lines = s.split("\n");

    const cleaned = lines.filter((line) => {
      const t = line.trim();
      if (!t) return false;

      const emptyDashBullet = /^-\s*(\[\s*x\s*\])?\s*$/i.test(t);
      if (emptyDashBullet) return false;

      const emptyNumberedLine = /^\d+\.\s*(\[\s*x\s*\])?\s*$/i.test(t);
      if (emptyNumberedLine) return false;

      return true;
    });

    return cleaned.join("\n").trim();
  };

  const promptForAuth = useCallback(() => {
    const username = window.prompt("Admin username:");
    if (!username) return null;
    const password = window.prompt("Admin password:");
    if (!password) return null;
    return btoa(`${username}:${password}`);
  }, []);

  const verifyAuth = useCallback(async (token) => {
    const res = await fetch(`${API_BASE_URL}/api/admin/orders/status/active`, {
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

      const { signal, ...rest } = options;

      let res;
      try {
        res = await fetch(url, {
          ...rest,
          headers,
          credentials: "include",
          signal,
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
          ...rest,
          headers: retryHeaders,
          credentials: "include",
          signal,
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

  const fetchCounts = useCallback(
    async ({ signal } = {}) => {
      const [activeRes, shippedRes] = await Promise.all([
        authedFetch(`${API_BASE_URL}/api/admin/orders/status/active`, { signal }),
        authedFetch(`${API_BASE_URL}/api/admin/orders/status/shipped`, { signal }),
      ]);

      const active = activeRes.ok
        ? JSON.parse((await activeRes.text()) || "[]")
        : [];
      const shipped = shippedRes.ok
        ? JSON.parse((await shippedRes.text()) || "[]")
        : [];

      setActiveOrdersCount(Array.isArray(active) ? active.length : 0);
      setShippedOrdersCount(Array.isArray(shipped) ? shipped.length : 0);
    },
    [authedFetch],
  );

  const clearSearch = () => {
    setSearchResults(null);
    setSearchMeta(null);
    setSearchEmail("");
    setSearchByOrderId("");
    setSearchType("email");
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
        `${API_BASE_URL}/api/admin/orders/search/email/${encodeURIComponent(email)}`,
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

  const handleSearchByOrderId = () => {
    const id = String(searchByOrderId || "").trim();

    if (!id) {
      clearSearch();
      return;
    }

    const matches = (orders || []).filter((o) => String(o.orderId) === id);

    setSearchResults(matches);
    setSearchMeta({ type: "orderId", value: id });
  };

  const handleMarkFollowUp = async (order) => {
    const orderId = order?.orderId ?? order?.id;
    if (!orderId) {
      console.error("Missing orderId: Check your onClick wiring.", { order });
      alert("Could not mark follow up: missing order id");
      return;
    }
    const confirm = window.confirm("Follow up with this order/customer?");

    if (!confirm) return;

    try {
      const resp = await authedFetch(
        `${API_BASE_URL}/api/admin/orders/follow-up/${orderId}`,
        { method: "PATCH", credentials: "include" },
      );
      if (!resp.ok) {
        setError(`HTTP ${resp.status}`);
      }
      await fetchOrders();
    } catch (e) {
      console.error("Mark follow up failed", e);
      setError(`Could not mark follow-up for order #${orderId}`);
    }
  };

  const handleUnmarkFollowUp = async (order) => {
    const orderId = order?.orderId ?? order?.id;
    if (!orderId) {
      alert("Missing order id");
      return;
    }

    const confirm = window.confirm("Remove follow-up flag for this order?");
    if (!confirm) return;

    try {
      const resp = await authedFetch(
        `${API_BASE_URL}/api/admin/orders/unmark-follow-up/${orderId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ needsFollowUp: false }),
        },
      );

      if (!resp.ok) {
        setError(`Failed to unmark follow-up for order #${orderId}`);
        return;
      }

      await fetchOrders();
    } catch (e) {
      console.error("Unmark follow up failed:", e);
      setError(`Could not unmark follow-up for order #${orderId}`);
    }
  };

  const getChecklistStats = (raw) => {
    const s = String(raw ?? "").replace(/\r\n/g, "\n");
    const lines = s.split("\n");

    let totalItems = 0;
    let checkedItems = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const isListItem = /^-\s*/.test(trimmed);
      if (!isListItem) continue;

      const emptyBullet = /^-\s*(\[\s*x\s*\])?\s*$/i.test(trimmed);
      if (emptyBullet) continue;

      totalItems += 1;

      const isChecked = /^-\s*\[\s*x\s*\]\s*/i.test(trimmed);
      if (isChecked) checkedItems += 1;
    }
    return {
      totalItems,
      checkedItems,
      allChecked: totalItems > 0 && checkedItems === totalItems,
    };
  };

  const handleMarkResolved = async (order) => {
    const orderId = order?.orderId ?? order?.id;
    if (!orderId) {
      alert("Missing order id");
      return;
    }

    const rawNotes = orderNotes[orderId] ?? order?.followUpNotes ?? "";
    const { totalItems, allChecked } = getChecklistStats(rawNotes);

    let message = "Mark order resolved?";

    if (totalItems > 0 && !allChecked) {
      message =
        "All line items are not complete. Are you sure you want to mark resolved?";
    }

    const ok = window.confirm(message);
    if (!ok) return;

    const saved = await handleSaveOrderNotes(order);

    if (!saved) {
      alert("Could not save notes. Resolve cancelled.");
      return;
    }

    try {
      const resp = await authedFetch(
        `${API_BASE_URL}/api/admin/orders/follow-up/${orderId}/resolved`,
        { method: "PATCH", credentials: "include" },
      );

      if (!resp.ok) {
        setError(`Failed to mark resolved for order #${orderId}`);
        return;
      }

      const updated = await resp.json();
      await fetchOrders();
      return updated;
    } catch (e) {
      console.error("Failed to mark resolved:", e);
      setError(`Could not mark resolved for order #${orderId}`);
    }
    handleSaveOrderNotes(order.orderId);
  };

  const handleMarkShipped = async (order) => {
    const confirm = window.confirm("Are you sure you want to mark shipped?");

    if (!confirm) {
      return;
    }

    const orderId = order.orderId;

    let carrier = window.prompt("Carrier (ex: USPS, FedEx, UPS):");
    if (carrier === null) return;

    let normalizedCarrier = carrier.trim().toLowerCase();
    while (
      !normalizedCarrier ||
      !["usps", "fedex", "ups"].includes(normalizedCarrier)
    ) {
      carrier = window.prompt(
        "Carrier must be USPS, FedEx, or UPS. Please try again:",
      );
      if (carrier === null) return;

      normalizedCarrier = carrier.trim().toLowerCase();
    }
    let showError = false;
    let cleanTracking = "";

    while (true) {
      let trackingNumber = window.prompt(
        showError
          ? "Tracking number must be at least <8> digits long. Please try again:"
          : "Tracking number:",
      );
      if (trackingNumber === null) return;

      cleanTracking = trackingNumber.trim();

      if (cleanTracking.length < 8) {
        showError = true;
        continue;
      }
      const confirmed = window.confirm(
        `Please confirm tracking number. Hit OK if correct:\n\n${cleanTracking}`,
      );
      if (!confirmed) {
        showError = false;
        continue;
      }
      break;
    }

    try {
      const res = await authedFetch(
        `${API_BASE_URL}/api/admin/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "SHIPPED",
            carrier,
            trackingNumber: cleanTracking,
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
          tracking_number: updated?.trackingNumber ?? cleanTracking,
          tracking_url: buildTrackingUrl(
            updated?.carrier ?? carrier,
            updated?.trackingNumber ?? cleanTracking,
          ),
        },
        EMAILJS_PUBLIC_KEY,
      );
      await fetchOrders();
      console.log("ship payload:", {
        orderId,
        carrier,
        trackingNumber: cleanTracking,
      });
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
        `${API_BASE_URL}/api/admin/orders/${orderId}/status`,
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

  const fetchOrders = useCallback(
    async ({ signal } = {}) => {
      try {
        setError(null);

        const url = orderStatusEndpoint();
        const res = await authedFetch(url, { method: "GET", signal });

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
        setOrderNotes((prev) => ({
          ...Object.fromEntries(
            (Array.isArray(data) ? data : []).map((o) => [
              o.orderId,
              o.followUpNotes ?? "",
            ]),
          ),
          ...prev,
        }));
      } catch (e) {
        if (e?.name === "AbortError") return;
        console.error("[fetchOrders] error:", e);
        setError(e?.message || "Failed to load orders.");
      }
    },
    [authedFetch, orderStatusEndpoint],
  );

  const pollingAbortRef = useRef(null);

  const refreshOrdersAndCounts = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    if (pollingAbortRef.current) pollingAbortRef.current.abort();
    const controller = new AbortController();
    pollingAbortRef.current = controller;

    try {
      await fetchCounts({ signal: controller.signal });
      await fetchOrders({ signal: controller.signal });
    } catch (e) {
      if (e.name !== "AbortError") console.error(e);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [fetchCounts, fetchOrders]);

  useEffect(() => {
    if (!auth) return;

    const abortRef = pollingAbortRef;

    const startPolling = () => {
      if (pollingRef.current) return;
      pollingRef.current = setInterval(refreshOrdersAndCounts, 6000);
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
      if (abortRef.current) abortRef.current.abort();
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
        `${API_BASE_URL}/api/admin/orders/${orderId}/status`,
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
          🔍 {isSearchShown ? "Hide Search" : "Search"}
        </button>
      </div>
      {isSearchShown && (
        <div className="orders-search-bar">
          <label className="orders-search-label" htmlFor="ordersSearch">
            {searchType === "email" ? "Email Address:" : "Order #:"}
          </label>

          <div className="orders-search-row">
            <button
              type="button"
              className="orders-search-btn"
              onClick={() => {
                setSearchType("email");
                setSearchResults(null);
                setSearchMeta(null);
              }}
              disabled={searchLoading}
            >
              Email
            </button>

            <button
              type="button"
              className="orders-search-btn"
              onClick={() => {
                setSearchType("orderId");
                setSearchResults(null);
                setSearchMeta(null);
              }}
              disabled={searchLoading}
            >
              Order #
            </button>

            <input
              id="ordersSearch"
              type="text"
              className="search-input"
              value={searchType === "email" ? searchEmail : searchByOrderId}
              onChange={(e) => {
                const next = e.target.value;

                if (searchType === "email") setSearchEmail(next);
                else setSearchByOrderId(next);

                if (!next.trim()) {
                  setSearchResults(null);
                  setSearchMeta(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (searchType === "email") handleSearchEmail();
                  else handleSearchByOrderId();
                }

                if (e.key === "Escape") {
                  setIsSearchShown(false);
                  clearSearch();
                }
              }}
            />

            <button
              type="button"
              className="orders-search-btn"
              onClick={
                searchType === "email"
                  ? handleSearchEmail
                  : handleSearchByOrderId
              }
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
              {searchType === "email"
                ? "Showing orders for "
                : "Showing Order # "}
              <br />
              <span className="orders-search-email">
                {searchMeta !== "email" && " "}
                {searchMeta.value}
              </span>
            </>
          ) : (
            "Orders"
          )}
        </h1>
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
          Click Reset button to return to all orders.
        </div>
      )}
      <div className="refresh-button-container">
        <button type="button" className="orders-refresh" onClick={fetchOrders}>
          Refresh Orders List
        </button>
      </div>

      {displayOrders.length === 0 ? (
        <div className="orders-empty">
          {searchMeta ? "No matches for that search." : "No orders yet."}
        </div>
      ) : (
        <div className="orders-list">
          {displayOrders.map((o) => {
            const labelCreated = o.labelCreated;
            return (
              <div key={o.orderId} className="orders-card">
                <div className="orders-card-header">
                  <div className="orders-card-title">Order #{o.orderId}</div>
                  <div className="orders-card-status">{o.orderStatus}</div>
                </div>

                <div className="orders-card-body">
                  <div className="follow-up">
                  {!o.needsFollowUp && (
                    <button onClick={() => handleMarkFollowUp(o)}>
                      Needs follow up
                    </button>
                  )}
                    {o.needsFollowUp && !o.followUpResolvedAt && (
                      <div className="follow-up-alert">
                        <h3 className="follow-up-alert-text">
                          Order is marked for follow up
                        </h3>
                        <div className="follow-up-alert-buttons">
                          <div className="mark-resolved-container">
                            <button
                              type="button"
                              className="unmark-follow-up-button"
                              onClick={() => handleUnmarkFollowUp(o)}
                            >
                              Unmark follow up
                            </button>
                          </div>
                          <button
                            className="resolved-button"
                            onClick={() => {
                              handleMarkResolved(o);
                            }}
                          >
                            Mark resolved
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
                  <div className="order-label-section">
                    <div className="order-label-status">
                      {labelCreated && (
                        <h3 className="label-created-alert">Label: Created</h3>
                      )}
                      {!labelCreated && (
                        <h3 className="label-created-alert">
                          Label: Not Created
                        </h3>
                      )}
                    </div>
                    <button
                      type="button"
                      className="pack-slip-button"
                      onClick={() => openPackSlip(o)}
                    >
                      Pack Slip
                    </button>
                    <button
                      type="button"
                      className="generate-label-button"
                      disabled={o.labelCreated === true}
                      onClick={async () => {
                        const orderId = o.orderId;
                        const labelAlreadyCreated = o.labelCreated === true;

                        if (labelAlreadyCreated) {
                          window.alert(
                            `A shipping label was already generated for order# ${orderId}`,
                          );
                          return;
                        }

                        const confirmCreate = window.confirm(
                          "Create shipping label for this order?",
                        );

                        if (!confirmCreate) return;

                        try {
                          const updated = await generateShippingLabel(orderId);
                          if (!updated) return;

                          setOrders((prev) =>
                            prev.map((x) =>
                              x.orderId === orderId ? updated : x,
                            ),
                          );
                          fetchOrders();
                        } catch (e) {
                          console.error(
                            "Could not generate shipping label:",
                            e,
                          );
                          return null;
                        }
                      }}
                    >
                      Create Label
                    </button>

                    {o.orderStatus === "PAID" && (
                      <button
                        type="button"
                        onClick={() => handleMarkShipped(o)}
                      >
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
                {(o.needsFollowUp ||
                  String(
                    o.followUpNotes ?? orderNotes[o.orderId] ?? "",
                  ).trim()) && (
                  <div className="order-notes">
                    {editingNotesByOrderId[o.orderId] ? (
                      <>
                        <textarea
                          ref={(el) => {
                            if (el) notesTextareaRefs.current[o.orderId] = el;
                          }}
                          value={orderNotes[o.orderId] ?? ""}
                          onChange={(e) => {
                            const orderId = o.orderId;
                            const textarea = e.currentTarget;
                            const raw = textarea.value ?? "";
                            const cursor =
                              textarea.selectionStart ?? raw.length;

                            const { nextValue, nextCursor } = applyBangShortcut(
                              raw,
                              cursor,
                            );

                            setOrderNotes((prev) => ({
                              ...prev,
                              [orderId]: nextValue,
                            }));

                            requestAnimationFrame(() => {
                              const el = notesTextareaRefs.current[orderId];
                              if (!el) return;
                              el.selectionStart = el.selectionEnd = nextCursor;
                            });
                          }}
                          onKeyDown={(e) => handleNotesKeyDown(o.orderId, e)}
                          className="order-notes-textarea"
                          placeholder="Type order notes here..."
                        />
                        <div className="order-notes-actions">
                          <button
                            type="button"
                            className="save-order-notes"
                            onClick={() => handleSaveOrderNotes(o)}
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            className="cancel-order-notes"
                            onClick={() => handleCancelOrderNotes(o)}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="order-notes-display">
                        {String(
                          o.followUpNotes ?? orderNotes[o.orderId] ?? "",
                        ).trim() ? (
                          <div className="order-notes-text">
                            {String(
                              o.followUpNotes ?? orderNotes[o.orderId] ?? "",
                            )
                              .split("\n")
                              .map((line, index) => {
                                const dashPrefix = /^-\s*/;
                                const numPrefix = /^(\d+)\.\s*/;

                                const hasDash = dashPrefix.test(line);
                                const hasNum = numPrefix.test(line);

                                const isListItem = hasDash || hasNum;

                                if (!isListItem) {
                                  return (
                                    <div
                                      key={index}
                                      className="order-note-line"
                                    >
                                      {line}
                                    </div>
                                  );
                                }

                                // Strip prefix FIRST (either "3. " or "- ")
                                const withoutPrefix = line
                                  .replace(numPrefix, "")
                                  .replace(dashPrefix, "");

                                // Now detect checked markers on the remainder
                                const hasBracketX = /^\[\s*x\s*\]\s*/i.test(
                                  withoutPrefix,
                                );
                                const hasBang = /^!\s*/i.test(withoutPrefix);
                                const isChecked = hasBracketX || hasBang;

                                // Strip markers so display only shows the human text
                                const text = withoutPrefix
                                  .replace(/^\[\s*x\s*\]\s*/i, "")
                                  .replace(/^!\s*/i, "")
                                  .trim();

                                return (
                                  <div
                                    key={index}
                                    className={`order-note-item ${isChecked ? "checked" : ""}`}
                                    onClick={() => toggleNoteLine(o, index)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ")
                                        toggleNoteLine(o, index);
                                    }}
                                  >
                                    <span className="checkbox">
                                      {isChecked ? "✅" : "☐"}
                                    </span>
                                    <span className="text">{text}</span>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <p className="order-notes-empty">No notes yet.</p>
                        )}
                        {o.needsFollowUp === true && (
                          <button
                            type="button"
                            className="edit-order-notes"
                            onClick={() => {
                              const orderId = o.orderId;

                              const nextText = ensureTrailingNumberedLine(
                                orderNotes[orderId] ?? o.followUpNotes ?? "",
                              );

                              setOrderNotes((prev) => ({
                                ...prev,
                                [orderId]: nextText,
                              }));

                              setEditingNotesByOrderId((prev) => ({
                                ...prev,
                                [orderId]: true,
                              }));

                              setTimeout(() => {
                                const el = notesTextareaRefs.current[orderId];
                                if (!el) return;

                                el.focus();
                                const len = el.value.length;
                                el.setSelectionRange(len, len);
                              }, 0);
                            }}
                          >
                            {(o.followUpNotes ?? "").trim()
                              ? "Edit"
                              : "Add notes"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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
                src={`${API_BASE_URL}/api/product/${selectedItem.productId}/picture?version=${Date.now()}`}
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
