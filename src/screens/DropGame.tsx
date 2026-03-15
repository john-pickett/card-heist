import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme';
import {
  buildDropDeck,
  computeDropReward,
  DROP_REWARDS,
  isSafeCard,
  isTrigger,
  isRedSuit,
  RULE_CYCLE,
  RULE_LABELS,
  RULE_OPPOSITES,
  suitSymbol,
  type DropRule,
} from '../data/dropDeck';
import { useHistoryStore } from '../store/historyStore';
import type { Card } from '../types/card';

const ESCALATION_DURATION = 5000;

interface ResultData {
  victory: boolean;
  fusesRemaining: number;
  escalationsCompleted: number;
  mistakes: number;
  freezeActiveOnLast: boolean;
  reward: number;
}

interface Props {
  onBack: () => void;
}

// ─── Intro ────────────────────────────────────────────────────────────────────

function IntroScreen({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
        <Text style={styles.backArrow}>‹</Text>
        <Text style={styles.backLabel}>Relax</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.introContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.introTitle}>THE DROP</Text>
        <Text style={styles.introSubtitle}>Sort all 52 cards before your fuses burn out.</Text>

        <View style={styles.introSection}>
          <Text style={styles.introSectionTitle}>HOW IT WORKS</Text>
          <Text style={styles.introBody}>
            Each turn you draw a card. The active rule tells you whether it's Safe or Volatile. Sort correctly to build a streak — reach 5 in a row to trigger Escalation.
          </Text>
        </View>

        <View style={styles.introSection}>
          <Text style={styles.introSectionTitle}>TRIGGER CARDS</Text>
          {[
            { rank: 'J', label: 'Jack', desc: 'Flips to the next rule in the cycle' },
            { rank: 'Q', label: 'Queen', desc: 'Flips to a random rule' },
            { rank: 'K', label: 'King', desc: 'Flips to the opposite rule' },
            { rank: 'A', label: 'Ace', desc: 'Freezes rule flips for 3 draws' },
          ].map(t => (
            <View key={t.rank} style={styles.triggerRow}>
              <Text style={styles.triggerRank}>{t.rank}</Text>
              <View style={styles.triggerDesc}>
                <Text style={styles.triggerLabel}>{t.label}</Text>
                <Text style={styles.triggerDescText}>{t.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.introSection}>
          <Text style={styles.introSectionTitle}>ESCALATION</Text>
          <Text style={styles.introBody}>
            5 correct in a row activates Escalation for 3 draws. A countdown timer appears — sort before it expires or lose a fuse. Completed escalations earn bonus gold.
          </Text>
        </View>

        <View style={styles.introSection}>
          <Text style={styles.introSectionTitle}>SCORING</Text>
          {[
            { label: 'Base clear', value: `+${DROP_REWARDS.BASE_CLEAR}` },
            { label: 'Per fuse remaining', value: `+${DROP_REWARDS.PER_FUSE}` },
            { label: 'Per escalation survived', value: `+${DROP_REWARDS.PER_ESCALATION}` },
            { label: 'Zero mistakes bonus', value: `+${DROP_REWARDS.ZERO_MISTAKES}` },
            { label: 'Freeze active on last card', value: `+${DROP_REWARDS.FREEZE_ON_LAST}` },
          ].map(r => (
            <View key={r.label} style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>{r.label}</Text>
              <Text style={styles.scoreValue}>{r.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.75}>
          <Text style={styles.startBtnText}>START THE DROP</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Result ───────────────────────────────────────────────────────────────────

function ResultScreen({ data, onPlayAgain, onBack }: { data: ResultData; onPlayAgain: () => void; onBack: () => void }) {
  const lines = data.victory ? [
    { label: 'Base clear',              value: DROP_REWARDS.BASE_CLEAR },
    { label: `Fuses remaining (×${data.fusesRemaining})`, value: data.fusesRemaining * DROP_REWARDS.PER_FUSE },
    { label: `Escalations (×${data.escalationsCompleted})`, value: data.escalationsCompleted * DROP_REWARDS.PER_ESCALATION },
    ...(data.mistakes === 0 ? [{ label: 'Zero mistakes bonus', value: DROP_REWARDS.ZERO_MISTAKES }] : []),
    ...(data.freezeActiveOnLast ? [{ label: 'Freeze on last card', value: DROP_REWARDS.FREEZE_ON_LAST }] : []),
  ] : [];

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
        <Text style={styles.backArrow}>‹</Text>
        <Text style={styles.backLabel}>Relax</Text>
      </TouchableOpacity>

      <View style={styles.resultContent}>
        <Text style={[styles.resultVerdict, data.victory ? styles.resultVerdictWin : styles.resultVerdictLoss]}>
          {data.victory ? 'CLEARED' : 'WIRED'}
        </Text>
        <Text style={styles.resultSubtitle}>
          {data.victory ? 'The grid went dark. The drop is clean.' : 'All fuses burned. The system locked you out.'}
        </Text>

        {data.victory && (
          <View style={styles.resultBreakdown}>
            {lines.map(l => (
              <View key={l.label} style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>{l.label}</Text>
                <Text style={styles.resultRowValue}>+{l.value}</Text>
              </View>
            ))}
            <View style={styles.resultDivider} />
            <View style={styles.resultRow}>
              <Text style={styles.resultTotal}>TOTAL</Text>
              <Text style={styles.resultTotalValue}>{data.reward} ¢</Text>
            </View>
          </View>
        )}

        <View style={styles.resultStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.fusesRemaining}</Text>
            <Text style={styles.statLabel}>fuses left</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.escalationsCompleted}</Text>
            <Text style={styles.statLabel}>escalations</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.mistakes}</Text>
            <Text style={styles.statLabel}>mistakes</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={onPlayAgain} activeOpacity={0.75}>
          <Text style={styles.startBtnText}>PLAY AGAIN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main game ────────────────────────────────────────────────────────────────

export function DropGame({ onBack }: Props) {
  const addBonusGold = useHistoryStore(s => s.addBonusGold);

  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [deck, setDeck] = useState<Card[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [rule, setRule] = useState<DropRule>('low-voltage');
  const [fuses, setFuses] = useState(3);
  const [streak, setStreak] = useState(0);
  const [freeze, setFreeze] = useState(0);
  const [lastSafeCard, setLastSafeCard] = useState<Card | null>(null);
  const [escalationActive, setEscalationActive] = useState(false);
  const [escalationDrawsLeft, setEscalationDrawsLeft] = useState(0);
  const [escalationsCompleted, setEscalationsCompleted] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [sortResult, setSortResult] = useState<'correct' | 'wrong' | null>(null);
  const [triggerBanner, setTriggerBanner] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultData, setResultData] = useState<ResultData | null>(null);

  // Refs kept fresh for timer callbacks
  const stateRef = useRef({
    fuses: 3, freeze: 0, mistakes: 0,
    escalationsCompleted: 0, cardIndex: 0, rule: 'low-voltage' as DropRule,
  });
  useLayoutEffect(() => {
    stateRef.current = { fuses, freeze, mistakes, escalationsCompleted, cardIndex, rule };
  });

  const timerAnim = useRef(new Animated.Value(1)).current;
  const escalationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const endGameRef = useRef<(v: boolean, f: number, e: number, m: number, fal: boolean) => void>(null!);

  const endGame = useCallback((victory: boolean, finalFuses: number, finalEsc: number, finalMistakes: number, fal: boolean) => {
    const reward = computeDropReward({ victory, fusesRemaining: finalFuses, escalationsCompleted: finalEsc, mistakes: finalMistakes, freezeActiveOnLast: fal });
    if (victory && reward > 0) addBonusGold(reward);
    setResultData({ victory, fusesRemaining: finalFuses, escalationsCompleted: finalEsc, mistakes: finalMistakes, freezeActiveOnLast: fal, reward });
    setPhase('result');
  }, [addBonusGold]);

  useLayoutEffect(() => { endGameRef.current = endGame; }, [endGame]);

  const handleTimerExpire = useCallback(() => {
    const snap = { ...stateRef.current };
    const newFuses = snap.fuses - 1;
    const newMistakes = snap.mistakes + 1;
    const nextIdx = snap.cardIndex + 1;
    setFuses(newFuses);
    setMistakes(newMistakes);
    setStreak(0);
    setEscalationActive(false);
    setEscalationDrawsLeft(0);
    setSortResult('wrong');
    advanceTimerRef.current = setTimeout(() => {
      setSortResult(null);
      if (newFuses <= 0) {
        endGameRef.current(false, newFuses, snap.escalationsCompleted, newMistakes, snap.freeze > 0);
      } else if (nextIdx >= 52) {
        endGameRef.current(true, newFuses, snap.escalationsCompleted, newMistakes, snap.freeze > 0);
      } else {
        setCardIndex(nextIdx);
      }
    }, 400);
  }, []);

  const handleTimerExpireRef = useRef(handleTimerExpire);
  handleTimerExpireRef.current = handleTimerExpire;

  function clearEscTimer() {
    if (escalationTimerRef.current) { clearTimeout(escalationTimerRef.current); escalationTimerRef.current = null; }
    timerAnim.stopAnimation();
  }

  // Start escalation countdown for regular cards
  useEffect(() => {
    if (phase !== 'playing' || !escalationActive) return;
    const card = deck[cardIndex];
    if (!card || isTrigger(card.rank)) return;
    timerAnim.setValue(1);
    Animated.timing(timerAnim, { toValue: 0, duration: ESCALATION_DURATION, useNativeDriver: false }).start();
    escalationTimerRef.current = setTimeout(() => handleTimerExpireRef.current(), ESCALATION_DURATION);
    return () => {
      if (escalationTimerRef.current) { clearTimeout(escalationTimerRef.current); escalationTimerRef.current = null; }
      timerAnim.stopAnimation();
    };
  }, [escalationActive, cardIndex, phase]);

  // Auto-process trigger cards
  useEffect(() => {
    if (phase !== 'playing') return;
    const card = deck[cardIndex];
    if (!card || !isTrigger(card.rank)) return;
    setProcessing(true);
    const snap = { ...stateRef.current };
    let banner = '';
    setLastSafeCard(card); // triggers always go to Safe

    if (snap.freeze > 0) {
      const nf = snap.freeze - 1;
      setFreeze(nf);
      banner = `❄  ${card.rank} — flip suppressed${nf > 0 ? ` (${nf} left)` : ''}`;
    } else {
      if (card.rank === 'J') {
        const nr = RULE_CYCLE[(RULE_CYCLE.indexOf(snap.rule) + 1) % RULE_CYCLE.length];
        setRule(nr);
        banner = `Jack → ${RULE_LABELS[nr].name}`;
      } else if (card.rank === 'Q') {
        const nr = RULE_CYCLE[Math.floor(Math.random() * RULE_CYCLE.length)];
        setRule(nr);
        banner = `Queen → ${RULE_LABELS[nr].name}`;
      } else if (card.rank === 'K') {
        const nr = RULE_OPPOSITES[snap.rule];
        setRule(nr);
        banner = `King → ${RULE_LABELS[nr].name}`;
      } else {
        setFreeze(3);
        banner = 'Ace — Freeze! (3 draws)';
      }
    }

    setTriggerBanner(banner);
    const nextIdx = cardIndex + 1;
    const t = setTimeout(() => {
      setTriggerBanner(null);
      setProcessing(false);
      const s = stateRef.current;
      if (nextIdx >= 52) {
        endGameRef.current(true, s.fuses, s.escalationsCompleted, s.mistakes, snap.freeze > 0);
      } else {
        setCardIndex(nextIdx);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [cardIndex, phase]);

  // Cleanup on unmount
  useEffect(() => () => {
    clearEscTimer();
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
  }, []);

  function startGame() {
    clearEscTimer();
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    const d = buildDropDeck();
    setDeck(d);
    setCardIndex(0);
    setRule('low-voltage');
    setFuses(3);
    setStreak(0);
    setFreeze(0);
    setLastSafeCard(null);
    setEscalationActive(false);
    setEscalationDrawsLeft(0);
    setEscalationsCompleted(0);
    setMistakes(0);
    setSortResult(null);
    setTriggerBanner(null);
    setProcessing(false);
    setResultData(null);
    setPhase('playing');
  }

  function handleSort(choice: 'safe' | 'volatile') {
    if (processing) return;
    const card = deck[cardIndex];
    if (!card) return;
    setProcessing(true);
    clearEscTimer();

    const correct = (choice === 'safe') === isSafeCard(card, rule, lastSafeCard);
    if (choice === 'safe') setLastSafeCard(card);

    let newStreak = streak;
    let newFuses = fuses;
    let newMistakes = mistakes;
    let newEscActive = escalationActive;
    let newEscDrawsLeft = escalationDrawsLeft;
    let newEscCompleted = escalationsCompleted;

    if (correct) {
      newStreak = streak + 1;
      if (newEscActive) {
        newEscDrawsLeft--;
        if (newEscDrawsLeft <= 0) {
          newEscActive = false;
          newEscDrawsLeft = 0;
          newEscCompleted++;
          newStreak = 0;
        }
      } else if (newStreak >= 5) {
        newEscActive = true;
        newEscDrawsLeft = 3;
        newStreak = 0;
      }
    } else {
      newMistakes++;
      newFuses = fuses - 1;
      newStreak = 0;
      if (newEscActive) { newEscActive = false; newEscDrawsLeft = 0; }
    }

    setStreak(newStreak);
    setFuses(newFuses);
    setMistakes(newMistakes);
    setEscalationActive(newEscActive);
    setEscalationDrawsLeft(newEscDrawsLeft);
    setEscalationsCompleted(newEscCompleted);
    setSortResult(correct ? 'correct' : 'wrong');

    const nextIdx = cardIndex + 1;
    advanceTimerRef.current = setTimeout(() => {
      setSortResult(null);
      setProcessing(false);
      if (newFuses <= 0) {
        endGame(false, newFuses, newEscCompleted, newMistakes, freeze > 0);
      } else if (nextIdx >= 52) {
        endGame(true, newFuses, newEscCompleted, newMistakes, freeze > 0);
      } else {
        setCardIndex(nextIdx);
      }
    }, 400);
  }

  if (phase === 'intro') return <IntroScreen onStart={startGame} onBack={onBack} />;
  if (phase === 'result' && resultData) return <ResultScreen data={resultData} onPlayAgain={startGame} onBack={onBack} />;

  const currentCard = deck[cardIndex];
  const isCurrentTrigger = currentCard ? isTrigger(currentCard.rank) : false;
  const isRed = currentCard ? isRedSuit(currentCard.suit) : false;
  const cardsLeft = 52 - cardIndex;
  const ruleInfo = RULE_LABELS[rule];
  const safeLabel = rule === 'suit-lock'
    ? (lastSafeCard ? `${suitSymbol(lastSafeCard.suit)} (${lastSafeCard.suit})` : '? (no safe yet)')
    : ruleInfo.safe;
  const escalationDraw = escalationActive ? (4 - escalationDrawsLeft) : 0;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backLabel}>Relax</Text>
        </TouchableOpacity>
        <View style={styles.fuseRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.fuse, fuses > i ? styles.fuseActive : styles.fuseBurned]} />
          ))}
        </View>
        <Text style={styles.cardsLeft}>{cardsLeft} left</Text>
      </View>

      {/* Rule pill */}
      <View style={styles.rulePill}>
        <Text style={styles.ruleName}>{ruleInfo.name.toUpperCase()}</Text>
        <Text style={styles.ruleSafe}>
          Safe: <Text style={styles.ruleSafeValue}>{safeLabel}</Text>
        </Text>
      </View>

      {/* Status badges */}
      {(freeze > 0 || escalationActive) && (
        <View style={styles.statusRow}>
          {freeze > 0 && (
            <View style={styles.freezeBadge}>
              <Text style={styles.freezeText}>❄  FROZEN ({freeze})</Text>
            </View>
          )}
          {escalationActive && (
            <View style={styles.escalationBadge}>
              <Text style={styles.escalationBadgeText}>⚡  ESCALATION  {escalationDraw}/3</Text>
            </View>
          )}
        </View>
      )}

      {/* Escalation timer bar */}
      {escalationActive && !isCurrentTrigger && (
        <View style={styles.timerTrack}>
          <Animated.View
            style={[
              styles.timerFill,
              {
                width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              },
            ]}
          />
        </View>
      )}

      {/* Card display */}
      <View style={styles.cardArea}>
        {currentCard && (
          <View style={[
            styles.card,
            sortResult === 'correct' && styles.cardCorrect,
            sortResult === 'wrong' && styles.cardWrong,
          ]}>
            <Text style={[styles.cardCornerRank, { color: isRed ? theme.colors.red : theme.colors.cardTextDark }]}>
              {currentCard.rank}
            </Text>
            <Text style={[styles.cardSuitBig, { color: isRed ? theme.colors.red : theme.colors.cardTextDark }]}>
              {suitSymbol(currentCard.suit)}
            </Text>
            <Text style={[styles.cardCornerRank, styles.cardCornerBottom, { color: isRed ? theme.colors.red : theme.colors.cardTextDark }]}>
              {currentCard.rank}
            </Text>
          </View>
        )}
        {sortResult && (
          <View style={[styles.resultFlash, sortResult === 'correct' ? styles.resultFlashCorrect : styles.resultFlashWrong]}>
            <Text style={styles.resultFlashText}>{sortResult === 'correct' ? '✓' : '✗'}</Text>
          </View>
        )}
      </View>

      {/* Trigger banner */}
      {triggerBanner ? (
        <View style={styles.triggerBanner}>
          <Text style={styles.triggerBannerText}>{triggerBanner}</Text>
        </View>
      ) : (
        <View style={styles.triggerBannerPlaceholder} />
      )}

      {/* Sort buttons */}
      {!isCurrentTrigger && !triggerBanner && (
        <View style={styles.sortRow}>
          <TouchableOpacity
            style={[styles.sortBtn, styles.sortBtnSafe, processing && styles.sortBtnDisabled]}
            onPress={() => handleSort('safe')}
            activeOpacity={0.7}
            disabled={processing}
          >
            <Text style={styles.sortBtnLabel}>SAFE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, styles.sortBtnVolatile, processing && styles.sortBtnDisabled]}
            onPress={() => handleSort('volatile')}
            activeOpacity={0.7}
            disabled={processing}
          >
            <Text style={styles.sortBtnLabel}>VOLATILE</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Streak */}
      <Text style={styles.streakLabel}>
        {streak > 0 && !escalationActive ? `STREAK  ${streak}` : ''}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  // ── Intro ──
  introContent: {
    paddingBottom: theme.spacing.forty,
    paddingTop: theme.spacing.md,
  },
  introTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  introSubtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  introSection: {
    marginBottom: theme.spacing.xl,
  },
  introSectionTitle: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 2,
    marginBottom: theme.spacing.sm,
  },
  introBody: {
    color: theme.colors.textBody,
    fontSize: theme.fontSizes.md,
    lineHeight: 20,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  triggerRank: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    width: 28,
  },
  triggerDesc: { flex: 1 },
  triggerLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
  },
  triggerDescText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.s,
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  scoreLabel: {
    color: theme.colors.textBody,
    fontSize: theme.fontSizes.md,
  },
  scoreValue: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
  },
  startBtn: {
    backgroundColor: theme.colors.greenPrimary,
    borderRadius: theme.radii.xl,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    ...theme.shadows.medium,
  },
  startBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1.5,
  },

  // ── Result ──
  resultContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: theme.spacing.forty,
  },
  resultVerdict: {
    fontSize: theme.fontSizes.display,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 4,
    marginBottom: theme.spacing.sm,
  },
  resultVerdictWin: { color: theme.colors.gold },
  resultVerdictLoss: { color: theme.colors.errorRed },
  resultSubtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.md,
  },
  resultBreakdown: {
    width: '100%',
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  resultRowLabel: { color: theme.colors.textBody, fontSize: theme.fontSizes.md },
  resultRowValue: { color: theme.colors.gold, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.bold },
  resultDivider: {
    height: 1,
    backgroundColor: theme.colors.borderMedium,
    marginVertical: theme.spacing.sm,
  },
  resultTotal: { color: theme.colors.textPrimary, fontSize: theme.fontSizes.base, fontWeight: theme.fontWeights.heavy },
  resultTotalValue: { color: theme.colors.goldBright, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.black },
  resultStats: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  statItem: { alignItems: 'center' },
  statValue: { color: theme.colors.textPrimary, fontSize: theme.fontSizes.xxl, fontWeight: theme.fontWeights.black },
  statLabel: { color: theme.colors.textMuted, fontSize: theme.fontSizes.s, marginTop: 2 },

  // ── Playing ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  fuseRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  fuse: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: theme.borderWidths.medium,
    borderColor: theme.colors.borderStrong,
  },
  fuseActive: {
    backgroundColor: theme.colors.gold,
    borderColor: theme.colors.gold,
  },
  fuseBurned: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.borderMedium,
  },
  cardsLeft: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 0.5,
  },
  rulePill: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.md,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  ruleName: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 2,
  },
  ruleSafe: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.s,
    marginTop: 2,
  },
  ruleSafeValue: {
    color: theme.colors.greenPastel,
    fontWeight: theme.fontWeights.bold,
  },
  statusRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    justifyContent: 'center',
  },
  freezeBadge: {
    backgroundColor: 'rgba(100,180,255,0.15)',
    borderRadius: theme.radii.sm,
    borderWidth: theme.borderWidths.thin,
    borderColor: 'rgba(100,180,255,0.4)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  freezeText: {
    color: '#90cdf4',
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 0.5,
  },
  escalationBadge: {
    backgroundColor: 'rgba(246,173,85,0.15)',
    borderRadius: theme.radii.sm,
    borderWidth: theme.borderWidths.thin,
    borderColor: 'rgba(246,173,85,0.4)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  escalationBadgeText: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 0.5,
  },
  timerTrack: {
    height: 6,
    backgroundColor: theme.colors.bgPanel,
    borderRadius: 3,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: theme.colors.gold,
    borderRadius: 3,
  },
  cardArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.xl,
    position: 'relative',
  },
  card: {
    width: 160,
    height: 220,
    backgroundColor: theme.colors.cardFace,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.heavy,
  },
  cardCorrect: {
    borderColor: theme.colors.greenSuccess,
    borderWidth: 3,
  },
  cardWrong: {
    borderColor: theme.colors.errorRed,
    borderWidth: 3,
  },
  cardCornerRank: {
    position: 'absolute',
    top: 12,
    left: 14,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
  },
  cardCornerBottom: {
    top: undefined,
    bottom: 12,
    left: undefined,
    right: 14,
    transform: [{ rotate: '180deg' }],
  },
  cardSuitBig: {
    fontSize: theme.fontSizes.display,
    lineHeight: 52,
  },
  resultFlash: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultFlashCorrect: { backgroundColor: 'rgba(39,174,96,0.9)' },
  resultFlashWrong: { backgroundColor: 'rgba(231,76,60,0.9)' },
  resultFlashText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.h1,
    fontWeight: theme.fontWeights.black,
  },
  triggerBanner: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.md,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.gold,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  triggerBannerText: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
    textAlign: 'center',
  },
  triggerBannerPlaceholder: {
    height: 52,
    marginBottom: theme.spacing.lg,
  },
  sortRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    justifyContent: 'center',
  },
  sortBtn: {
    flex: 1,
    paddingVertical: theme.spacing.xl,
    borderRadius: theme.radii.xl,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  sortBtnSafe: {
    backgroundColor: theme.colors.greenPrimary,
  },
  sortBtnVolatile: {
    backgroundColor: theme.colors.red,
  },
  sortBtnDisabled: {
    opacity: 0.5,
  },
  sortBtnLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 2,
  },
  streakLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.s,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
});
