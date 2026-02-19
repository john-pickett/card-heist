import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GameCard } from '../types/game';

interface MiniCardProps {
  gameCard: GameCard;
  isSelected: boolean;
  isHotfixMode: boolean;
  onPress: () => void;
}

const SUIT_SYMBOL: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const RED_SUITS = new Set(['hearts', 'diamonds']);

export const CARD_WIDTH = 96;
export const CARD_HEIGHT = 130;

export function MiniCard({ gameCard, isSelected, isHotfixMode, onPress }: MiniCardProps) {
  const { card, resolved } = gameCard;
  const isRed = RED_SUITS.has(card.suit);
  const symbol = SUIT_SYMBOL[card.suit] ?? card.suit;

  const cardStyle = [
    styles.card,
    isSelected && styles.selected,
    !resolved && styles.unresolved,
    isHotfixMode && styles.hotfix,
  ];

  return (
    <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.75}>
      {/* Top-left corner */}
      <View style={styles.corner}>
        <Text style={[styles.cornerRank, isRed && styles.red, !resolved && styles.dimText]}>
          {card.rank}
        </Text>
        <Text style={[styles.cornerSuit, isRed && styles.red, !resolved && styles.dimText]}>
          {symbol}
        </Text>
      </View>

      {/* Center */}
      <View style={styles.center}>
        <Text style={[styles.centerSuit, isRed && styles.red, !resolved && styles.dimText]}>
          {symbol}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
    padding: 6,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  selected: {
    borderColor: '#f4d03f',
    borderWidth: 3,
    transform: [{ scale: 1.04 }],
  },
  unresolved: {
    borderStyle: 'dashed',
    borderColor: '#aaaaaa',
    opacity: 0.85,
  },
  hotfix: {
    borderColor: '#e67e22',
    borderWidth: 2,
  },
  corner: {
    alignItems: 'flex-start',
  },
  cornerRank: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111111',
    lineHeight: 18,
  },
  cornerSuit: {
    fontSize: 12,
    color: '#111111',
    lineHeight: 14,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  centerSuit: {
    fontSize: 30,
    color: '#111111',
  },
  red: {
    color: '#c0392b',
  },
  dimText: {
    opacity: 0.6,
  },
});
