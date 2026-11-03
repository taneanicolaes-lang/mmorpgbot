import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const gameGuildsTable = pgTable(
  "game_guilds",
  {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    nameKey: text("name_key").notNull().unique(),
    description: text("description").notNull().default(""),
    creatorPlayerId: text("creator_player_id").notNull(),
    rating: integer("rating").notNull().default(1000),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("game_guilds_rating_nonnegative", sql`${table.rating} >= 0`),
    uniqueIndex("game_guilds_name_key_idx").on(table.nameKey),
  ],
);

export const gameGuildMembersTable = pgTable(
  "game_guild_members",
  {
    playerId: text("player_id").primaryKey(),
    guildId: uuid("guild_id")
      .notNull()
      .references(() => gameGuildsTable.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "game_guild_members_role_check",
      sql`${table.role} in ('leader', 'officer', 'member')`,
    ),
    uniqueIndex("game_guild_members_one_leader_idx")
      .on(table.guildId)
      .where(sql`${table.role} = 'leader'`),
    uniqueIndex("game_guild_members_player_guild_idx").on(table.playerId, table.guildId),
  ],
);

export const gameGuildWarsTable = pgTable(
  "game_guild_wars",
  {
    id: uuid("id").primaryKey(),
    attackerGuildId: uuid("attacker_guild_id")
      .notNull()
      .references(() => gameGuildsTable.id, { onDelete: "cascade" }),
    defenderGuildId: uuid("defender_guild_id")
      .notNull()
      .references(() => gameGuildsTable.id, { onDelete: "cascade" }),
    attackerScore: integer("attacker_score").notNull().default(0),
    defenderScore: integer("defender_score").notNull().default(0),
    status: text("status").notNull().default("active"),
    winnerGuildId: uuid("winner_guild_id").references(() => gameGuildsTable.id, {
      onDelete: "set null",
    }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    check("game_guild_wars_distinct_guilds", sql`${table.attackerGuildId} <> ${table.defenderGuildId}`),
    check("game_guild_wars_status_check", sql`${table.status} in ('active', 'resolved')`),
    index("game_guild_wars_attacker_idx").on(table.attackerGuildId, table.status),
    index("game_guild_wars_defender_idx").on(table.defenderGuildId, table.status),
    index("game_guild_wars_expiry_idx").on(table.status, table.endsAt),
  ],
);

export const gameGuildWarActionsTable = pgTable(
  "game_guild_war_actions",
  {
    warId: uuid("war_id")
      .notNull()
      .references(() => gameGuildWarsTable.id, { onDelete: "cascade" }),
    playerId: text("player_id").notNull(),
    guildId: uuid("guild_id")
      .notNull()
      .references(() => gameGuildsTable.id, { onDelete: "cascade" }),
    contribution: integer("contribution").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("game_guild_war_actions_contribution_positive", sql`${table.contribution} > 0`),
    uniqueIndex("game_guild_war_actions_player_once_idx").on(table.warId, table.playerId),
  ],
);
