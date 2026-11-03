import { createInsertSchema } from "drizzle-zod";
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const gameLinkChallengesTable = pgTable(
  "game_link_challenges",
  {
    codeHash: text("code_hash").primaryKey(),
    playerId: text("player_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    failedAttempts: integer("failed_attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("game_link_challenges_player_expiry_idx").on(table.playerId, table.expiresAt),
  ],
);

export const insertGameLinkChallengeSchema = createInsertSchema(gameLinkChallengesTable).omit({
  consumedAt: true,
  failedAttempts: true,
  createdAt: true,
});
export type InsertGameLinkChallenge = z.infer<typeof insertGameLinkChallengeSchema>;
export type GameLinkChallenge = typeof gameLinkChallengesTable.$inferSelect;
