"use client";

import React, { useState, useEffect, useRef } from "react";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

interface KitchenOrder {
  orderId: string;
  restaurantId: string;
  tableNo: number;
  status: "SUBMITTED" | "RECEIVED" | "PREPARING" | "READY" | "SERVED";
  kitchenAcknowledged: boolean;
  items: OrderItem[];
  totalAmount: number;
  orderNote?: string;
  createdAt: string;
  updatedAt: string;
}

export default function KitchenAIPage() {
  const [restaurantId, setRestaurantId] = useState<string>("REST-001");
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [lastAnnouncedId, setLastAnnouncedId] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Voice announcement helper
  const announceOrder = (order: KitchenOrder) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const itemsSummary = order.items
        .map((i) => `${i.quantity} ${i.name}`)
        .join(", ");
      const text = `New order ${order.orderId} for Table ${order.tableNo}. ${itemsSummary}.${
        order.orderNote ? ` Note: ${order.orderNote}` : ""
      }`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS Announcement failed:", e);
    }
  };

  // Automatically acknowledge new order on backend
  const acknowledgeOrder = async (orderId: string) => {
    try {
      await fetch(`/api/kitchen/orders/${orderId}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId }),
      });
    } catch (e) {
      console.warn("Auto-acknowledge failed:", e);
    }
  };

  // Fetch initial active orders
  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/kitchen/orders?restaurantId=${restaurantId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error("Failed to fetch kitchen orders:", e);
    }
  };

  // Set up realtime SSE connection
  useEffect(() => {
    fetchOrders();

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(`/api/kitchen/events?restaurantId=${restaurantId}`);
    eventSourceRef.current = sse;

    sse.onopen = () => {
      setIsConnected(true);
    };

    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.event === "CONNECTED") {
          setIsConnected(true);
        } else if (payload.event === "NEW_ORDER" && payload.order) {
          const newOrder: KitchenOrder = payload.order;

          setOrders((prev) => {
            const exists = prev.some((o) => o.orderId === newOrder.orderId);
            if (exists) return prev;
            return [newOrder, ...prev];
          });

          // Trigger Kitchen AI Actions:
          // 1. Voice Announcement
          if (newOrder.orderId !== lastAnnouncedId) {
            setLastAnnouncedId(newOrder.orderId);
            announceOrder(newOrder);
          }

          // 2. Acknowledge receipt to backend
          acknowledgeOrder(newOrder.orderId);
        } else if (payload.event === "ORDER_STATUS_UPDATED") {
          setOrders((prev) =>
            prev.map((o) =>
              o.orderId === payload.orderId
                ? {
                    ...o,
                    status: payload.status,
                    kitchenAcknowledged: payload.kitchenAcknowledged,
                    updatedAt: payload.updatedAt,
                  }
                : o
            )
          );
        }
      } catch (err) {
        // Heartbeat or malformed frame
      }
    };

    sse.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      sse.close();
    };
  }, [restaurantId, voiceEnabled]);

  // Handle status transition
  const handleUpdateStatus = async (
    orderId: string,
    nextStatus: "PREPARING" | "READY" | "SERVED"
  ) => {
    setIsUpdating(orderId);
    try {
      const res = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, restaurantId }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.orderId === orderId
              ? { ...o, status: nextStatus, kitchenAcknowledged: true }
              : o
          )
        );
      }
    } catch (e) {
      console.error("Status update failed:", e);
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === "ALL") return o.status !== "SERVED";
    return o.status === activeFilter;
  });

  return (
    <div className="min-h-screen bg-[#1e2319] text-[#f4f2ec] p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#3b4332]">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-serif text-[#d7e1c8] font-bold">
                Aster &amp; Olive · Kitchen AI
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isConnected
                    ? "bg-[#324524] text-[#a9df8b]"
                    : "bg-[#4f2a24] text-[#f49e91]"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-[#71ce43] animate-pulse" : "bg-[#f45d48]"
                  }`}
                />
                {isConnected ? "Realtime AI Connected" : "Connecting…"}
              </span>
            </div>
            <p className="text-sm text-[#9ea893] mt-1">
              Live kitchen display system · Automated voice announcements &amp; customer sync
            </p>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-[#293023] px-3 py-1.5 rounded-lg border border-[#3b4332] text-xs">
              <span className="text-[#9ea893] mr-2">Restaurant:</span>
              <span className="font-mono font-bold text-[#d7e1c8]">{restaurantId}</span>
            </div>

            <button
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                voiceEnabled
                  ? "bg-[#384829] text-[#d7e1c8] border-[#576b43]"
                  : "bg-[#293023] text-[#7d8774] border-[#3b4332]"
              }`}
            >
              <span>{voiceEnabled ? "🔊 Voice TTS On" : "🔇 Voice Muted"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if ("speechSynthesis" in window) {
                  const u = new SpeechSynthesisUtterance("Kitchen audio announcement test active.");
                  u.rate = 1.0;
                  window.speechSynthesis.speak(u);
                }
              }}
              className="px-3 py-1.5 bg-[#293023] hover:bg-[#343d2c] border border-[#3b4332] rounded-lg text-xs font-medium text-[#c4ceb7] transition"
            >
              Test Audio
            </button>
          </div>
        </header>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
          {[
            { id: "ALL", label: "Active Orders" },
            { id: "RECEIVED", label: "Received" },
            { id: "PREPARING", label: "Preparing" },
            { id: "READY", label: "Ready" },
            { id: "SERVED", label: "Served" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                activeFilter === tab.id
                  ? "bg-[#59634a] text-white shadow"
                  : "bg-[#272e21] text-[#9ea893] hover:bg-[#31392a]"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-75">
                (
                {tab.id === "ALL"
                  ? orders.filter((o) => o.status !== "SERVED").length
                  : orders.filter((o) => o.status === tab.id).length}
                )
              </span>
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredOrders.map((order) => {
            const isRec = order.status === "RECEIVED";
            const isPrep = order.status === "PREPARING";
            const isRdy = order.status === "READY";
            const isSrv = order.status === "SERVED";

            return (
              <div
                key={order.orderId}
                className={`bg-[#262d20] border rounded-xl p-5 flex flex-col justify-between transition-all ${
                  isRec
                    ? "border-[#687e50] shadow-md shadow-[#59634a]/10"
                    : isPrep
                    ? "border-[#857242]"
                    : isRdy
                    ? "border-[#3f7a4d]"
                    : "border-[#384030] opacity-75"
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#3b4332]">
                    <div>
                      <span className="font-mono text-base font-bold text-[#e1e9d5]">
                        {order.orderId}
                      </span>
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-[#3b4731] text-[#d7e1c8]">
                        Table {order.tableNo}
                      </span>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        isRec
                          ? "bg-[#3d4a2d] text-[#c1d89d]"
                          : isPrep
                          ? "bg-[#4a3f23] text-[#f2cb73]"
                          : isRdy
                          ? "bg-[#254d32] text-[#86e3a0]"
                          : "bg-[#303629] text-[#9ea893]"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* System Acknowledgment Indicator */}
                  <div className="flex items-center justify-between text-[11px] text-[#9ea893] pt-2">
                    <span>
                      Placed:{" "}
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="flex items-center gap-1 text-[#a5bd8b]">
                      ✓ Kitchen Notified
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="py-3 space-y-2 border-b border-[#3b4332] my-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-[#e8eee1]">
                        <span>
                          <strong className="text-[#a5bd8b] mr-1.5 font-bold">
                            {item.quantity}×
                          </strong>
                          {item.name}
                          {item.note && (
                            <span className="block text-xs text-[#d7ba7d] italic mt-0.5">
                              “{item.note}”
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-[#8f9b83]">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Whole order kitchen note */}
                  {order.orderNote && (
                    <div className="bg-[#1f241a] p-2.5 rounded-lg border border-[#3b4332] mb-3 text-xs text-[#f1ddaa]">
                      <strong>Note:</strong> {order.orderNote}
                    </div>
                  )}
                </div>

                {/* Status Advancement Buttons */}
                <div className="pt-3">
                  {isRec && (
                    <button
                      type="button"
                      disabled={isUpdating === order.orderId}
                      onClick={() => handleUpdateStatus(order.orderId, "PREPARING")}
                      className="w-full py-2.5 px-4 bg-[#768b4f] hover:bg-[#859d5a] text-[#1a2113] font-bold rounded-lg text-sm transition"
                    >
                      {isUpdating === order.orderId ? "Updating…" : "▶ Start Preparing"}
                    </button>
                  )}

                  {isPrep && (
                    <button
                      type="button"
                      disabled={isUpdating === order.orderId}
                      onClick={() => handleUpdateStatus(order.orderId, "READY")}
                      className="w-full py-2.5 px-4 bg-[#398453] hover:bg-[#439c63] text-white font-bold rounded-lg text-sm transition"
                    >
                      {isUpdating === order.orderId ? "Updating…" : "✓ Mark Order Ready"}
                    </button>
                  )}

                  {isRdy && (
                    <button
                      type="button"
                      disabled={isUpdating === order.orderId}
                      onClick={() => handleUpdateStatus(order.orderId, "SERVED")}
                      className="w-full py-2.5 px-4 bg-[#3b4433] hover:bg-[#47523d] text-[#c4ceb7] font-semibold rounded-lg text-sm transition"
                    >
                      {isUpdating === order.orderId ? "Updating…" : "Mark As Served"}
                    </button>
                  )}

                  {isSrv && (
                    <div className="text-center py-1 text-xs text-[#7d8774] font-medium">
                      Order Completed &amp; Served
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-20 text-[#858f7c]">
            <p className="text-base font-medium">No orders in this category right now.</p>
            <p className="text-xs text-[#626c5b] mt-1">
              New orders placed from tables will appear here in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
