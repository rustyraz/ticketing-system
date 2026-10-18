import { index, integer, pgEnum, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { events, priceTiers } from './events';
import { venueSeats } from './venues';
import { holds } from './holds';

export const eventSeatStatusEnum = pgEnum('event_seat_status', ['available', 'held', 'sold']);

export const eventSeats = pgTable(
  'event_seats',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    venueSeatId: uuid('venue_seat_id')
      .notNull()
      .references(() => venueSeats.id, { onDelete: 'restrict' }),
    priceTierId: uuid('price_tier_id')
      .notNull()
      .references(() => priceTiers.id, { onDelete: 'restrict' }),
    status: eventSeatStatusEnum('status').default('available').notNull(),
    version: integer('version').default(0).notNull(),
    holdId: uuid('hold_id').references(() => holds.id, { onDelete: 'set null' }),
    holdExpiresAt: timestamp('hold_expires_at', { withTimezone: true }),
  },
  (table) => ({
    eventSeatsEventVenueSeatUniqueIdx: uniqueIndex(
      'event_seats_event_venue_seat_unique_idx',
    ).on(table.eventId, table.venueSeatId),
    eventSeatsEventStatusIdx: index('event_seats_event_status_idx').on(
      table.eventId,
      table.status,
    ),
  }),
);

export type EventSeat = typeof eventSeats.$inferSelect;
export type NewEventSeat = typeof eventSeats.$inferInsert;
