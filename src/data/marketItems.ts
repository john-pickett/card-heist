import { MarketItemDefinition } from '../types/market';

export const MARKET_UNLOCK_HEISTS = __DEV__ ? 1 : 5;
export const BLACK_MARKET_ENTRY_FEE = __DEV__ ? 1 : 2000;
export const PREMIUM_UNLOCK_TIER_1 = __DEV__ ? 1 : 2000;
export const PREMIUM_UNLOCK_TIER_2 = __DEV__ ? 1 : 5000;

export const MARKET_ITEMS: MarketItemDefinition[] = [
  {
    id: 'inside-tip',
    act: 'Act One',
    icon: '🕵️',
    title: 'Inside Tip',
    flavor: 'A leak from someone on the inside.',
    effect: 'Reveal one card from an area.',
    cost: 250,
  },
  {
    id: 'false-alarm',
    act: 'Act One',
    icon: '🚨',
    title: 'False Alarm',
    flavor: 'Authorities ignore the initial report.',
    effect: 'Extend timer by one minute.',
    cost: 300,
  },
  {
    id: 'inside-switch',
    act: 'Act Two',
    icon: '🧰',
    title: 'Inside Switch',
    flavor: 'Slide the cash to a better lockbox.',
    effect: 'Move card from one vault to another.',
    cost: 350,
  },
  {
    id: 'burn-evidence',
    act: 'Act Two',
    icon: '🔥',
    title: 'Burn the Evidence',
    flavor: 'Card? What card?',
    effect: 'Discard one card (drawn now or already played).',
    cost: 350,
  },
  {
    id: 'false-trail',
    act: 'Act Three',
    icon: '🧭',
    title: 'False Trail',
    flavor: 'Can this be right?',
    effect: 'Move police back one step.',
    cost: 400,
  },
  // Premium tier 1 (2000 gold spent)
  {
    id: 'bonus-cut',
    act: 'Act One',
    icon: '💰',
    title: 'Bonus Cut',
    flavor: 'You negotiated better terms.',
    effect: '2x your reward for Act One.',
    cost: 350,
    goldUnlock: PREMIUM_UNLOCK_TIER_1,
    premiumTierId: 'tier1',
  },
  {
    id: 'time-freeze',
    act: 'Act One',
    icon: '🧊',
    title: 'Time Freeze',
    flavor: 'Time pauses as you focus on the task.',
    effect: 'Pause the timer for 15 seconds.',
    cost: 250,
    goldUnlock: PREMIUM_UNLOCK_TIER_1,
    premiumTierId: 'tier1',
  },
  // Premium tier 2 (5000 gold spent)
  {
    id: 'peek-blueprint',
    act: 'Act One',
    icon: '🗺️',
    title: 'Peek the Blueprint',
    flavor: 'You get a quick glance at the security layout.',
    effect: 'Reveal both cards from an area.',
    cost: 400,
    goldUnlock: PREMIUM_UNLOCK_TIER_2,
    premiumTierId: 'tier2',
  },
  {
    id: 'quick-fingers',
    act: 'Act One',
    icon: '🖐️',
    title: 'Quick Fingers',
    flavor: 'Your skill with the tools feels effortless.',
    effect: 'Instantly lock in one correct area without playing cards.',
    cost: 300,
    goldUnlock: PREMIUM_UNLOCK_TIER_2,
    premiumTierId: 'tier2',
  },
  {
    id: 'lions-share',
    act: 'Act One',
    icon: '🦁',
    title: "Lion's Share",
    flavor: 'One night, massive haul.',
    effect: '4x your reward.',
    cost: 500,
    goldUnlock: PREMIUM_UNLOCK_TIER_2,
    premiumTierId: 'tier2',
  },
];

export const MARKET_ACT_ORDER: MarketItemDefinition['act'][] = ['Act One', 'Act Two', 'Act Three'];
