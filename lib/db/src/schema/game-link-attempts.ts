import { pgTable, integer, text, timestamp } from "drizzle-orm/pg-core";

export const gameLinkAttemptsTable = pgTable("game_link_attempts", {
  telegramUserId: text("telegram_user_id").primaryKey(),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
