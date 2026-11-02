import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request } from "express";
import { eq } from "drizzle-orm";
import { db, gameProfilesTable } from "@workspace/db";
import {
  GetGameDashboardQueryParams,
  GetGameDashboardResponse,
  PerformGameActionBody,
  PerformGameActionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

type Dashboard = ReturnType<typeof GetGameDashboardResponse.parse>;
type ActionBody = ReturnType<typeof PerformGameActionBody.parse>;

const shop = [
  {
    id: "moon-blade",
    name: "Клинок лунного дозора",
    icon: "sword",
    description: "Лёгкое оружие с холодным сиянием.",
    price: 1_200,
    currency: "gold",
    rarity: "Редкий",
  },
  {
    id: "star-armor",
    name: "Доспех звёздного стража",
    icon: "shield",
    description: "Броня, пережившая тысячу ночей.",
    price: 1_800,
    currency: "gold",
    rarity: "Эпический",
  },
  {
    id: "crystal-phone",
    name: "Кристальный вестник",
    icon: "phone",
    description: "Магический телефон для связи между мирами.",
    price: 800,
    currency: "gold",
    rarity: "Необычный",
  },
  {
    id: "evolution-stone",
    name: "Камень эволюции",
    icon: "gem",
    description: "Помогает питомцу открыть новую форму.",
    price: 20,
    currency: "crystals",
    rarity: "Эпический",
  },
];

function makeActivity(message: string, category: string) {
  return {
    id: randomUUID(),
    message,
    category,
    createdAt: new Date(),
  };
}

function createDashboard(playerId = "demo", name = "Эллиан"): Dashboard {
  const now = Date.now();
  const demo = playerId === "demo";
  return GetGameDashboardResponse.parse({
    player: {
      id: playerId,
      name,
      heroClass: "Страж",
      level: demo ? 24 : 1,
      xp: demo ? 6_820 : 0,
      xpToNext: demo ? 8_000 : 500,
      gold: demo ? 42_850 : 1_000,
      crystals: demo ? 126 : 10,
      health: demo ? 86 : 100,
      maxHealth: 100,
      attack: demo ? 1_480 : 90,
      realm: "Европа · Элизиум",
      title: demo ? "Хранитель рассвета" : "Новичок",
      guildName: demo ? "Серебряный дозор" : null,
      spouseName: demo ? "Лунная ведьма" : null,
      vip: false,
    },
    inventory: demo ? [
      {
        id: "sun-sword",
        name: "Клинок первого света",
        icon: "sword",
        rarity: "Легендарный",
        category: "Оружие",
        equipped: true,
        attack: 76,
        defense: 0,
        price: 2_400,
        quantity: 1,
      },
      {
        id: "dusk-armor",
        name: "Панцирь сумерек",
        icon: "shield",
        rarity: "Эпический",
        category: "Броня",
        equipped: true,
        attack: 0,
        defense: 64,
        price: 1_800,
        quantity: 1,
      },
      {
        id: "silver-ring",
        name: "Кольцо серебряной клятвы",
        icon: "ring",
        rarity: "Редкий",
        category: "Бижутерия",
        equipped: false,
        attack: 12,
        defense: 10,
        price: 900,
        quantity: 1,
      },
      {
        id: "healing-potion",
        name: "Настойка живой воды",
        icon: "potion",
        rarity: "Обычный",
        category: "Алхимия",
        equipped: false,
        attack: 0,
        defense: 0,
        price: 120,
        quantity: 3,
      },
    ] : [
      {
        id: "starter-blade",
        name: "Меч странника",
        icon: "sword",
        rarity: "Обычный",
        category: "Оружие",
        equipped: true,
        attack: 8,
        defense: 0,
        price: 0,
        quantity: 1,
      },
      {
        id: "starter-potion",
        name: "Настойка живой воды",
        icon: "potion",
        rarity: "Обычный",
        category: "Алхимия",
        equipped: false,
        attack: 0,
        defense: 0,
        price: 120,
        quantity: 2,
      },
    ],
    pets: demo ? [
      {
        id: "fenya",
        name: "Феня",
        species: "Феня",
        level: 18,
        rarity: "Легендарный",
        attack: 310,
        health: 820,
        experience: 68,
        active: true,
        vip: false,
        evolution: "Пламенное крыло",
      },
      {
        id: "panda",
        name: "Панда",
        species: "Панда",
        level: 7,
        rarity: "Редкий",
        attack: 94,
        health: 420,
        experience: 35,
        active: false,
        vip: false,
        evolution: "Юный хранитель",
      },
      {
        id: "dragon",
        name: "Искра",
        species: "Дракон",
        level: 14,
        rarity: "Эпический",
        attack: 245,
        health: 680,
        experience: 72,
        active: false,
        vip: false,
        evolution: "Пепельное пламя",
      },
      {
        id: "pony",
        name: "Облачко",
        species: "Пони",
        level: 5,
        rarity: "Обычный",
        attack: 54,
        health: 260,
        experience: 20,
        active: false,
        vip: false,
        evolution: "Лунный скакун",
      },
      {
        id: "cat",
        name: "Уголёк",
        species: "Котик",
        level: 4,
        rarity: "Обычный",
        attack: 48,
        health: 225,
        experience: 14,
        active: false,
        vip: false,
        evolution: "Ночной охотник",
      },
      {
        id: "dog",
        name: "Гром",
        species: "Собачка",
        level: 6,
        rarity: "Обычный",
        attack: 63,
        health: 310,
        experience: 28,
        active: false,
        vip: false,
        evolution: "Верный страж",
      },
      {
        id: "fox",
        name: "Рыжик",
        species: "Лиса",
        level: 9,
        rarity: "Редкий",
        attack: 105,
        health: 395,
        experience: 46,
        active: false,
        vip: false,
        evolution: "Лисий дух",
      },
      {
        id: "wolf",
        name: "Север",
        species: "Волк",
        level: 11,
        rarity: "Эпический",
        attack: 170,
        health: 560,
        experience: 58,
        active: false,
        vip: false,
        evolution: "Вожак стаи",
      },
      {
        id: "unicorn",
        name: "Радуга",
        species: "Единорог",
        level: 16,
        rarity: "Легендарный",
        attack: 220,
        health: 720,
        experience: 81,
        active: false,
        vip: false,
        evolution: "Радужный страж",
      },
      {
        id: "owl",
        name: "Сова",
        species: "Сова",
        level: 8,
        rarity: "Редкий",
        attack: 99,
        health: 370,
        experience: 39,
        active: false,
        vip: false,
        evolution: "Провидица сумерек",
      },
      {
        id: "phoenix",
        name: "Феникс",
        species: "Феникс",
        level: 13,
        rarity: "Легендарный",
        attack: 230,
        health: 640,
        experience: 63,
        active: false,
        vip: false,
        evolution: "Солнечное возрождение",
      },
      {
        id: "golden-dragon",
        name: "Солар",
        species: "Золотой дракон",
        level: 12,
        rarity: "VIP",
        attack: 260,
        health: 690,
        experience: 52,
        active: false,
        vip: true,
        evolution: "Солнечный страж",
      },
      {
        id: "golden-unicorn",
        name: "Аурелия",
        species: "Золотой единорог",
        level: 20,
        rarity: "VIP",
        attack: 330,
        health: 980,
        experience: 87,
        active: false,
        vip: true,
        evolution: "Корона света",
      },
      {
        id: "fire-dragon",
        name: "Пирра",
        species: "Огненный дракон",
        level: 22,
        rarity: "VIP",
        attack: 390,
        health: 1_100,
        experience: 91,
        active: false,
        vip: true,
        evolution: "Владыка пламени",
      },
      {
        id: "shadow-owl",
        name: "Нокт",
        species: "Теневая сова",
        level: 19,
        rarity: "VIP",
        attack: 310,
        health: 900,
        experience: 78,
        active: false,
        vip: true,
        evolution: "Крыло бездны",
      },
    ] : [
      {
        id: "fenya",
        name: "Феня",
        species: "Феня",
        level: 1,
        rarity: "Обычный",
        attack: 12,
        health: 100,
        experience: 0,
        active: true,
        vip: false,
        evolution: "Юный спутник",
      },
    ],
    marriageHistory: demo ? [
      {
        id: "union-current",
        partnerName: "Лунная ведьма",
        marriedAt: new Date(now - 1000 * 60 * 60 * 24 * 184).toISOString(),
        divorcedAt: null,
        durationDays: 184,
      },
      {
        id: "union-archive",
        partnerName: "Арден из Севера",
        marriedAt: new Date(now - 1000 * 60 * 60 * 24 * 620).toISOString(),
        divorcedAt: new Date(now - 1000 * 60 * 60 * 24 * 510).toISOString(),
        durationDays: 110,
      },
    ] : [],
    activity: demo ? [
      makeActivity("Получена награда за участие в рейде «Пепельный король».", "raid"),
      makeActivity("Феня открыла навык «Пламенное крыло».", "pet"),
      makeActivity("В гильдии завершено еженедельное испытание.", "guild"),
      makeActivity("Найден редкий артефакт в руинах Элизиума.", "loot"),
    ] : [makeActivity("Вы прибыли в Элизиум и начали свой путь.", "world")],
    worldBoss: {
      name: "Астерион, Пожиратель звёзд",
      phase: 2,
      health: 3_420_000,
      maxHealth: 5_000_000,
      participants: 128,
    },
    leaderboard: [
      { rank: 1, name: "Лунная ведьма", heroClass: "Маг", level: 51, score: 18_420 },
      { rank: 2, name: "Эллиан", heroClass: "Страж", level: 24, score: 14_870 },
      { rank: 3, name: "Тихий Лис", heroClass: "Ассасин", level: 47, score: 13_940 },
    ],
    shop,
  });
}

async function readDashboard(playerId: string): Promise<Dashboard | null> {
  const [stored] = await db
    .select()
    .from(gameProfilesTable)
    .where(eq(gameProfilesTable.playerId, playerId))
    .limit(1);
  if (stored) {
    return GetGameDashboardResponse.parse(stored.dashboard);
  }
  if (playerId !== "demo") {
    return null;
  }
  const initial = createDashboard();
  await db
    .insert(gameProfilesTable)
    .values({ playerId, dashboard: initial })
    .onConflictDoNothing();
  const [created] = await db
    .select()
    .from(gameProfilesTable)
    .where(eq(gameProfilesTable.playerId, playerId))
    .limit(1);
  return GetGameDashboardResponse.parse(created?.dashboard ?? initial);
}

async function saveDashboard(
  playerId: string,
  dashboard: Dashboard,
  lastDailyAt?: Date | null,
): Promise<Dashboard> {
  const current = await db
    .select({ lastDailyAt: gameProfilesTable.lastDailyAt })
    .from(gameProfilesTable)
    .where(eq(gameProfilesTable.playerId, playerId))
    .limit(1);
  await db
    .insert(gameProfilesTable)
    .values({
      playerId,
      dashboard,
      lastDailyAt: lastDailyAt === undefined ? (current[0]?.lastDailyAt ?? null) : lastDailyAt,
    })
    .onConflictDoUpdate({
      target: gameProfilesTable.playerId,
      set: {
        dashboard,
        ...(lastDailyAt === undefined ? {} : { lastDailyAt }),
        updatedAt: new Date(),
      },
    });
  return GetGameDashboardResponse.parse(dashboard);
}

function addEvent(dashboard: Dashboard, message: string, category: string): void {
  dashboard.activity = [makeActivity(message, category), ...dashboard.activity].slice(0, 10);
}

function gainXp(dashboard: Dashboard, amount: number): number {
  const actual = dashboard.player.vip ? Math.round(amount * 1.2) : amount;
  dashboard.player.xp += actual;
  while (dashboard.player.xp >= dashboard.player.xpToNext) {
    dashboard.player.xp -= dashboard.player.xpToNext;
    dashboard.player.level += 1;
    dashboard.player.xpToNext = Math.round(dashboard.player.xpToNext * 1.22);
  }
  return actual;
}

function isBotRequest(req: Request): boolean {
  const expected = process.env.BOT_TOKEN;
  return Boolean(expected && req.get("x-bot-token") === expected);
}

function isBrowserPlayerId(playerId: string): boolean {
  return /^web:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    playerId,
  );
}

router.get("/game/dashboard", async (req, res): Promise<void> => {
  const params = GetGameDashboardQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const playerId = params.data.playerId ?? "demo";
  if (
    playerId !== "demo" &&
    !isBrowserPlayerId(playerId) &&
    !isBotRequest(req)
  ) {
    res.status(401).json({ error: "Для этого профиля требуется авторизация Telegram." });
    return;
  }
  const dashboard = await readDashboard(playerId);
  if (!dashboard) {
    res.status(404).json({ error: "Игрок не найден. Сначала отправьте /start боту." });
    return;
  }
  res.json(GetGameDashboardResponse.parse(dashboard));
});

router.post("/game/action", async (req, res): Promise<void> => {
  const parsed = PerformGameActionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const input: ActionBody = parsed.data;
  const playerId = input.playerId ?? "demo";
  const fromBot = isBotRequest(req);
  if (
    (playerId === "demo" && !fromBot) ||
    (playerId !== "demo" && !isBrowserPlayerId(playerId) && !fromBot)
  ) {
    res.status(401).json({ error: "Для этого профиля требуется авторизация Telegram." });
    return;
  }

  let dashboard = await readDashboard(playerId);
  if (!dashboard && input.action !== "register") {
    res.status(404).json({ error: "Игрок не найден. Сначала отправьте /start боту." });
    return;
  }
  if (!dashboard) {
    dashboard = createDashboard(
      playerId,
      input.playerName?.trim().slice(0, 40) || "Путник",
    );
    await saveDashboard(playerId, dashboard);
    res.json(
      PerformGameActionResponse.parse({
        message: "Добро пожаловать в Элизиум. Вы получили 1 000 монет и 10 кристаллов.",
        dashboard,
      }),
    );
    return;
  }

  dashboard = structuredClone(dashboard);
  let message = "Действие выполнено.";
  let lastDailyAt: Date | undefined;

  switch (input.action) {
    case "register":
      message = `Добро пожаловать, ${dashboard.player.name}! Ваш герой уже в мире.`;
      break;
    case "claim_daily": {
      const [stored] = await db
        .select({ lastDailyAt: gameProfilesTable.lastDailyAt })
        .from(gameProfilesTable)
        .where(eq(gameProfilesTable.playerId, playerId))
        .limit(1);
      const today = new Date().toISOString().slice(0, 10);
      if (stored?.lastDailyAt?.toISOString().slice(0, 10) === today) {
        message = "Награда на сегодня уже получена. Возвращайтесь завтра.";
        break;
      }
      dashboard.player.gold += 500;
      dashboard.player.crystals += 2;
      const xp = gainXp(dashboard, 250);
      message = `Ежедневная награда: 500 монет, 2 кристалла и ${xp} опыта.`;
      lastDailyAt = new Date();
      addEvent(dashboard, "Забрана ежедневная награда.", "reward");
      break;
    }
    case "battle": {
      const xp = gainXp(dashboard, 180);
      dashboard.player.gold += 240;
      dashboard.player.health = Math.max(1, dashboard.player.health - 8);
      message = `Победа в бою: +240 монет и ${xp} опыта.`;
      addEvent(dashboard, "Одержана победа на арене.", "battle");
      break;
    }
    case "equip_item": {
      const item = dashboard.inventory.find((entry) => entry.id === input.targetId);
      if (!item || !["Оружие", "Броня", "Бижутерия"].includes(item.category)) {
        message = "Этот предмет нельзя надеть.";
        break;
      }
      item.equipped = !item.equipped;
      message = item.equipped ? `Надет предмет «${item.name}».` : `Снят предмет «${item.name}».`;
      addEvent(dashboard, message, "equipment");
      break;
    }
    case "buy_item": {
      const product = dashboard.shop.find((entry) => entry.id === input.targetId);
      if (!product) {
        message = "Этот товар уже исчез из лавки.";
        break;
      }
      const balanceKey = product.currency === "crystals" ? "crystals" : "gold";
      if (dashboard.player[balanceKey] < product.price) {
        message = `Недостаточно ${product.currency === "crystals" ? "кристаллов" : "монет"}.`;
        break;
      }
      dashboard.player[balanceKey] -= product.price;
      const existing = dashboard.inventory.find((entry) => entry.id === product.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        dashboard.inventory.push({
          id: product.id,
          name: product.name,
          icon: product.icon,
          rarity: product.rarity,
          category: product.id.includes("armor") ? "Броня" : "Артефакт",
          equipped: false,
          attack: product.id.includes("blade") ? 35 : 0,
          defense: product.id.includes("armor") ? 28 : 0,
          price: product.price,
          quantity: 1,
        });
      }
      message = `Куплено: «${product.name}».`;
      addEvent(dashboard, message, "shop");
      break;
    }
    case "feed_pet": {
      const pet = dashboard.pets.find((entry) => entry.id === input.targetId) ??
        dashboard.pets.find((entry) => entry.active);
      if (!pet) {
        message = "У вас пока нет питомца.";
        break;
      }
      if (dashboard.player.gold < 100) {
        message = "Нужно 100 монет, чтобы купить лакомство.";
        break;
      }
      dashboard.player.gold -= 100;
      pet.experience += 25;
      if (pet.experience >= 100) {
        pet.experience -= 100;
        pet.level += 1;
        pet.attack += 12;
        pet.health += 30;
        message = `${pet.name} вырос до ${pet.level} уровня!`;
      } else {
        message = `${pet.name} с радостью съел лакомство. +25 опыта питомца.`;
      }
      addEvent(dashboard, message, "pet");
      break;
    }
    case "evolve_pet": {
      const pet = dashboard.pets.find((entry) => entry.id === input.targetId) ??
        dashboard.pets.find((entry) => entry.active);
      if (!pet || pet.level < 8 || dashboard.player.crystals < 20) {
        message = "Для эволюции нужны 20 кристаллов и питомец 8-го уровня.";
        break;
      }
      dashboard.player.crystals -= 20;
      pet.evolution = `Пробуждённая форма · ${pet.species}`;
      pet.attack += 45;
      pet.health += 120;
      message = `${pet.name} эволюционировал: ${pet.evolution}.`;
      addEvent(dashboard, message, "pet");
      break;
    }
    case "raid_attack": {
      const damage = Math.min(180_000, dashboard.player.attack * 85);
      dashboard.worldBoss.health = Math.max(0, dashboard.worldBoss.health - damage);
      dashboard.player.gold += 100;
      const xp = gainXp(dashboard, 90);
      if (dashboard.worldBoss.health === 0) {
        dashboard.worldBoss.phase += 1;
        dashboard.worldBoss.health = dashboard.worldBoss.maxHealth;
        message = `Босс повержен! Началась фаза ${dashboard.worldBoss.phase}. Награда: 100 монет и ${xp} опыта.`;
      } else {
        message = `Нанесено ${damage.toLocaleString("ru-RU")} урона. Награда за участие: 100 монет и ${xp} опыта.`;
      }
      addEvent(dashboard, `Рейд: ${message}`, "raid");
      break;
    }
    case "marriage_propose": {
      const name = input.targetName?.trim().slice(0, 40);
      if (!name) {
        message = "Укажите имя игрока, например: брак Лунная ведьма.";
        break;
      }
      if (dashboard.player.spouseName) {
        message = `Вы уже состоите в союзе с ${dashboard.player.spouseName}.`;
        break;
      }
      const marriedAt = new Date();
      dashboard.player.spouseName = name;
      dashboard.marriageHistory.unshift({
        id: randomUUID(),
        partnerName: name,
        marriedAt,
        divorcedAt: null,
        durationDays: 0,
      });
      message = `Союз с ${name} заключён. История сохранена в архиве союзов.`;
      addEvent(dashboard, message, "marriage");
      break;
    }
    case "marriage_divorce": {
      const current = dashboard.marriageHistory.find((record) => record.divorcedAt === null);
      if (!current) {
        message = "Сейчас вы не состоите в браке.";
        break;
      }
      const divorcedAt = new Date();
      const marriedAt = current.marriedAt;
      current.divorcedAt = divorcedAt;
      current.durationDays = Math.max(
        0,
        Math.floor((divorcedAt.getTime() - marriedAt.getTime()) / 86_400_000),
      );
      dashboard.player.spouseName = null;
      message = `Союз с ${current.partnerName} завершён. Стаж: ${current.durationDays} дн. Архив сохранён.`;
      addEvent(dashboard, message, "marriage");
      break;
    }
    case "join_guild":
      if (dashboard.player.guildName) {
        message = `Вы уже состоите в гильдии «${dashboard.player.guildName}».`;
      } else {
        const guildName =
          input.targetName?.trim().slice(0, 40) || "Серебряный дозор";
        dashboard.player.guildName = guildName;
        message = `Вы вступили в гильдию «${guildName}».`;
        addEvent(dashboard, message, "guild");
      }
      break;
  }

  const saved = await saveDashboard(playerId, dashboard, lastDailyAt);
  res.json(
    PerformGameActionResponse.parse({
      message,
      dashboard: saved,
    }),
  );
});

export default router;
