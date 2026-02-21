import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Rank, Suit } from '../types/card';
import { EscapeCard } from '../types/escape';
import theme from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  outOfPlay: EscapeCard[];
  deckCount: number;
}

const RANK_ORDER: Rank[] = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

const SUITS: { suit: Suit; symbol: string; red: boolean }[] = [
  { suit: 'spades',   symbol: '♠', red: false },
  { suit: 'hearts',   symbol: '♥', red: true  },
  { suit: 'diamonds', symbol: '♦', red: true  },
  { suit: 'clubs',    symbol: '♣', red: false },
];

export function EscapeDiscardModal({ visible, onClose, outOfPlay, deckCount }: Props) {
  const gone = outOfPlay.length;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Cards Out of Play</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subheader}>
            {gone} cards gone — {deckCount} remain in deck
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {SUITS.map(({ suit, symbol, red }) => {
              const suitCards = outOfPlay
                .filter(ec => ec.card.suit === suit)
                .sort((a, b) => RANK_ORDER.indexOf(a.card.rank) - RANK_ORDER.indexOf(b.card.rank));

              return (
                <View key={suit} style={styles.suitRow}>
                  <Text style={[styles.suitLabel, red && styles.redLabel]}>{symbol}</Text>
                  <View style={styles.chips}>
                    {suitCards.length === 0 ? (
                      <Text style={styles.emptyDash}>—</Text>
                    ) : (
                      suitCards.map(ec => (
                        <View key={ec.instanceId} style={styles.chip}>
                          <Text style={[styles.chipText, red && styles.redText]}>
                            {ec.card.rank}{symbol}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayModal,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.bgPanel,
    borderTopLeftRadius: theme.radii.xxl,
    borderTopRightRadius: theme.radii.xxl,
    height: '75%',
    paddingBottom: theme.spacing.xxl,
    borderTopWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderFaint,
  },
  title: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
  },
  closeBtn: { padding: theme.spacing.xs },
  closeBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: theme.fontSizes.lg,
  },
  subheader: {
    color: theme.colors.textSoft,
    fontSize: 12,
    fontWeight: theme.fontWeights.medium,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 10,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
    gap: 14,
  },
  suitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  suitLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 20,
    fontWeight: theme.fontWeights.black,
    width: 22,
    marginTop: 2,
  },
  redLabel: {
    color: theme.colors.errorRed,
  },
  chips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: theme.colors.cardFace,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipText: {
    color: theme.colors.cardTextDark,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
  },
  redText: { color: theme.colors.red },
  emptyDash: {
    color: theme.colors.borderBright,
    fontSize: 16,
    marginTop: 2,
  },
  doneBtn: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.bgPrimary,
    borderRadius: theme.radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderMedium,
  },
  doneBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
  },
});
