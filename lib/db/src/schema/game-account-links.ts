import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const gameAccountLinksTable = pgTable("game_account_links", {
  telegramUserId: text("telegram_user_id").primaryKey(),
  playerId: text("player_id").notNull().unique(),
  webPlayerId: text("web_player_id").unique(),
  linkedAt: timestamp("linked_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGameAccountLinkSchema = createInsertSchema(gameAccountLinksTable).omit({
  linkedAt: true,
});
export type InsertGameAccountLink = z.infer<typeof insertGameAccountLinkSchema>;
export type GameAccountLink = typeof gameAccountLinksTable.$inferSelect;
