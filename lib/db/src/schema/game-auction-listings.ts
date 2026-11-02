import { createInsertSchema } from "drizzle-zod";
import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const gameAuctionListingsTable = pgTable(
  "game_auction_listings",
  {
    id: text("id").primaryKey(),
    sellerPlayerId: text("seller_player_id").notNull(),
    sellerName: text("seller_name").notNull(),
    item: jsonb("item").$type<Record<string, unknown>>().notNull(),
    quantity: integer("quantity").notNull(),
    price: integer("price").notNull(),
    currency: text("currency").notNull(),
    status: text("status").notNull().default("active"),
    buyerPlayerId: text("buyer_player_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    soldAt: timestamp("sold_at", { withTimezone: true }),
  },
  (table) => [
    index("game_auction_status_expiry_idx").on(table.status, table.expiresAt),
    index("game_auction_seller_idx").on(table.sellerPlayerId, table.status),
  ],
);

export const insertGameAuctionListingSchema = createInsertSchema(gameAuctionListingsTable).omit({
  createdAt: true,
  soldAt: true,
});
export type InsertGameAuctionListing = z.infer<typeof insertGameAuctionListingSchema>;
export type GameAuctionListing = typeof gameAuctionListingsTable.$inferSelect;
