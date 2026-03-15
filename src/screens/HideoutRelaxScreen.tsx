import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme';
import { useHistoryStore } from '../store/historyStore';
import { useSettingsStore, type RelaxGameId } from '../store/settingsStore';
import { PatternRecognitionGame } from './PatternRecognitionGame';
import { GetawayGame } from './GetawayGame';
import { DropGame } from './DropGame';

type RelaxView = 'home' | RelaxGameId;

interface GameDef {
  id: RelaxGameId;
  label: string;
  description: string;
  price: number;
}

// TODO: Set these back to 1000, 5000, and 7500 before pushing to prod
const GAMES: GameDef[] = [
  {
    id: 'pattern-recognition',
    label: 'Pattern Recognition',
    description:
      'Train your eyes, not just your instincts. Sixteen items from the job, paired and hidden. Find every match with the fewest wrong flips — quick hands, quiet mind.',
    price: __DEV__ ? 1 : 1,
  },
  {
    id: 'getaway',
    label: 'The Getaway',
    description:
      'Every card is a move. Read the suit, count the steps, find the exit before the net closes. One wrong turn burns a route and costs you time.',
    price: __DEV__ ? 1 : 1,
  },
  {
    id: 'drop',
    label: 'The Drop',
    description:
      'A 52-card sorting test under shifting rules. Jacks, Queens, Kings, and Aces flip the grid live. Build a streak to trigger Escalation — then sort fast or lose a fuse.',
    price: __DEV__ ? 1 : 1,
  },
];

interface Props {
  onBack: () => void;
}

export function HideoutRelaxScreen({ onBack }: Props) {
  const [view, setView] = useState<RelaxView>('home');

  const lifetimeGold = useHistoryStore(s => s.lifetimeGold);
  const spentGold = useHistoryStore(s => s.spentGold);
  const spendGold = useHistoryStore(s => s.spendGold);
  const relaxUnlocked = useSettingsStore(s => s.relaxUnlocked);
  const unlockRelaxGame = useSettingsStore(s => s.unlockRelaxGame);

  const availableGold = lifetimeGold - spentGold;

  function handleBuy(game: GameDef) {
    if (availableGold < game.price) return;
    spendGold(game.price);
    unlockRelaxGame(game.id);
    setView(game.id);
  }

  if (view === 'pattern-recognition') {
    return <PatternRecognitionGame onBack={() => setView('home')} />;
  }
  if (view === 'getaway') {
    return <GetawayGame onBack={() => setView('home')} />;
  }
  if (view === 'drop') {
    return <DropGame onBack={() => setView('home')} />;
  }

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
        <Text style={styles.backArrow}>‹</Text>
        <Text style={styles.backLabel}>Hideout</Text>
      </TouchableOpacity>

      <View style={styles.titleRow}>
        <Text style={styles.title}>RELAX</Text>
        {/* <View style={styles.balancePill}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceValue}>{availableGold.toLocaleString()} ¢</Text>
        </View> */}
      </View>

      <ScrollView contentContainerStyle={styles.gameList} showsVerticalScrollIndicator={false}>
        {GAMES.map(game => {
          const unlocked = relaxUnlocked[game.id];
          const canAfford = availableGold >= game.price;
          return (
            <View key={game.id} style={styles.gameCard}>
              <View style={styles.gameCardHeader}>
                <Text style={styles.gameLabel}>{game.label}</Text>
                {!unlocked && <Text style={styles.lockIcon}>🔒</Text>}
              </View>

              <Text style={styles.gameDescription}>{game.description}</Text>

              <View style={styles.gameCardFooter}>
                {unlocked ? (
                  <TouchableOpacity
                    style={styles.playBtn}
                    onPress={() => setView(game.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.playBtnText}>PLAY</Text>
                    <Text style={styles.playBtnArrow}>›</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.buyRow}>
                    <Text style={[styles.priceText, !canAfford && styles.priceTextInsufficient]}>
                      {game.price.toLocaleString()} ¢
                    </Text>
                    <TouchableOpacity
                      style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
                      onPress={() => handleBuy(game)}
                      activeOpacity={0.75}
                      disabled={!canAfford}
                    >
                      <Text style={[styles.buyBtnText, !canAfford && styles.buyBtnTextDisabled]}>
                        BUY ACCESS
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.fourteen,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.xs,
  },
  backArrow: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.bold,
    marginRight: theme.spacing.xs,
    lineHeight: 28,
  },
  backLabel: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 3,
  },
  balancePill: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xxl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'flex-end',
  },
  balanceLabel: {
    color: theme.colors.textDim,
    fontSize: theme.fontSizes.xxs,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  balanceValue: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  gameList: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.forty,
  },
  gameCard: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
    padding: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  gameCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  gameLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
  },
  lockIcon: {
    fontSize: theme.fontSizes.base,
  },
  gameDescription: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  gameCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.greenPrimary,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  playBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1.5,
  },
  playBtnArrow: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
    lineHeight: 20,
  },
  buyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  priceText: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  priceTextInsufficient: {
    color: theme.colors.textDim,
  },
  buyBtn: {
    backgroundColor: theme.colors.gold,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  buyBtnDisabled: {
    backgroundColor: theme.colors.bgDeep,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
  },
  buyBtnText: {
    color: theme.colors.bgDeep,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1,
  },
  buyBtnTextDisabled: {
    color: theme.colors.textDisabled,
  },
});
