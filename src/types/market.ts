export type MarketAct = 'Act One' | 'Act Two' | 'Act Three';

export interface MarketItemDefinition {
  id: string;
  act: MarketAct;
  icon: string;
  title: string;
  flavor: string;
  effect: string;
  cost: number | null;
}
