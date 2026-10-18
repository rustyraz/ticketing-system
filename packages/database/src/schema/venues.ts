import { integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { cities } from './cities';

export const venues = pgTable('venues', {
  id: uuid('id').defaultRandom().primaryKey(),
  cityId: uuid('city_id')
    .notNull()
    .references(() => cities.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address').notNull(),
  capacity: integer('capacity').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const venueSeats = pgTable(
  'venue_seats',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    venueId: uuid('venue_id')
      .notNull()
      .references(() => venues.id, { onDelete: 'cascade' }),
    section: varchar('section', { length: 50 }).notNull(),
    rowLabel: varchar('row_label', { length: 50 }).notNull(),
    seatNumber: integer('seat_number').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    venueSeatsUniqueIdx: uniqueIndex('venue_seats_unique_idx').on(
      table.venueId,
      table.section,
      table.rowLabel,
      table.seatNumber,
    ),
  }),
);

export type Venue = typeof venues.$inferSelect;
export type NewVenue = typeof venues.$inferInsert;
export type VenueSeat = typeof venueSeats.$inferSelect;
export type NewVenueSeat = typeof venueSeats.$inferInsert;
