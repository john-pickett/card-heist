export type TutorialAct = 'act1' | 'act2' | 'act3';
export type TutorialSeen = Record<TutorialAct, boolean>;

export const TUTORIALS_STORAGE_KEY = 'solitaire:tutorials-seen-v1';
export const DEFAULT_TUTORIALS: TutorialSeen = {
  act1: false,
  act2: false,
  act3: false,
};
