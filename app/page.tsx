"use client";

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

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

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
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
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
  );
}
