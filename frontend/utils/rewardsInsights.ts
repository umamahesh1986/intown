export interface RewardsInsights {
  thisMonthEarned: number | null;
  lastMonthEarned: number | null;
  yesterdayEarned: number | null;
}

const pointsOf = (t: any) => {
  const v = Number(t?.points ?? t?.pointsEarned ?? t?.earnedPoints);
  return Number.isFinite(v) ? Math.max(0, v) : 0;
};

const dateOf = (t: any): Date | null => {
  const raw = t?.createdAt ?? t?.transactionDate ?? t?.date ?? t?.timestamp ?? t?.earnedAt ?? t?.createdOn;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Month-over-month and yesterday deltas for the rewards card; nulls when transactions carry no dates.
export const computeRewardsInsights = (transactions: unknown[], now = new Date()): RewardsInsights => {
  const dated = (transactions || []).map((t) => ({ pts: pointsOf(t), at: dateOf(t) })).filter((x) => x.at) as { pts: number; at: Date }[];
  if (dated.length === 0) return { thisMonthEarned: null, lastMonthEarned: null, yesterdayEarned: null };

  const y = now.getFullYear();
  const m = now.getMonth();
  const sameMonth = (d: Date, yy: number, mm: number) => d.getFullYear() === yy && d.getMonth() === mm;
  const lastY = m === 0 ? y - 1 : y;
  const lastM = m === 0 ? 11 : m - 1;
  const yesterday = new Date(y, m, now.getDate() - 1);
  const isYesterday = (d: Date) => d.getFullYear() === yesterday.getFullYear() && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate();

  const sum = (pred: (d: Date) => boolean) => dated.filter((x) => pred(x.at)).reduce((s, x) => s + x.pts, 0);
  return {
    thisMonthEarned: sum((d) => sameMonth(d, y, m)),
    lastMonthEarned: sum((d) => sameMonth(d, lastY, lastM)),
    yesterdayEarned: sum(isYesterday),
  };
};

export interface RewardTier {
  name: string;
  min: number;
}

// Tier ladder by lifetime INPoints earned
export const REWARD_TIERS: RewardTier[] = [
  { name: 'Bronze', min: 0 },
  { name: 'Silver', min: 25 },
  { name: 'Gold', min: 50 },
  { name: 'Platinum', min: 100 },
  { name: 'Diamond', min: 250 },
];

export const tierFor = (totalEarned: number) => {
  const current = [...REWARD_TIERS].reverse().find((t) => totalEarned >= t.min) ?? REWARD_TIERS[0];
  const next = REWARD_TIERS.find((t) => t.min > current.min) ?? null;
  return { current, next };
};
