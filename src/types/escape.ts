import { Card } from './card';

export interface EscapeCard {
  card: Card;
  instanceId: string; // monotonic "ec-N" — player+police share one deck
}

export type EscapePhase =
  | 'player_turn'
  | 'police_thinking'      // 900ms: animating police advance
  | 'awaiting_continue'    // player must tap Continue to proceed
  | 'won'
  | 'lost';

export type MeldType = 'set' | 'run';

export interface MeldResult { valid: true; type: MeldType; }
export interface MeldError  { valid: false; reason: string; }
export type MeldValidation = MeldResult | MeldError;

export interface TurnLogEntry {
  turn: number;
  playerAction: string;   // e.g. "Laid a match (set, 1 step)"
  policeAction: string;   // e.g. "Police closed in — now at step 4"
  playerPos: number;
  policePos: number;
}

export interface EscapeState {
  phase: EscapePhase;
  deck: EscapeCard[];
  playerHand: EscapeCard[];   // always 8 during play
  policeHand: EscapeCard[];   // always empty, kept for history compatibility
  playerPosition: number;     // 1–6, starts 4
  policePosition: number;     // 1–6, starts 6
  selectedIds: string[];      // instanceIds of selected player cards
  errorMessage: string | null;  // auto-clears after 2 s
  policeMessage: string | null; // shown during police turn
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
  turnLog: TurnLogEntry[];
  lastPlayerAction: string | null;
}

export interface EscapeActions {
  initGame: () => void;
  toggleSelect: (instanceId: string) => void;
  layMeld: () => void;
  discard: () => void;
  runPoliceTurn: () => void;   // called by screen useEffect after 900 ms
  endPoliceTurn: () => void;   // called on Continue button press
  clearError: () => void;
  clearInfo: () => void;
  activateFalseTrail: () => void;
}
