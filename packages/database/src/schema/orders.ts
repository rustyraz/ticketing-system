import { integer, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';
import { events } from './events';
import { eventSeats } from './event-seats';

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'paid',
  'failed',
  'cancelled',
  'refunded',
]);

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'restrict' }),
  status: orderStatusEnum('status').default('pending').notNull(),
  totalCents: integer('total_cents').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  eventSeatId: uuid('event_seat_id')
    .notNull()
    .references(() => eventSeats.id, { onDelete: 'restrict' }),
  priceCents: integer('price_cents').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(),
  providerRef: varchar('provider_ref', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 50 }).notNull(),
  amountCents: integer('amount_cents').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

