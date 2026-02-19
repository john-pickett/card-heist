import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AceModal } from '../components/reckoning/AceModal';
import { VaultColumn } from '../components/reckoning/VaultColumn';
import { useReckoningStore } from '../store/reckoningStore';

const SUIT_SYMBOL: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};
const RED_SUITS = new Set(['hearts', 'diamonds']);

interface ReckoningScreenProps {
  onGameEnd: () => void;
}

export function ReckoningScreen({ onGameEnd }: ReckoningScreenProps) {
  const phase = useReckoningStore((s) => s.phase);
  const deck = useReckoningStore((s) => s.deck);
  const currentCard = useReckoningStore((s) => s.currentCard);
  const vaults = useReckoningStore((s) => s.vaults);

  const initGame = useReckoningStore((s) => s.initGame);
  const flipCard = useReckoningStore((s) => s.flipCard);
  const assignCard = useReckoningStore((s) => s.assignCard);
  const standVault = useReckoningStore((s) => s.standVault);

  useEffect(() => {
    if (phase === 'idle') {
      initGame();
    }
  }, []);

  useEffect(() => {
    if (phase === 'done') {
      onGameEnd();
    }
  }, [phase]);

  const canFlip = phase === 'dealing' && currentCard === null;
  const hasCard = currentCard !== null && phase === 'assigning';

  const isRed = currentCard ? RED_SUITS.has(currentCard.suit) : false;
  const symbol = currentCard ? (SUIT_SYMBOL[currentCard.suit] ?? '') : '';

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>CRACK THE VAULTS</Text>
        <View style={styles.drawBadge}>
          <Text style={styles.drawText}>Draw: {deck.length}</Text>
        </View>
      </View>

      {/* Vaults */}
      <View style={styles.vaultsRow}>
        {vaults.map((vault) => {
          const vaultTerminal = vault.isBusted || vault.isStood;
          const isAssignable = hasCard && !vaultTerminal;
          return (
            <VaultColumn
              key={vault.id}
              vault={vault}
              isAssignable={isAssignable}
              onAssign={() => assignCard(vault.id)}
              onStand={() => standVault(vault.id)}
            />
          );
        })}
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        {hasCard && currentCard ? (
          <View style={styles.currentCardArea}>
            <View style={styles.cardDisplay}>
              <Text style={[styles.cardRank, isRed && styles.red]}>
                {currentCard.rank}
              </Text>
              <Text style={[styles.cardSuit, isRed && styles.red]}>{symbol}</Text>
            </View>
            <Text style={styles.assignHint}>Tap a vault to assign</Text>
          </View>
        ) : (
          <View style={styles.noCardArea}>
            {phase === 'dealing' && deck.length === 0 && (
              <Text style={styles.emptyDeckHint}>Deck empty — stand remaining vaults</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.flipBtn, !canFlip && styles.flipBtnDisabled]}
          onPress={canFlip ? flipCard : undefined}
          activeOpacity={canFlip ? 0.75 : 1}
        >
          <Text style={styles.flipBtnText}>
            {deck.length === 0 ? 'DECK EMPTY' : 'FLIP CARD'}
          </Text>
        </TouchableOpacity>
      </View>

      <AceModal />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#2d6a4f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    flex: 1,
  },
  drawBadge: {
    backgroundColor: '#1b4332',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  drawText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  vaultsRow: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 4,
  },
  bottomBar: {
    backgroundColor: '#1b4332',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 10,
  },
  currentCardArea: {
    alignItems: 'center',
    gap: 6,
  },
  noCardArea: {
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDisplay: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    width: 72,
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  cardRank: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111111',
  },
  cardSuit: {
    fontSize: 20,
    color: '#111111',
    marginTop: -2,
  },
  red: {
    color: '#c0392b',
  },
  assignHint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyDeckHint: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  flipBtn: {
    backgroundColor: '#40916c',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  flipBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  flipBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
