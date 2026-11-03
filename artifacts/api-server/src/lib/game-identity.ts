import type { Request } from "express";
import { eq } from "drizzle-orm";
import { db, gameAccountLinksTable } from "@workspace/db";

export function isBotRequest(req: Request): boolean {
  const expected = process.env.BOT_TOKEN;
  return Boolean(expected && req.get("x-bot-token") === expected);
}

export function isBrowserPlayerId(playerId: string): boolean {
  return /^web:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    playerId,
  );
}

export async function resolvePlayerId(
  requestedId: string,
  fromBot: boolean,
): Promise<{ playerId: string; telegramLinked: boolean }> {
  if (isBrowserPlayerId(requestedId)) {
    const [link] = await db
      .select({ playerId: gameAccountLinksTable.playerId })
      .from(gameAccountLinksTable)
      .where(eq(gameAccountLinksTable.webPlayerId, requestedId))
      .limit(1);
    return { playerId: link?.playerId ?? requestedId, telegramLinked: Boolean(link) };
  }
  if (fromBot && /^[0-9]{5,20}$/.test(requestedId)) {
    const [link] = await db
      .select({ playerId: gameAccountLinksTable.playerId })
      .from(gameAccountLinksTable)
      .where(eq(gameAccountLinksTable.telegramUserId, requestedId))
      .limit(1);
    return { playerId: link?.playerId ?? requestedId, telegramLinked: Boolean(link) };
  }
  return { playerId: requestedId, telegramLinked: false };
}

export async function getAuthorizedPlayerId(
  req: Request,
  requestedId: string,
): Promise<string | null> {
  const fromBot = isBotRequest(req);
  if (!isBrowserPlayerId(requestedId) && !(fromBot && /^[0-9]{5,20}$/.test(requestedId))) {
    return null;
  }
  return (await resolvePlayerId(requestedId, fromBot)).playerId;
}
