type TalentEffect = "attack" | "critical" | "guard" | "healing" | "resource" | "control";

function skill(
  id: string,
  name: string,
  description: string,
  effectType: TalentEffect,
  effectValue: number,
  cost = 1,
  requires: string | null = null,
) {
  return { id, name, description, effectType, effectValue, cost, requires };
}

function branch(
  id: string,
  name: string,
  description: string,
  talents: ReturnType<typeof skill>[],
) {
  return { id, name, description, talents };
}

export const heroClasses = [
  {
    id: "assassin",
    name: "Ассасин",
    role: "Критический урон",
    description: "Бьёт из тени, находит уязвимые места и отступает до ответного удара.",
    passive: "Теневой выпад: каждый бой имеет шанс на усиленный критический удар.",
    branches: [
      branch("assassin-shadow", "Путь тени", "Скрытность, внезапность и уклонение.", [
        skill("assassin-shadow-step", "Шаг в дыму", "Снижает ответный урон после атаки.", "control", 8),
        skill("assassin-vanishing-cut", "Исчезающий клинок", "Усиливает выпад из невидимости.", "attack", 10, 2, "assassin-shadow-step"),
      ]),
      branch("assassin-blades", "Парные клинки", "Серия быстрых ударов по слабым точкам.", [
        skill("assassin-open-wound", "Открытая рана", "Повышает урон точного удара.", "critical", 8),
        skill("assassin-crossing-steel", "Перекрёстная сталь", "Добавляет второй удар в серию.", "attack", 12, 2, "assassin-open-wound"),
      ]),
      branch("assassin-venom", "Алхимия яда", "Яды ослабляют врага и помогают завершить бой.", [
        skill("assassin-night-venom", "Ночной яд", "Наносит дополнительный урон ядом.", "attack", 9),
        skill("assassin-deadly-dose", "Смертельная доза", "Увеличивает силу отравленного клинка.", "critical", 12, 2, "assassin-night-venom"),
      ]),
    ],
  },
  {
    id: "druid",
    name: "Друид",
    role: "Исцеление и природа",
    description: "Поддерживает себя силами леса и превращает природу в оружие.",
    passive: "Живой лес: после боя восстанавливает часть здоровья.",
    branches: [
      branch("druid-growth", "Целебный рост", "Восстановление жизненных сил.", [
        skill("druid-moss-heal", "Мох жизни", "Усиливает восстановление здоровья.", "healing", 12),
        skill("druid-blooming-spring", "Цветущий источник", "Восстанавливает больше здоровья после победы.", "healing", 18, 2, "druid-moss-heal"),
      ]),
      branch("druid-grove", "Хранитель рощи", "Защита корнями и корой древних деревьев.", [
        skill("druid-barkskin", "Кора древних", "Снижает получаемый урон.", "guard", 9),
        skill("druid-rooted-heart", "Сердце чащи", "Закрепляет защиту и исцеляет друида.", "healing", 16, 2, "druid-barkskin"),
      ]),
      branch("druid-wild", "Дикий круг", "Яростные звериные и растительные атаки.", [
        skill("druid-thorn-whip", "Хлыст шипов", "Усиливает природную атаку.", "attack", 10),
        skill("druid-wild-shape", "Звериный облик", "Увеличивает урон превращения.", "critical", 11, 2, "druid-thorn-whip"),
      ]),
    ],
  },
  {
    id: "tank",
    name: "Танк",
    role: "Защита и стойкость",
    description: "Принимает удар на себя, удерживает строй и отвечает железной контратакой.",
    passive: "Несокрушимый строй: заметно снижает урон в каждом бою.",
    branches: [
      branch("tank-bulwark", "Железный бастион", "Щиты, стойки и непробиваемая оборона.", [
        skill("tank-shield-wall", "Стена щитов", "Снижает урон от контратаки.", "guard", 12),
        skill("tank-last-fortress", "Последняя крепость", "Усиливает защиту на грани поражения.", "guard", 18, 2, "tank-shield-wall"),
      ]),
      branch("tank-vanguard", "Передовой дозор", "Удержание внимания врага и контроль боя.", [
        skill("tank-challenge", "Вызов стража", "Сдерживает противника и уменьшает ответный урон.", "control", 10),
        skill("tank-anchored-ground", "Неподвижная земля", "Усиливает контроль и стойкость.", "guard", 14, 2, "tank-challenge"),
      ]),
      branch("tank-retaliation", "Ответный удар", "Превращает прочность брони в силу удара.", [
        skill("tank-spiked-armor", "Шипованная броня", "Возвращает часть урона врагу.", "attack", 8),
        skill("tank-earthshaker", "Сокрушитель земли", "Усиливает тяжёлую контратаку.", "attack", 14, 2, "tank-spiked-armor"),
      ]),
    ],
  },
  {
    id: "warrior",
    name: "Воин",
    role: "Сбалансированный бой",
    description: "Уверенно держит линию и усиливает каждую серию ударов.",
    passive: "Боевой ритм: наносит повышенный базовый урон.",
    branches: [
      branch("warrior-assault", "Натиск", "Мощные атаки и давление на противника.", [
        skill("warrior-crushing-blow", "Сокрушительный удар", "Увеличивает силу тяжёлой атаки.", "attack", 12),
        skill("warrior-relentless", "Безостановочный натиск", "Продолжает усиливать урон серии.", "attack", 16, 2, "warrior-crushing-blow"),
      ]),
      branch("warrior-fury", "Ярость", "Рискованные выпады и короткие всплески силы.", [
        skill("warrior-battle-fury", "Боевая ярость", "Усиливает удар в разгар боя.", "critical", 10),
        skill("warrior-execution", "Казнящий выпад", "Повышает шанс завершающего удара.", "critical", 15, 2, "warrior-battle-fury"),
      ]),
      branch("warrior-discipline", "Воинская дисциплина", "Точная работа оружием и защита стойки.", [
        skill("warrior-measured-stance", "Выверенная стойка", "Снижает урон от контратаки.", "guard", 8),
        skill("warrior-master-at-arms", "Мастер оружия", "Даёт постоянный бонус к атаке.", "attack", 14, 2, "warrior-measured-stance"),
      ]),
    ],
  },
  {
    id: "mage",
    name: "Маг",
    role: "Магический урон",
    description: "Управляет стихиями, связывает врага чарами и накапливает силу заклинаний.",
    passive: "Арканный импульс: заклинание наносит дополнительный магический урон.",
    branches: [
      branch("mage-elements", "Стихии", "Пламя, мороз и молния.", [
        skill("mage-arcane-bolt", "Арканный снаряд", "Увеличивает силу магической атаки.", "attack", 13),
        skill("mage-storm-call", "Призыв бури", "Усиливает стихийный взрыв.", "critical", 14, 2, "mage-arcane-bolt"),
      ]),
      branch("mage-control", "Холодная печать", "Останавливает врага и выигрывает время.", [
        skill("mage-frost-bind", "Ледяные оковы", "Снижает ответный урон противника.", "control", 12),
        skill("mage-glass-prison", "Хрустальная темница", "Продлевает контроль и усиливает разряд.", "attack", 11, 2, "mage-frost-bind"),
      ]),
      branch("mage-arcana", "Глубокая аркана", "Сосредоточение и точность чар.", [
        skill("mage-mana-reservoir", "Резерв маны", "Даёт дополнительный ресурс после победы.", "resource", 1),
        skill("mage-starfall", "Звездопад", "Преобразует накопленную ману в урон.", "attack", 17, 2, "mage-mana-reservoir"),
      ]),
    ],
  },
  {
    id: "archer",
    name: "Лучник",
    role: "Дальний урон",
    description: "Выбирает дистанцию, отмечает цель и попадает прежде, чем враг приблизится.",
    passive: "Меткий глаз: точный выстрел может нанести двойной урон.",
    branches: [
      branch("archer-precision", "Меткость", "Прицеливание в уязвимые места.", [
        skill("archer-deadeye", "Глаз ястреба", "Повышает силу точного выстрела.", "critical", 10),
        skill("archer-piercing-shot", "Пробивающая стрела", "Игнорирует часть защиты цели.", "attack", 15, 2, "archer-deadeye"),
      ]),
      branch("archer-volley", "Шквал стрел", "Быстрые серии и непрерывное давление.", [
        skill("archer-double-shot", "Двойной выстрел", "Добавляет урон второй стрелы.", "attack", 10),
        skill("archer-rain-of-arrows", "Дождь стрел", "Усиливает серию попаданий.", "critical", 12, 2, "archer-double-shot"),
      ]),
      branch("archer-traps", "Лесные ловушки", "Замедляет и ослабляет противника.", [
        skill("archer-snare", "Капкан следопыта", "Замедляет врага и снижает его ответный удар.", "control", 9),
        skill("archer-hunters-mark", "Метка охотника", "Усиливает атаку по отмеченной цели.", "attack", 14, 2, "archer-snare"),
      ]),
    ],
  },
  {
    id: "shaman",
    name: "Шаман",
    role: "Духи и стихии",
    description: "Зовёт духов предков, направляет гром и укрепляет себя тотемами.",
    passive: "Дух-проводник: после боя восстанавливает здоровье и получает немного монет.",
    branches: [
      branch("shaman-ancestors", "Духи предков", "Поддержка из мира духов.", [
        skill("shaman-ancestor-voice", "Голос предков", "Восстанавливает здоровье после победы.", "healing", 12),
        skill("shaman-spirit-procession", "Шествие духов", "Усиливает лечение и духовный выпад.", "healing", 16, 2, "shaman-ancestor-voice"),
      ]),
      branch("shaman-storm", "Громовой круг", "Молния и ударные волны.", [
        skill("shaman-lightning-spear", "Копьё молнии", "Усиливает стихийную атаку.", "attack", 12),
        skill("shaman-thunder-heart", "Сердце грозы", "Повышает критический урон молний.", "critical", 14, 2, "shaman-lightning-spear"),
      ]),
      branch("shaman-totems", "Тотемы земли", "Защитные обереги и контроль врага.", [
        skill("shaman-earth-totem", "Тотем земли", "Снижает урон от удара.", "guard", 10),
        skill("shaman-binding-roots", "Связующие корни", "Сдерживает врага и усиливает оборону.", "control", 13, 2, "shaman-earth-totem"),
      ]),
    ],
  },
  {
    id: "priest",
    name: "Жрец",
    role: "Свет и исцеление",
    description: "Поддерживает жизнь, отводит тьму и отвечает очищающим светом.",
    passive: "Благословение света: восстанавливает здоровье после каждого боя.",
    branches: [
      branch("priest-radiance", "Сияние", "Световые удары и очищение скверны.", [
        skill("priest-radiant-strike", "Луч возмездия", "Добавляет урон светом.", "attack", 10),
        skill("priest-sunfire", "Солнечный приговор", "Усиливает поражение нечисти.", "critical", 15, 2, "priest-radiant-strike"),
      ]),
      branch("priest-blessings", "Благословения", "Лечение и защита союзника.", [
        skill("priest-gentle-light", "Мягкий свет", "Восстанавливает здоровье после боя.", "healing", 15),
        skill("priest-dawn-blessing", "Благословение рассвета", "Усиливает лечение и боевой запас.", "healing", 20, 2, "priest-gentle-light"),
      ]),
      branch("priest-wards", "Священные печати", "Барьер и защита от проклятий.", [
        skill("priest-warding-seal", "Охранная печать", "Снижает получаемый урон.", "guard", 10),
        skill("priest-purifying-circle", "Круг очищения", "Снимает часть ран и ослабляет врага.", "control", 14, 2, "priest-warding-seal"),
      ]),
    ],
  },
];

export const craftingRecipes = [
  {
    id: "moon-sabre",
    name: "Сабля лунной стали",
    description: "Лёгкий клинок, закалённый в серебряном пламени.",
    requiredLevel: 1,
    goldCost: 180,
    ingredients: [
      { itemId: "iron-ore", name: "Железная руда", quantity: 3 },
      { itemId: "moon-thread", name: "Лунная нить", quantity: 1 },
    ],
    result: {
      id: "moon-sabre",
      name: "Сабля лунной стали",
      icon: "sword",
      rarity: "Редкий",
      category: "Оружие",
      equipped: false,
      attack: 28,
      defense: 0,
      price: 720,
      quantity: 1,
    },
  },
  {
    id: "ranger-mail",
    name: "Кольчуга следопыта",
    description: "Гибкая броня для долгих походов.",
    requiredLevel: 2,
    goldCost: 260,
    ingredients: [
      { itemId: "iron-ore", name: "Железная руда", quantity: 4 },
      { itemId: "wolf-fang", name: "Клык волка", quantity: 1 },
    ],
    result: {
      id: "ranger-mail",
      name: "Кольчуга следопыта",
      icon: "shield",
      rarity: "Редкий",
      category: "Броня",
      equipped: false,
      attack: 0,
      defense: 22,
      price: 980,
      quantity: 1,
    },
  },
  {
    id: "healing-elixir",
    name: "Эликсир живого источника",
    description: "Тёплое зелье с травами из рощи Элизиума.",
    requiredLevel: 1,
    goldCost: 60,
    ingredients: [
      { itemId: "healing-herb", name: "Целебная трава", quantity: 2 },
    ],
    result: {
      id: "healing-elixir",
      name: "Эликсир живого источника",
      icon: "potion",
      rarity: "Обычный",
      category: "Алхимия",
      equipped: false,
      attack: 0,
      defense: 0,
      price: 180,
      quantity: 1,
    },
  },
];

export function classById(classId: string) {
  return heroClasses.find((heroClass) => heroClass.id === classId);
}

export function talentById(talentId: string) {
  for (const heroClass of heroClasses) {
    for (const talentBranch of heroClass.branches) {
      const talent = talentBranch.talents.find((entry) => entry.id === talentId);
      if (talent) return { heroClass, talentBranch, talent };
    }
  }
  return undefined;
}
