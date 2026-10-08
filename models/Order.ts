import mongoose, { Schema, models, model } from "mongoose";

export type OrderStatus =
  | "SUBMITTED"
  | "RECEIVED"
  | "PREPARING"
  | "READY"
  | "SERVED";

const OrderItemSchema = new Schema(
  {
    id: String,
    name: String,
    price: Number,
    quantity: Number,
    note: { type: String, default: "" },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderId: { type: String, required: true, index: true },
    restaurantId: { type: String, required: true, default: "REST-001", index: true },
    tableNo: { type: Number, required: true },
    status: {
      type: String,
      enum: ["SUBMITTED", "RECEIVED", "PREPARING", "READY", "SERVED"],
      default: "RECEIVED",
    },
    kitchenAcknowledged: { type: Boolean, default: false },

    // Backwards-compatible aliases
    orderReference: { type: String },
    tableNumber: { type: Number },
    phone: { type: String, default: "" },

    items: [OrderItemSchema],
    totalAmount: { type: Number, default: 0 },
    orderNote: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// Middleware to keep aliases synchronized
OrderSchema.pre("save", function (next) {
  if (this.orderId && !this.orderReference) {
    this.orderReference = this.orderId;
  } else if (this.orderReference && !this.orderId) {
    this.orderId = this.orderReference;
  }

  if (this.tableNo != null && this.tableNumber == null) {
    this.tableNumber = this.tableNo;
  } else if (this.tableNumber != null && this.tableNo == null) {
    this.tableNo = this.tableNumber;
  }

  next();
});

export const Order = models.Order || model("Order", OrderSchema);
