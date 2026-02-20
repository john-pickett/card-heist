import React, { useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { createDeck, shuffleDeck } from '../data/deck';
import { Card, Rank } from '../types/card';

type EscapePhase =
  | 'overview'
  | 'draw_ready'
  | 'revealing'
  | 'draw_done'
  | 'busted'
  | 'cashed_out'
  | 'won';

const CHECKPOINTS = [
  { name: 'LEAVE THE VAULT', target: 21, leavePct: 40 },
  { name: 'CROSS THE LOBBY', target: 18, leavePct: 60 },
  { name: 'EXIT THE BANK',   target: 13, leavePct: 80 },
] as const;

const SUIT_SYMBOL: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};
const RED_SUITS = new Set(['hearts', 'diamonds']);

function cardValue(rank: Rank): number {
  if (rank === 'A') return 11;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return parseInt(rank, 10);
}

interface Props {
  totalScore: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function EscapeScreen({ totalScore, onPlayAgain, onHome }: Props) {
  const [phase, setPhase] = useState<EscapePhase>('overview');
  const [deck, setDeck] = useState<Card[]>(() => shuffleDeck(createDeck()));
  const [checkpointIndex, setCheckpointIndex] = useState<0 | 1 | 2>(0);
  const [card1, setCard1] = useState<Card | null>(null);
  const [card2, setCard2] = useState<Card | null>(null);

  const card1Scale = useRef(new Animated.Value(0)).current;
  const card2Scale = useRef(new Animated.Value(0)).current;
  const card1Flip  = useRef(new Animated.Value(0)).current;
  const card2Flip  = useRef(new Animated.Value(0)).current;

  const checkpoint = CHECKPOINTS[checkpointIndex];
  const goldFor = (pct: number) => Math.round(totalScore * pct / 100);

  // Flip interpolations — back disappears at 90deg, front appears from -90deg
  const back1Rotate = card1Flip.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '90deg', '90deg'] });
  const face1Rotate = card1Flip.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-90deg', '-90deg', '0deg'] });
  const back2Rotate = card2Flip.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '90deg', '90deg'] });
  const face2Rotate = card2Flip.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-90deg', '-90deg', '0deg'] });

  function handleLeaveNow() {
    setPhase('cashed_out');
  }

  function handleKeepLooting() {
    card1Scale.setValue(0);
    card2Scale.setValue(0);
    card1Flip.setValue(0);
    card2Flip.setValue(0);
    setCard1(null);
    setCard2(null);
    setPhase('draw_ready');
  }

  function handleDraw() {
    const [c1, c2, ...rest] = deck;
    card1Scale.setValue(0);
    card2Scale.setValue(0);
    card1Flip.setValue(0);
    card2Flip.setValue(0);
    setCard1(c1);
    setCard2(c2);
    setDeck(rest);
    setPhase('revealing');

    Animated.sequence([
      // Both cards grow in face-down simultaneously
      Animated.parallel([
        Animated.spring(card1Scale, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.spring(card2Scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      // Card 1 flips to reveal face
      Animated.timing(card1Flip, { toValue: 1, duration: 440, useNativeDriver: true }),
      Animated.delay(150),
      // Card 2 flips to reveal face
      Animated.timing(card2Flip, { toValue: 1, duration: 440, useNativeDriver: true }),
    ]).start(() => {
      setPhase('draw_done');
    });
  }

  function handleContinue() {
    if (!card1 || !card2) return;
    const sum = cardValue(card1.rank) + cardValue(card2.rank);
    if (sum > checkpoint.target) {
      setPhase('busted');
    } else if (checkpointIndex === 2) {
      setPhase('won');
    } else {
      setCard1(null);
      setCard2(null);
      setCheckpointIndex((checkpointIndex + 1) as 1 | 2);
      setPhase('overview');
    }
  }

  // ── Overview ────────────────────────────────────────────────────────────────
  if (phase === 'overview') {
    return (
      <ScrollView style={styles.scrollBg} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>ACT 3: ESCAPE</Text>

        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Campaign Score</Text>
          <Text style={styles.panelValue}>{totalScore}</Text>
          <View style={styles.divider} />
          <Text style={styles.panelLabel}>Current Payout if You Leave</Text>
          <Text style={styles.leaveAmount}>{goldFor(checkpoint.leavePct)} gold ({checkpoint.leavePct}%)</Text>
        </View>

        {CHECKPOINTS.map((cp, i) => {
          const isCompleted = checkpointIndex > i;
          const isCurrent   = checkpointIndex === i;

          if (isCompleted) {
            return (
              <View key={i} style={[styles.cpCard, styles.cpCompleted]}>
                <View style={styles.cpRow}>
                  <Text style={styles.cpCheckmark}>✓</Text>
                  <View style={styles.cpInfo}>
                    <Text style={styles.cpName}>{cp.name}</Text>
                    <Text style={styles.cpSub}>Draw ≤ {cp.target}</Text>
                  </View>
                  <View style={styles.cpBadge}>
                    <Text style={styles.cpBadgeText}>PASSED</Text>
                  </View>
                </View>
                <Text style={styles.cpEarned}>{goldFor(cp.leavePct)} gold payout passed</Text>
              </View>
            );
          }

          if (isCurrent) {
            return (
              <View key={i} style={[styles.cpCard, styles.cpCurrent]}>
                <Text style={styles.cpCurrentLabel}>CHECKPOINT {i + 1}</Text>
                <Text style={styles.cpCurrentName}>{cp.name}</Text>
                <Text style={styles.cpCurrentTarget}>Draw ≤ {cp.target} to survive</Text>
                <View style={styles.cpCurrentPayout}>
                  <Text style={styles.cpPayoutLabel}>Leave now:</Text>
                  <Text style={styles.cpPayoutValue}>{goldFor(cp.leavePct)} gold ({cp.leavePct}%)</Text>
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={[styles.btn, styles.btnLeave]} onPress={handleLeaveNow}>
                    <Text style={styles.btnText}>LEAVE NOW ({cp.leavePct}%)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.btnLoot]} onPress={handleKeepLooting}>
                    <Text style={styles.btnText}>KEEP LOOTING →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          // Upcoming
          return (
            <View key={i} style={[styles.cpCard, styles.cpUpcoming]}>
              <View style={styles.cpRow}>
                <Text style={styles.cpLock}>🔒</Text>
                <View style={styles.cpInfo}>
                  <Text style={styles.cpNameDim}>{cp.name}</Text>
                  <Text style={styles.cpSubDim}>Draw ≤ {cp.target} · {cp.leavePct}% payout</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  }

  // ── Drawing Sub-Screen ──────────────────────────────────────────────────────
  if (phase === 'draw_ready' || phase === 'revealing' || phase === 'draw_done') {
    const sum = card1 && card2 ? cardValue(card1.rank) + cardValue(card2.rank) : null;
    const safe = sum !== null && sum <= checkpoint.target;
    const isAnimating = phase === 'revealing';

    return (
      <View style={styles.screen}>
        <View style={styles.drawHeader}>
          {phase === 'draw_ready' && (
            <TouchableOpacity onPress={() => setPhase('overview')} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← BACK</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.drawHeaderTitle}>
            CHECKPOINT {checkpointIndex + 1} — {checkpoint.name}
          </Text>
          <Text style={styles.drawHeaderTarget}>Draw ≤ {checkpoint.target}</Text>
        </View>

        <Text style={styles.rulesBlurb}>
          Draw two cards. If their combined value exceeds {checkpoint.target}, you're caught.
        </Text>

        <View style={styles.cardRow}>
          {phase === 'draw_ready' ? (
            <>
              <View style={styles.cardBack}><Text style={styles.cardBackText}>?</Text></View>
              <View style={styles.cardBack}><Text style={styles.cardBackText}>?</Text></View>
            </>
          ) : (
            <>
              {/* Card 1 */}
              <Animated.View style={[styles.cardContainer, { transform: [{ scale: card1Scale }] }]}>
                <Animated.View
                  style={[
                    styles.cardBack, styles.cardAbsolute,
                    { backfaceVisibility: 'hidden', transform: [{ perspective: 1000 }, { rotateY: back1Rotate }] },
                  ]}
                >
                  <Text style={styles.cardBackText}>?</Text>
                </Animated.View>
                <Animated.View
                  style={[
                    styles.cardFace, styles.cardAbsolute,
                    { backfaceVisibility: 'hidden', transform: [{ perspective: 1000 }, { rotateY: face1Rotate }] },
                  ]}
                >
                  {card1 && (
                    <>
                      <Text style={[styles.cardRank, RED_SUITS.has(card1.suit) && styles.redText]}>{card1.rank}</Text>
                      <Text style={[styles.cardSuit, RED_SUITS.has(card1.suit) && styles.redText]}>{SUIT_SYMBOL[card1.suit]}</Text>
                      <Text style={styles.cardValue}>{cardValue(card1.rank)}</Text>
                    </>
                  )}
                </Animated.View>
              </Animated.View>

              {/* Card 2 */}
              <Animated.View style={[styles.cardContainer, { transform: [{ scale: card2Scale }] }]}>
                <Animated.View
                  style={[
                    styles.cardBack, styles.cardAbsolute,
                    { backfaceVisibility: 'hidden', transform: [{ perspective: 1000 }, { rotateY: back2Rotate }] },
                  ]}
                >
                  <Text style={styles.cardBackText}>?</Text>
                </Animated.View>
                <Animated.View
                  style={[
                    styles.cardFace, styles.cardAbsolute,
                    { backfaceVisibility: 'hidden', transform: [{ perspective: 1000 }, { rotateY: face2Rotate }] },
                  ]}
                >
                  {card2 && (
                    <>
                      <Text style={[styles.cardRank, RED_SUITS.has(card2.suit) && styles.redText]}>{card2.rank}</Text>
                      <Text style={[styles.cardSuit, RED_SUITS.has(card2.suit) && styles.redText]}>{SUIT_SYMBOL[card2.suit]}</Text>
                      <Text style={styles.cardValue}>{cardValue(card2.rank)}</Text>
                    </>
                  )}
                </Animated.View>
              </Animated.View>
            </>
          )}
        </View>

        {phase === 'draw_done' && sum !== null && (
          <View style={styles.resultBlock}>
            <Text style={styles.sumText}>Total: {sum}</Text>
            <Text style={[styles.resultLabel, safe ? styles.resultSafe : styles.resultBust]}>
              {safe ? `✓ SAFE (≤ ${checkpoint.target})` : `✗ BUSTED (> ${checkpoint.target})`}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, styles.btnLoot, styles.btnFull, (isAnimating || phase === 'draw_done') && styles.btnDisabled]}
          onPress={phase === 'draw_ready' ? handleDraw : undefined}
          disabled={isAnimating || phase === 'draw_done'}
        >
          <Text style={styles.btnText}>DRAW BOTH CARDS</Text>
        </TouchableOpacity>

        {phase === 'draw_done' && (
          <TouchableOpacity style={[styles.btn, styles.btnLoot, styles.btnFull, styles.btnContinue]} onPress={handleContinue}>
            <Text style={styles.btnText}>CONTINUE</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ── Busted ──────────────────────────────────────────────────────────────────
  if (phase === 'busted') {
    return (
      <View style={styles.screen}>
        <Text style={[styles.heading, styles.headingRed]}>BUSTED!</Text>
        <Text style={styles.subheading}>The cops got you.</Text>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>You escape with:</Text>
          <Text style={styles.goldAmount}>{goldFor(20)} gold</Text>
          <Text style={styles.pctLabel}>(20% of campaign score)</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.btn, styles.btnLoot]} onPress={onPlayAgain}>
            <Text style={styles.btnText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onHome}>
            <Text style={[styles.btnText, styles.btnTextSecondary]}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Cashed Out ──────────────────────────────────────────────────────────────
  if (phase === 'cashed_out') {
    return (
      <View style={styles.screen}>
        <Text style={[styles.heading, styles.headingGold]}>ESCAPED!</Text>
        <Text style={styles.subheading}>{checkpoint.name}</Text>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>You escape with:</Text>
          <Text style={styles.goldAmount}>{goldFor(checkpoint.leavePct)} gold</Text>
          <Text style={styles.pctLabel}>({checkpoint.leavePct}% of campaign score)</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.btn, styles.btnLoot]} onPress={onPlayAgain}>
            <Text style={styles.btnText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onHome}>
            <Text style={[styles.btnText, styles.btnTextSecondary]}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Won ─────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <Text style={[styles.heading, styles.headingGold]}>CLEAN ESCAPE!</Text>
      <Text style={styles.subheading}>You made it out with everything.</Text>
      <View style={styles.panel}>
        <Text style={styles.panelLabel}>You escape with:</Text>
        <Text style={styles.goldAmount}>{goldFor(120)} gold</Text>
        <Text style={styles.pctLabel}>(120% of campaign score)</Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.btn, styles.btnLoot]} onPress={onPlayAgain}>
          <Text style={styles.btnText}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onHome}>
          <Text style={[styles.btnText, styles.btnTextSecondary]}>Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Layout ──────────────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  scrollBg: {
    flex: 1,
    backgroundColor: '#2d6a4f',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // ── Typography ──────────────────────────────────────────────────────────────
  heading: {
    color: '#f4d03f',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  headingGold: { color: '#f4d03f' },
  headingRed:  { color: '#e74c3c' },
  subheading: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
    textAlign: 'center',
  },

  // ── Score Panel ─────────────────────────────────────────────────────────────
  panel: {
    backgroundColor: '#1b4332',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 12,
  },
  panelLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  panelValue: {
    color: '#f4d03f',
    fontSize: 48,
    fontWeight: '900',
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
  leaveAmount: {
    color: '#95d5b2',
    fontSize: 22,
    fontWeight: '800',
  },
  goldAmount: {
    color: '#f4d03f',
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 4,
  },
  pctLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontStyle: 'italic',
  },

  // ── Checkpoint Cards ─────────────────────────────────────────────────────────
  cpCard: {
    width: '100%',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cpCompleted: {
    backgroundColor: '#1b4332',
    borderColor: '#40916c',
  },
  cpCurrent: {
    backgroundColor: '#1b4332',
    borderColor: '#f4d03f',
    borderWidth: 2,
  },
  cpUpcoming: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderColor: 'rgba(255,255,255,0.08)',
    opacity: 0.35,
  },
  cpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cpInfo: {
    flex: 1,
  },
  cpCheckmark: {
    color: '#95d5b2',
    fontSize: 22,
    fontWeight: '900',
  },
  cpLock: {
    fontSize: 18,
  },
  cpName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cpSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  cpNameDim: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cpSubDim: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 2,
  },
  cpBadge: {
    backgroundColor: '#40916c',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cpBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cpEarned: {
    color: 'rgba(149,213,178,0.6)',
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
  cpCurrentLabel: {
    color: '#f4d03f',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  cpCurrentName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cpCurrentTarget: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  cpCurrentPayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cpPayoutLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
  },
  cpPayoutValue: {
    color: '#95d5b2',
    fontSize: 14,
    fontWeight: '800',
  },

  // ── Drawing Sub-Screen ───────────────────────────────────────────────────────
  drawHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  drawHeaderTitle: {
    color: '#f4d03f',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  drawHeaderTarget: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  rulesBlurb: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 28,
    lineHeight: 19,
    paddingHorizontal: 8,
  },

  // ── Cards ────────────────────────────────────────────────────────────────────
  cardRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  cardContainer: {
    width: 110,
    height: 160,
  },
  cardAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 110,
    height: 160,
  },
  cardFace: {
    width: 110,
    height: 160,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardBack: {
    width: 110,
    height: 160,
    backgroundColor: '#1b4332',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#40916c',
  },
  cardBackText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 48,
    fontWeight: '900',
  },
  cardRank: {
    color: '#1a1a1a',
    fontSize: 32,
    fontWeight: '900',
  },
  cardSuit: {
    color: '#1a1a1a',
    fontSize: 28,
    marginTop: -4,
  },
  cardValue: {
    color: 'rgba(0,0,0,0.35)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  redText: { color: '#c0392b' },

  // ── Result ───────────────────────────────────────────────────────────────────
  resultBlock: {
    alignItems: 'center',
    marginBottom: 8,
  },
  sumText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  resultSafe: { color: '#95d5b2' },
  resultBust: { color: '#e74c3c' },

  // ── Buttons ──────────────────────────────────────────────────────────────────
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  btnFull: {
    width: '100%',
    flex: 0,
    marginTop: 16,
  },
  btnContinue: {
    marginTop: 12,
  },
  btnLeave: {
    backgroundColor: '#2d6a4f',
    borderColor: '#40916c',
  },
  btnLoot: {
    backgroundColor: '#40916c',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  btnDisabled: {
    backgroundColor: 'rgba(64,145,108,0.4)',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnTextSecondary: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
});
