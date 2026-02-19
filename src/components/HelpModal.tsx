import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Section {
  heading: string;
  rows: { label: string; body: string }[];
}

const SECTIONS: Section[] = [
  {
    heading: 'Goal',
    rows: [
      {
        label: '',
        body:
          'Clear all 4 sprint columns (Mon–Thu) by selecting groups of cards whose values add up exactly to the column budget. Start each column with a budget of 15 points.',
      },
    ],
  },
  {
    heading: 'Selecting cards',
    rows: [
      {
        label: 'Tap',
        body: 'Tap any numeric card to select/deselect it. The running sum shows at the bottom.',
      },
      {
        label: 'Confirm',
        body:
          'CONFIRM appears when your selection sums exactly to the column budget. Tap to remove those cards.',
      },
      {
        label: 'Switch columns',
        body: 'Tapping a card in a different column clears your current selection.',
      },
    ],
  },
  {
    heading: 'Card values',
    rows: [
      { label: '2 – 10', body: 'Worth their face value.' },
      {
        label: 'Ace',
        body:
          'Worth 1 or 11 — the game picks whichever value makes your selection valid when you confirm.',
      },
    ],
  },
  {
    heading: 'Face cards (tap to activate)',
    rows: [
      {
        label: 'Jack  J',
        body:
          'Tap to activate. The Jack is removed from the column, and 1 new card is drawn from the deck and added in its place.',
      },
      {
        label: 'Queen  Q',
        body:
          'Tap to activate. Opens a delegation dialog. You choose to keep her in the current column or move her to another column. Either way she becomes a 10-point card and the receiving column gains +10 budget.',
      },
      {
        label: 'King  K',
        body:
          'Tap to activate. The King is removed, the column budget increases by +5, and 2 new cards are drawn from the deck into the column.',
      },
    ],
  },
  {
    heading: 'Hotfix  (one-time)',
    rows: [
      {
        label: '',
        body:
          'If a column is BLOCKED (no valid subset sums to its budget), tap HOTFIX. Blocked columns glow amber. Tap any card in a blocked column to permanently discard it and draw a replacement from the deck. You can cancel before choosing a card without spending the Hotfix.',
      },
    ],
  },
  {
    heading: 'Win / Lose',
    rows: [
      { label: 'Win', body: 'All 4 columns are cleared.' },
      {
        label: 'Lose',
        body:
          'The draw pile is empty AND every remaining column is blocked (no valid moves exist).',
      },
    ],
  },
  {
    heading: 'Score',
    rows: [
      {
        label: '',
        body:
          'Cards cleared × 10, minus elapsed seconds. Clear fast and clear everything for the best score.',
      },
    ],
  },
];

export function HelpModal({ visible, onClose }: HelpModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>How to Play</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {SECTIONS.map(section => (
              <View key={section.heading} style={styles.section}>
                <Text style={styles.sectionHeading}>{section.heading}</Text>
                {section.rows.map((row, i) => (
                  <View key={i} style={styles.row}>
                    {row.label ? (
                      <Text style={styles.rowLabel}>{row.label}</Text>
                    ) : null}
                    <Text style={[styles.rowBody, !row.label && styles.rowBodyFull]}>
                      {row.body}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Got it</Text>
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
    height: '88%',
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    flex: 1,
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 18,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    color: '#f4d03f',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: {
    marginBottom: 8,
  },
  rowLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  rowBody: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    lineHeight: 19,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.15)',
  },
  rowBodyFull: {
    paddingLeft: 0,
    borderLeftWidth: 0,
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
