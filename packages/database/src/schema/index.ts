import { relations } from 'drizzle-orm';
import { users } from './users';
import { cities } from './cities';
import { venues, venueSeats } from './venues';
import { events, priceTiers } from './events';
import { holds } from './holds';
import { eventSeats } from './event-seats';
import { orders, orderItems, payments } from './orders';
import { tickets } from './tickets';
import { outbox } from './outbox';

export * from './users';
export * from './cities';
export * from './venues';
export * from './events';
export * from './holds';
export * from './event-seats';
export * from './orders';
export * from './tickets';
export * from './outbox';

export const citiesRelations = relations(cities, ({ many }) => ({
  venues: many(venues),
}));

export const venuesRelations = relations(venues, ({ one, many }) => ({
  city: one(cities, {
    fields: [venues.cityId],
    references: [cities.id],
  }),
  seats: many(venueSeats),
  events: many(events),
}));

export const venueSeatsRelations = relations(venueSeats, ({ one, many }) => ({
  venue: one(venues, {
    fields: [venueSeats.venueId],
    references: [venues.id],
  }),
  eventSeats: many(eventSeats),
}));

export const usersRelations = relations(users, ({ many }) => ({
  organizedEvents: many(events),
  holds: many(holds),
  orders: many(orders),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  venue: one(venues, {
    fields: [events.venueId],
    references: [venues.id],
  }),
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  priceTiers: many(priceTiers),
  seats: many(eventSeats),
  holds: many(holds),
  orders: many(orders),
}));

export const priceTiersRelations = relations(priceTiers, ({ one, many }) => ({
  event: one(events, {
    fields: [priceTiers.eventId],
    references: [events.id],
  }),
  seats: many(eventSeats),
}));

export const eventSeatsRelations = relations(eventSeats, ({ one, many }) => ({
  event: one(events, {
    fields: [eventSeats.eventId],
    references: [events.id],
  }),
  venueSeat: one(venueSeats, {
    fields: [eventSeats.venueSeatId],
    references: [venueSeats.id],
  }),
  priceTier: one(priceTiers, {
    fields: [eventSeats.priceTierId],
    references: [priceTiers.id],
  }),
  hold: one(holds, {
    fields: [eventSeats.holdId],
    references: [holds.id],
  }),
  orderItems: many(orderItems),
  tickets: many(tickets),
}));

export const holdsRelations = relations(holds, ({ one, many }) => ({
  user: one(users, {
    fields: [holds.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [holds.eventId],
    references: [events.id],
  }),
  seats: many(eventSeats),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [orders.eventId],
    references: [events.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  eventSeat: one(eventSeats, {
    fields: [orderItems.eventSeatId],
    references: [eventSeats.id],
  }),
  ticket: one(tickets, {
    fields: [orderItems.id],
    references: [tickets.orderItemId],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [tickets.orderItemId],
    references: [orderItems.id],
  }),
  eventSeat: one(eventSeats, {
    fields: [tickets.eventSeatId],
    references: [eventSeats.id],
  }),
}));

