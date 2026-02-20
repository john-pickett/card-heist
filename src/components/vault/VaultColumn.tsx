import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Vault } from '../../types/reckoning';

const SUIT_SYMBOL: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};
const RED_SUITS = new Set(['hearts', 'diamonds']);

interface VaultColumnProps {
  vault: Vault;
  isAssignable: boolean;
  isDragTarget: boolean;
  onAssign: () => void;
  onStand: () => void;
}

export const VaultColumn = React.forwardRef<View, VaultColumnProps>(
  ({ vault, isAssignable, isDragTarget, onAssign, onStand }, ref) => {
    const isTerminal = vault.isBusted || vault.isStood;
    const isExact = !vault.isBusted && vault.sum === vault.target;

    const sumColor = vault.isBusted
      ? '#e74c3c'
      : isExact
      ? '#f4d03f'
      : vault.sum >= vault.target - 2
      ? '#e67e22'
      : '#ffffff';

    return (
      <TouchableOpacity
        ref={ref as any}
        style={[
          styles.column,
          isAssignable && styles.columnAssignable,
          isDragTarget && styles.columnDragTarget,
          isExact && styles.columnExact,
          isTerminal && !isExact && styles.columnTerminal,
        ]}
        onPress={isAssignable ? onAssign : undefined}
        activeOpacity={isAssignable ? 0.75 : 1}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.vaultLabel}>Vault {vault.id + 1}</Text>
          <View style={styles.targetBadge}>
            <Text style={styles.targetText}>{vault.target}</Text>
          </View>
        </View>

        {/* Sum badge */}
        <View style={styles.sumRow}>
          <Text style={[styles.sumText, { color: sumColor }]}>{vault.sum}</Text>
          {isExact && <Text style={styles.exactBadge}>×2</Text>}
        </View>

        {/* Cards */}
        <ScrollView style={styles.cardsScroll} showsVerticalScrollIndicator={false}>
          {vault.cards.map((vc) => {
            const isRed = RED_SUITS.has(vc.card.suit);
            const symbol = SUIT_SYMBOL[vc.card.suit] ?? '';
            const displayRank =
              vc.card.rank === 'A' && vc.aceValue != null
                ? `A(${vc.aceValue})`
                : vc.card.rank;
            return (
              <View key={vc.instanceId} style={styles.cardTile}>
                <Text style={[styles.cardRank, isRed && styles.red]}>{displayRank}</Text>
                <Text style={[styles.cardSuit, isRed && styles.red]}>{symbol}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Stand button */}
        {!isTerminal && (
          <TouchableOpacity
            style={styles.standBtn}
            onPress={onStand}
            hitSlop={4}
          >
            <Text style={styles.standBtnText}>STAND</Text>
          </TouchableOpacity>
        )}

        {/* Terminal overlays */}
        {vault.isBusted && (
          <View style={[styles.overlay, styles.bustedOverlay]}>
            <Text style={styles.overlayText}>BUST</Text>
          </View>
        )}
        {vault.isStood && !vault.isBusted && isExact && (
          <View style={[styles.overlay, styles.exactOverlay]}>
            <Text style={styles.exactOverlayLabel}>EXACT ×2</Text>
            <Text style={styles.exactOverlayScore}>{vault.sum * 2}</Text>
          </View>
        )}
        {vault.isStood && !vault.isBusted && !isExact && (
          <View style={[styles.overlay, styles.stoodOverlay]}>
            <Text style={styles.overlayText}>STOOD</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  column: {
    flex: 1,
    backgroundColor: '#1b4332',
    borderRadius: 10,
    marginHorizontal: 3,
    padding: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  columnAssignable: {
    borderColor: '#40916c',
    borderWidth: 2,
    shadowColor: '#40916c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  columnDragTarget: {
    borderColor: 'rgba(255,255,255,0.65)',
    borderWidth: 2.5,
  },
  columnExact: {
    borderColor: '#f4d03f',
    borderWidth: 2,
    shadowColor: '#f4d03f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  columnTerminal: {
    opacity: 0.72,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  vaultLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  targetBadge: {
    backgroundColor: '#2d6a4f',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  targetText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  sumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  sumText: {
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  exactBadge: {
    color: '#f4d03f',
    fontSize: 13,
    fontWeight: '800',
  },
  cardsScroll: {
    flex: 1,
    marginBottom: 4,
  },
  cardTile: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardRank: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111111',
  },
  cardSuit: {
    fontSize: 13,
    color: '#111111',
  },
  red: {
    color: '#c0392b',
  },
  standBtn: {
    backgroundColor: '#2d6a4f',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: 2,
  },
  standBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  bustedOverlay: {
    backgroundColor: 'rgba(231, 76, 60, 0.45)',
  },
  stoodOverlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  exactOverlay: {
    backgroundColor: 'rgba(244, 208, 63, 0.22)',
  },
  overlayText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  exactOverlayLabel: {
    color: '#f4d03f',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  exactOverlayScore: {
    color: '#f4d03f',
    fontSize: 38,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 2,
  },
});
