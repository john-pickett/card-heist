import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Act1BridgeScreen } from './src/screens/Act1BridgeScreen';
import { Act2BridgeScreen } from './src/screens/Act2BridgeScreen';
import { EscapeScreen } from './src/screens/EscapeScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { MarketScreen } from './src/screens/MarketScreen';
import { VaultScreen } from './src/screens/VaultScreen';
import { DevelopmentScreen } from './src/screens/DevelopmentScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SneakInScreen } from './src/screens/SneakInScreen';
import { useEscapeStore } from './src/store/escapeStore';
import { useHistoryStore } from './src/store/historyStore';
import { useInventoryStore } from './src/store/inventoryStore';
import { useReckoningStore } from './src/store/vaultStore';
import { useSneakInStore } from './src/store/sneakInStore';
import { MARKET_ACT_ORDER, MARKET_ITEMS } from './src/data/marketItems';
import { MarketAct } from './src/types/market';
import {
  DEFAULT_TUTORIALS,
  TUTORIALS_STORAGE_KEY,
  TutorialAct,
  TutorialSeen,
} from './src/constants/tutorials';
import { Act1Record, Act2Record, Act3Record, HeistRecord } from './src/types/history';
import theme from './src/theme';

type Tab = 'home' | 'market' | 'history' | 'settings';
type GameFlow = 'home' | 'act1' | 'act1-bridge' | 'act2' | 'act2-bridge' | 'act3';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [settingsScreen, setSettingsScreen] = useState<'main' | 'development'>('main');
  const [gameFlow, setGameFlow] = useState<GameFlow>('home');
  const [act1TimeBonus, setAct1TimeBonus] = useState(0);
  const [act2Score, setAct2Score] = useState(0);
  const [campaignStartTime, setCampaignStartTime] = useState<number | null>(null);
  const [act1Record, setAct1Record] = useState<Act1Record | null>(null);
  const [act2Record, setAct2Record] = useState<Act2Record | null>(null);
  const [tutorialsSeen, setTutorialsSeen] = useState<TutorialSeen>(DEFAULT_TUTORIALS);
  const [tutorialsReady, setTutorialsReady] = useState(false);
  const [inventoryVisible, setInventoryVisible] = useState(false);

  const lifetimeGold = useHistoryStore(s => s.lifetimeGold);
  const spentGold = useHistoryStore(s => s.spentGold);
  const availableGold = lifetimeGold - spentGold;
  const inventoryItems = useInventoryStore(s => s.items);

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

  const handleStartGame = () => {
    useSneakInStore.getState().initGame();
    setCampaignStartTime(Date.now());
    setGameFlow('act1');
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
        elapsedSec <= 15 ? 50 :
        elapsedSec <= 30 ? 40 :
        elapsedSec <= 60 ? 25 :
        elapsedSec <= 90 ? 15 :
        elapsedSec <= 120 ? 10 : 0;
    }
    setAct1TimeBonus(timingBonus);
    setAct1Record({ elapsedMs, timedOut, timingBonus, totalMoves: state.totalMoves });
    setGameFlow('act1-bridge');
  };

  const handleContinueToAct2 = () => {
    useReckoningStore.getState().initGame();
    setGameFlow('act2');
  };

  const handleCrackTheVaultsEnd = () => {
    const state = useReckoningStore.getState();
    const score = state.finalScore ?? 0;
    setAct2Score(score);
    setAct2Record({
      score,
      exactHits: state.exactHits,
      busts: state.busts,
      aceOnes: state.aceOnes,
      aceElevens: state.aceElevens,
    });
    setGameFlow('act2-bridge');
  };

  const handleContinueToAct3 = () => {
    setGameFlow('act3');
  };

  const recordCurrentHeist = () => {
    if (!campaignStartTime || !act1Record || !act2Record) return;
    const escapeState = useEscapeStore.getState();
    const won = escapeState.phase === 'won';
    const act3: Act3Record = {
      won,
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
      totalGold: won ? totalScore : 0,
      act1: act1Record,
      act2: act2Record,
      act3,
      durationMs: Date.now() - campaignStartTime,
    };
    useHistoryStore.getState().recordHeist(record);
  };

  const resetCampaignState = () => {
    setAct1TimeBonus(0);
    setAct2Score(0);
    setCampaignStartTime(null);
    setAct1Record(null);
    setAct2Record(null);
  };

  const handlePlayAgain = () => {
    recordCurrentHeist();
    resetCampaignState();
    setGameFlow('home');
  };

  const handleReturnHome = () => {
    recordCurrentHeist();
    resetCampaignState();
    setGameFlow('home');
  };

  const renderHomeTab = () => {
    switch (gameFlow) {
      case 'act1':
        return (
          <SneakInScreen
            onGameEnd={handleSneakInEnd}
            showTutorial={tutorialsReady && !tutorialsSeen.act1}
            onDismissTutorial={() => dismissTutorial('act1')}
          />
        );
      case 'act1-bridge':
        return (
          <Act1BridgeScreen
            elapsedMs={act1Record?.elapsedMs ?? null}
            timedOut={act1Record?.timedOut ?? false}
            timingBonus={act1Record?.timingBonus ?? 0}
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
            onContinue={handleContinueToAct3}
          />
        );
      case 'act3':
        return (
          <EscapeScreen
            totalScore={totalScore}
            onPlayAgain={handlePlayAgain}
            onHome={handleReturnHome}
            showTutorial={tutorialsReady && !tutorialsSeen.act3}
            onDismissTutorial={() => dismissTutorial('act3')}
          />
        );
      default:
        return <HomeScreen onStartGame={handleStartGame} />;
    }
  };

  const isInHeist = activeTab === 'home' && gameFlow !== 'home';

  const renderContent = () => {
    if (activeTab === 'settings') {
      if (__DEV__ && settingsScreen === 'development') {
        return (
          <DevelopmentScreen
            onBack={() => setSettingsScreen('main')}
            onResetHeistData={handleResetHeistData}
          />
        );
      }
      return (
        <SettingsScreen
          onResetTutorials={handleResetTutorials}
          onOpenDevelopment={() => setSettingsScreen('development')}
        />
      );
    }
    if (activeTab === 'market') return <MarketScreen />;
    if (activeTab === 'history') return <HistoryScreen />;
    return renderHomeTab();
  };

  return (
    <PaperProvider>
      <SafeAreaView style={[styles.safeArea, !isInHeist && styles.safeAreaWithTabBar]}>
        <View style={styles.appShell}>
          <View style={styles.topAppBar}>
            <View style={styles.goldWrap}>
              <Text style={styles.goldLabel}>Gold</Text>
              <Text style={styles.goldValue}>{availableGold}</Text>
            </View>

            <TouchableOpacity
              style={styles.bagButton}
              onPress={() => setInventoryVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.bagIcon}>👜</Text>
              <Text style={styles.bagCount}>{totalInventoryCount}</Text>
            </TouchableOpacity>
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
              style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]}
              onPress={() => setActiveTab('history')}
            >
              <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>
                History
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
