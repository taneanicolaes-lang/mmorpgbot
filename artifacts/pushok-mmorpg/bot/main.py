from __future__ import annotations

import asyncio
import html
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any

import aiohttp
from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
)

BOT_TOKEN = os.getenv("BOT_TOKEN")
API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:80/api").rstrip("/")
REQUEST_TIMEOUT = aiohttp.ClientTimeout(total=15)

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("pushok-bot")

dp = Dispatcher()


def player_id(message: Message | CallbackQuery) -> str:
    user = message.from_user
    if user is None:
        raise ValueError("В сообщении Telegram не найден игрок.")
    return str(user.id)


async def api_request(
    method: str,
    path: str,
    *,
    data: dict[str, Any] | None = None,
    params: dict[str, str] | None = None,
) -> dict[str, Any]:
    if not BOT_TOKEN:
        raise RuntimeError("Добавьте BOT_TOKEN в переменные окружения.")
    url = f"{API_BASE_URL}{path}"
    headers = {"X-Bot-Token": BOT_TOKEN}
    async with aiohttp.ClientSession(timeout=REQUEST_TIMEOUT) as session:
        async with session.request(
            method,
            url,
            json=data,
            params=params,
            headers=headers,
        ) as response:
            try:
                result = await response.json()
            except aiohttp.ContentTypeError as exc:
                raise RuntimeError("Игровой сервер вернул неверный ответ.") from exc
            if response.status >= 400:
                raise RuntimeError(result.get("error", "Не удалось выполнить действие."))
            return result


async def dashboard_for(user_id: str) -> dict[str, Any]:
    result = await api_request(
        "GET",
        "/game/dashboard",
        params={"playerId": user_id},
    )
    return result


async def act(
    user_id: str,
    action: str,
    *,
    player_name: str | None = None,
    target_id: str | None = None,
    target_name: str | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {"playerId": user_id, "action": action}
    if player_name:
        payload["playerName"] = player_name
    if target_id:
        payload["targetId"] = target_id
    if target_name:
        payload["targetName"] = target_name
    return await api_request("POST", "/game/action", data=payload)


def main_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="👤 Профиль", callback_data="profile"),
                InlineKeyboardButton(text="🎒 Инвентарь", callback_data="inventory"),
            ],
            [
                InlineKeyboardButton(text="🐾 Питомцы", callback_data="pets"),
                InlineKeyboardButton(text="⚔️ Дуэль", callback_data="battle"),
            ],
            [
                InlineKeyboardButton(text="🏛 Гильдия", callback_data="guild"),
                InlineKeyboardButton(text="🛒 Магазин", callback_data="shop"),
            ],
            [
                InlineKeyboardButton(text="🐉 Рейд", callback_data="raid"),
                InlineKeyboardButton(text="💍 Союзы", callback_data="marriage"),
            ],
            [InlineKeyboardButton(text="✨ Ежедневная награда", callback_data="daily")],
        ]
    )


def quick_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="🏠 Главное меню"),
                KeyboardButton(text="👤 Профиль"),
            ],
            [
                KeyboardButton(text="🎒 Инвентарь"),
                KeyboardButton(text="🐾 Питомцы"),
            ],
        ],
        resize_keyboard=True,
        is_persistent=True,
        input_field_placeholder="Выберите действие",
    )


def safe(value: Any) -> str:
    return html.escape(str(value))


def profile_text(data: dict[str, Any]) -> str:
    player = data["player"]
    xp_percent = round(player["xp"] * 100 / max(1, player["xpToNext"]))
    hp_percent = round(player["health"] * 100 / max(1, player["maxHealth"]))
    spouse = safe(player.get("spouseName") or "нет")
    guild = safe(player.get("guildName") or "без гильдии")
    premium = " · VIP" if player.get("vip") else ""
    return (
        f"<b>{safe(player['name'])}</b> · {safe(player['title'])}{premium}\n"
        f"Уровень {player['level']} · {safe(player['heroClass'])} · {safe(player['realm'])}\n"
        f"✨ Опыт: {player['xp']}/{player['xpToNext']} ({xp_percent}%)\n"
        f"❤️ Здоровье: {player['health']}/{player['maxHealth']} ({hp_percent}%)\n"
        f"⚔️ Сила: {player['attack']}\n"
        f"🪙 Монеты: {player['gold']:,} · 💎 Кристаллы: {player['crystals']}\n"
        f"🏛 {guild} · 💍 Союз: {spouse}"
    )


def inventory_text(data: dict[str, Any]) -> tuple[str, InlineKeyboardMarkup]:
    items = data.get("inventory", [])
    if not items:
        return "Инвентарь пока пуст.", main_menu()
    lines = ["<b>Инвентарь героя</b>"]
    buttons: list[list[InlineKeyboardButton]] = []
    for item in items:
        equipped = " · надето" if item["equipped"] else ""
        lines.append(
            f"• <b>{safe(item['name'])}</b> — {safe(item['rarity'])}{equipped} ×{item['quantity']}"
        )
        if item["category"] in ("Оружие", "Броня", "Бижутерия"):
            action = "Снять" if item["equipped"] else "Надеть"
            buttons.append(
                [
                    InlineKeyboardButton(
                        text=f"{action}: {item['name'][:24]}",
                        callback_data=f"equip:{item['id']}",
                    )
                ]
            )
    buttons.append([InlineKeyboardButton(text="🏠 Главное меню", callback_data="menu")])
    return "\n".join(lines), InlineKeyboardMarkup(inline_keyboard=buttons)


def pets_text(data: dict[str, Any]) -> tuple[str, InlineKeyboardMarkup]:
    pets = data.get("pets", [])
    if not pets:
        return "Пока нет питомцев. Загляните в магазин.", main_menu()
    lines = ["<b>Питомцы и спутники</b>"]
    for pet in pets:
        active = " · спутник" if pet["active"] else ""
        vip = " · VIP" if pet["vip"] else ""
        lines.append(
            f"• <b>{safe(pet['name'])}</b> — {safe(pet['species'])}, ур. {pet['level']}, "
            f"атака {pet['attack']}{active}{vip}"
        )
    active_pet = next((pet for pet in pets if pet["active"]), pets[0])
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🍖 Покормить",
                    callback_data=f"feed:{active_pet['id']}",
                ),
                InlineKeyboardButton(
                    text="✨ Эволюция",
                    callback_data=f"evolve:{active_pet['id']}",
                ),
            ],
            [InlineKeyboardButton(text="🏠 Главное меню", callback_data="menu")],
        ]
    )
    return "\n".join(lines), keyboard


def shop_text(data: dict[str, Any]) -> tuple[str, InlineKeyboardMarkup]:
    products = data.get("shop", [])
    lines = ["<b>Лавка Элизиума</b>"]
    buttons: list[list[InlineKeyboardButton]] = []
    for product in products:
        currency = "💎" if product["currency"] == "crystals" else "🪙"
        lines.append(
            f"• <b>{safe(product['name'])}</b> — {safe(product['rarity'])}, "
            f"{product['price']:,} {currency}\n  <i>{safe(product['description'])}</i>"
        )
        buttons.append(
            [
                InlineKeyboardButton(
                    text=f"Купить · {product['name'][:20]}",
                    callback_data=f"buy:{product['id']}",
                )
            ]
        )
    buttons.append([InlineKeyboardButton(text="🏠 Главное меню", callback_data="menu")])
    return "\n".join(lines), InlineKeyboardMarkup(inline_keyboard=buttons)


def marriage_text(data: dict[str, Any]) -> str:
    player = data["player"]
    history = data.get("marriageHistory", [])
    current = player.get("spouseName")
    lines = [
        "<b>Архив союзов</b>",
        f"Текущий союз: {safe(current) if current else 'нет'}",
        "",
    ]
    if not history:
        lines.append("История союзов пока пуста.")
    for record in history:
        state = "союз продолжается" if not record["divorcedAt"] else "развод"
        start = safe(record["marriedAt"][:10])
        days = record["durationDays"]
        if not record["divorcedAt"]:
            married_at = datetime.fromisoformat(
                record["marriedAt"].replace("Z", "+00:00")
            )
            days = max(0, (datetime.now(timezone.utc) - married_at).days)
        end = safe(record["divorcedAt"][:10]) if record["divorcedAt"] else "—"
        lines.append(
            f"• <b>{safe(record['partnerName'])}</b>: {start} → {end}; "
            f"{int(days)} дн. · {state}"
        )
    return "\n".join(lines)


async def show_dashboard(message: Message, section: str = "profile") -> None:
    uid = player_id(message)
    data = await dashboard_for(uid)
    if section == "profile":
        await message.answer(profile_text(data), reply_markup=main_menu())
    elif section == "inventory":
        text, keyboard = inventory_text(data)
        await message.answer(text, reply_markup=keyboard)
    elif section == "pets":
        text, keyboard = pets_text(data)
        await message.answer(text, reply_markup=keyboard)
    elif section == "shop":
        text, keyboard = shop_text(data)
        await message.answer(text, reply_markup=keyboard)
    elif section == "marriage":
        await message.answer(
            marriage_text(data)
            + "\n\nЧтобы вступить в союз, отправьте: <code>брак Имя игрока</code>.",
            reply_markup=InlineKeyboardMarkup(
                inline_keyboard=[
                    [InlineKeyboardButton(text="Развестись", callback_data="divorce")],
                    [InlineKeyboardButton(text="🏠 Главное меню", callback_data="menu")],
                ]
            ),
        )
    elif section == "raid":
        boss = data["worldBoss"]
        await message.answer(
            f"<b>{safe(boss['name'])}</b>\nФаза {boss['phase']} · "
            f"❤️ {boss['health']:,}/{boss['maxHealth']:,}\n"
            f"Участников: {boss['participants']}\n\n"
            "Атакуйте босса, чтобы внести вклад в рейд.",
            reply_markup=InlineKeyboardMarkup(
                inline_keyboard=[
                    [InlineKeyboardButton(text="⚔️ Атаковать босса", callback_data="raid_attack")],
                    [InlineKeyboardButton(text="🏠 Главное меню", callback_data="menu")],
                ]
            ),
        )
    elif section == "guild":
        player = data["player"]
        if player.get("guildName"):
            await message.answer(
                f"<b>Гильдия «{safe(player['guildName'])}»</b>\n"
                "Казна, роли и рейтинговые события появятся в следующих игровых обновлениях.",
                reply_markup=main_menu(),
            )
        else:
            await message.answer(
                "Вы пока не состоите в гильдии.",
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [InlineKeyboardButton(text="Вступить в Серебряный дозор", callback_data="join_guild")],
                        [InlineKeyboardButton(text="🏠 Главное меню", callback_data="menu")],
                    ]
                ),
            )
    elif section == "home":
        player = data["player"]
        await message.answer(
            f"<b>Дом героя · {safe(player['name'])}</b>\n"
            "Ваш мир: Элизиум. Личный дом и его улучшения будут подключены отдельным игровым модулем.",
            reply_markup=main_menu(),
        )


async def mutate(
    message: Message,
    action: str,
    *,
    target_id: str | None = None,
    target_name: str | None = None,
) -> None:
    result = await act(
        player_id(message),
        action,
        target_id=target_id,
        target_name=target_name,
    )
    await message.answer(
        safe(result["message"]),
        reply_markup=main_menu(),
    )


@dp.message(CommandStart())
async def start(message: Message) -> None:
    user = message.from_user
    if user is None:
        return
    result = await act(
        str(user.id),
        "register",
        player_name=user.full_name,
    )
    await message.answer(
        f"<b>Пушок — мир Элизиума</b>\n{safe(result['message'])}\n\n"
        "Выберите раздел в меню или напишите название раздела.",
        reply_markup=quick_keyboard(),
    )
    await message.answer("Главное меню:", reply_markup=main_menu())


@dp.message(Command("menu", "help"))
async def menu(message: Message) -> None:
    await message.answer(
        "<b>Главное меню</b>\n"
        "Команды: /profile, /inventory, /pets, /shop, /battle, /raid, /marriage, /divorce, /guild.\n"
        "Также работают короткие слова: дуэль, брак, дом, аукцион, питомцы, магазин, кузнец, рейд, гильдия.",
        reply_markup=main_menu(),
    )


@dp.message(Command("profile"))
async def profile(message: Message) -> None:
    await show_dashboard(message, "profile")


@dp.message(Command("inventory"))
async def inventory(message: Message) -> None:
    await show_dashboard(message, "inventory")


@dp.message(Command("pets"))
async def pets(message: Message) -> None:
    await show_dashboard(message, "pets")


@dp.message(Command("shop"))
async def shop(message: Message) -> None:
    await show_dashboard(message, "shop")


@dp.message(Command("battle", "duel"))
async def battle(message: Message) -> None:
    await mutate(message, "battle")


@dp.message(Command("raid"))
async def raid(message: Message) -> None:
    await show_dashboard(message, "raid")


@dp.message(Command("guild"))
async def guild(message: Message) -> None:
    await show_dashboard(message, "guild")


@dp.message(Command("divorce"))
async def divorce(message: Message) -> None:
    await mutate(message, "marriage_divorce")


@dp.message(F.text.regexp(re.compile(r"^/?брак(?:\s+(.*))?$", re.IGNORECASE)))
async def marriage(message: Message) -> None:
    text = message.text or ""
    match = re.match(r"^/?брак(?:\s+(.*))?$", text, re.IGNORECASE)
    target = match.group(1).strip() if match and match.group(1) else ""
    if target:
        await mutate(message, "marriage_propose", target_name=target)
    else:
        await show_dashboard(message, "marriage")


@dp.message(Command("marriage"))
async def marriage_command(message: Message) -> None:
    parts = (message.text or "").split(maxsplit=1)
    target = parts[1].strip() if len(parts) > 1 else ""
    if target:
        await mutate(message, "marriage_propose", target_name=target)
    else:
        await show_dashboard(message, "marriage")


@dp.message(F.text.regexp(re.compile(r"^/?развод$", re.IGNORECASE)))
async def divorce_text(message: Message) -> None:
    await mutate(message, "marriage_divorce")


@dp.message(F.text.regexp(re.compile(r"^/?дуэль$", re.IGNORECASE)))
async def duel_text(message: Message) -> None:
    await mutate(message, "battle")


@dp.message(F.text.regexp(re.compile(r"^/?рейд$", re.IGNORECASE)))
async def raid_text(message: Message) -> None:
    await show_dashboard(message, "raid")


@dp.message(F.text.regexp(re.compile(r"^/?гильдия$", re.IGNORECASE)))
async def guild_text(message: Message) -> None:
    await show_dashboard(message, "guild")


@dp.message(F.text.regexp(re.compile(r"^/?дом$", re.IGNORECASE)))
async def home_text(message: Message) -> None:
    await show_dashboard(message, "home")


@dp.message(F.text.regexp(re.compile(r"^/?(аукцион|магазин)$", re.IGNORECASE)))
async def market_text(message: Message) -> None:
    await show_dashboard(message, "shop")


@dp.message(F.text.regexp(re.compile(r"^/?(кузнец|инвентарь)$", re.IGNORECASE)))
async def inventory_text_handler(message: Message) -> None:
    await show_dashboard(message, "inventory")


@dp.message(F.text.regexp(re.compile(r"^/?питомцы$", re.IGNORECASE)))
async def pets_text_handler(message: Message) -> None:
    await show_dashboard(message, "pets")


@dp.message(F.text.regexp(re.compile(r"^/?профиль$", re.IGNORECASE)))
async def profile_text_handler(message: Message) -> None:
    await show_dashboard(message, "profile")


@dp.message(F.text.regexp(re.compile(r"^/?награда$", re.IGNORECASE)))
async def daily_text_handler(message: Message) -> None:
    await mutate(message, "claim_daily")


@dp.message(F.text.regexp(re.compile(r"^/?(кормить|покормить)$", re.IGNORECASE)))
async def feed_text_handler(message: Message) -> None:
    await mutate(message, "feed_pet")


@dp.message(F.text.regexp(re.compile(r"^/?главное меню$", re.IGNORECASE)))
async def main_menu_text(message: Message) -> None:
    await message.answer("Выберите действие:", reply_markup=main_menu())


@dp.message(F.text)
async def pushok_reaction(message: Message) -> None:
    text = message.text or ""
    if "пушок" in text.casefold():
        lowered = text.casefold()
        if "как дела" in lowered:
            answer = "Пушок мурчит и следит, чтобы герои не забывали про питомцев."
        elif "кто ты" in lowered or "кто такой" in lowered:
            answer = "Я Пушок, хранитель меню Элизиума. Напиши «питомцы» или «дуэль», чтобы начать."
        elif "корм" in lowered or "поесть" in lowered:
            answer = "Пушок рад лакомствам. Напиши «покормить», чтобы позаботиться о спутнике."
        else:
            answer = "Пушок здесь. Напиши /menu — покажу игровые разделы."
        await message.answer(answer, reply_markup=quick_keyboard())


@dp.callback_query(F.data)
async def callbacks(callback: CallbackQuery) -> None:
    if callback.message is None or not isinstance(callback.message, Message):
        await callback.answer()
        return
    try:
        value = callback.data or ""
        if value == "menu":
            await callback.message.answer("Выберите действие:", reply_markup=main_menu())
        elif value in {"profile", "inventory", "pets", "shop", "raid", "guild", "marriage"}:
            await show_dashboard(callback.message, value)
        elif value == "battle":
            await mutate(callback.message, "battle")
        elif value == "daily":
            await mutate(callback.message, "claim_daily")
        elif value == "divorce":
            await mutate(callback.message, "marriage_divorce")
        elif value == "join_guild":
            await mutate(callback.message, "join_guild")
        elif value == "raid_attack":
            await mutate(callback.message, "raid_attack")
        elif value.startswith("equip:"):
            await mutate(callback.message, "equip_item", target_id=value.split(":", 1)[1])
        elif value.startswith("buy:"):
            await mutate(callback.message, "buy_item", target_id=value.split(":", 1)[1])
        elif value.startswith("feed:"):
            await mutate(callback.message, "feed_pet", target_id=value.split(":", 1)[1])
        elif value.startswith("evolve:"):
            await mutate(callback.message, "evolve_pet", target_id=value.split(":", 1)[1])
        await callback.answer()
    except Exception as exc:
        logger.warning("Callback action failed: %s", type(exc).__name__)
        await callback.answer("Не удалось выполнить действие. Попробуйте ещё раз.", show_alert=True)


async def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN не задан. Добавьте токен в настройки секретов.")
    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    logger.info("Пушок запущен и ожидает команды.")
    await dp.start_polling(
        bot,
        allowed_updates=dp.resolve_used_update_types(),
        delete_webhook=False,
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Бот остановлен.")
