import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import theme from '../theme';
import {
  GameCard,
  PATTERN_RECOGNITION_REWARDS,
  buildGameDeck,
  computeReward,
} from '../data/patternRecognitionDeck';
import { useHistoryStore } from '../store/historyStore';

// ─── Card tile dimensions ────────────────────────────────────────────────────
const CARD_W = 76;
const CARD_H = 106;
const GRID_GAP = 8;

// ─── MemoryCard ──────────────────────────────────────────────────────────────
interface MemoryCardProps {
  card: GameCard;
  isFlipped: boolean;
  isMatched: boolean;
  isLocked: boolean;
  onPress: (instanceId: string) => void;
}

function MemoryCard({ card, isFlipped, isMatched, isLocked, onPress }: MemoryCardProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: isFlipped || isMatched ? 1 : 0,
      duration: 280,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isFlipped, isMatched]);

  useEffect(() => {
    if (isMatched) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        delay: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isMatched]);

  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <TouchableWithoutFeedback
      onPress={() => !isLocked && !isMatched && onPress(card.instanceId)}
    >
      <Animated.View style={[cardStyles.wrapper, { opacity: fadeAnim }]}>
        {/* Back face */}
        <Animated.View
          style={[
            cardStyles.card,
            cardStyles.cardBack,
            { transform: [{ perspective: 800 }, { rotateY: backRotateY }] },
          ]}
        >
          <Text style={cardStyles.backMark}>?</Text>
        </Animated.View>

        {/* Front face */}
        <Animated.View
          style={[
            cardStyles.card,
            cardStyles.cardFront,
            { transform: [{ perspective: 800 }, { rotateY: frontRotateY }] },
          ]}
        >
          <Text style={cardStyles.emoji}>{card.emoji}</Text>
          <Text style={cardStyles.label} numberOfLines={2}>{card.name}</Text>
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: {
    width: CARD_W,
    height: CARD_H,
  },
  card: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    backgroundColor: theme.colors.bgDeep,
    borderColor: theme.colors.borderMedium,
  },
  cardFront: {
    backgroundColor: theme.colors.cardFace,
    borderColor: theme.colors.cardBorder,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  backMark: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.black,
  },
  emoji: {
    fontSize: 30,
    marginBottom: 4,
  },
  label: {
    color: theme.colors.cardText,
    fontSize: theme.fontSizes.caption,
    fontWeight: theme.fontWeights.bold,
    textAlign: 'center',
    lineHeight: 13,
  },
});

// ─── Tier label ──────────────────────────────────────────────────────────────
function tierLabel(falseAttempts: number): string {
  if (falseAttempts <= PATTERN_RECOGNITION_REWARDS.ELITE_THRESHOLD) return 'CLEAN RUN';
  if (falseAttempts <= PATTERN_RECOGNITION_REWARDS.SOLID_THRESHOLD) return 'SOLID WORK';
  return 'SLOPPY';
}

// ─── Main game ───────────────────────────────────────────────────────────────
type Phase = 'intro' | 'playing' | 'complete';

interface Props {
  onBack: () => void;
}

export function PatternRecognitionGame({ onBack }: Props) {
  const addBonusGold = useHistoryStore(s => s.addBonusGold);

  const [phase, setPhase] = useState<Phase>('intro');
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [falseAttempts, setFalseAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [reward, setReward] = useState(0);

  const lockRef = useRef(false);

  const startGame = useCallback(() => {
    setCards(buildGameDeck(8));
    setFlippedIds([]);
    setMatchedIds(new Set());
    setFalseAttempts(0);
    setIsLocked(false);
    lockRef.current = false;
    setReward(0);
    setPhase('playing');
  }, []);

  const handleCardPress = useCallback((instanceId: string) => {
    if (lockRef.current) return;

    setFlippedIds(prev => {
      if (prev.includes(instanceId)) return prev;
      if (prev.length === 2) return prev;

      const next = [...prev, instanceId];

      if (next.length < 2) return next;

      // Two cards flipped — evaluate
      const [id0, id1] = next;
      const card0 = cards.find(c => c.instanceId === id0);
      const card1 = cards.find(c => c.instanceId === id1);

      if (!card0 || !card1) return next;

      lockRef.current = true;
      setIsLocked(true);

      if (card0.itemId === card1.itemId) {
        // Match
        setTimeout(() => {
          setMatchedIds(prev => {
            const updated = new Set(prev);
            updated.add(id0);
            updated.add(id1);
            if (updated.size === 16) {
              // All matched
              const earned = computeReward(falseAttempts);
              setReward(earned);
              addBonusGold(earned);
              setTimeout(() => setPhase('complete'), 400);
            }
            return updated;
          });
          setFlippedIds([]);
          lockRef.current = false;
          setIsLocked(false);
        }, 400);
      } else {
        // No match
        setTimeout(() => {
          setFalseAttempts(f => f + 1);
          setFlippedIds([]);
          lockRef.current = false;
          setIsLocked(false);
        }, 1000);
      }

      return next;
    });
  }, [cards, falseAttempts, addBonusGold]);

  // ── Intro screen ────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <View style={styles.screen}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backLabel}>Relax</Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.introContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>PATTERN{'\n'}RECOGNITION</Text>

          <View style={styles.storyCard}>
            <Text style={styles.storyLead}>Memory is a muscle.</Text>
            <Text style={styles.storyText}>
              Every pro knows the layout before they walk in the door. 32 cards,
              16 pairs — all the tools of the trade. Flip two at a time. Find the matches.
              The fewer wrong turns you take, the bigger the cut.
            </Text>
          </View>

          <View style={styles.tierCard}>
            <Text style={styles.tierTitle}>Reward Tiers</Text>
            <View style={styles.tierRow}>
              <Text style={styles.tierGold}>100 gold</Text>
              <Text style={styles.tierDesc}>4 or fewer false attempts</Text>
            </View>
            <View style={styles.tierRow}>
              <Text style={styles.tierSilver}>50 gold</Text>
              <Text style={styles.tierDesc}>8 or fewer false attempts</Text>
            </View>
            <View style={styles.tierRow}>
              <Text style={styles.tierBronze}>25 gold</Text>
              <Text style={styles.tierDesc}>9 or more false attempts</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.8}>
            <Text style={styles.startBtnText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Complete screen ─────────────────────────────────────────────────────
  if (phase === 'complete') {
    const tier = tierLabel(falseAttempts);
    return (
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.completeContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>GAME{'\n'}COMPLETE</Text>

          <View style={styles.resultCard}>
            <Text style={styles.tierBadge}>{tier}</Text>
            <Text style={styles.resultStat}>{falseAttempts}</Text>
            <Text style={styles.resultStatLabel}>false attempts</Text>
          </View>

          <View style={styles.rewardCard}>
            <Text style={styles.rewardLabel}>Gold earned</Text>
            <Text style={styles.rewardAmount}>+{reward}</Text>
            <Text style={styles.rewardNote}>Added to your balance</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.8}>
            <Text style={styles.startBtnText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.secondaryBtnText}>Back to Relax</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Playing screen ──────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <View style={styles.playHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backLabel}>Relax</Text>
        </TouchableOpacity>
        <View style={styles.playStats}>
          <Text style={styles.statLabel}>Matched</Text>
          <Text style={styles.statValue}>{matchedIds.size / 2}/8</Text>
        </View>
        <View style={styles.playStats}>
          <Text style={styles.statLabel}>Wrong</Text>
          <Text style={styles.statValue}>{falseAttempts}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {cards.map(card => (
          <MemoryCard
            key={card.instanceId}
            card={card}
            isFlipped={flippedIds.includes(card.instanceId)}
            isMatched={matchedIds.has(card.instanceId)}
            isLocked={isLocked}
            onPress={handleCardPress}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  scroll: {
    flex: 1,
  },

  // Back button
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.fourteen,
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

  // Intro
  introContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    alignItems: 'center',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 3,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    lineHeight: 30,
  },
  storyCard: {
    width: '100%',
    backgroundColor: theme.colors.bgStory,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  storyLead: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.basePlus,
    fontWeight: theme.fontWeights.heavy,
    marginBottom: theme.spacing.sm,
  },
  storyText: {
    color: theme.colors.text85,
    fontSize: theme.fontSizes.base,
    lineHeight: 22,
  },
  tierCard: {
    width: '100%',
    backgroundColor: theme.colors.bgOverlaySoft,
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  tierTitle: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.m,
    fontWeight: theme.fontWeights.heavy,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.md,
  },
  tierGold: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
    width: 64,
  },
  tierSilver: {
    color: theme.colors.text85,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
    width: 64,
  },
  tierBronze: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
    width: 64,
  },
  tierDesc: {
    color: theme.colors.text72,
    fontSize: theme.fontSizes.md,
    flex: 1,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    borderTopWidth: theme.borderWidths.thin,
    borderTopColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.bgPrimary,
    gap: theme.spacing.sm,
  },
  startBtn: {
    backgroundColor: theme.colors.greenPrimary,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
  },
  startBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.subtitle,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
  },

  // Playing
  playHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: theme.spacing.xl,
    paddingTop: theme.spacing.fourteen,
    borderBottomWidth: theme.borderWidths.thin,
    borderBottomColor: theme.colors.borderSubtle,
    paddingBottom: theme.spacing.sm,
  },
  playStats: {
    marginLeft: theme.spacing.xl,
    alignItems: 'center',
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: theme.fontWeights.bold,
  },
  statValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    gap: GRID_GAP,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },

  // Complete
  completeContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.forty,
    paddingBottom: theme.spacing.xxl,
    alignItems: 'center',
  },
  resultCard: {
    width: '100%',
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  tierBadge: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  resultStat: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.display,
    fontWeight: theme.fontWeights.black,
    lineHeight: 52,
  },
  resultStatLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rewardCard: {
    width: '100%',
    backgroundColor: theme.colors.bgOverlaySoft,
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  rewardLabel: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.m,
    fontWeight: theme.fontWeights.heavy,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  rewardAmount: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.h1,
    fontWeight: theme.fontWeights.black,
  },
  rewardNote: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
    marginTop: theme.spacing.xs,
  },
});
