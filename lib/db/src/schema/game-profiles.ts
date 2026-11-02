import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const gameProfilesTable = pgTable("game_profiles", {
  playerId: text("player_id").primaryKey(),
  dashboard: jsonb("dashboard")
    .$type<Record<string, unknown>>()
    .notNull(),
  lastDailyAt: timestamp("last_daily_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
