import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme';

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
    backgroundColor: theme.colors.overlayModal,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.bgPanel,
    borderTopLeftRadius: theme.radii.xxl,
    borderTopRightRadius: theme.radii.xxl,
    height: '88%',
    paddingBottom: theme.spacing.xxl,
    borderTopWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderFaint,
  },
  title: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: theme.spacing.xs,
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: theme.fontSizes.lg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeading: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  row: {
    marginBottom: theme.spacing.sm,
  },
  rowLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: theme.fontWeights.bold,
    marginBottom: 2,
  },
  rowBody: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: theme.fontSizes.md,
    lineHeight: 19,
    paddingLeft: theme.spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.borderMedium,
  },
  rowBodyFull: {
    paddingLeft: 0,
    borderLeftWidth: 0,
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
