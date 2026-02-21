import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme';

interface SneakInHelpModalProps {
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
        body: 'Place two or three cards into each security area so each total exactly matches its target number.',
      },
    ],
  },
  {
    heading: 'How To Move Cards',
    rows: [
      {
        label: 'Drag cards',
        body: 'Drag from your hand to an unlocked area, from one area to another, or back to your hand.',
      },
      {
        label: 'Drop rules',
        body: 'You can only drop into unlocked areas with space (max 3 cards per area).',
      },
    ],
  },
  {
    heading: 'Unlocking Areas',
    rows: [
      {
        label: '',
        body: 'Only the first area starts unlocked. Solving an area unlocks the next one in order.',
      },
    ],
  },
  {
    heading: 'Solving',
    rows: [
      {
        label: '',
        body: 'An area is solved when it has two or three cards and their values add up exactly to that area target.',
      },
    ],
  },
  {
    heading: 'Timer',
    rows: [
      {
        label: '',
        body: 'The clock starts when you place your first card into an area and stops when all four areas are solved.',
      },
    ],
  },
];

export function SneakInHelpModal({ visible, onClose }: SneakInHelpModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Sneak In Rules</Text>
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
