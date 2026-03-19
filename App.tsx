import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Act1BridgeScreen } from './src/screens/Act1BridgeScreen';
import { Act2BridgeScreen } from './src/screens/Act2BridgeScreen';
import { EscapeScreen } from './src/screens/EscapeScreen';
import { GameOverScreen } from './src/screens/GameOverScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { HideoutScreen } from './src/screens/HideoutScreen';
import { HideoutIntroScreen } from './src/screens/HideoutIntroScreen';
import { BlackMarketIntroScreen } from './src/screens/BlackMarketIntroScreen';
import { BlackMarketUnlockedScreen } from './src/screens/BlackMarketUnlockedScreen';
import { MarketScreen } from './src/screens/MarketScreen';
import { VaultScreen } from './src/screens/VaultScreen';
import { DevelopmentScreen } from './src/screens/DevelopmentScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SneakInScreen } from './src/screens/SneakInScreen';
import { crewMembers } from './src/data/crew';
import { useCrewStore } from './src/store/crewStore';
import { CrewMemberId } from './src/types/crew';
import { useEscapeStore } from './src/store/escapeStore';
import { useHistoryStore } from './src/store/historyStore';
import { useInventoryStore } from './src/store/inventoryStore';
import { useReckoningStore } from './src/store/vaultStore';
import { useSneakInStore } from './src/store/sneakInStore';
import { useSettingsStore } from './src/store/settingsStore';
import {
  BLACK_MARKET_ENTRY_FEE,
  HIDEOUT_PRICE,
  MARKET_ACT_ORDER,
  MARKET_ITEMS,
  MARKET_UNLOCK_HEISTS,
} from './src/data/marketItems';
import { MarketAct, MarketItemDefinition } from './src/types/market';
import { CrewSelectionModal } from './src/components/CrewSelectionModal';
import { PerkSelectionModal } from './src/components/PerkSelectionModal';
import {
  DEFAULT_TUTORIALS,
  TUTORIALS_STORAGE_KEY,
  TutorialAct,
  TutorialSeen,
} from './src/constants/tutorials';
import { Act1Record, Act2Record, Act2VaultResult, Act3Record, HeistRecord } from './src/types/history';
import { InventoryEntry } from './src/store/inventoryStore';
import theme from './src/theme';

type Tab = 'home' | 'market' | 'hideout' | 'settings';
type GameFlow = 'home' | 'act1' | 'act1-bridge' | 'act2' | 'act2-bridge' | 'act3' | 'act3-gameover';
type DevLaunchTarget = 'act1' | 'act2' | 'act3' | 'act1-summary' | 'act2-summary' | 'gameover' | null;
type UsedBuff = {
  itemId: string;
  icon: string;
  title: string;
  act: MarketAct;
  quantity: number;
};
type DevSummaryData = {
  crewIds: CrewMemberId[];
  buffsUsed: UsedBuff[];
  jinxApplied: boolean;
};

function toInventoryCounts(items: InventoryEntry[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.itemId] = entry.quantity;
    return acc;
  }, {});
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sampleSize<T>(items: T[], count: number): T[] {
  return shuffle(items).slice(0, Math.max(0, Math.min(count, items.length)));
}

function getBaseAct1Bonus(elapsedMs: number | null, timedOut: boolean): number {
  if (timedOut || elapsedMs === null) return 0;
  const elapsedSec = Math.floor(elapsedMs / 1000);
  if (elapsedSec <= 15) return 500;
  if (elapsedSec <= 30) return 400;
  if (elapsedSec <= 60) return 250;
  if (elapsedSec <= 90) return 150;
  if (elapsedSec <= 120) return 100;
  return 0;
}

function buildRandomAct1Record(): Act1Record {
  const timedOut = randomBool(0.14);
  const elapsedMs = timedOut ? null : randomInt(12_000, 118_000);
  const baseBonus = getBaseAct1Bonus(elapsedMs, timedOut);
  const bonusCutApplied = baseBonus > 0 && randomBool(0.25);
  const ticoApplied = baseBonus > 0 && randomBool(0.2);
  let timingBonus = baseBonus;
  if (bonusCutApplied) timingBonus *= 2;
  if (ticoApplied) timingBonus = Math.round(timingBonus * 1.5);

  return {
    elapsedMs,
    timedOut,
    baseBonus,
    timingBonus,
    bonusCutApplied,
    ticoApplied,
    totalMoves: randomInt(6, 18),
  };
}

function buildRandomAct2Summary() {
  const offshoreAccountActive = randomBool(0.28);
  const allInActive = randomBool(0.24);
  const fuzzyMathActive = randomBool(0.22);
  const deadlockActive = randomBool(0.24);
  const vaultCount = offshoreAccountActive ? 4 : 3;
  const exactVaultIndex = randomBool(0.75) ? randomInt(0, vaultCount - 1) : -1;
  let bishopApplied = randomBool(0.25) && exactVaultIndex >= 0;

  const vaultResults: Act2VaultResult[] = Array.from({ length: vaultCount }, (_, index) => {
    const baseTarget = offshoreAccountActive && index === vaultCount - 1 ? 42 : randomInt(16, 21);
    const target = allInActive ? baseTarget * 2 : baseTarget;

    let result: Act2VaultResult['result'];
    if (index === exactVaultIndex) {
      result = 'exact';
    } else {
      const roll = Math.random();
      result = roll < 0.25 ? 'busted' : roll < 0.7 ? 'under' : 'exact';
    }

    let sum: number;
    if (result === 'exact') {
      const exactFloor = deadlockActive ? Math.max(1, target - 3) : target;
      sum = randomInt(exactFloor, target);
    } else if (result === 'under') {
      sum = randomInt(Math.max(1, target - 9), Math.max(1, target - 1));
    } else {
      sum = randomInt(target + 1, target + (fuzzyMathActive ? 8 : 6));
    }

    const baseGold = result === 'busted' ? 0 : result === 'exact' ? sum * 20 : sum * 10;
    const applyBishop = bishopApplied && index === exactVaultIndex;
    const gold = applyBishop ? baseGold * 2 : baseGold;

    return {
      id: index + 1,
      target,
      sum,
      result,
      gold,
      bishopApplied: applyBishop,
    };
  });

  if (!vaultResults.some(vault => vault.bishopApplied)) {
    bishopApplied = false;
  }

  const score = vaultResults.reduce((sum, vault) => sum + vault.gold, 0);

  return {
    vaultResults,
    act2Record: {
      score,
      exactHits: vaultResults.filter(vault => vault.result === 'exact').length,
      busts: vaultResults.filter(vault => vault.result === 'busted').length,
      aceOnes: randomInt(0, 3),
      aceElevens: randomInt(0, 3),
      allInActive,
      offshoreAccountActive,
      fuzzyMathActive,
      deadlockActive,
      bishopApplied,
    } as Act2Record,
    act2Gold: score,
  };
}

function buildRandomCrew(requiredIds: CrewMemberId[] = []): CrewMemberId[] {
  const uniqueRequired = [...new Set(requiredIds)];
  const optionalIds = crewMembers.map(member => member.id).filter(id => !uniqueRequired.includes(id));
  const extraCount = randomInt(0, Math.max(0, 3 - uniqueRequired.length));
  return shuffle([...uniqueRequired, ...sampleSize(optionalIds, extraCount)]);
}

function buildRandomBuffsUsed(): UsedBuff[] {
  const count = randomInt(0, 4);
  return sampleSize(MARKET_ITEMS, count).map(item => ({
    itemId: item.id,
    icon: item.icon,
    title: item.title,
    act: item.act,
    quantity: randomInt(1, 2),
  }));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [settingsScreen, setSettingsScreen] = useState<'main' | 'history' | 'development'>('main');
  const [gameFlow, setGameFlow] = useState<GameFlow>('home');
  const [act1TimeBonus, setAct1TimeBonus] = useState(0);
  const [act2Score, setAct2Score] = useState(0);
  const [campaignStartTime, setCampaignStartTime] = useState<number | null>(null);
  const [act1Record, setAct1Record] = useState<Act1Record | null>(null);
  const [act2Record, setAct2Record] = useState<Act2Record | null>(null);
  const [tutorialsSeen, setTutorialsSeen] = useState<TutorialSeen>(DEFAULT_TUTORIALS);
  const [tutorialsReady, setTutorialsReady] = useState(false);
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [devLaunchAct, setDevLaunchAct] = useState<DevLaunchTarget>(null);
  const [devSummaryData, setDevSummaryData] = useState<DevSummaryData | null>(null);
  const [act3Won, setAct3Won] = useState<boolean | null>(null);
  const [act2VaultResults, setAct2VaultResults] = useState<Act2VaultResult[]>([]);
  const [heistStartInventory, setHeistStartInventory] = useState<Record<string, number> | null>(null);
  const [perkModalConfig, setPerkModalConfig] = useState<{
    act: 'act1' | 'act2' | 'act3';
    perks: MarketItemDefinition[];
  } | null>(null);
  const [crewModalVisible, setCrewModalVisible] = useState(false);

  const lifetimeGold = useHistoryStore(s => s.lifetimeGold);
  const spentGold = useHistoryStore(s => s.spentGold);
  const spendGold = useHistoryStore(s => s.spendGold);
  const heistCount = useHistoryStore(s => s.records.length);
  const availableGold = lifetimeGold - spentGold;
  const currentRunNumber = heistCount + 1;
  const inventoryItems = useInventoryStore(s => s.items);
  const blackMarketIntroSeen = useSettingsStore(s => s.blackMarketIntroSeen);
  const setBlackMarketIntroSeen = useSettingsStore(s => s.setBlackMarketIntroSeen);
  const blackMarketUnlockedStorySeen = useSettingsStore(s => s.blackMarketUnlockedStorySeen);
  const setBlackMarketUnlockedStorySeen = useSettingsStore(s => s.setBlackMarketUnlockedStorySeen);
  const hideoutPurchased = useSettingsStore(s => s.hideoutPurchased);
  const setHideoutPurchased = useSettingsStore(s => s.setHideoutPurchased);
  const crewUnlockedIds = useCrewStore(s => s.unlockedIds);
  const activeHeistCrew = useCrewStore(s => s.activeHeistCrew);

  const act1Bonus = act1TimeBonus;
  const totalScore = act1Bonus + act2Score;
  const totalInventoryCount = inventoryItems.reduce((sum, entry) => sum + entry.quantity, 0);

  const inventoryRows = inventoryItems
    .map(entry => {
      const item = MARKET_ITEMS.find(candidate => candidate.id === entry.itemId);
      return item ? { item, quantity: entry.quantity } : null;
    })
    .filter((row): row is { item: (typeof MARKET_ITEMS)[number]; quantity: number } => row !== null)
    .sort((a, b) => {
      const actSort = MARKET_ACT_ORDER.indexOf(a.item.act) - MARKET_ACT_ORDER.indexOf(b.item.act);
      if (actSort !== 0) return actSort;
      return a.item.title.localeCompare(b.item.title);
    });

  const activeAct: MarketAct | null =
    gameFlow === 'act1' ? 'Act One' :
    gameFlow === 'act2' ? 'Act Two' :
    gameFlow === 'act3' ? 'Act Three' :
    null;

  const activeInventoryRows = activeAct
    ? inventoryRows.filter(row => row.item.act === activeAct)
    : [];
  const otherInventoryRows = activeAct
    ? inventoryRows.filter(row => row.item.act !== activeAct)
    : inventoryRows;

  const usedBuffs: UsedBuff[] = (() => {
    if (!heistStartInventory) return [];
    const currentCounts = toInventoryCounts(inventoryItems);
    const usages: UsedBuff[] = [];
    Object.entries(heistStartInventory).forEach(([itemId, startQty]) => {
      const endQty = currentCounts[itemId] ?? 0;
      const usedQty = startQty - endQty;
      if (usedQty <= 0) return;
      const item = MARKET_ITEMS.find(entry => entry.id === itemId);
      if (!item) return;
      usages.push({
        itemId,
        icon: item.icon,
        title: item.title,
        act: item.act,
        quantity: usedQty,
      });
    });
    return usages.sort((a, b) => {
      const actSort = MARKET_ACT_ORDER.indexOf(a.act) - MARKET_ACT_ORDER.indexOf(b.act);
      if (actSort !== 0) return actSort;
      return a.title.localeCompare(b.title);
    });
  })();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(TUTORIALS_STORAGE_KEY);
        if (!mounted) return;
        if (!raw) {
          setTutorialsReady(true);
          return;
        }
        const parsed = JSON.parse(raw) as Partial<TutorialSeen>;
        setTutorialsSeen({
          act1: !!parsed.act1,
          act2: !!parsed.act2,
          act3: !!parsed.act3,
        });
      } catch {
        setTutorialsSeen(DEFAULT_TUTORIALS);
      } finally {
        if (mounted) setTutorialsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!tutorialsReady) return;
    AsyncStorage.setItem(TUTORIALS_STORAGE_KEY, JSON.stringify(tutorialsSeen)).catch(() => {});
  }, [tutorialsReady, tutorialsSeen]);

  const dismissTutorial = (act: TutorialAct) => {
    setTutorialsSeen(prev => ({ ...prev, [act]: true }));
  };

  const handleResetTutorials = async () => {
    setTutorialsSeen(DEFAULT_TUTORIALS);
    await AsyncStorage.removeItem(TUTORIALS_STORAGE_KEY);
  };

  const handleResetHeistData = async () => {
    useHistoryStore.getState().clearHistory();
    useInventoryStore.getState().clearInventory();
    useSneakInStore.getState().initGame();
    useReckoningStore.getState().initGame();
    useEscapeStore.getState().initGame();
    resetCampaignState();
    setGameFlow('home');
    setActiveTab('settings');
  };

  function getActPerksInInventory(act: MarketItemDefinition['act']): MarketItemDefinition[] {
    const inventory = useInventoryStore.getState().items;
    return MARKET_ITEMS.filter(
      item => item.type === 'perk'
        && item.act === act
        && inventory.some(e => e.itemId === item.id && e.quantity > 0)
    );
  }

  const handleStartGame = () => {
    setDevLaunchAct(null);
    setDevSummaryData(null);
    setHeistStartInventory(toInventoryCounts(useInventoryStore.getState().items));
    setCampaignStartTime(Date.now());
    if (useCrewStore.getState().unlockedIds.length > 0) {
      setCrewModalVisible(true);
    } else {
      proceedAfterCrewSelection();
    }
  };

  const proceedAfterCrewSelection = () => {
    const activeCrewIds = useCrewStore.getState().activeHeistCrew;
    const perks = getActPerksInInventory('Act One');
    if (perks.length > 0) {
      setPerkModalConfig({ act: 'act1', perks });
    } else {
      useSneakInStore.getState().initGame(activeCrewIds);
      setGameFlow('act1');
    }
  };

  const handleCrewModalApply = (selectedIds: CrewMemberId[]) => {
    useCrewStore.getState().setActiveHeistCrew(selectedIds);
    setCrewModalVisible(false);
    proceedAfterCrewSelection();
  };

  const handleLaunchActForTesting = (act: 'act1' | 'act2' | 'act3' | 'act1-summary' | 'act2-summary' | 'gameover') => {
    setDevLaunchAct(act);
    setDevSummaryData(null);
    setActiveTab('home');
    resetCampaignState();
    setHeistStartInventory(toInventoryCounts(useInventoryStore.getState().items));

    if (act === 'act1') {
      const act1PerkIds = getActPerksInInventory('Act One').map(p => p.id);
      useSneakInStore.getState().initGame([], act1PerkIds);
      setCampaignStartTime(Date.now());
      setGameFlow('act1');
      return;
    }

    if (act === 'act2') {
      const act2PerkIds = getActPerksInInventory('Act Two').map(p => p.id);
      useReckoningStore.getState().initGame(act2PerkIds);
      setCampaignStartTime(Date.now());
      setGameFlow('act2');
      return;
    }

    if (act === 'act1-summary') {
      const randomAct1Record = buildRandomAct1Record();
      setCampaignStartTime(Date.now() - randomInt(60_000, 7 * 60_000));
      setAct1TimeBonus(randomAct1Record.timingBonus);
      setAct1Record(randomAct1Record);
      setGameFlow('act1-bridge');
      return;
    }

    if (act === 'act2-summary') {
      const randomAct1Record = buildRandomAct1Record();
      const randomAct2Summary = buildRandomAct2Summary();
      setCampaignStartTime(Date.now() - randomInt(2 * 60_000, 10 * 60_000));
      setAct1TimeBonus(randomAct1Record.timingBonus);
      setAct1Record(randomAct1Record);
      setAct2Score(randomAct2Summary.act2Gold);
      setAct2Record(randomAct2Summary.act2Record);
      setAct2VaultResults(randomAct2Summary.vaultResults);
      setGameFlow('act2-bridge');
      return;
    }

    if (act === 'gameover') {
      const randomAct1Record = buildRandomAct1Record();
      const randomAct2Summary = buildRandomAct2Summary();
      const won = randomBool(0.55);
      const jinxApplied = !won && randomBool(0.35);
      const requiredCrew: CrewMemberId[] = [];
      if (randomAct1Record.ticoApplied) requiredCrew.push('tico');
      if (randomAct2Summary.act2Record.bishopApplied) requiredCrew.push('bishop');
      if (randomAct2Summary.act2Record.deadlockActive) requiredCrew.push('deadlock');
      if (jinxApplied) requiredCrew.push('jinx');

      setCampaignStartTime(Date.now() - randomInt(3 * 60_000, 14 * 60_000));
      setAct1TimeBonus(randomAct1Record.timingBonus);
      setAct1Record(randomAct1Record);
      setAct2Score(randomAct2Summary.act2Gold);
      setAct2Record(randomAct2Summary.act2Record);
      setAct2VaultResults(randomAct2Summary.vaultResults);
      setAct3Won(won);
      setDevSummaryData({
        crewIds: buildRandomCrew(requiredCrew),
        buffsUsed: buildRandomBuffsUsed(),
        jinxApplied,
      });
      setGameFlow('act3-gameover');
      return;
    }

    useEscapeStore.getState().initGame();
    setCampaignStartTime(Date.now());
    setGameFlow('act3');
  };

  const handleReturnToDevelopmentFromAct = () => {
    useSneakInStore.getState().initGame();
    useReckoningStore.getState().initGame();
    useEscapeStore.getState().initGame();
    resetCampaignState();
    setDevLaunchAct(null);
    setGameFlow('home');
    setActiveTab('settings');
    setSettingsScreen('development');
  };

  const handleSneakInEnd = () => {
    const state = useSneakInStore.getState();
    const timedOut = state.phase === 'timeout';
    let elapsedMs: number | null = null;
    let timingBonus = 0;
    if (!timedOut && state.startTime && state.endTime) {
      elapsedMs = state.endTime - state.startTime;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      timingBonus =
        elapsedSec <= 15 ? 500 :
        elapsedSec <= 30 ? 400 :
        elapsedSec <= 60 ? 250 :
        elapsedSec <= 90 ? 150 :
        elapsedSec <= 120 ? 100 : 0;
    }
    const baseBonus = timingBonus;
    const inv = useInventoryStore.getState();
    const bonusCutApplied = timingBonus > 0 && useSneakInStore.getState().bonusCutActive;
    if (bonusCutApplied) {
      timingBonus *= 2;
      inv.removeItem('bonus-cut');
    }
    const activeCrewIds = useCrewStore.getState().activeHeistCrew;
    const ticoApplied = timingBonus > 0 && activeCrewIds.includes('tico');
    if (ticoApplied) {
      timingBonus = Math.round(timingBonus * 1.5);
    }
    setAct1TimeBonus(timingBonus);
    setAct1Record({ elapsedMs, timedOut, baseBonus, timingBonus, bonusCutApplied, ticoApplied, totalMoves: state.totalMoves });
    setGameFlow('act1-bridge');
  };

  const handleContinueToAct2 = () => {
    const perks = getActPerksInInventory('Act Two');
    if (perks.length > 0) {
      setPerkModalConfig({ act: 'act2', perks });
    } else {
      useReckoningStore.getState().initGame([]);
      setGameFlow('act2');
    }
  };

  const handleCrackTheVaultsEnd = () => {
    const state = useReckoningStore.getState();
    const score = state.finalScore ?? 0;

    const activeCrewIds = useCrewStore.getState().activeHeistCrew;
    const bishopActive = activeCrewIds.includes('bishop');
    const allInMult = state.allInActive ? 2 : 1;
    let bishopBonus = 0;
    let bishopApplied = false;

    const vaultBreakdown: Act2VaultResult[] = state.vaults.map(vault => {
      const isExact = state.deadlockActive
        ? vault.sum >= vault.target - 3 && vault.sum <= vault.target
        : vault.sum === vault.target;
      const result = vault.isBusted ? 'busted' : isExact ? 'exact' : 'under';
      const baseGold = vault.isBusted ? 0 : isExact ? vault.sum * 2 * 10 : vault.sum * 10;
      let gold = baseGold;
      let vaultBishopApplied = false;

      if (bishopActive && !bishopApplied && result === 'exact' && vault.id === state.firstExactVaultId) {
        gold = baseGold * 4;
        bishopBonus = baseGold * allInMult * 3;
        bishopApplied = true;
        vaultBishopApplied = true;
      }

      return {
        id: vault.id + 1,
        target: vault.target,
        sum: vault.sum,
        result,
        gold,
        bishopApplied: vaultBishopApplied,
      };
    });

    const finalAct2Score = score + bishopBonus;
    setAct2Score(finalAct2Score);
    setAct2VaultResults(vaultBreakdown);
    setAct2Record({
      score: finalAct2Score,
      exactHits: state.exactHits,
      busts: state.busts,
      aceOnes: state.aceOnes,
      aceElevens: state.aceElevens,
      allInActive: state.allInActive,
      offshoreAccountActive: state.offshoreAccountActive,
      fuzzyMathActive: state.fuzzyMathActive,
      deadlockActive: state.deadlockActive,
      bishopApplied,
    });
    setGameFlow('act2-bridge');
  };

  const handleContinueToAct3 = () => {
    const perks = getActPerksInInventory('Act Three');
    if (perks.length > 0) {
      setPerkModalConfig({ act: 'act3', perks });
    } else {
      useEscapeStore.getState().initGame();
      setGameFlow('act3');
    }
  };

  const handlePerkModalApply = (selectedIds: string[]) => {
    if (!perkModalConfig) return;
    const { act } = perkModalConfig;
    setPerkModalConfig(null);
    if (act === 'act1') {
      useSneakInStore.getState().initGame(useCrewStore.getState().activeHeistCrew, selectedIds);
      setGameFlow('act1');
    } else if (act === 'act2') {
      useReckoningStore.getState().initGame(selectedIds);
      setGameFlow('act2');
    } else if (act === 'act3') {
      // Wire selectedIds into escapeStore.initGame when Act Three perks are added
      useEscapeStore.getState().initGame();
      setGameFlow('act3');
    }
  };

  const handleAct3GameOver = (won: boolean) => {
    setAct3Won(won);
    setGameFlow('act3-gameover');
  };

  const recordCurrentHeist = () => {
    if (!campaignStartTime || !act1Record || !act2Record) return;
    const escapeState = useEscapeStore.getState();
    const won = escapeState.phase === 'won';
    const jinxApplied = !won && useCrewStore.getState().activeHeistCrew.includes('jinx');
    const payoutGold = won ? totalScore : Math.round(totalScore * (jinxApplied ? 0.80 : 0.33));
    const act3: Act3Record = {
      won,
      jinxApplied,
      playerMelds: escapeState.playerMelds,
      playerSets: escapeState.playerSets,
      playerRuns: escapeState.playerRuns,
      playerCardsDrawn: escapeState.playerCardsDrawn,
      policeMelds: escapeState.policeMelds,
      policeCardsDrawn: escapeState.policeCardsDrawn,
      turnsPlayed: escapeState.turnsPlayed,
    };
    const record: HeistRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      won,
      totalGold: payoutGold,
      act1: act1Record,
      act2: act2Record,
      act3,
      durationMs: Date.now() - campaignStartTime,
    };
    useHistoryStore.getState().recordHeist(record);
    useCrewStore.getState().recordHeistEnd();
  };

  const resetCampaignState = () => {
    setAct1TimeBonus(0);
    setAct2Score(0);
    setCampaignStartTime(null);
    setAct1Record(null);
    setAct2Record(null);
    setAct3Won(null);
    setAct2VaultResults([]);
    setHeistStartInventory(null);
    setDevSummaryData(null);
  };

  const handlePlayAgain = () => {
    if (devLaunchAct) {
      handleReturnToDevelopmentFromAct();
      return;
    }
    recordCurrentHeist();
    resetCampaignState();
    setGameFlow('home');
  };

  const handleReturnHome = () => {
    if (devLaunchAct) {
      handleReturnToDevelopmentFromAct();
      return;
    }
    recordCurrentHeist();
    resetCampaignState();
    setGameFlow('home');
  };

  const handleCancelActOne = () => {
    useSneakInStore.getState().initGame();
    useReckoningStore.getState().initGame();
    useEscapeStore.getState().initGame();
    resetCampaignState();
    setGameFlow('home');
  };

  const renderHomeTab = () => {
    switch (gameFlow) {
      case 'act1':
        return (
          <SneakInScreen
            onGameEnd={handleSneakInEnd}
            onCancelHeist={handleCancelActOne}
            showTutorial={tutorialsReady && !tutorialsSeen.act1}
            onDismissTutorial={() => dismissTutorial('act1')}
          />
        );
      case 'act1-bridge':
        return (
          <Act1BridgeScreen
            elapsedMs={act1Record?.elapsedMs ?? null}
            timedOut={act1Record?.timedOut ?? false}
            baseBonus={act1Record?.baseBonus ?? 0}
            timingBonus={act1Record?.timingBonus ?? 0}
            bonusCutApplied={act1Record?.bonusCutApplied ?? false}
            ticoApplied={act1Record?.ticoApplied ?? false}
            crewIds={activeHeistCrew.filter(id =>
              id === 'knuckles' || (id === 'tico' && (act1Record?.ticoApplied ?? false))
            )}
            cumulativeGold={act1Bonus}
            onContinue={handleContinueToAct2}
          />
        );
      case 'act2':
        return (
          <VaultScreen
            onGameEnd={handleCrackTheVaultsEnd}
            showTutorial={tutorialsReady && !tutorialsSeen.act2}
            onDismissTutorial={() => dismissTutorial('act2')}
          />
        );
      case 'act2-bridge':
        return (
          <Act2BridgeScreen
            act1Gold={act1Bonus}
            act2Gold={act2Score}
            cumulativeGold={totalScore}
            vaultResults={act2VaultResults}
            act2Record={act2Record}
            onContinue={handleContinueToAct3}
          />
        );
      case 'act3':
        return (
          <EscapeScreen
            totalScore={totalScore}
            onGameOver={handleAct3GameOver}
            showTutorial={tutorialsReady && !tutorialsSeen.act3}
            onDismissTutorial={() => dismissTutorial('act3')}
          />
        );
      case 'act3-gameover':
        const summaryCrewIds = devSummaryData?.crewIds ?? activeHeistCrew;
        const jinxApplied = devSummaryData?.jinxApplied ?? (!(act3Won ?? false) && activeHeistCrew.includes('jinx'));
        const totalGoldWon = (act3Won ?? false) ? totalScore : Math.round(totalScore * (jinxApplied ? 0.80 : 0.33));
        return (
          <GameOverScreen
            totalScore={totalScore}
            won={!!act3Won}
            totalGoldWon={totalGoldWon}
            jinxApplied={jinxApplied}
            runNumber={currentRunNumber}
            act1Record={act1Record}
            act1Gold={act1Bonus}
            act2Record={act2Record}
            act2Gold={act2Score}
            act2VaultResults={act2VaultResults}
            crewIds={summaryCrewIds}
            buffsUsed={devSummaryData?.buffsUsed ?? usedBuffs}
            onPlayAgain={handlePlayAgain}
            onHome={handleReturnHome}
          />
        );
      default:
        return <HomeScreen onStartGame={handleStartGame} />;
    }
  };

  const isInHeist = activeTab === 'home' && gameFlow !== 'home';
  const shouldShowBlackMarketIntro =
    activeTab === 'market' && heistCount >= MARKET_UNLOCK_HEISTS && !blackMarketIntroSeen;
  const shouldShowBlackMarketUnlockedStory =
    activeTab === 'market' &&
    heistCount >= MARKET_UNLOCK_HEISTS &&
    blackMarketIntroSeen &&
    !blackMarketUnlockedStorySeen;

  const renderContent = () => {
    if (activeTab === 'settings') {
      if (settingsScreen === 'history') {
        return <HistoryScreen onBack={() => setSettingsScreen('main')} />;
      }
      if (__DEV__ && settingsScreen === 'development') {
        return (
          <DevelopmentScreen
            onBack={() => setSettingsScreen('main')}
            onResetHeistData={handleResetHeistData}
            onLaunchAct={handleLaunchActForTesting}
          />
        );
      }
      return (
        <SettingsScreen
          onResetTutorials={handleResetTutorials}
          onOpenHistory={() => setSettingsScreen('history')}
          onOpenDevelopment={() => setSettingsScreen('development')}
        />
      );
    }
    if (activeTab === 'market') {
      if (shouldShowBlackMarketIntro) {
        return (
          <BlackMarketIntroScreen
            availableGold={availableGold}
            entryFee={BLACK_MARKET_ENTRY_FEE}
            onContinue={() => {
              if (availableGold < BLACK_MARKET_ENTRY_FEE) return;
              spendGold(BLACK_MARKET_ENTRY_FEE);
              setBlackMarketIntroSeen(true);
            }}
          />
        );
      }
      if (shouldShowBlackMarketUnlockedStory) {
        return (
          <BlackMarketUnlockedScreen
            onContinue={() => {
              setBlackMarketUnlockedStorySeen(true);
            }}
          />
        );
      }
      return <MarketScreen />;
    }
    if (activeTab === 'hideout') {
      if (!hideoutPurchased) {
        return (
          <HideoutIntroScreen
            availableGold={availableGold}
            price={HIDEOUT_PRICE}
            onPurchase={() => {
              if (availableGold < HIDEOUT_PRICE) return;
              spendGold(HIDEOUT_PRICE);
              setHideoutPurchased(true);
            }}
          />
        );
      }
      return <HideoutScreen />;
    }
    return renderHomeTab();
  };

  return (
    <PaperProvider>
      <SafeAreaProvider>
        <SafeAreaView style={[styles.safeArea, !isInHeist && styles.safeAreaWithTabBar]}>
          <View style={styles.appShell}>
          <View style={styles.topAppBar}>
            <View style={styles.goldWrap}>
              <Text style={styles.goldLabel}>Gold</Text>
              <Text style={styles.goldValue}>{availableGold.toLocaleString()}</Text>
            </View>

            <TouchableOpacity
              style={styles.bagButton}
              onPress={() => setInventoryVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.bagIcon}>👜</Text>
              <Text style={styles.bagCount}>{totalInventoryCount}</Text>
            </TouchableOpacity>

            {devLaunchAct && gameFlow !== 'home' && (
              <TouchableOpacity
                style={styles.devBackButton}
                onPress={handleReturnToDevelopmentFromAct}
                activeOpacity={0.85}
              >
                <Text style={styles.devBackButtonText}>Back to Dev</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.contentArea}>{renderContent()}</View>
          {!isInHeist && <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
              onPress={() => setActiveTab('home')}
            >
              <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
                Home
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'market' && styles.tabItemActive]}
              onPress={() => setActiveTab('market')}
            >
              <Text style={[styles.tabLabel, activeTab === 'market' && styles.tabLabelActive]}>
                Market
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'hideout' && styles.tabItemActive]}
              onPress={() => setActiveTab('hideout')}
            >
              <Text style={[styles.tabLabel, activeTab === 'hideout' && styles.tabLabelActive]}>
                Hideout
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
              onPress={() => {
                setSettingsScreen('main');
                setActiveTab('settings');
              }}
            >
              <Text
                style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}
              >
                Settings
              </Text>
            </TouchableOpacity>
          </View>}
        </View>

          <CrewSelectionModal
            visible={crewModalVisible}
            onApply={handleCrewModalApply}
          />

          <PerkSelectionModal
            visible={perkModalConfig !== null}
            perks={perkModalConfig?.perks ?? []}
            onApply={handlePerkModalApply}
          />

          <Modal
            visible={inventoryVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setInventoryVisible(false)}
          >
            <View style={styles.inventoryOverlay}>
              <Pressable
                style={styles.inventoryBackdrop}
                onPress={() => setInventoryVisible(false)}
              />
              <View style={styles.inventorySheet}>
                <View style={styles.inventoryHandle} />
                <Text style={styles.inventoryTitle}>Inventory</Text>
                <Text style={styles.inventorySubtitle}>
                  Items on hand for your next heist.
                </Text>

                {inventoryRows.length === 0 ? (
                  <View style={styles.emptyInventoryCard}>
                    <Text style={styles.emptyInventoryIcon}>🧳</Text>
                    <Text style={styles.emptyInventoryTitle}>No items yet</Text>
                    <Text style={styles.emptyInventoryText}>
                      Buy tools from the market and they will appear here.
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    style={styles.inventoryList}
                    contentContainerStyle={styles.inventoryListContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {activeInventoryRows.length > 0 && (
                      <View style={styles.activeSection}>
                        <Text style={styles.activeSectionLabel}>Active</Text>
                        {activeInventoryRows.map(({ item, quantity }) => (
                          <View key={item.id} style={styles.inventoryItemCard}>
                            <View style={styles.inventoryItemHeader}>
                              <Text style={styles.inventoryItemIcon}>{item.icon}</Text>
                              <View style={styles.inventoryItemMain}>
                                <Text style={styles.inventoryItemTitle}>{item.title}</Text>
                                <Text style={styles.inventoryItemAct}>{item.act}</Text>
                              </View>
                              <Text style={styles.inventoryItemQuantity}>x{quantity}</Text>
                            </View>
                            <Text style={styles.inventoryItemEffect}>{item.effect}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {otherInventoryRows.map(({ item, quantity }) => (
                      <View key={item.id} style={styles.inventoryItemCard}>
                        <View style={styles.inventoryItemHeader}>
                          <Text style={styles.inventoryItemIcon}>{item.icon}</Text>
                          <View style={styles.inventoryItemMain}>
                            <Text style={styles.inventoryItemTitle}>{item.title}</Text>
                            <Text style={styles.inventoryItemAct}>{item.act}</Text>
                          </View>
                          <Text style={styles.inventoryItemQuantity}>x{quantity}</Text>
                        </View>
                        <Text style={styles.inventoryItemEffect}>{item.effect}</Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  safeAreaWithTabBar: {
    backgroundColor: theme.colors.bgPanel,
  },
  appShell: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  topAppBar: {
    minHeight: 62,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.borderWidths.thin,
    borderBottomColor: theme.colors.borderLight,
    backgroundColor: theme.colors.bgDeep,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goldWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.sm,
  },
  goldLabel: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.m,
    fontWeight: theme.fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  goldValue: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.xxl2,
    fontWeight: theme.fontWeights.black,
    fontVariant: ['tabular-nums'],
  },
  bagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
    backgroundColor: theme.colors.bgOverlaySoft,
    paddingVertical: theme.spacing.seven,
    paddingHorizontal: theme.spacing.md,
  },
  bagIcon: {
    fontSize: theme.fontSizes.title,
  },
  bagCount: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
    minWidth: 22,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  devBackButton: {
    borderRadius: theme.radii.r8,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.bgOverlaySoft,
    paddingVertical: theme.spacing.seven,
    paddingHorizontal: theme.spacing.md,
  },
  devBackButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.heavy,
  },
  contentArea: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgPanel,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingTop: theme.spacing.sm,
    paddingBottom: 10,
    gap: theme.spacing.sm,
  },
  tabItem: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: theme.colors.greenPrimary,
  },
  tabLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
  },
  tabLabelActive: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeights.black,
  },
  inventoryOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.overlayModal,
  },
  inventoryBackdrop: {
    flex: 1,
  },
  inventorySheet: {
    backgroundColor: theme.colors.bgPanel,
    borderTopLeftRadius: theme.radii.xxl,
    borderTopRightRadius: theme.radii.xxl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.twentyEight,
    paddingHorizontal: theme.spacing.xl,
    height: '65%',
  },
  inventoryHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: theme.radii.xs,
    backgroundColor: theme.colors.borderStrong,
    marginBottom: theme.spacing.lg,
  },
  inventoryTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.h1,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.two,
  },
  inventorySubtitle: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.m,
    marginBottom: theme.spacing.lg,
  },
  emptyInventoryCard: {
    marginTop: theme.spacing.md,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.bgOverlaySoft,
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  emptyInventoryIcon: {
    fontSize: theme.fontSizes.hero2,
  },
  emptyInventoryTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.basePlus,
    fontWeight: theme.fontWeights.heavy,
  },
  emptyInventoryText: {
    color: theme.colors.textDim,
    fontSize: theme.fontSizes.m,
    textAlign: 'center',
    lineHeight: 19,
  },
  inventoryList: {
    flex: 1,
  },
  inventoryListContent: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  inventoryItemCard: {
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.bgOverlaySoft,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.seven,
  },
  inventoryItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  inventoryItemIcon: {
    fontSize: theme.fontSizes.xxl,
  },
  inventoryItemMain: {
    flex: 1,
    gap: theme.spacing.two,
  },
  inventoryItemTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
  },
  inventoryItemAct: {
    color: theme.colors.textDim,
    fontSize: theme.fontSizes.sm,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inventoryItemQuantity: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.basePlus,
    fontWeight: theme.fontWeights.black,
    fontVariant: ['tabular-nums'],
  },
  inventoryItemEffect: {
    color: theme.colors.text78,
    fontSize: theme.fontSizes.m,
    lineHeight: 19,
  },
  activeSection: {
    borderWidth: 1.5,
    borderColor: theme.colors.gold,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  activeSectionLabel: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
});
