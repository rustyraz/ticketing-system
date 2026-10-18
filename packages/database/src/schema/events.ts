import { integer, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { venues } from './venues';
import { users } from './users';

export const seatingModeEnum = pgEnum('seating_mode', ['reserved', 'general_admission']);
export const eventStatusEnum = pgEnum('event_status', ['draft', 'on_sale', 'sold_out', 'cancelled']);

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  venueId: uuid('venue_id')
    .notNull()
    .references(() => venues.id, { onDelete: 'restrict' }),
  organizerId: uuid('organizer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 255 }).notNull(),
  genre: varchar('genre', { length: 100 }).notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  saleStartsAt: timestamp('sale_starts_at', { withTimezone: true }).notNull(),
  seatingMode: seatingModeEnum('seating_mode').default('reserved').notNull(),
  status: eventStatusEnum('status').default('draft').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const priceTiers = pgTable('price_tiers', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  priceCents: integer('price_cents').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  remaining: integer('remaining'), // used only for GA mode
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type PriceTier = typeof priceTiers.$inferSelect;
export type NewPriceTier = typeof priceTiers.$inferInsert;

