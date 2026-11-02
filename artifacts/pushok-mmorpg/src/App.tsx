import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Route, Switch, Link, useLocation } from 'wouter';
import {
  Activity, ArrowUpRight, Axe, BookOpen, Castle, Check, ChevronRight,
  CircleHelp, Coins, Crown, Gem, Heart, Home, Menu, PawPrint, Plus,
  Shield, ShieldCheck, ShoppingBag, Sparkles, Swords, Users, WandSparkles,
  X, Zap,
} from 'lucide-react';
import {
  getGetGameDashboardQueryKey, getHealthCheckQueryKey, useGetGameDashboard,
  useHealthCheck, usePerformGameAction,
} from '@workspace/api-client-react';
import type { GameActionInput, GameDashboard, GameItem, GamePet } from '@workspace/api-client-react';
import './index.css';

const client = new QueryClient({ defaultOptions: { queries: { staleTime: 20_000, retry: 1 } } });
const nav = [
  { path: '/', label: 'Обзор', icon: Home },
  { path: '/heroes', label: 'Герои', icon: Shield },
  { path: '/inventory', label: 'Инвентарь', icon: ShoppingBag },
  { path: '/pets', label: 'Питомцы', icon: PawPrint },
  { path: '/unions', label: 'Союзы', icon: Heart },
  { path: '/guilds', label: 'Гильдии', icon: Castle },
];
const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n);
const rarityClass = (rarity: string) => `rarity-${rarity.toLowerCase()}`;
const rarityName = (rarity: string) => ({ legendary: 'Легендарный', epic: 'Эпический', rare: 'Редкий', common: 'Обычный' }[rarity.toLowerCase()] ?? rarity);

function getBrowserPlayerId() {
  if (typeof window === 'undefined') return 'demo';
  const storageKey = 'pushok-player-id';
  const stored = window.localStorage.getItem(storageKey);
  if (stored && /^web:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stored)) {
    return stored;
  }
  const id = `web:${window.crypto.randomUUID()}`;
  window.localStorage.setItem(storageKey, id);
  return id;
}

function AppShell() {
  const [location] = useLocation();
  const [playerId] = useState(getBrowserPlayerId);
  const [accountReady, setAccountReady] = useState(false);
  const [registrationAttempted, setRegistrationAttempted] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [notice, setNotice] = useState('');
  const queryClient = useQueryClient();
  const queryKey = getGetGameDashboardQueryKey({ playerId });
  const { data, isLoading, isError } = useGetGameDashboard(
    { playerId },
    { query: { queryKey, retry: false, enabled: accountReady } },
  );
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), refetchInterval: 60_000 } });
  const actionMutation = usePerformGameAction({
    mutation: {
      onSuccess: (result) => {
        queryClient.setQueryData<GameDashboard>(queryKey, result.dashboard);
        setAccountReady(true);
        setNotice(result.message);
        window.setTimeout(() => setNotice(''), 4200);
      },
      onError: (error) => setNotice(error instanceof Error ? error.message : 'Не удалось выполнить действие. Попробуйте ещё раз.'),
    },
  });
  useEffect(() => {
    if (!registrationAttempted && !actionMutation.isPending) {
      setRegistrationAttempted(true);
      actionMutation.mutate({ data: { playerId, playerName: 'Странник', action: 'register' } });
    }
  }, [actionMutation.isPending, actionMutation.mutate, playerId, registrationAttempted]);
  const player = data?.player!;
  const sendAction = (action: GameActionInput['action'], targetId?: string, targetName?: string) => {
    actionMutation.mutate({ data: { playerId, playerName: player?.name, action, targetId, targetName } });
  };
  const pageTitles: Record<string, [string, string]> = {
    '/': ['Ваш путь продолжается', 'Летопись героя'],
    '/heroes': ['Герой и снаряжение', 'Сила начинается с выбора'],
    '/inventory': ['Сокровищница', 'Всё, что вы собрали в пути'],
    '/pets': ['Спутники', 'Те, кто сражается рядом'],
    '/unions': ['Союзы', 'Истории, связанные судьбой'],
    '/guilds': ['Гильдия', 'Сила — в тех, кто рядом'],
  };
  const [eyebrow, subtitle] = pageTitles[location] ?? pageTitles['/'];
  const currentNav = nav.find((item) => item.path === location)?.label ?? 'Обзор';

  if ((!accountReady && actionMutation.isPending) || isLoading) return <LoadingScreen />;
  if ((actionMutation.isError && !data) || isError || !data) return <ErrorScreen onRetry={() => window.location.reload()} />;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-inner flex h-full flex-col px-4 py-6">
          <Link href="/" className="sidebar-logo flex items-center gap-3 px-2 no-underline">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-200/20 bg-[#1e2a3c] text-[#d7bb75]"><WandSparkles size={20} /></div>
            <div className="brand-copy"><div className="font-display text-xl tracking-wide text-[#eee7d7]">Пушок</div><div className="text-[9px] uppercase tracking-[.24em] text-slate-500">летопись миров</div></div>
          </Link>
          <div className="nav-caption mb-3 mt-11 px-3 text-[9px] font-semibold uppercase tracking-[.22em] text-slate-600">Путеводитель</div>
          <nav className="flex flex-col gap-1">
            {nav.map(({ path, label, icon: Icon }) => (
              <Link key={path} href={path} data-testid={`link-nav-${label.toLowerCase()}`} className={`nav-link flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] text-slate-400 no-underline ${location === path ? 'active' : ''}`}>
                <Icon size={17} strokeWidth={1.7} /><span className="nav-label">{label}</span>
              </Link>
            ))}
          </nav>
          <div className="realm-card mt-auto rounded-xl border border-[#c1a15f]/15 bg-[#c1a15f]/[.045] p-4">
            <div className="mb-2 flex items-center gap-2 text-[9px] uppercase tracking-[.18em] text-[#c8ab68]"><Gem size={13} /> Ваш мир</div>
            <div className="font-display text-base text-slate-200">{player.realm}</div>
            <div className="mt-1 text-[11px] text-slate-500">Сезон Пепельной зари</div>
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-white/[.07] pt-4">
            <Avatar name={player.name} />
            <div className="profile-copy min-w-0"><div className="truncate text-xs font-semibold text-slate-200">{player.name}</div><div className="mt-0.5 text-[10px] text-slate-500">Уровень {player.level} · {player.heroClass}</div></div>
          </div>
        </div>
      </aside>

      <main className="main-area px-5 pb-8 pt-6 sm:px-8 lg:px-10">
        <header className="mx-auto flex max-w-[1440px] items-center justify-between border-b border-white/[.07] pb-5">
          <div className="flex items-center gap-3">
            <div className="hidden h-9 w-9 place-items-center rounded-lg border border-white/[.08] bg-white/[.025] text-slate-400 sm:grid"><Menu size={16} /></div>
            <div><div className="text-[10px] uppercase tracking-[.2em] text-slate-500">{currentNav} <span className="px-1.5 text-slate-700">/</span> {player.realm}</div><div className="mt-1 text-xs text-slate-400">{subtitle}</div></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Currency icon={<Coins size={14} />} amount={player.gold} tone="gold" />
            <Currency icon={<Gem size={14} />} amount={player.crystals} tone="blue" />
          </div>
        </header>
        <div className="mx-auto max-w-[1440px]">
          {notice && <div role="status" data-testid="status-action-message" className="fade-in mt-4 flex items-center justify-between rounded-lg border border-[#c7a964]/25 bg-[#c7a964]/[.08] px-4 py-3 text-xs text-[#e8d19a]"><span>{notice}</span><button data-testid="button-dismiss-message" className="text-slate-400 hover:text-white" onClick={() => setNotice('')} aria-label="Закрыть"><X size={15} /></button></div>}
          <div className="mb-6 mt-7 flex items-end justify-between">
            <div><div className="mb-1.5 text-[10px] uppercase tracking-[.24em] text-[#c4a761]">{player.title}</div><h1 className="font-display text-3xl font-medium tracking-[-.02em] text-[#f0ece4] sm:text-[38px]">{eyebrow}</h1></div>
            <div className="hidden items-center gap-2 text-[10px] text-slate-500 sm:flex"><span className={`h-1.5 w-1.5 rounded-full ${health?.status === 'ok' ? 'bg-[#7aa887] shadow-[0_0_10px_#7aa88788]' : 'bg-[#c77b63]'}`} /> {health?.status === 'ok' ? 'Мир активен' : 'Связь с миром...'}</div>
          </div>
          <Switch>
            <Route path="/"><Overview data={data} busy={actionMutation.isPending} action={sendAction} /></Route>
            <Route path="/heroes"><Heroes data={data} busy={actionMutation.isPending} action={sendAction} /></Route>
            <Route path="/inventory"><Inventory data={data} busy={actionMutation.isPending} action={sendAction} /></Route>
            <Route path="/pets"><Pets data={data} busy={actionMutation.isPending} action={sendAction} /></Route>
            <Route path="/unions"><Unions data={data} busy={actionMutation.isPending} action={sendAction} queryName={queryName} setQueryName={setQueryName} /></Route>
            <Route path="/guilds"><Guilds data={data} busy={actionMutation.isPending} action={sendAction} queryName={queryName} setQueryName={setQueryName} /></Route>
            <Route><Overview data={data} busy={actionMutation.isPending} action={sendAction} /></Route>
          </Switch>
        </div>
      </main>
      <nav className="mobile-nav" aria-label="Основная навигация">
        {nav.map(({ path, label, icon: Icon }) => <Link key={path} href={path} data-testid={`mobile-nav-${label.toLowerCase()}`} className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[9px] no-underline ${location === path ? 'text-[#dec27b]' : 'text-slate-500'}`}><Icon size={18} strokeWidth={1.7} /><span>{label}</span></Link>)}
      </nav>
    </div>
  );
}

function Overview({ data, busy, action }: ViewProps) {
  const { player, worldBoss, activity, leaderboard, shop } = data;
  const xpPercent = Math.min(100, Math.round((player.xp / Math.max(1, player.xpToNext)) * 100));
  const healthPercent = Math.min(100, Math.round((player.health / Math.max(1, player.maxHealth)) * 100));
  return <div className="fade-in grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(290px,.85fr)]">
    <div className="min-w-0 space-y-5">
      <section className="hero-art relative min-h-[360px] overflow-hidden rounded-2xl border border-[#8496b2]/20 sm:min-h-[405px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_45%,transparent_10%,rgba(9,14,22,.38)_75%)]" />
        <div className="relative flex h-full min-h-[360px] flex-col justify-end p-6 sm:min-h-[405px] sm:p-9">
          <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[.24em] text-[#d6bb75]"><span className="h-px w-6 bg-[#d6bb75]/70" /> {player.realm}</div>
          <h2 className="font-display text-4xl leading-[1.08] text-[#f2efe9] sm:text-[52px]">{player.name}</h2>
          <p className="mt-2 text-sm text-slate-300">{player.heroClass} <span className="mx-2 text-slate-600">·</span> Уровень {player.level}</p>
          {player.vip && <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#cfad61]/30 bg-[#cfad61]/10 px-2.5 py-1 text-[9px] uppercase tracking-[.16em] text-[#e2c779]"><Crown size={12} /> VIP странник</div>}
          <div className="mt-6 max-w-[420px] space-y-3">
            <Bar label="Здоровье" value={`${fmt(player.health)} / ${fmt(player.maxHealth)}`} percent={healthPercent} type="health" />
            <Bar label="Опыт" value={`${fmt(player.xp)} / ${fmt(player.xpToNext)} XP`} percent={xpPercent} type="xp" />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <ActionButton icon={<Swords size={15} />} busy={busy} onClick={() => action('battle')}>Вступить в бой</ActionButton>
            <ActionButton variant="outline" icon={<Coins size={15} />} busy={busy} onClick={() => action('claim_daily')}>Забрать награду дня</ActionButton>
          </div>
        </div>
      </section>
      <section className="glass rounded-2xl p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between"><div><SectionTitle>Врата рейда</SectionTitle><p className="mt-1 text-xs text-slate-500">Мировой босс · общая охота</p></div><span className="rounded-full border border-[#a94e57]/30 bg-[#a94e57]/10 px-2.5 py-1 text-[9px] uppercase tracking-[.13em] text-[#df8588]">Фаза {worldBoss.phase}</span></div>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1"><h3 className="font-display text-2xl text-slate-100">{worldBoss.name}</h3><div className="mt-5"><Bar label="Силы босса" value={`${fmt(worldBoss.health)} / ${fmt(worldBoss.maxHealth)}`} percent={Math.round(worldBoss.health / Math.max(1, worldBoss.maxHealth) * 100)} type="health" /></div></div>
          <div className="flex items-center justify-between gap-5 sm:justify-end"><div><div className="font-mono text-xl text-slate-100">{fmt(worldBoss.participants)}</div><div className="text-[10px] text-slate-500">в походе</div></div><ActionButton busy={busy} icon={<Zap size={14} />} onClick={() => action('raid_attack')}>Атаковать</ActionButton></div>
        </div>
      </section>
      <section className="glass rounded-2xl p-5 sm:p-6">
        <SectionTitle>След в летописи</SectionTitle>
        <div className="mt-4 divide-y divide-white/[.06]">
          {activity.slice(0, 5).map((entry) => <div key={entry.id} data-testid={`activity-entry-${entry.id}`} className="flex items-start gap-3 py-3 first:pt-0"><div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#6d8bae]/15 bg-[#3a5677]/10 text-[#91adce]"><Activity size={15} /></div><div className="min-w-0 flex-1"><div className="text-xs leading-relaxed text-slate-300">{entry.message}</div><div className="mt-1 text-[10px] text-slate-600">{entry.category} · {new Date(entry.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></div></div>)}
          {!activity.length && <Empty label="Летопись пока чиста. Первое сражение станет её началом." />}
        </div>
      </section>
    </div>
    <aside className="space-y-5">
      <section className="glass rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between"><SectionTitle>Герой сейчас</SectionTitle><Link href="/heroes" data-testid="link-view-hero" className="text-[10px] text-[#cdb16c] no-underline">Подробнее <ChevronRight className="inline" size={12} /></Link></div>
        <div className="grid grid-cols-3 gap-2">
          <Stat icon={<Axe size={15} />} value={fmt(player.attack)} label="Атака" />
          <Stat icon={<ShieldCheck size={15} />} value={fmt(player.health)} label="Здоровье" />
          <Stat icon={<Crown size={15} />} value={player.level} label="Уровень" />
        </div>
        <div className="mt-4 border-t border-white/[.06] pt-4 text-xs"><div className="flex justify-between py-1.5"><span className="text-slate-500">Гильдия</span><span className="text-slate-300">{player.guildName || 'Пока без гильдии'}</span></div><div className="flex justify-between py-1.5"><span className="text-slate-500">Союз</span><span className="text-slate-300">{player.spouseName || 'Сердце свободно'}</span></div></div>
      </section>
      <section className="glass rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between"><SectionTitle>Зал славы</SectionTitle><span className="text-[9px] uppercase tracking-[.15em] text-slate-600">Сезон I</span></div>
        <div className="space-y-1">
          {leaderboard.slice(0, 4).map((entry) => <div key={entry.rank} className={`flex items-center gap-3 rounded-lg px-2 py-2.5 ${entry.name === player.name ? 'bg-[#c6a65d]/[.08]' : ''}`}><span className={`font-mono text-xs ${entry.rank <= 3 ? 'text-[#d4b667]' : 'text-slate-600'}`}>{String(entry.rank).padStart(2, '0')}</span><Avatar name={entry.name} small /><div className="min-w-0 flex-1"><div className="truncate text-xs text-slate-300">{entry.name}</div><div className="text-[9px] text-slate-600">{entry.heroClass} · ур. {entry.level}</div></div><span className="font-mono text-[10px] text-slate-400">{fmt(entry.score)}</span></div>)}
          {!leaderboard.length && <Empty label="Таблица появится после первых подвигов." />}
        </div>
      </section>
      <section className="glass rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between"><SectionTitle>Лавка странника</SectionTitle><ShoppingBag size={15} className="text-slate-500" /></div>
        {shop.slice(0, 2).map((item) => <div key={item.id} className="flex items-center gap-3 border-t border-white/[.06] py-3 first:border-0 first:pt-0"><ItemGlyph category={item.rarity} /><div className="min-w-0 flex-1"><div className="truncate text-xs text-slate-200">{item.name}</div><div className="mt-1 truncate text-[10px] text-slate-500">{item.description}</div></div><button data-testid={`button-buy-${item.id}`} disabled={busy} onClick={() => action('buy_item', item.id)} className="action-btn rounded-md border border-[#c5a45d]/25 px-2.5 py-1.5 font-mono text-[10px] text-[#d6bb75]">{fmt(item.price)} {item.currency === 'crystals' ? '◇' : 'з.'}</button></div>)}
        {!shop.length && <Empty label="Лавка сегодня закрыта." />}
      </section>
    </aside>
  </div>;
}

function Heroes({ data, busy, action }: ViewProps) {
  const { player, inventory } = data;
  const gear = inventory.filter((item) => item.equipped);
  return <div className="fade-in grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
    <section className="hero-art relative flex min-h-[400px] flex-col justify-end overflow-hidden rounded-2xl border border-[#8496b2]/20 p-6 sm:p-8">
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b111b] via-transparent to-transparent" />
      <div className="relative"><div className="mb-2 text-[10px] uppercase tracking-[.2em] text-[#d6bb75]">{player.title}</div><h2 className="font-display text-4xl text-white">{player.name}</h2><p className="mt-2 text-sm text-slate-300">{player.heroClass} · {player.realm}</p><div className="mt-5 grid grid-cols-2 gap-3"><Stat icon={<Axe size={16} />} value={fmt(player.attack)} label="Сила атаки" /><Stat icon={<ShieldCheck size={16} />} value={`${fmt(player.health)} / ${fmt(player.maxHealth)}`} label="Здоровье" /></div></div>
    </section>
    <div className="space-y-5">
      <section className="glass rounded-2xl p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><SectionTitle>Надето сейчас</SectionTitle><span className="font-mono text-[10px] text-slate-600">{gear.length} предмета</span></div>{gear.length ? <div className="space-y-2">{gear.map((item) => <GearRow key={item.id} item={item} busy={busy} action={action} />)}</div> : <Empty label="Снаряжение ждёт своего героя." />}</section>
      <section className="glass rounded-2xl p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><BookOpen size={15} className="text-[#d2b469]" /><SectionTitle>Путь героя</SectionTitle></div><div className="space-y-3"><Bar label="Здоровье" value={`${fmt(player.health)} / ${fmt(player.maxHealth)}`} percent={player.health / player.maxHealth * 100} type="health" /><Bar label="Опыт до следующего уровня" value={`${fmt(player.xp)} / ${fmt(player.xpToNext)} XP`} percent={player.xp / player.xpToNext * 100} type="xp" /></div><div className="mt-4 grid grid-cols-2 gap-3"><Stat icon={<Coins size={15} />} value={fmt(player.gold)} label="Золото" /><Stat icon={<Gem size={15} />} value={fmt(player.crystals)} label="Кристаллы" /></div></section>
    </div>
  </div>;
}

function Inventory({ data, busy, action }: ViewProps) {
  const [filter, setFilter] = useState('Все');
  const categories = ['Все', ...Array.from(new Set(data.inventory.map((item) => item.category)))];
  const filtered = filter === 'Все' ? data.inventory : data.inventory.filter((item) => item.category === filter);
  return <div className="fade-in">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="text-xs text-slate-500">Предметов в сумке <span className="ml-1 font-mono text-slate-300">{data.inventory.length}</span></div><div className="flex flex-wrap gap-1.5">{categories.map((category) => <button key={category} data-testid={`filter-category-${category}`} onClick={() => setFilter(category)} className={`rounded-full border px-3 py-1.5 text-[10px] transition ${filter === category ? 'border-[#c8a860]/35 bg-[#c8a860]/10 text-[#dfc77f]' : 'border-white/[.08] text-slate-500 hover:text-slate-300'}`}>{category}</button>)}</div></div>
    {filtered.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <ItemCard key={item.id} item={item} busy={busy} action={action} />)}</div> : <EmptyPanel title="Сумка пуста" detail="Предметы появятся здесь после находок и покупок." />}
    <section className="glass mt-5 rounded-2xl p-5"><div className="mb-4 flex items-center justify-between"><SectionTitle>На прилавке</SectionTitle><span className="text-[10px] text-slate-600">Покупка меняет ваш запас</span></div><div className="grid gap-3 md:grid-cols-2">{data.shop.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-black/10 p-3"><ItemGlyph category={item.rarity} /><div className="min-w-0 flex-1"><div className="text-xs text-slate-200">{item.name}</div><div className="mt-1 text-[10px] text-slate-500">{item.description}</div></div><button data-testid={`button-buy-${item.id}`} disabled={busy} onClick={() => action('buy_item', item.id)} className="action-btn rounded-lg border border-[#c8a860]/25 px-3 py-2 font-mono text-[10px] text-[#dfc77f]">{fmt(item.price)} {item.currency === 'crystals' ? '◇' : 'з.'}</button></div>)}</div>{!data.shop.length && <Empty label="На прилавке пока ничего нет." />}</section>
  </div>;
}

function Pets({ data, busy, action }: ViewProps) {
  return <div className="fade-in">
    <div className="mb-5 flex items-center justify-between"><p className="text-sm text-slate-400">Верные спутники становятся сильнее вместе с вами.</p><span className="font-mono text-xs text-slate-600">{data.pets.length} спутника</span></div>
    {data.pets.length ? <div className="grid gap-4 lg:grid-cols-2">{data.pets.map((pet) => <PetCard key={pet.id} pet={pet} busy={busy} action={action} />)}</div> : <EmptyPanel title="Пока без спутника" detail="Впереди ещё много встреч в этом мире." />}
  </div>;
}

function Unions({ data, busy, action, queryName, setQueryName }: ViewProps & { queryName: string; setQueryName: (value: string) => void }) {
  const married = Boolean(data.player.spouseName);
  return <div className="fade-in grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
    <section className="glass relative overflow-hidden rounded-2xl p-6 sm:p-8"><div className="absolute -right-8 -top-10 h-44 w-44 rounded-full border border-[#c5a760]/10" /><div className="absolute -right-2 top-0 h-32 w-32 rounded-full border border-[#c5a760]/10" /><div className="relative"><div className="grid h-12 w-12 place-items-center rounded-xl border border-[#c9a85d]/25 bg-[#c9a85d]/[.08] text-[#d6bb75]"><Heart size={20} /></div><h2 className="mt-6 font-display text-3xl text-slate-100">{married ? 'Ваш союз' : 'Свободное сердце'}</h2><p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">{married ? `Ваш путь связан с ${data.player.spouseName}. Пусть общие дни будут долгими.` : 'Назовите спутника, с которым хотите связать свою историю.'}</p>
      {!married ? <div className="mt-6 flex gap-2"><input data-testid="input-partner-name" value={queryName} onChange={(event) => setQueryName(event.target.value)} placeholder="Имя странника" className="min-w-0 flex-1 rounded-lg border border-white/[.1] bg-[#0d1420] px-3 py-2.5 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-[#c8a860]/50" /><ActionButton busy={busy} disabled={!queryName.trim()} icon={<Heart size={14} />} onClick={() => action('marriage_propose', undefined, queryName.trim())}>Предложить</ActionButton></div> : <button data-testid="button-marriage-divorce" disabled={busy} onClick={() => action('marriage_divorce')} className="action-btn mt-6 rounded-lg border border-[#a85b64]/30 bg-[#873b45]/10 px-4 py-2.5 text-xs text-[#d88c91]">Завершить союз</button>}
      <div className="mt-7 grid grid-cols-2 gap-3"><Stat icon={<Users size={15} />} value={data.marriageHistory.length} label="Историй" /><Stat icon={<Heart size={15} />} value={married ? 'Вместе' : 'Открыто'} label="Состояние" /></div>
    </div></section>
    <section className="glass rounded-2xl p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><SectionTitle>Архив союза</SectionTitle><span className="text-[10px] text-slate-600">Все главы</span></div><div className="space-y-3">{data.marriageHistory.map((record) => <div key={record.id} className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-black/10 p-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#c9a85d]/20 bg-[#c9a85d]/[.07] text-[#c9a85d]"><Heart size={16} /></div><div className="min-w-0 flex-1"><div className="text-sm text-slate-200">{record.partnerName}</div><div className="mt-1 text-[10px] text-slate-500">{new Date(record.marriedAt).toLocaleDateString('ru-RU')} — {record.divorcedAt ? new Date(record.divorcedAt).toLocaleDateString('ru-RU') : 'сейчас'}</div></div><div className="text-right"><div className="font-mono text-xs text-[#d7bd7d]">{record.durationDays}</div><div className="text-[9px] text-slate-600">дней</div></div></div>)}{!data.marriageHistory.length && <Empty label="Истории появятся здесь, когда начнётся первая глава." />}</div></section>
  </div>;
}

function Guilds({ data, busy, action, queryName, setQueryName }: ViewProps & { queryName: string; setQueryName: (value: string) => void }) {
  const { player, leaderboard } = data;
  return <div className="fade-in grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
    <section className="glass rounded-2xl p-6 sm:p-8"><div className="grid h-12 w-12 place-items-center rounded-xl border border-[#7d9bbd]/20 bg-[#2e496b]/15 text-[#9bb8d9]"><Castle size={20} /></div><div className="mt-6 text-[10px] uppercase tracking-[.19em] text-slate-500">Ваше знамя</div><h2 className="mt-1 font-display text-3xl text-slate-100">{player.guildName || 'Без гильдии'}</h2><p className="mt-2 text-sm leading-relaxed text-slate-400">{player.guildName ? 'Ваши достижения влияют на общий престиж союза.' : 'Найдите тех, кто разделит ваш поход, или создайте новую историю вместе.'}</p>
      {!player.guildName && <div className="mt-6 flex gap-2"><input data-testid="input-guild-name" value={queryName} onChange={(event) => setQueryName(event.target.value)} placeholder="Название гильдии" className="min-w-0 flex-1 rounded-lg border border-white/[.1] bg-[#0d1420] px-3 py-2.5 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-[#7598c0]/50" /><ActionButton busy={busy} disabled={!queryName.trim()} icon={<Plus size={14} />} onClick={() => action('join_guild', undefined, queryName.trim())}>Вступить</ActionButton></div>}
      <div className="mt-7 grid grid-cols-2 gap-3"><Stat icon={<Shield size={15} />} value={player.guildName ? 'Участник' : 'Странник'} label="Статус" /><Stat icon={<Crown size={15} />} value={fmt(player.level)} label="Вклад героя" /></div>
    </section>
    <section className="glass rounded-2xl p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><SectionTitle>Рейтинг героев</SectionTitle><span className="text-[9px] uppercase tracking-[.15em] text-slate-600">Сила сезона</span></div><div className="space-y-1">{leaderboard.map((entry) => <div key={entry.rank} data-testid={`leaderboard-${entry.rank}`} className={`flex items-center gap-3 rounded-lg px-3 py-3 ${entry.name === player.name ? 'border border-[#c6a65d]/15 bg-[#c6a65d]/[.06]' : 'border border-transparent'}`}><div className={`w-7 font-mono text-xs ${entry.rank <= 3 ? 'text-[#d7bd7d]' : 'text-slate-600'}`}>{String(entry.rank).padStart(2, '0')}</div><Avatar name={entry.name} small /><div className="min-w-0 flex-1"><div className="truncate text-xs text-slate-200">{entry.name}{entry.name === player.name && <span className="ml-2 text-[9px] text-[#c9ab63]">Вы</span>}</div><div className="mt-1 text-[10px] text-slate-600">{entry.heroClass} · уровень {entry.level}</div></div><div className="font-mono text-xs text-slate-300">{fmt(entry.score)}</div><ArrowUpRight size={13} className="text-slate-600" /></div>)}{!leaderboard.length && <Empty label="Рейтинг ещё не составлен." />}</div></section>
  </div>;
}

type ViewProps = { data: GameDashboard; busy: boolean; action: (action: GameActionInput['action'], targetId?: string, targetName?: string) => void };

function ItemCard({ item, busy, action }: { item: GameItem; busy: boolean; action: ViewProps['action'] }) {
  return <article data-testid={`card-item-${item.id}`} className="glass rounded-xl p-4 transition hover:border-[#c5a760]/30"><div className="flex items-start gap-3"><ItemGlyph category={item.category} /><div className="min-w-0 flex-1"><div className="text-sm text-slate-200">{item.name}</div><div className="mt-1 text-[10px] text-slate-500">{item.category} · количество {item.quantity}</div></div><span className={`rounded-full border px-2 py-1 text-[9px] ${rarityClass(item.rarity)}`}>{rarityName(item.rarity)}</span></div><div className="mt-4 flex items-center justify-between border-t border-white/[.06] pt-3"><div className="flex gap-3 font-mono text-[10px] text-slate-500">{item.attack > 0 && <span className="text-[#d38c82]">АТК +{item.attack}</span>}{item.defense > 0 && <span className="text-[#85a9ce]">ЗАЩ +{item.defense}</span>}</div>{item.equipped ? <span className="inline-flex items-center gap-1 text-[10px] text-[#9abda3]"><Check size={12} /> Надето</span> : <button data-testid={`button-equip-${item.id}`} disabled={busy} onClick={() => action('equip_item', item.id)} className="action-btn rounded-md border border-[#799bc0]/25 px-3 py-1.5 text-[10px] text-[#a9c2df]">Надеть</button>}</div></article>;
}
function GearRow({ item, busy, action }: { item: GameItem; busy: boolean; action: ViewProps['action'] }) {
  return <div className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-black/10 p-3"><ItemGlyph category={item.category} /><div className="min-w-0 flex-1"><div className="truncate text-xs text-slate-200">{item.name}</div><div className={`mt-1 text-[9px] ${rarityClass(item.rarity)}`}>{rarityName(item.rarity)} · {item.category}</div></div><div className="flex gap-2 font-mono text-[10px] text-slate-400">{item.attack > 0 && <span>+{item.attack} АТК</span>}{item.defense > 0 && <span>+{item.defense} ЗАЩ</span>}</div><button data-testid={`button-unequip-${item.id}`} disabled={busy} onClick={() => action('equip_item', item.id)} className="action-btn rounded-md border border-white/[.1] px-2.5 py-1.5 text-[9px] text-slate-400">Сменить</button></div>;
}

function petEffect(species: string) {
  const value = species.toLowerCase();
  if (value.includes('единорог')) return 'pet-unicorn';
  if (value.includes('дракон')) return 'pet-dragon';
  if (value.includes('панда')) return 'pet-panda';
  return '';
}

function PetCard({ pet, busy, action }: { pet: GamePet; busy: boolean; action: ViewProps['action'] }) {
  return <article data-testid={`card-pet-${pet.id}`} className="glass rounded-2xl p-5 sm:p-6">
    <div className="flex items-start gap-4">
      <div className={`pet-art ${petEffect(pet.species)} relative grid h-[68px] w-[68px] shrink-0 place-items-center rounded-2xl border border-[#7a9abd]/25 bg-[radial-gradient(circle_at_50%_35%,rgba(90,126,167,.3),rgba(22,34,50,.75))] text-[#b7c9df]`}>
        <PawPrint size={27} strokeWidth={1.4} />
        {pet.active && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#17202e] bg-[#84b08c]" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl text-slate-100">{pet.name}</h3>
          <span className={`rounded-full border px-2 py-0.5 text-[8px] ${rarityClass(pet.rarity)}`}>{rarityName(pet.rarity)}</span>
          {pet.vip && <Crown size={12} className="text-[#d6b66b]" />}
        </div>
        <div className="mt-1 text-xs text-slate-500">{pet.species} · уровень {pet.level}</div>
        <div className="mt-2 text-[10px] text-slate-400">Эволюция: <span className="text-[#cdb271]">{pet.evolution}</span></div>
      </div>
    </div>
    <div className="mt-5 grid grid-cols-3 gap-2">
      <Stat icon={<Axe size={13} />} value={fmt(pet.attack)} label="Атака" />
      <Stat icon={<Heart size={13} />} value={fmt(pet.health)} label="Здоровье" />
      <Stat icon={<Sparkles size={13} />} value={fmt(pet.experience)} label="Опыт" />
    </div>
    <div className="mt-4 flex gap-2 border-t border-white/[.06] pt-4">
      <ActionButton variant="outline" busy={busy} icon={<Coins size={13} />} onClick={() => action('feed_pet', pet.id)}>Покормить</ActionButton>
      <ActionButton busy={busy} icon={<Sparkles size={13} />} onClick={() => action('evolve_pet', pet.id)}>Эволюция</ActionButton>
    </div>
  </article>;
}
function Bar({ label, value, percent, type }: { label: string; value: string; percent: number; type: 'health' | 'xp' }) {
  const safe = Math.max(0, Math.min(100, percent));
  return <div><div className="mb-1.5 flex items-center justify-between text-[10px]"><span className="text-slate-400">{label}</span><span className="font-mono text-slate-300">{value}</span></div><div className="bar-track h-1.5 overflow-hidden rounded-full"><div className={`${type === 'health' ? 'health-fill' : 'xp-fill'} h-full rounded-full transition-all duration-500`} style={{ width: `${safe}%` }} /></div></div>;
}
function ActionButton({ children, icon, onClick, busy, disabled, variant = 'gold' }: { children: string; icon: ReactNode; onClick: () => void; busy: boolean; disabled?: boolean; variant?: 'gold' | 'outline' }) {
  return <button data-testid={`button-${children.toLowerCase().replaceAll(' ', '-')}`} disabled={busy || disabled} onClick={onClick} className={`action-btn inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-[11px] font-semibold ${variant === 'gold' ? 'border border-[#d2b66c]/40 bg-[#c3a258] text-[#171811] hover:bg-[#d3b66c]' : 'border border-[#89a4c5]/25 bg-[#27405e]/35 text-[#c1d1e3] hover:border-[#9ab5d6]/45'}`}>{busy ? <span className="h-3 w-3 animate-pulse rounded-full bg-current/70" /> : icon}{children}</button>;
}
function SectionTitle({ children }: { children: string }) { return <h2 className="font-display text-lg text-slate-100">{children}</h2>; }
function Stat({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) { return <div className="rounded-lg border border-white/[.055] bg-black/[.12] p-3"><div className="mb-2 text-[#c8ac69]">{icon}</div><div className="font-mono text-sm text-slate-200">{value}</div><div className="mt-1 text-[9px] uppercase tracking-[.12em] text-slate-600">{label}</div></div>; }
function Currency({ icon, amount, tone }: { icon: ReactNode; amount: number; tone: 'gold' | 'blue' }) { return <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 font-mono text-[10px] sm:px-3 ${tone === 'gold' ? 'border-[#c5a760]/20 bg-[#c5a760]/[.06] text-[#ddc47d]' : 'border-[#789fc8]/20 bg-[#789fc8]/[.06] text-[#a8c4e5]'}`}>{icon}<span>{fmt(amount)}</span></div>; }
function Avatar({ name, small = false }: { name: string; small?: boolean }) { return <div className={`${small ? 'h-8 w-8 text-[10px]' : 'h-9 w-9 text-xs'} grid shrink-0 place-items-center rounded-full border border-[#7892b1]/25 bg-[#26364b] font-display text-[#c2d0df]`}>{name.slice(0, 1).toUpperCase()}</div>; }
function ItemGlyph({ category }: { category: string }) { const icon = category.toLowerCase().includes('weapon') || category.toLowerCase().includes('оруж') ? <Axe size={19} /> : category.toLowerCase().includes('armor') || category.toLowerCase().includes('брон') ? <Shield size={19} /> : <Gem size={19} />; return <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#7898bb]/15 bg-[#304663]/20 text-[#a8bfdc]">{icon}</div>; }
function Empty({ label }: { label: string }) { return <div className="py-8 text-center text-xs text-slate-600">{label}</div>; }
function EmptyPanel({ title, detail }: { title: string; detail: string }) { return <div className="glass flex min-h-64 flex-col items-center justify-center rounded-2xl px-6 text-center"><div className="mb-4 grid h-12 w-12 place-items-center rounded-xl border border-[#859bb6]/15 bg-[#34465e]/20 text-[#9bb0c8]"><CircleHelp size={20} /></div><h2 className="font-display text-xl text-slate-200">{title}</h2><p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500">{detail}</p></div>; }
function LoadingScreen() { return <div className="shell flex"><div className="hidden w-[248px] border-r border-white/[.06] p-6 sm:block"><div className="skeleton h-10 w-36 rounded-lg" /><div className="mt-12 space-y-3">{nav.map((item) => <div key={item.path} className="skeleton h-10 rounded-lg" />)}</div></div><main className="flex-1 p-6 sm:p-10"><div className="skeleton h-6 w-48 rounded" /><div className="skeleton mt-8 h-12 max-w-md rounded" /><div className="mt-8 grid gap-5 lg:grid-cols-[1.6fr_.8fr]"><div className="skeleton min-h-[380px] rounded-2xl" /><div className="space-y-5"><div className="skeleton h-48 rounded-2xl" /><div className="skeleton h-52 rounded-2xl" /></div></div></main></div>; }
function ErrorScreen({ onRetry }: { onRetry: () => void }) { return <div className="grid min-h-[100dvh] place-items-center p-6"><div className="glass max-w-md rounded-2xl p-8 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-[#a6535b]/25 bg-[#853b44]/10 text-[#d88387]"><Activity size={20} /></div><h1 className="mt-5 font-display text-2xl text-slate-100">Путь пока скрыт</h1><p className="mt-2 text-sm leading-relaxed text-slate-400">Не удалось загрузить сведения о мире. Проверьте соединение и попробуйте снова.</p><button data-testid="button-retry-dashboard" onClick={onRetry} className="action-btn mt-6 rounded-lg border border-[#c8a860]/30 bg-[#c8a860]/10 px-5 py-2.5 text-xs text-[#dfc77f]">Повторить попытку</button></div></div>; }

function App() { return <QueryClientProvider client={client}><AppShell /></QueryClientProvider>; }
export default App;
