export const PATTERN_RECOGNITION_REWARDS = {
  ELITE_GOLD: 100,       // ≤ ELITE_THRESHOLD false attempts
  SOLID_GOLD: 50,        // ≤ SOLID_THRESHOLD false attempts
  BASE_GOLD: 25,         // > SOLID_THRESHOLD false attempts
  ELITE_THRESHOLD: 4,
  SOLID_THRESHOLD: 8,
} as const;

export interface HeistItem {
  id: string;
  name: string;
  emoji: string;
}

export interface GameCard {
  instanceId: string;
  itemId: string;
  name: string;
  emoji: string;
}

export const HEIST_ITEMS: HeistItem[] = [
  { id: 'guard-schedule',   name: 'Guard Schedule',   emoji: '📋' },
  { id: 'fake-id',          name: 'Fake ID',           emoji: '🪪' },
  { id: 'vault-blueprint',  name: 'Vault Blueprint',   emoji: '🗺️' },
  { id: 'getaway-car',      name: 'Getaway Car',       emoji: '🚗' },
  { id: 'laser-cutter',     name: 'Laser Cutter',      emoji: '⚡' },
  { id: 'disguise-kit',     name: 'Disguise Kit',      emoji: '🎭' },
  { id: 'security-badge',   name: 'Security Badge',    emoji: '🏷️' },
  { id: 'safecracker',      name: 'Safecracker',       emoji: '🔓' },
  { id: 'lookout-post',     name: 'Lookout Post',      emoji: '👁️' },
  { id: 'earpiece',         name: 'Earpiece',          emoji: '🎧' },
  { id: 'smoke-grenade',    name: 'Smoke Grenade',     emoji: '💨' },
  { id: 'lockpick-set',     name: 'Lockpick Set',      emoji: '🗝️' },
  { id: 'burner-phone',     name: 'Burner Phone',      emoji: '📱' },
  { id: 'bribe-money',      name: 'Bribe Money',       emoji: '💵' },
  { id: 'crowbar',          name: 'Crowbar',           emoji: '🪛' },
  { id: 'security-camera',  name: 'Security Camera',   emoji: '📷' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildGameDeck(pairCount = 8): GameCard[] {
  const selected = shuffle(HEIST_ITEMS).slice(0, pairCount);
  const pairs: GameCard[] = selected.flatMap(item => [
    { instanceId: `${item.id}-0`, itemId: item.id, name: item.name, emoji: item.emoji },
    { instanceId: `${item.id}-1`, itemId: item.id, name: item.name, emoji: item.emoji },
  ]);
  return shuffle(pairs);
}

export function computeReward(falseAttempts: number): number {
  if (falseAttempts <= PATTERN_RECOGNITION_REWARDS.ELITE_THRESHOLD) {
    return PATTERN_RECOGNITION_REWARDS.ELITE_GOLD;
  }
  if (falseAttempts <= PATTERN_RECOGNITION_REWARDS.SOLID_THRESHOLD) {
    return PATTERN_RECOGNITION_REWARDS.SOLID_GOLD;
  }
  return PATTERN_RECOGNITION_REWARDS.BASE_GOLD;
}
