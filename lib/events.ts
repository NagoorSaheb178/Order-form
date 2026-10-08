// lib/events.ts
import { EventEmitter } from "events";

export interface OrderStatusEvent {
  event: "ORDER_STATUS_UPDATED";
  orderId: string;
  restaurantId: string;
  status: "SUBMITTED" | "RECEIVED" | "PREPARING" | "READY" | "SERVED";
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
}

if (!global.__orderEventBus) {
  global.__orderEventBus = new EventEmitter();
  global.__orderEventBus.setMaxListeners(200);
}

export const orderEventBus: EventEmitter = global.__orderEventBus;
