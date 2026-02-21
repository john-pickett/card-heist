import { Card } from './card';

export interface EscapeCard {
  card: Card;
  instanceId: string; // monotonic "ec-N" — player+police share one deck
}

export type EscapePhase =
  | 'player_turn'
  | 'police_thinking'  // 900 ms: "Police searching hand..."
  | 'police_reveal'    // 1400 ms: show police action result
  | 'won'
  | 'lost';

export type MeldType = 'set' | 'run';

export interface MeldResult { valid: true; type: MeldType; }
export interface MeldError  { valid: false; reason: string; }
export type MeldValidation = MeldResult | MeldError;

export interface EscapeState {
  phase: EscapePhase;
  deck: EscapeCard[];
  playerHand: EscapeCard[];   // always 8 during play
  policeHand: EscapeCard[];   // always 7, never shown to player
  playerPosition: number;     // 1–6, starts 4
  policePosition: number;     // 1–6, starts 6
  selectedIds: string[];      // instanceIds of selected player cards
  errorMessage: string | null;  // auto-clears after 2 s
  policeMessage: string | null; // shown during police turn
  policeLastPlay: EscapeCard[] | null; // cards police played last turn
  outOfPlay: EscapeCard[];    // all cards no longer in deck
  infoMessage: string | null; // reshuffle notice, auto-clears after 3 s
  lastMeldType: MeldType | null;
  playerMelds: number;
  playerSets: number;
  playerRuns: number;
  playerCardsDrawn: number;
  playerDiscardCount: number;
  policeMelds: number;
  policeCardsDrawn: number;
  turnsPlayed: number;
}

export interface EscapeActions {
  initGame: () => void;
  toggleSelect: (instanceId: string) => void;
  layMeld: () => void;
  discard: () => void;
  runPoliceTurn: () => void;   // called by screen useEffect after 900 ms
  endPoliceTurn: () => void;   // called by screen useEffect after 1400 ms
  clearError: () => void;
  clearInfo: () => void;
}
