"use client";

import { useState } from "react";
import { useOrder } from "@/components/OrderContext";
import { CATEGORY_LABELS } from "@/lib/categories";
import { MENU_ITEMS, type MenuItem } from "@/lib/menu";


type Step = "PHONE" | "CATEGORY" | "ITEMS" | "REVIEW";

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
    useState<keyof typeof CATEGORY_LABELS | null>(null);

  const [selectedItemsCategoryName, setSelectedItemsCategoryName] =
    useState("");

  const handlePhoneNext = () => {
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      alert("Please enter a valid phone number");
      return;
    }
    setStep("CATEGORY");
  };

  const categoryItems = (catId: keyof typeof CATEGORY_LABELS): MenuItem[] =>
    MENU_ITEMS.filter((i) => i.categoryId === catId);

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

      clearCart();
      setStep("CATEGORY");
      alert("Your order is confirmed! You will receive an SMS shortly.");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while placing the order.");
    }
  };

  return (
    <div className="space-y-4">

      {/* =======================
          HEADER
      ======================= */}
      <header className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/40">
        <div className="text-left">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Fish & Feast
          </h1>
          <p className="text-xs text-slate-400">Scan · Select · Enjoy</p>
        </div>

        {phone && (
          <div className="text-right text-xs text-slate-300">
            <p className="font-medium">Hi, {phone}</p>
            <button
              onClick={() => setStep("REVIEW")}
              className="underline underline-offset-2 hover:text-emerald-400 transition"
            >
              View Order ({cart.length})
            </button>
          </div>
        )}
      </header>

      {/* =======================
          STEP: PHONE
      ======================= */}
      {step === "PHONE" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Enter your phone</h2>
          <p className="text-xs text-slate-400">
            We&apos;ll send your order confirmation to this number.
          </p>

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 9XXXXXXXXX"
            className="w-full rounded-xl bg-slate-900/40 backdrop-blur-md border border-slate-700/40 px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/70 outline-none transition"
          />

          <button
            onClick={handlePhoneNext}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-sm font-semibold shadow-md hover:opacity-90 transition"
          >
            Continue
          </button>
        </div>
      )}

      {/* =======================
          STEP: CATEGORY
      ======================= */}
      {step === "CATEGORY" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-lg font-semibold text-white">
              Choose a category
            </h2>

            <button
              className="text-xs text-slate-400 underline hover:text-emerald-400 transition"
              onClick={() => setStep("PHONE")}
            >
              Change phone
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {(Object.keys(
              CATEGORY_LABELS
            ) as (keyof typeof CATEGORY_LABELS)[]).map((catId) => (
              <button
                key={catId}
                onClick={() => {
                  setSelectedCategory(catId);
                  setSelectedItemsCategoryName(CATEGORY_LABELS[catId]);
                  setStep("ITEMS");
                }}
                className="flex items-center justify-between rounded-xl bg-slate-800/40 backdrop-blur-md border border-slate-700/40 px-4 py-3 shadow-[0_4px_18px_-4px_rgba(0,0,0,0.4)] hover:border-emerald-400/70 hover:bg-slate-800/60 transition duration-200"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-white">
                    {CATEGORY_LABELS[catId]}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {categoryItems(catId).length} items
                  </p>
                </div>

                <span className="text-xs text-emerald-400 font-medium">
                  Select ›
                </span>
              </button>
            ))}
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => setStep("REVIEW")}
              className="w-full rounded-xl border border-emerald-500/70 py-2 text-sm font-medium hover:bg-emerald-500/10 transition"
            >
              View current order ({cart.length} · ₹{totalAmount})
            </button>
          )}
        </div>
      )}

      {/* =======================
          STEP: ITEMS
      ======================= */}
      {step === "ITEMS" && selectedCategory && (
        <div className="space-y-4">

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep("CATEGORY")}
              className="text-xs text-slate-400 underline hover:text-emerald-400 transition"
            >
              ‹ Back to categories
            </button>

            <button
              onClick={() => setStep("REVIEW")}
              className="text-xs text-emerald-400 underline hover:text-emerald-300 transition"
            >
              View order ({cart.length})
            </button>
          </div>

          <h2 className="text-lg font-semibold text-white">
            {selectedItemsCategoryName}
          </h2>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {categoryItems(selectedCategory).map((item) => {
              const cartItem = cart.find((c) => c.item.id === item.id);
              const qty = cartItem?.quantity ?? 0;

              return (
                <div
                  key={item.id}
                  className="rounded-xl bg-slate-800/40 backdrop-blur-md border border-slate-700/40 p-3 flex justify-between items-center shadow-[0_4px_18px_-4px_rgba(0,0,0,0.4)]"
                >
                  <div className="pr-2">
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {item.description}
                    </p>
                    <p className="text-sm mt-1 font-semibold text-emerald-400">
                      ₹{item.price}
                    </p>
                  </div>

                  <div className="flex flex-col items-center">
                    {qty === 0 ? (
                      <button
                        onClick={() => addItem(item)}
                        className="text-xs px-3 py-1 rounded-full bg-emerald-500 font-medium text-black hover:bg-emerald-400 transition"
                      >
                        Add +
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, qty - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-600 bg-slate-800/40 hover:border-emerald-400 hover:text-emerald-400 transition"
                        >
                          –
                        </button>

                        <span className="text-sm font-medium w-4 text-center text-white">
                          {qty}
                        </span>

                        <button
                          onClick={() => updateQuantity(item.id, qty + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-emerald-500 bg-slate-800/40 hover:border-emerald-400 hover:text-emerald-400 transition"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setStep("REVIEW")}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-sm font-semibold shadow-md hover:opacity-90 transition"
          >
            Go to Order ({cart.length} · ₹{totalAmount})
          </button>
        </div>
      )}

      {/* =======================
          STEP: REVIEW
      ======================= */}
      {step === "REVIEW" && (
        <div className="space-y-4">

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep("CATEGORY")}
              className="text-xs text-slate-400 underline hover:text-emerald-400 transition"
            >
              ‹ Back to menu
            </button>

            <p className="text-xs text-slate-400">Edit items &amp; confirm</p>
          </div>

          <h2 className="text-lg font-semibold text-white">Your Order</h2>

          {cart.length === 0 ? (
            <p className="text-sm text-slate-400">No items added yet.</p>
          ) : (
            <>
              <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                {cart.map((c) => (
                  <div
                    key={c.item.id}
                    className="flex items-center justify-between rounded-xl bg-slate-800/40 backdrop-blur-md border border-slate-700/40 p-3 shadow-[0_4px_18px_-4px_rgba(0,0,0,0.4)]"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{c.item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        ₹{c.item.price} × {c.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(c.item.id, c.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-600 bg-slate-800/40 hover:border-emerald-400 hover:text-emerald-400 transition"
                      >
                        –
                      </button>

                      <span className="text-sm font-medium w-4 text-center text-white">
                        {c.quantity}
                      </span>

                      <button
                        onClick={() => updateQuantity(c.item.id, c.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-emerald-500 bg-slate-800/40 hover:border-emerald-400 hover:text-emerald-400 transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-700/40 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Total</span>
                  <span className="font-semibold text-emerald-400">
                    ₹{totalAmount}
                  </span>
                </div>

                <button
                  onClick={handleConfirmOrder}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-sm font-semibold shadow-md hover:opacity-90 transition"
                >
                  Confirm Order
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
