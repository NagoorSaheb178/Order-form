"use client";

<<<<<<< HEAD
import React, { useState, useMemo } from "react";
import { MENU_ITEMS, MenuItem } from "@/lib/menu";
import { CATEGORIES } from "@/lib/categories";

export interface CartItem extends MenuItem {
  qty: number;
  note?: string;
}

export interface PlacedOrder {
  order_reference: string;
  orderId?: string;
  restaurantId?: string;
  table_number: number;
  status: "SUBMITTED" | "RECEIVED" | "PREPARING" | "READY" | "SERVED";
  kitchenAcknowledged: boolean;
  items: CartItem[];
  order_note: string;
  subtotal: number;
  created_at: string;
  updated_at?: string;
}

type Screen = "welcome" | "menu" | "review" | "confirmation" | "status";


export default function OrderPage() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [manualTableInput, setManualTableInput] = useState<string>("");
  const [tableError, setTableError] = useState<string>("");

  const [activeCategory, setActiveCategory] = useState<string>("Popular");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNote, setOrderNote] = useState<string>("");

  // Item Detail Sheet State
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [detailQty, setDetailQty] = useState<number>(1);
  const [detailNote, setDetailNote] = useState<string>("");
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Cart Sheet (Mobile)
  const [isCartSheetOpen, setIsCartSheetOpen] = useState<boolean>(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [latestOrder, setLatestOrder] = useState<PlacedOrder | null>(null);

  // Realtime order progress listener (Kitchen -> Customer)
  React.useEffect(() => {
    if (!latestOrder?.order_reference) return;

    const ref = latestOrder.order_reference;

    // Fetch latest status
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/orders/status?orderId=${ref}`);
        const data = await res.json();
        if (data.success && data.order) {
          setLatestOrder((prev) =>
            prev && (prev.order_reference === ref || prev.orderId === ref)
              ? {
                  ...prev,
                  status: data.order.status,
                  kitchenAcknowledged: !!data.order.kitchenAcknowledged,
                }
              : prev
          );
        }
      } catch (e) {}
    };
    pollStatus();

    let sse: EventSource | null = null;
    try {
      sse = new EventSource(`/api/orders/events?orderId=${ref}`);
      sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (
            payload.event === "ORDER_STATUS_UPDATED" &&
            (payload.orderId === ref || payload.orderId === latestOrder.orderId)
          ) {
            setLatestOrder((prev) =>
              prev
                ? {
                    ...prev,
                    status: payload.status,
                    kitchenAcknowledged: !!payload.kitchenAcknowledged,
                  }
                : prev
            );
          }
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (sse) sse.close();
    };
  }, [latestOrder?.order_reference]);

  // Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const totalItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const formatMoney = (n: number) => `₹${n}`;

  // Filtered menu items
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MENU_ITEMS.filter((item) => {
      const matchCat =
        activeCategory === "Popular" || item.cat === activeCategory;
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.cat.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  // Cart helpers
  const addItemToCart = (item: MenuItem, qty: number = 1, note: string = "") => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (x) => x.id === item.id && (x.note || "") === (note || "")
      );
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          qty: next[existingIndex].qty + qty,
        };
        return next;
      }
      return [...prev, { ...item, qty, note }];
    });
  };

  const updateItemQty = (id: string, delta: number, note?: string) => {
    setCart((prev) => {
      const existing = prev.find(
        (x) => x.id === id && (note === undefined || (x.note || "") === (note || ""))
      );
      if (!existing) return prev;
      const newQty = existing.qty + delta;
      if (newQty <= 0) {
        return prev.filter((x) => x !== existing);
      }
      return prev.map((x) => (x === existing ? { ...x, qty: newQty } : x));
    });
  };

  const handleOpenDetail = (item: MenuItem) => {
    setDetailItem(item);
    setDetailQty(1);
    setDetailNote("");
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setDetailItem(null);
  };

  const handleCloseAllSheets = () => {
    setIsDetailOpen(false);
    setIsCartSheetOpen(false);
  };

  const handleStartOrdering = () => {
    const selectedNum = tableNumber || Number(manualTableInput);
    if (!Number.isInteger(selectedNum) || selectedNum < 1 || selectedNum > 99) {
      setTableError("Choose a valid table number (1-99) to begin.");
      return;
    }
    setTableNumber(selectedNum);
    setTableError("");
    setScreen("menu");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectTablePreset = (num: number) => {
    setTableNumber(num);
    setManualTableInput(String(num));
    setTableError("");
  };

  // Submit order to API
  const handleSubmitOrder = async () => {
    if (!cart.length) {
      setSubmitError("Add at least one item before sending your order.");
      return;
    }
    if (!tableNumber) {
      setSubmitError("Table number is missing. Please re-select your table.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    const now = new Date();
    const orderRef = `AO-${String(now.getTime()).slice(-6)}`;

    const orderPayload = {
      tableNumber,
      orderReference: orderRef,
      items: cart.map((c) => ({
        id: c.id,
        name: c.name,
        price: c.price,
        quantity: c.qty,
        note: c.note || "",
      })),
      orderNote: orderNote.trim(),
      totalAmount: cartSubtotal,
    };
=======
import { useState } from "react";
import { useOrder } from "@/components/OrderContext";
import {
  CATEGORY_LABELS,
  type CategoryId,
} from "@/lib/categories";
import {
  MENU_ITEMS,
  type MenuItem,
} from "@/lib/menu";

// Added SUCCESS step
type Step = "PHONE" | "CATEGORY" | "ITEMS" | "REVIEW" | "SUCCESS";

export default function HomePage() {
  const {
    phone,
    setPhone,
    cart,
    addItem,
    updateQuantity,
    totalAmount,
    clearCart,
  } = useOrder();

  const [step, setStep] = useState<Step>("PHONE");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryId | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] =
    useState("");

  // ---------- HELPERS ------------------------------------------------

  const categoryItems = (catId: CategoryId): MenuItem[] =>
    MENU_ITEMS.filter((item) => item.categoryId === catId);

  const handlePhoneNext = () => {
    const digits = phone.replace(/\D/g, "");
    if (!digits || digits.length < 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    setStep("CATEGORY");
  };

  const handleConfirmOrder = async () => {
    if (!cart.length) {
      alert("Please add at least one item.");
      return;
    }
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to send order.");
      }

      const confirmedOrder: PlacedOrder = {
        order_reference: data.orderReference || orderRef,
        orderId: data.orderId || orderRef,
        restaurantId: "REST-001",
        table_number: tableNumber,
        status: data.status || "RECEIVED",
        kitchenAcknowledged: !!data.kitchenAcknowledged,
        items: [...cart],
        order_note: orderNote.trim(),
        subtotal: cartSubtotal,
        created_at: now.toISOString(),
      };

      setLatestOrder(confirmedOrder);
      setCart([]);
      setOrderNote("");
      setIsSubmitting(false);
      setScreen("confirmation");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Order submission error:", err);
      setIsSubmitting(false);
      setSubmitError("We could not send your order. Please try again.");
    }
  };

  return (
    <main className="w-full">
      {/* ============================================================== */}
      {/* SCREEN 1: WELCOME / TABLE SELECTION                           */}
      {/* ============================================================== */}
      {screen === "welcome" && (
        <section id="welcome" className="screen active" aria-labelledby="welcome-title">
          <div className="shell">
            <header className="flex items-center justify-between py-5 sm:py-7 border-b border-[#e6e1d6]">
              <div>
                <p className="brand text-xl sm:text-2xl font-semibold text-[#252720]">
                  Aster &amp; Olive
                </p>
                <p className="eyebrow mt-0.5">Dine-in ordering</p>
              </div>
              <div className="p-2 bg-[#edf0e7] rounded-full text-[#59634a]">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 2v20M8 2v20M2 12h20M2 4h20M2 20h20" />
                  <path d="M7 2v6a3 3 0 0 0 6 0V2" />
                  <path d="M17 2v20" />
                </svg>
              </div>
            </header>

            <div className="welcome-card mx-auto">
              <p className="eyebrow">Welcome to your table</p>
              <h1
                id="welcome-title"
                className="brand text-3xl sm:text-4xl leading-tight mt-2 sm:mt-3 text-[#252720] font-semibold"
              >
                A considered meal begins here.
              </h1>
              <p className="mt-3 sm:mt-4 text-[#73766c] leading-relaxed text-sm sm:text-base">
                Scan the table QR code, choose your table number, and order
                directly from our seasonal menu.
              </p>

              <div className="mt-6 sm:mt-8">
                <label
                  htmlFor="manual-table"
                  className="block font-semibold mb-2.5 sm:mb-3 text-[#252720] text-sm sm:text-base"
                >
                  Select your table
                </label>
                <div
                  className="table-grid"
                  id="table-grid"
                  role="group"
                  aria-label="Table number options"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`table-button ${
                        tableNumber === num ? "selected" : ""
                      }`}
                      onClick={() => handleSelectTablePreset(num)}
                      aria-pressed={tableNumber === num}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-4">
                  <label
                    htmlFor="manual-table"
                    className="text-sm text-[#73766c] whitespace-nowrap"
                  >
                    Or enter it manually
                  </label>
                  <input
                    id="manual-table"
                    className="field flex-1"
                    type="number"
                    min={1}
                    max={99}
                    inputMode="numeric"
                    placeholder="Table 1 - 99"
                    value={manualTableInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setManualTableInput(val);
                      const num = Number(val);
                      if (Number.isInteger(num) && num > 0) {
                        setTableNumber(num);
                        setTableError("");
                      } else {
                        setTableNumber(null);
                      }
                    }}
                  />
                </div>
                {tableError && (
                  <p id="table-error" className="error" aria-live="polite">
                    {tableError}
                  </p>
                )}
              </div>

              <button
                id="start-ordering"
                className="primary w-full mt-5"
                type="button"
                onClick={handleStartOrdering}
              >
                Start ordering
              </button>

              <p className="text-xs text-[#73766c] leading-relaxed mt-4 sm:mt-5 text-center sm:text-left">
                Your order is linked only to your table and sent securely to the
                restaurant kitchen.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* SCREEN 2: MENU BROWSING (MOBILE-OPTIMIZED)                     */}
      {/* ============================================================== */}
      {screen === "menu" && (
        <section id="menu" className="screen active" aria-labelledby="menu-title">
          <header className="topbar">
            <div className="shell py-2.5 sm:py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h1
                    id="menu-title"
                    className="brand text-lg sm:text-xl text-[#252720] font-semibold truncate"
                  >
                    Aster &amp; Olive
                  </h1>
                  <span className="inline-block text-xs font-medium text-[#59634a] bg-[#edf0e7] px-2 py-0.5 rounded-full mt-0.5">
                    Table {tableNumber || 1}
                  </span>
                </div>
                <button
                  id="open-cart"
                  className="secondary flex items-center gap-1.5 px-3 py-1.5 text-sm"
                  type="button"
                  onClick={() => setIsCartSheetOpen(true)}
                  aria-label="View current order"
                >
                  <span>Order</span>
                  {totalItemCount > 0 && (
                    <span className="inline-flex items-center justify-center bg-[#59634a] text-white text-xs font-bold rounded-full w-5 h-5 ml-0.5">
                      {totalItemCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mt-2.5">
                <svg
                  className="absolute left-3 top-3.5 text-[#73766c] w-4 h-4 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  id="menu-search"
                  className="field pl-9 py-2 text-sm"
                  type="search"
                  placeholder="Search dishes or ingredients…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Pills */}
              <nav
                className="category-row mt-1"
                aria-label="Menu categories"
                id="category-tabs"
              >
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`category ${
                      activeCategory === cat ? "active" : ""
                    }`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </nav>
            </div>
          </header>

          <div className="shell menu-layout">
            <div>
              <p
                id="menu-result"
                className="text-xs sm:text-sm text-[#73766c] pt-4"
                aria-live="polite"
              >
                {filteredItems.length}{" "}
                {filteredItems.length === 1 ? "dish" : "dishes"} available
              </p>

              <div id="menu-grid" className="menu-grid">
                {filteredItems.map((item) => {
                  const inCartItem = cart.find((x) => x.id === item.id);
                  return (
                    <article key={item.id} className="menu-card">
                      <img
                        src={item.img}
                        alt={item.name}
                        onClick={() => handleOpenDetail(item)}
                        className="cursor-pointer active:opacity-90"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex flex-col justify-between">
                        <button
                          className="text-left w-full cursor-pointer"
                          type="button"
                          onClick={() => handleOpenDetail(item)}
                          aria-label={`View ${item.name} details`}
                        >
                          <h2 className="font-bold text-[#252720] text-sm sm:text-base leading-snug">
                            {item.name}
                          </h2>
                          <p className="text-xs text-[#73766c] leading-relaxed mt-1 line-clamp-2">
                            {item.desc}
                          </p>
                        </button>

                        <div className="mt-2">
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {item.tags.map((t) => (
                                <span key={t} className="tag">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <strong className="text-[#252720] font-bold text-sm sm:text-base">
                              {formatMoney(item.price)}
                            </strong>

                            {inCartItem ? (
                              <div className="qty">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateItemQty(item.id, -1, inCartItem.note)
                                  }
                                  aria-label={`Remove one ${item.name}`}
                                >
                                  −
                                </button>
                                <span>{inCartItem.qty}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateItemQty(item.id, 1, inCartItem.note)
                                  }
                                  aria-label={`Add one ${item.name}`}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                className="add"
                                type="button"
                                onClick={() => addItemToCart(item, 1, "")}
                              >
                                Add +
                              </button>
                            )}
                          </div>
=======
        body: JSON.stringify({
          phone,
          items: cart.map((c) => ({
            id: c.item.id,
            name: c.item.name,
            price: c.item.price,
            quantity: c.quantity,
          })),
          totalAmount,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Order failed");
      }

      // -------------- SUCCESS SCREEN + FULL RESET -----------------
      clearCart();
      setPhone("");                // phone reset
      setSelectedCategory(null);   // category reset
      setSelectedCategoryName(""); // text reset

      setStep("SUCCESS");

      setTimeout(() => {
        setStep("PHONE"); // fresh start
      }, 2500);

    } catch (err) {
      console.error(err);
      alert("Something went wrong while placing the order.");
    }
  };

  // ---------- UI -----------------------------------------------------

  return (
    <div className="order-page-root">
      <div className="order-card">
        {/* HEADER */}
        <header className="order-card-header">
          <div>
            <h1 className="order-brand">Baker's cafe</h1>
            <p className="order-subtitle">Scan · Select · Enjoy</p>
          </div>

          {phone && (
            <div className="order-header-right">
              <span className="order-header-phone">
                Hi, {phone}
              </span>
              {cart.length > 0 && (
                <button
                  type="button"
                  className="order-link"
                  onClick={() => setStep("REVIEW")}
                >
                  View order ({cart.length})
                </button>
              )}
            </div>
          )}
        </header>

        {/* MAIN BODY */}
        <main className="order-card-body">

          {/* STEP 1 – PHONE */}
          {step === "PHONE" && (
            <section className="order-section fade-in">
              <h2 className="order-section-title">Enter your phone</h2>
              <p className="order-section-text">
                We'll send your order confirmation to this number.
              </p>

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 9XXXXXXXXX"
                className="order-input"
              />

              <button
                type="button"
                onClick={handlePhoneNext}
                className="order-primary-btn"
              >
                Continue
              </button>
            </section>
          )}

          {/* STEP 2 – CATEGORY */}
          {step === "CATEGORY" && (
            <section className="order-section fade-in">
              <div className="order-section-header">
                <h2 className="order-section-title">Choose a category</h2>

                <button
                  type="button"
                  className="order-link"
                  onClick={() => setStep("PHONE")}
                >
                  Change phone
                </button>
              </div>

              <div className="order-category-list">
                {(Object.keys(CATEGORY_LABELS) as CategoryId[]).map(
                  (catId) => {
                    const items = categoryItems(catId);
                    if (!items.length) return null;

                    return (
                      <button
                        key={catId}
                        type="button"
                        className="order-category-card"
                        onClick={() => {
                          setSelectedCategory(catId);
                          setSelectedCategoryName(CATEGORY_LABELS[catId]);
                          setStep("ITEMS");
                        }}
                      >
                        <div>
                          <h3 className="order-category-name">
                            {CATEGORY_LABELS[catId]}
                          </h3>
                          <p className="order-category-meta">
                            {items.length} dishes
                          </p>
                        </div>
                        <span className="order-category-cta">Select ›</span>
                      </button>
                    );
                  }
                )}
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  className="order-secondary-btn"
                  onClick={() => setStep("REVIEW")}
                >
                  View current order ({cart.length} · ₹{totalAmount})
                </button>
              )}
            </section>
          )}

          {/* STEP 3 – ITEMS */}
          {step === "ITEMS" && selectedCategory && (
            <section className="order-section fade-in">
              <div className="order-section-header">
                <button
                  type="button"
                  className="order-link"
                  onClick={() => setStep("CATEGORY")}
                >
                  ‹ Back to categories
                </button>

                {cart.length > 0 && (
                  <button
                    type="button"
                    className="order-link order-link-strong"
                    onClick={() => setStep("REVIEW")}
                  >
                    View order ({cart.length})
                  </button>
                )}
              </div>

              <h2 className="order-section-title">{selectedCategoryName}</h2>

              <div className="order-items-list">
                {categoryItems(selectedCategory).map((item) => {
                  const cartItem = cart.find(
                    (c) => c.item.id === item.id
                  );
                  const qty = cartItem?.quantity ?? 0;

                  return (
                    <article key={item.id} className="order-item-card">
                      <div className="order-item-image-wrap">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="order-item-image"
                        />
                      </div>

                      <div className="order-item-content">
                        <div className="order-item-main">
                          <h3 className="order-item-name">{item.name}</h3>
                          <p className="order-item-desc">{item.description}</p>
                        </div>

                        <div className="order-item-footer">
                          <span className="order-item-price">₹{item.price}</span>

                          {qty === 0 ? (
                            <button
                              type="button"
                              className="order-add-btn"
                              onClick={() => addItem(item)}
                            >
                              Add +
                            </button>
                          ) : (
                            <div className="order-qty-control">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.id, qty - 1)
                                }
                              >
                                –
                              </button>
                              <span>{qty}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.id, qty + 1)
                                }
                              >
                                +
                              </button>
                            </div>
                          )}
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

<<<<<<< HEAD
              {filteredItems.length === 0 && (
                <div id="menu-empty" className="text-center py-16">
                  <p className="text-[#73766c] text-sm sm:text-base">
                    No dishes match that search. Try another ingredient or category.
                  </p>
                </div>
              )}
            </div>

            {/* Desktop Sticky Cart Sidebar */}
            <aside className="desktop-cart" aria-label="Current order">
              <div className="review-card" id="desktop-cart-content">
                <h2 className="brand text-xl text-[#252720] font-semibold mb-3">
                  Your order
                </h2>
                {cart.length === 0 ? (
                  <div className="py-9 text-center">
                    <p className="text-[#73766c] text-sm">
                      Your order is waiting for something delicious.
                    </p>
                  </div>
                ) : (
                  <div>
                    {cart.map((x, index) => (
                      <div key={`${x.id}-${index}`} className="line-item">
                        <img src={x.img} alt={x.name} />
                        <div className="min-w-0 pr-1">
                          <p className="font-semibold text-sm text-[#252720] truncate">
                            {x.name}
                          </p>
                          {x.note && (
                            <p className="text-xs text-[#73766c] mt-0.5 truncate">
                              Note: {x.note}
                            </p>
                          )}
                          <p className="text-sm mt-1 text-[#252720] font-medium">
                            {formatMoney(x.price * x.qty)}
                          </p>
                        </div>
                        <div className="qty">
                          <button
                            type="button"
                            onClick={() => updateItemQty(x.id, -1, x.note)}
                            aria-label={`Reduce ${x.name}`}
                          >
                            −
                          </button>
                          <span>{x.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateItemQty(x.id, 1, x.note)}
                            aria-label={`Increase ${x.name}`}
=======
              {cart.length > 0 && (
                <button
                  type="button"
                  className="order-primary-btn"
                  onClick={() => setStep("REVIEW")}
                >
                  Go to order ({cart.length} · ₹{totalAmount})
                </button>
              )}
            </section>
          )}

          {/* STEP 4 – REVIEW */}
          {step === "REVIEW" && (
            <section className="order-section fade-in">
              <div className="order-section-header">
                <button
                  type="button"
                  className="order-link"
                  onClick={() => setStep("CATEGORY")}
                >
                  ‹ Back to menu
                </button>
              </div>

              <h2 className="order-section-title">Your order</h2>

              {cart.length === 0 ? (
                <p className="order-section-text">No items yet. Please add something.</p>
              ) : (
                <>
                  <div className="order-review-list">
                    {cart.map((c) => (
                      <div key={c.item.id} className="order-review-row">
                        <div>
                          <p className="order-review-name">{c.item.name}</p>
                          <p className="order-review-meta">
                            ₹{c.item.price} × {c.quantity}
                          </p>
                        </div>

                        <div className="order-review-controls">
                          <button
                            type="button"
                            onClick={() => updateQuantity(c.item.id, c.quantity - 1)}
                          >
                            –
                          </button>
                          <span>{c.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(c.item.id, c.quantity + 1)}
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
<<<<<<< HEAD

                    <div className="flex justify-between font-bold pt-5 text-base text-[#252720]">
                      <span>Subtotal</span>
                      <span>{formatMoney(cartSubtotal)}</span>
                    </div>
                    <p className="text-xs text-[#73766c] leading-relaxed mt-2.5">
                      Taxes and gratuity are handled directly at the restaurant.
                    </p>
                    <button
                      className="primary w-full mt-4"
                      type="button"
                      onClick={() => {
                        handleCloseAllSheets();
                        setScreen("review");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Review order
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* Mobile Bottom Floating Cart Bar */}
          {totalItemCount > 0 && (
            <button
              id="mobile-cart-bar"
              className="cart-bar"
              type="button"
              onClick={() => setIsCartSheetOpen(true)}
              aria-label="View your order summary"
            >
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalItemCount}
                </span>
                <span className="font-semibold text-sm">View order</span>
              </div>
              <strong className="text-base">{formatMoney(cartSubtotal)}</strong>
            </button>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* SCREEN 3: ORDER REVIEW (MOBILE-RESPONSIVE)                    */}
      {/* ============================================================== */}
      {screen === "review" && (
        <section id="review" className="screen active" aria-labelledby="review-title">
          <div className="shell max-w-2xl py-6 sm:py-8">
            <button
              id="review-back"
              className="secondary mb-5 sm:mb-6"
              type="button"
              onClick={() => {
                setScreen("menu");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              ← Back to menu
            </button>

            <p className="eyebrow">Almost there</p>
            <h1
              id="review-title"
              className="brand text-2xl sm:text-3xl mt-1.5 text-[#252720] font-semibold"
            >
              Review your order
            </h1>
            <p id="review-table" className="text-sm text-[#73766c] mt-1.5">
              Ordering for table <span className="font-semibold text-[#252720]">{tableNumber || 1}</span>
            </p>

            <div id="review-items" className="review-card mt-5">
              {cart.map((x, index) => (
                <div
                  key={`${x.id}-${index}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-3 border-b border-[#e6e1d6] last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-[#252720] block">
                      {x.qty} × {x.name}
                    </span>
                    {x.note && (
                      <small className="block text-xs text-[#73766c] mt-0.5">
                        “{x.note}”
                      </small>
                    )}
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto">
                    <div className="qty">
                      <button
                        type="button"
                        onClick={() => updateItemQty(x.id, -1, x.note)}
                        aria-label={`Reduce ${x.name}`}
                      >
                        −
                      </button>
                      <span>{x.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateItemQty(x.id, 1, x.note)}
                        aria-label={`Increase ${x.name}`}
                      >
                        +
                      </button>
                    </div>
                    <strong className="text-sm text-[#252720] min-w-[65px] text-right">
                      {formatMoney(x.qty * x.price)}
                    </strong>
                  </div>
                </div>
              ))}

              <div className="flex justify-between font-bold pt-4 mt-2 border-t border-[#e6e1d6] text-base text-[#252720]">
                <span>Subtotal</span>
                <span>{formatMoney(cartSubtotal)}</span>
              </div>
            </div>

            <label
              htmlFor="order-note"
              className="block font-semibold mt-5 sm:mt-6 mb-2 text-[#252720] text-sm sm:text-base"
            >
              A note for the kitchen
            </label>
            <textarea
              id="order-note"
              className="field min-h-24 resize-y text-sm"
              maxLength={220}
              placeholder="Optional notes for the whole order (e.g. please bring starters first, extra napkins)"
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
            />

            <p className="text-xs sm:text-sm text-[#73766c] mt-3">
              Please let your server know directly about any severe allergies or dietary
              requirements.
            </p>

            {submitError && (
              <p id="submit-error" className="error" aria-live="polite">
                {submitError}
              </p>
            )}

            <button
              id="submit-order"
              className="primary w-full mt-4"
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={handleSubmitOrder}
            >
              {isSubmitting ? "Sending to kitchen…" : "Send order to kitchen"}
            </button>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* SCREEN 4: CONFIRMATION (CLEAN & NO AI VOICE)                   */}
      {/* ============================================================== */}
      {screen === "confirmation" && latestOrder && (
        <section
          id="confirmation"
          className="screen active"
          aria-labelledby="confirmation-title"
        >
          <div className="shell max-w-2xl py-8 sm:py-12">
            <div className="success-mark">
              <svg
                className="w-7 h-7 text-[#59634a]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <p className="eyebrow mt-4 sm:mt-5">Order sent</p>
            <h1
              id="confirmation-title"
              className="brand text-2xl sm:text-3xl mt-1.5 text-[#252720] font-semibold"
            >
              The kitchen has your order.
            </h1>

            <p id="confirmation-reference" className="font-semibold text-sm sm:text-base mt-3 text-[#252720]">
              Order {latestOrder.order_reference} · Table {latestOrder.table_number}
            </p>

            <div className="status-card mt-5">
              <div className="kitchen">
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.93 4.93a10 10 0 0114.14 0m-11.31 2.83a6 6 0 018.48 0m-5.65 2.83a2 2 0 012.82 0M12 14v8"
                  />
                </svg>
                <span>Kitchen system connected</span>
              </div>
              <div className="flex gap-2 mt-3.5 flex-wrap">
                <span className="tag">Order received</span>
                <span className={`tag ${latestOrder.kitchenAcknowledged ? "" : "opacity-60"}`}>
                  {latestOrder.kitchenAcknowledged ? "Kitchen notified" : "Notifying kitchen…"}
                </span>
                {latestOrder.status === "PREPARING" && (
                  <span className="tag bg-[#f5ecda] text-[#7a5e20]">Preparing</span>
                )}
                {latestOrder.status === "READY" && (
                  <span className="tag bg-[#e2f0e5] text-[#256333]">Ready for table</span>
                )}
                {latestOrder.status === "SERVED" && (
                  <span className="tag bg-[#edf0e7] text-[#59634a]">Served</span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#73766c] leading-relaxed mt-3">
                Your dishes are queued in the kitchen. Our chefs are preparing your meal fresh to order.
              </p>
            </div>

            <div id="confirmation-summary" className="review-card mt-4">
              <p className="font-semibold text-[#252720] text-sm sm:text-base">Order summary</p>
              {latestOrder.items.map((x, i) => (
                <div
                  key={`${x.id}-${i}`}
                  className="flex justify-between text-xs sm:text-sm mt-2.5 text-[#252720]"
                >
                  <span className="pr-2">
                    {x.qty} × {x.name}
                    {x.note && (
                      <span className="text-[#73766c] block text-[11px]">
                        “{x.note}”
                      </span>
                    )}
                  </span>
                  <span className="font-medium whitespace-nowrap">
                    {formatMoney(x.price * x.qty)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-3.5 mt-3.5 border-t border-[#e6e1d6] text-sm sm:text-base text-[#252720]">
                <span>Subtotal</span>
                <span>{formatMoney(latestOrder.subtotal)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mt-5 sm:mt-6">
              <button
                id="order-more"
                className="secondary flex-1"
                type="button"
                onClick={() => {
                  setScreen("menu");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Order more dishes
              </button>
              <button
                id="view-order"
                className="primary flex-1"
                type="button"
                onClick={() => {
                  setScreen("status");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                View order progress
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* SCREEN 5: ORDER PROGRESS STATUS TRACKER                        */}
      {/* ============================================================== */}
      {screen === "status" && latestOrder && (
        <section id="status" className="screen active" aria-labelledby="status-title">
          <div className="shell max-w-2xl py-6 sm:py-8">
            <button
              id="status-back"
              className="secondary mb-5 sm:mb-6"
              type="button"
              onClick={() => {
                setScreen("menu");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              ← Back to menu
            </button>

            <p className="eyebrow">Kitchen progress</p>
            <h1
              id="status-title"
              className="brand text-2xl sm:text-3xl mt-1.5 text-[#252720] font-semibold"
            >
              Your order status
            </h1>

            <div id="status-details" className="status-card mt-5">
              <div className="kitchen">
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.93 4.93a10 10 0 0114.14 0m-11.31 2.83a6 6 0 018.48 0m-5.65 2.83a2 2 0 012.82 0M12 14v8"
                  />
                </svg>
                <span>Kitchen system connected</span>
              </div>
              <p className="font-semibold mt-4 text-[#252720] text-base sm:text-lg">
                {latestOrder.order_reference}
              </p>
              <p className="text-xs sm:text-sm text-[#73766c] mt-0.5">
                Table {latestOrder.table_number} · Received{" "}
                {new Date(latestOrder.created_at).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>

              {/* Dynamic Vertical Timeline with Connecting Lines */}
              {(() => {
                const currentStatus = latestOrder.status || "RECEIVED";
                const isKitchenNotified = !!latestOrder.kitchenAcknowledged;

                const isRecDone = true;
                const isNotifiedDone =
                  isKitchenNotified ||
                  currentStatus === "PREPARING" ||
                  currentStatus === "READY" ||
                  currentStatus === "SERVED";
                const isPrepDone =
                  currentStatus === "PREPARING" ||
                  currentStatus === "READY" ||
                  currentStatus === "SERVED";
                const isReadyDone =
                  currentStatus === "READY" || currentStatus === "SERVED";
                const isServedDone = currentStatus === "SERVED";

                let activeIndex = 0;
                if (isServedDone) activeIndex = 4;
                else if (isReadyDone) activeIndex = 3;
                else if (isPrepDone) activeIndex = 2;
                else if (isNotifiedDone) activeIndex = 1;
                else activeIndex = 0;

                const steps = [
                  { label: "Order received", done: isRecDone, active: activeIndex === 0 },
                  { label: "Kitchen notified", done: isNotifiedDone, active: activeIndex === 1 },
                  { label: "Preparing", done: isPrepDone, active: activeIndex === 2 },
                  { label: "Ready", done: isReadyDone, active: activeIndex === 3 },
                  ...(isServedDone ? [{ label: "Served", done: true, active: true }] : []),
                ];

                return (
                  <div className="mt-6 timeline-container">
                    {steps.map((step, i) => {
                      const isLast = i === steps.length - 1;
                      const isNextStepDone = !isLast && steps[i + 1].done;

                      return (
                        <div key={i} className="timeline-step">
                          <div className="timeline-marker">
                            <span
                              className={`status-dot ${
                                step.done ? "active" : ""
                              } ${step.active ? "current" : ""}`}
                            />
                            {!isLast && (
                              <div
                                className={`timeline-line ${
                                  isNextStepDone ? "filled" : ""
                                }`}
                              />
                            )}
                          </div>
                          <div className="pt-0 pb-3">
                            <span
                              className={`text-xs sm:text-sm transition-colors duration-300 ${
                                step.active
                                  ? "font-bold text-[#252720]"
                                  : step.done
                                  ? "font-semibold text-[#252720]"
                                  : "text-[#8a8d84]"
                              }`}
                            >
                              {step.label}
                            </span>
                            {step.active && (
                              <span className="block text-[11px] text-[#59634a] font-medium">
                                Current status
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}


              <div className="mt-6 pt-4 border-t border-[#e6e1d6]">
                <p className="font-semibold text-xs uppercase tracking-wider text-[#73766c] mb-2">
                  Items in preparation
                </p>
                {latestOrder.items.map((x, i) => (
                  <div key={i} className="text-xs sm:text-sm py-1 text-[#252720] flex justify-between">
                    <span>
                      {x.qty} × {x.name}
                    </span>
                    <span className="text-[#73766c]">
                      {formatMoney(x.price * x.qty)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* MODAL / SHEET BACKDROP                                         */}
      {/* ============================================================== */}
      <div
        id="sheet-backdrop"
        className={`sheet-backdrop ${
          isDetailOpen || isCartSheetOpen ? "open" : ""
        }`}
        onClick={handleCloseAllSheets}
      />

      {/* ============================================================== */}
      {/* MODAL / SHEET: ITEM DETAIL VIEW (SLIDE-UP / RIGHT)             */}
      {/* ============================================================== */}
      <section
        id="detail-sheet"
        className={`sheet detail ${isDetailOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
      >
        {detailItem && (
          <div className="sheet-content">
            <div className="handle" />
            <div className="flex justify-end">
              <button
                id="close-detail"
                className="secondary !p-2 min-w-[38px] min-h-[38px]"
                type="button"
                aria-label="Close item details"
                onClick={handleCloseDetail}
              >
                <svg
                  className="w-5 h-5 text-[#252720]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <img
              id="detail-image"
              className="modal-image mt-2"
              src={detailItem.img}
              alt={detailItem.name}
            />
            <h2 id="detail-title" className="brand text-2xl sm:text-3xl mt-4 font-semibold text-[#252720]">
              {detailItem.name}
            </h2>
            <p id="detail-description" className="text-[#73766c] leading-relaxed text-sm mt-1.5">
              {detailItem.desc}
            </p>

            {detailItem.tags.length > 0 && (
              <div id="detail-tags" className="flex gap-1.5 flex-wrap mt-3">
                {detailItem.tags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>
            )}

            <p id="detail-price" className="font-bold text-lg mt-3 text-[#252720]">
              {formatMoney(detailItem.price)}
            </p>

            <label
              htmlFor="item-instructions"
              className="block font-semibold mt-4 mb-1.5 text-[#252720] text-sm"
            >
              Special instructions
            </label>
            <textarea
              id="item-instructions"
              className="field min-h-20 text-sm"
              maxLength={160}
              placeholder="Optional kitchen request (e.g. sauce on the side, extra crispy)"
              value={detailNote}
              onChange={(e) => setDetailNote(e.target.value)}
            />

            <div className="flex items-center justify-between mt-4">
              <span className="font-semibold text-sm sm:text-base text-[#252720]">Quantity</span>
              <div className="qty">
                <button
                  id="detail-minus"
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span id="detail-qty">{detailQty}</span>
                <button
                  id="detail-plus"
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setDetailQty((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <button
              id="detail-add"
              className="primary w-full mt-5"
              type="button"
              onClick={() => {
                addItemToCart(detailItem, detailQty, detailNote.trim());
                handleCloseDetail();
              }}
            >
              Add to order · {formatMoney(detailItem.price * detailQty)}
            </button>
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* MODAL / SHEET: MOBILE CART DRAWER                              */}
      {/* ============================================================== */}
      <section
        id="cart-sheet"
        className={`sheet ${isCartSheetOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        <div className="sheet-content">
          <div className="handle" />
          <div className="flex items-center justify-between pb-3 border-b border-[#e6e1d6]">
            <div>
              <h2 id="cart-title" className="brand text-xl font-semibold text-[#252720]">
                Your order
              </h2>
              <span className="text-xs text-[#73766c]">Table {tableNumber || 1}</span>
            </div>
            <button
              id="close-cart"
              className="secondary !p-2 min-w-[38px] min-h-[38px]"
              type="button"
              aria-label="Close order"
              onClick={() => setIsCartSheetOpen(false)}
            >
              <svg
                className="w-5 h-5 text-[#252720]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div id="cart-sheet-content" className="mt-2">
            {cart.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[#73766c] text-sm">
                  Your order is waiting for something delicious.
                </p>
                <button
                  className="secondary mt-4 text-sm"
                  type="button"
                  onClick={() => setIsCartSheetOpen(false)}
                >
                  Return to menu
                </button>
              </div>
            ) : (
              <div>
                <div className="max-h-[50vh] overflow-y-auto pr-1">
                  {cart.map((x, index) => (
                    <div key={`${x.id}-${index}`} className="line-item">
                      <img src={x.img} alt={x.name} />
                      <div className="min-w-0 pr-1">
                        <p className="font-semibold text-xs sm:text-sm text-[#252720] truncate">
                          {x.name}
                        </p>
                        {x.note && (
                          <p className="text-[11px] text-[#73766c] mt-0.5 truncate">
                            Note: {x.note}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm mt-0.5 text-[#252720] font-medium">
                          {formatMoney(x.price * x.qty)}
                        </p>
                      </div>
                      <div className="qty">
                        <button
                          type="button"
                          onClick={() => updateItemQty(x.id, -1, x.note)}
                          aria-label={`Reduce ${x.name}`}
                        >
                          −
                        </button>
                        <span>{x.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQty(x.id, 1, x.note)}
                          aria-label={`Increase ${x.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between font-bold pt-4 text-base text-[#252720]">
                  <span>Subtotal</span>
                  <span>{formatMoney(cartSubtotal)}</span>
                </div>
                <p className="text-xs text-[#73766c] leading-relaxed mt-2">
                  Taxes and gratuity are handled directly with your server.
                </p>
                <button
                  id="review-order"
                  className="primary w-full mt-4"
                  type="button"
                  onClick={() => {
                    setIsCartSheetOpen(false);
                    setScreen("review");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Review order ({totalItemCount} items)
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
=======
                  </div>

                  <div className="order-summary">
                    <div className="order-summary-row">
                      <span>Total</span>
                      <strong>₹{totalAmount}</strong>
                    </div>

                    <button
                      type="button"
                      className="order-primary-btn"
                      onClick={handleConfirmOrder}
                    >
                      Confirm order
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {/* STEP 5 – SUCCESS SCREEN */}
          {step === "SUCCESS" && (
            <section
              className="order-section fade-in"
              style={{ textAlign: "center", padding: "40px 0" }}
            >
              <div
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  background: "#A7E5C1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <span style={{ fontSize: "50px", color: "white" }}>✔</span>
              </div>

              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  marginBottom: "6px",
                }}
              >
                  Your order is being prepared
              </h2>

              <p style={{ fontSize: "14px", color: "#6b7280" }}>
                Thank you for Choosing us.
              </p>
            </section>
          )}

        </main>
      </div>
    </div>
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5
  );
}
