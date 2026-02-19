import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { Act1BridgeScreen } from './src/screens/Act1BridgeScreen';
import { EscapeScreen } from './src/screens/EscapeScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ReckoningScreen } from './src/screens/ReckoningScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SneakInScreen } from './src/screens/SneakInScreen';
import { useReckoningStore } from './src/store/reckoningStore';
import { useSneakInStore } from './src/store/sneakInStore';

type Tab = 'home' | 'settings';
type GameFlow = 'home' | 'act1' | 'act1-bridge' | 'act2' | 'act3';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [gameFlow, setGameFlow] = useState<GameFlow>('home');
  const [act1HandRemaining, setAct1HandRemaining] = useState(0);
  const [act2Score, setAct2Score] = useState(0);

  const act1Bonus = act1HandRemaining * 10;
  const totalScore = act1Bonus + act2Score;

  const handleStartGame = () => {
    useSneakInStore.getState().initGame();
    setGameFlow('act1');
  };

  const handleSneakInEnd = () => {
    const remaining = useSneakInStore.getState().hand.length;
    setAct1HandRemaining(remaining);
    setGameFlow('act1-bridge');
  };

  const handleContinueToAct2 = () => {
    useReckoningStore.getState().initGame();
    setGameFlow('act2');
  };

  const handleCrackTheVaultsEnd = () => {
    const score = useReckoningStore.getState().finalScore ?? 0;
    setAct2Score(score);
    setGameFlow('act3');
  };

  const handlePlayAgain = () => {
    setAct1HandRemaining(0);
    setAct2Score(0);
    setGameFlow('home');
  };

  const handleReturnHome = () => {
    setAct1HandRemaining(0);
    setAct2Score(0);
    setGameFlow('home');
  };

  const renderHomeTab = () => {
    switch (gameFlow) {
      case 'act1':
        return <SneakInScreen onGameEnd={handleSneakInEnd} />;
      case 'act1-bridge':
        return (
          <Act1BridgeScreen
            handRemaining={act1HandRemaining}
            onContinue={handleContinueToAct2}
          />
        );
      case 'act2':
        return <ReckoningScreen onGameEnd={handleCrackTheVaultsEnd} />;
      case 'act3':
        return (
          <EscapeScreen
            totalScore={totalScore}
            onPlayAgain={handlePlayAgain}
            onHome={handleReturnHome}
          />
        );
      default:
        return <HomeScreen onStartGame={handleStartGame} />;
    }
  };

  const renderContent = () => {
    if (activeTab === 'settings') return <SettingsScreen />;
    return renderHomeTab();
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appShell}>
          <View style={styles.contentArea}>{renderContent()}</View>
          <View style={styles.tabBar}>
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
          </View>
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
