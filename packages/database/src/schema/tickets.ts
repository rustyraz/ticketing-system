import { pgEnum, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { orderItems } from './orders';
import { eventSeats } from './event-seats';

export const ticketStatusEnum = pgEnum('ticket_status', ['valid', 'used', 'void']);

export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderItemId: uuid('order_item_id')
      .notNull()
      .references(() => orderItems.id, { onDelete: 'cascade' }),
    eventSeatId: uuid('event_seat_id')
      .notNull()
      .references(() => eventSeats.id, { onDelete: 'restrict' }),
    codeHash: varchar('code_hash', { length: 255 }).notNull(),
    status: ticketStatusEnum('status').default('valid').notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ticketsActiveEventSeatUniqueIdx: uniqueIndex('tickets_active_event_seat_unique_idx')
      .on(table.eventSeatId)
      .where(sql`${table.status} IN ('valid', 'used')`),
  }),
);

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
