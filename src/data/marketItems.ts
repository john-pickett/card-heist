import { MarketItemDefinition } from '../types/market';

export const MARKET_UNLOCK_HEISTS = 5;

export const MARKET_ITEMS: MarketItemDefinition[] = [
  {
    id: 'inside-tip',
    act: 'Act One',
    icon: '🕵️',
    title: 'Inside Tip',
    flavor: 'A leak from someone on the inside.',
    effect: 'Reveal one card from an area.',
    cost: 10,
  },
  {
    id: 'false-alarm',
    act: 'Act One',
    icon: '🚨',
    title: 'False Alarm',
    flavor: 'Authorities ignore the initial report.',
    effect: 'Extend timer by one minute.',
    cost: 20,
  },
  {
    id: 'inside-switch',
    act: 'Act Two',
    icon: '🧰',
    title: 'Inside Switch',
    flavor: 'Slide the cash to a better lockbox.',
    effect: 'Move card from one vault to another.',
    cost: 15,
  },
  {
    id: 'burn-evidence',
    act: 'Act Two',
    icon: '🔥',
    title: 'Burn the Evidence',
    flavor: 'Card? What card?',
    effect: 'Discard one card (drawn now or already played).',
    cost: 15,
  },
  {
    id: 'false-trail',
    act: 'Act Three',
    icon: '🧭',
    title: 'False Trail',
    flavor: 'Can this be right?',
    effect: 'Move police back one step.',
    cost: null,
  },
];

export const MARKET_ACT_ORDER: MarketItemDefinition['act'][] = ['Act One', 'Act Two', 'Act Three'];
