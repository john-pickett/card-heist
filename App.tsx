import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
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
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SneakInScreen } from './src/screens/SneakInScreen';
import { useEscapeStore } from './src/store/escapeStore';
import { useHistoryStore } from './src/store/historyStore';
import { useReckoningStore } from './src/store/reckoningStore';
import { useSneakInStore } from './src/store/sneakInStore';
import {
  DEFAULT_TUTORIALS,
  TUTORIALS_STORAGE_KEY,
  TutorialAct,
  TutorialSeen,
} from './src/constants/tutorials';
import { Act1Record, Act2Record, Act3Record, HeistRecord } from './src/types/history';

type Tab = 'home' | 'market' | 'history' | 'settings';
type GameFlow = 'home' | 'act1' | 'act1-bridge' | 'act2' | 'act2-bridge' | 'act3';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [gameFlow, setGameFlow] = useState<GameFlow>('home');
  const [act1TimeBonus, setAct1TimeBonus] = useState(0);
  const [act2Score, setAct2Score] = useState(0);
  const [campaignStartTime, setCampaignStartTime] = useState<number | null>(null);
  const [act1Record, setAct1Record] = useState<Act1Record | null>(null);
  const [act2Record, setAct2Record] = useState<Act2Record | null>(null);
  const [tutorialsSeen, setTutorialsSeen] = useState<TutorialSeen>(DEFAULT_TUTORIALS);
  const [tutorialsReady, setTutorialsReady] = useState(false);

  const act1Bonus = act1TimeBonus;
  const totalScore = act1Bonus + act2Score;

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
    if (activeTab === 'settings') return <SettingsScreen onResetTutorials={handleResetTutorials} />;
    if (activeTab === 'market') return <MarketScreen />;
    if (activeTab === 'history') return <HistoryScreen />;
    return renderHomeTab();
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appShell}>
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
              onPress={() => setActiveTab('settings')}
            >
              <Text
                style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}
              >
                Settings
              </Text>
            </TouchableOpacity>
          </View>}
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2d6a4f',
  },
  appShell: {
    flex: 1,
    backgroundColor: '#2d6a4f',
  },
  contentArea: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1b4332',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: '#40916c',
  },
  tabLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 13,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
});
