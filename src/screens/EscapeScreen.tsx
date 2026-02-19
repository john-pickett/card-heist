import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createDeck, shuffleDeck } from '../data/deck';
import { Card, Rank } from '../types/card';

type EscapePhase = 'offer' | 'revealing_1' | 'revealing_2' | 'busted' | 'cashed_out' | 'won';

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
  const [phase, setPhase] = useState<EscapePhase>('offer');
  const [deck, setDeck] = useState<Card[]>(() => shuffleDeck(createDeck()));
  const [checkpointIndex, setCheckpointIndex] = useState<0 | 1 | 2>(0);
  const [card1, setCard1] = useState<Card | null>(null);
  const [card2, setCard2] = useState<Card | null>(null);

  const checkpoint = CHECKPOINTS[checkpointIndex];
  const goldFor = (pct: number) => Math.round(totalScore * pct / 100);

  useEffect(() => {
    if (phase !== 'revealing_1') return;
    const timer = setTimeout(() => {
      setDeck(prev => {
        const [c2, ...rest] = prev;
        setCard2(c2);
        return rest;
      });
      setPhase('revealing_2');
    }, 2000);
    return () => clearTimeout(timer);
  }, [phase]);

  function handleKeepLooting() {
    setDeck(prev => {
      const [c1, ...rest] = prev;
      setCard1(c1);
      setCard2(null);
      return rest;
    });
    setPhase('revealing_1');
  }

  function handleLeaveNow() {
    setPhase('cashed_out');
  }

  function handleContinue() {
    if (!card1 || !card2) return;
    const sum = cardValue(card1.rank) + cardValue(card2.rank);
    if (sum > checkpoint.target) {
      setPhase('busted');
    } else if (checkpointIndex === 2) {
      setPhase('won');
    } else {
      setCheckpointIndex((checkpointIndex + 1) as 1 | 2);
      setPhase('offer');
    }
  }

  if (phase === 'offer') {
    return (
      <View style={styles.screen}>
        <Text style={styles.heading}>ACT 3: ESCAPE</Text>
        <Text style={styles.subheading}>CHECKPOINT {checkpointIndex + 1} — {checkpoint.name}</Text>
        <Text style={styles.targetLabel}>Draw ≤ {checkpoint.target} to survive</Text>

        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Campaign Score</Text>
          <Text style={styles.panelValue}>{totalScore}</Text>
          <View style={styles.divider} />
          <Text style={styles.panelLabel}>Leave now</Text>
          <Text style={styles.leaveAmount}>{goldFor(checkpoint.leavePct)} gold ({checkpoint.leavePct}%)</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.btn, styles.btnLeave]} onPress={handleLeaveNow}>
            <Text style={styles.btnText}>LEAVE NOW ({checkpoint.leavePct}%)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnLoot]} onPress={handleKeepLooting}>
            <Text style={styles.btnText}>KEEP LOOTING →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (phase === 'revealing_1' || phase === 'revealing_2') {
    const sum = card1 && card2 ? cardValue(card1.rank) + cardValue(card2.rank) : null;
    const safe = sum !== null && sum <= checkpoint.target;

    return (
      <View style={styles.screen}>
        <Text style={styles.heading}>
          {phase === 'revealing_1' ? 'DRAWING...' : `CHECKPOINT ${checkpointIndex + 1} — ${checkpoint.name}`}
        </Text>

        <View style={styles.cardRow}>
          {card1 ? (
            <View style={styles.cardFace}>
              <Text style={[styles.cardRank, RED_SUITS.has(card1.suit) && styles.redText]}>
                {card1.rank}
              </Text>
              <Text style={[styles.cardSuit, RED_SUITS.has(card1.suit) && styles.redText]}>
                {SUIT_SYMBOL[card1.suit]}
              </Text>
              <Text style={styles.cardValue}>{cardValue(card1.rank)}</Text>
            </View>
          ) : (
            <View style={styles.cardBack}><Text style={styles.cardBackText}>?</Text></View>
          )}

          {card2 ? (
            <View style={styles.cardFace}>
              <Text style={[styles.cardRank, RED_SUITS.has(card2.suit) && styles.redText]}>
                {card2.rank}
              </Text>
              <Text style={[styles.cardSuit, RED_SUITS.has(card2.suit) && styles.redText]}>
                {SUIT_SYMBOL[card2.suit]}
              </Text>
              <Text style={styles.cardValue}>{cardValue(card2.rank)}</Text>
            </View>
          ) : (
            <View style={styles.cardBack}><Text style={styles.cardBackText}>?</Text></View>
          )}
        </View>

        {phase === 'revealing_2' && sum !== null && (
          <View style={styles.resultBlock}>
            <Text style={styles.sumText}>Total: {sum}</Text>
            <Text style={[styles.resultLabel, safe ? styles.resultSafe : styles.resultBust]}>
              {safe ? `✓ SAFE (≤ ${checkpoint.target})` : `✗ BUSTED (> ${checkpoint.target})`}
            </Text>
          </View>
        )}

        {phase === 'revealing_2' && (
          <TouchableOpacity style={[styles.btn, styles.btnLoot, styles.btnFull]} onPress={handleContinue}>
            <Text style={styles.btnText}>CONTINUE</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

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

  // phase === 'won'
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
  screen: {
    flex: 1,
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  heading: {
    color: '#f4d03f',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  headingGold: {
    color: '#f4d03f',
  },
  headingRed: {
    color: '#e74c3c',
  },
  subheading: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  targetLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 28,
    fontStyle: 'italic',
  },
  panel: {
    backgroundColor: '#1b4332',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    marginBottom: 28,
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
  cardRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 32,
    marginBottom: 24,
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
  redText: {
    color: '#c0392b',
  },
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
  resultSafe: {
    color: '#95d5b2',
  },
  resultBust: {
    color: '#e74c3c',
  },
});
