// lib/events.ts
import { EventEmitter } from "events";

export interface OrderStatusEvent {
  event: "ORDER_STATUS_UPDATED" | "order.status_changed";
  orderId: string;
  restaurantId: string;
  status: "SUBMITTED" | "RECEIVED" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";
  kitchenAcknowledged: boolean;
  updatedAt: string;
}

export interface NewOrderEvent {
  event: "NEW_ORDER";
  order: any;
  restaurantId: string;
}

declare global {
  var __orderEventBus: EventEmitter | undefined;
  var __activeOrders: Map<string, any> | undefined;
}

if (!global.__orderEventBus) {
  global.__orderEventBus = new EventEmitter();
  global.__orderEventBus.setMaxListeners(200);
}

if (!global.__activeOrders) {
  global.__activeOrders = new Map<string, any>();
}

export const orderEventBus: EventEmitter = global.__orderEventBus;
export const activeOrders: Map<string, any> = global.__activeOrders;

const updateCachedStatus = (evt: OrderStatusEvent) => {
  const existing = activeOrders.get(evt.orderId);
  if (existing) {
    existing.status = evt.status;
    existing.kitchenAcknowledged = evt.kitchenAcknowledged;
    existing.updatedAt = evt.updatedAt;
  }
};

// Automatically keep in-memory cache synchronized with status updates
orderEventBus.on("status_updated", updateCachedStatus);
orderEventBus.on("order.status_changed", updateCachedStatus);
orderEventBus.on("order_status", updateCachedStatus);
