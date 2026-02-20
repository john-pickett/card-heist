import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Rank, Suit } from '../types/card';
import { EscapeCard } from '../types/escape';

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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1b4332',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: { padding: 4 },
  closeBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 18,
  },
  subheader: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
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
    fontWeight: '900',
    width: 22,
    marginTop: 2,
  },
  redLabel: {
    color: '#e74c3c',
  },
  chips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipText: {
    color: '#1a1a1a',
    fontSize: 13,
    fontWeight: '700',
  },
  redText: { color: '#c0392b' },
  emptyDash: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 16,
    marginTop: 2,
  },
  doneBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#2d6a4f',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
