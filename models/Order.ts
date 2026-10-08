import mongoose, { Schema, models, model } from "mongoose";

<<<<<<< HEAD
export type OrderStatus =
  | "SUBMITTED"
  | "RECEIVED"
  | "PREPARING"
  | "READY"
  | "SERVED";

=======
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5
const OrderItemSchema = new Schema(
  {
    id: String,
    name: String,
    price: Number,
    quantity: Number,
<<<<<<< HEAD
    note: { type: String, default: "" },
=======
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
<<<<<<< HEAD
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
=======
    phone: { type: String, required: true },
    items: [OrderItemSchema],
    totalAmount: Number,
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5
  },
  {
    timestamps: true,
  }
);

<<<<<<< HEAD
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

=======
>>>>>>> 077dc146ac0dbb535218dd1a2cad3690b33bebd5
export const Order = models.Order || model("Order", OrderSchema);
