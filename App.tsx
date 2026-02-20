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
import { HomeScreen } from './src/screens/HomeScreen';
import { VaultScreen } from './src/screens/VaultScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SneakInScreen } from './src/screens/SneakInScreen';
import { useReckoningStore } from './src/store/reckoningStore';
import { useSneakInStore } from './src/store/sneakInStore';
import {
  DEFAULT_TUTORIALS,
  TUTORIALS_STORAGE_KEY,
  TutorialAct,
  TutorialSeen,
} from './src/constants/tutorials';

type Tab = 'home' | 'settings';
type GameFlow = 'home' | 'act1' | 'act1-bridge' | 'act2' | 'act2-bridge' | 'act3';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [gameFlow, setGameFlow] = useState<GameFlow>('home');
  const [act1HandRemaining, setAct1HandRemaining] = useState(0);
  const [act1TimeBonus, setAct1TimeBonus] = useState(0);
  const [act2Score, setAct2Score] = useState(0);
  const [tutorialsSeen, setTutorialsSeen] = useState<TutorialSeen>(DEFAULT_TUTORIALS);
  const [tutorialsReady, setTutorialsReady] = useState(false);

  const act1Bonus = act1HandRemaining * 10 + act1TimeBonus;
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
    setGameFlow('act1');
  };

  const handleSneakInEnd = () => {
    const state = useSneakInStore.getState();
    setAct1HandRemaining(state.hand.length);
    if (state.phase === 'done' && state.startTime && state.endTime) {
      const elapsedSec = Math.floor((state.endTime - state.startTime) / 1000);
      setAct1TimeBonus(elapsedSec <= 15 ? 20 : elapsedSec <= 35 ? 10 : 0);
    } else {
      setAct1TimeBonus(0);
    }
    setGameFlow('act1-bridge');
  };

  const handleContinueToAct2 = () => {
    useReckoningStore.getState().initGame();
    setGameFlow('act2');
  };

  const handleCrackTheVaultsEnd = () => {
    const score = useReckoningStore.getState().finalScore ?? 0;
    setAct2Score(score);
    setGameFlow('act2-bridge');
  };

  const handleContinueToAct3 = () => {
    setGameFlow('act3');
  };

  const handlePlayAgain = () => {
    setAct1HandRemaining(0);
    setAct1TimeBonus(0);
    setAct2Score(0);
    setGameFlow('home');
  };

  const handleReturnHome = () => {
    setAct1HandRemaining(0);
    setAct1TimeBonus(0);
    setAct2Score(0);
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
            handRemaining={act1HandRemaining}
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
