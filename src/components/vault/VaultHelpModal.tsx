import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../../theme';

interface ReckoningHelpModalProps {
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
        body: 'Build each vault toward its target without going over. Targets are 13, 18, and 21.',
      },
    ],
  },
  {
    heading: 'Turn Flow',
    rows: [
      {
        label: '1. Flip',
        body: 'Tap FLIP CARD to draw the next card from the deck.',
      },
      {
        label: '2. Assign',
        body: 'Tap a vault to assign the drawn card there.',
      },
      {
        label: '3. Repeat',
        body: 'Keep flipping and assigning until vaults are stood/busted or the deck runs out.',
      },
    ],
  },
  {
    heading: 'Card Values',
    rows: [
      { label: '2-10', body: 'Face value.' },
      { label: 'J, Q, K', body: 'Worth 10.' },
      { label: 'Ace', body: 'Choose 1 or 11 when you assign it.' },
    ],
  },
  {
    heading: 'Vault Outcomes',
    rows: [
      {
        label: 'Exact hit',
        body: 'If a vault total equals its target exactly, it stands automatically.',
      },
      {
        label: 'Bust',
        body: 'If a vault total goes over target, that vault is busted and scores 0.',
      },
      {
        label: 'Stand',
        body: 'You can tap STAND on a vault to lock its current total and stop assigning to it.',
      },
    ],
  },
  {
    heading: 'Scoring',
    rows: [
      {
        label: '',
        body: 'Busted vault: 0. Exact target: double the vault sum. Otherwise: vault sum.',
      },
    ],
  },
  {
    heading: 'Game End',
    rows: [
      {
        label: '',
        body: 'The round ends when all vaults are terminal (stood or busted), or when the deck is empty.',
      },
    ],
  },
];

export function ReckoningHelpModal({ visible, onClose }: ReckoningHelpModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Crack The Vaults Rules</Text>
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
    height: '84%',
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
