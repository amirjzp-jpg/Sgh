export const CATEGORIES = [
  "Furniture",
  "Electronics",
  "Clothing",
  "Books & Media",
  "Sports & Outdoors",
  "Home & Kitchen",
  "Kids & Baby",
  "Other",
] as const;

export const CONDITIONS = ["New", "Like new", "Good", "Fair", "Well loved"] as const;

export const ORDER_STATUSES = [
  "paid_escrow",
  "courier_assigned",
  "picked_up",
  "in_transit",
  "delivered",
  "confirmed",
  "refunded",
  "disputed",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  paid_escrow: "Paid — held in escrow",
  courier_assigned: "Courier assigned",
  picked_up: "Picked up",
  in_transit: "In transit",
  delivered: "Delivered",
  confirmed: "Confirmed by buyer",
  refunded: "Refunded",
  disputed: "Disputed",
};

// The happy-path timeline shown on the order tracking screen.
export const ORDER_TIMELINE: OrderStatus[] = [
  "paid_escrow",
  "courier_assigned",
  "picked_up",
  "in_transit",
  "delivered",
  "confirmed",
];

// Legal next step a courier can move an order to.
export const COURIER_TRANSITIONS: Record<string, string> = {
  courier_assigned: "picked_up",
  picked_up: "in_transit",
  in_transit: "delivered",
};
