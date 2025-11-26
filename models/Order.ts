import mongoose, { Schema, models, model } from "mongoose";

const OrderItemSchema = new Schema(
  {
    id: String,
    name: String,
    price: Number,
    quantity: Number,
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    phone: { type: String, required: true },
    items: [OrderItemSchema],
    totalAmount: Number,
  },
  {
    timestamps: true,
  }
);

export const Order = models.Order || model("Order", OrderSchema);
