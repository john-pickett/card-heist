import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  ESCAPE_EXIT_POSITION,
  ESCAPE_POLICE_START_POSITION,
  ESCAPE_PLAYER_START_POSITION,
} from '../constants/escapeBalance';
import theme from '../theme';

interface EscapeHelpModalProps {
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
        body: `Move your token to the Exit before the police catch up. The police start behind you, but investigate more aggressively as turns go on.`,
      },
    ],
  },
  {
    heading: 'Your Turn',
    rows: [
      {
        label: 'Lay a Meld',
        body: 'Select 3 or 4 cards from your hand that form a valid meld, then tap LAY MELD. Your token advances 1 step toward EXIT.',
      },
      {
        label: 'Discard',
        body: 'Select 1 or more cards and tap DISCARD. Those cards are removed and replaced with new ones from the deck. Your position does not change, but the police still take their turn.',
      },
    ],
  },
  {
    heading: 'Valid Melds',
    rows: [
      {
        label: 'Set',
        body: '3 or 4 cards of the same rank. Example: 7♠ 7♥ 7♦.',
      },
      {
        label: 'Run',
        body: '3 or 4 consecutive ranks (any suit). Ace is low only. Example: A♣ 2♥ 3♦ or 9♦ 10♠ J♥.',
      },
    ],
  },
  {
    heading: 'Police Turn',
    rows: [
      {
        label: '',
        body: 'The police are on the scene and looking for you. They may get closer every turn, and will close in when the alert meter is filled.',
      },
    ],
  },
  {
    heading: 'Win / Lose',
    rows: [
      {
        label: 'Escape',
        body: `Reach step ${ESCAPE_EXIT_POSITION} (EXIT). You keep 100% of your campaign score.`,
      },
      {
        label: 'Caught',
        body: 'The police reach your step or pass it. You keep only a portion of your campaign score.',
      },
    ],
  },
  {
    heading: 'Tips',
    rows: [
      {
        label: '',
        body: 'Melds are the only way to advance — prioritize building them. Early turns are safer, but the police become more likely to close in each turn. Any 4-card meld advances you 2 steps.',
      },
    ],
  },
];

export function EscapeHelpModal({ visible, onClose }: EscapeHelpModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Act 3: Escape Rules</Text>
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
    height: '82%',
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
