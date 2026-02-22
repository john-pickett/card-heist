import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AREA_ICONS, AREA_LABELS, SneakInArea, SneakInSolutionEntry } from '../types/sneakin';
import theme from '../theme';

interface SneakInSolutionModalProps {
  visible: boolean;
  onClose: () => void;
  solution: SneakInSolutionEntry[];
  areas: SneakInArea[];
}

export function SneakInSolutionModal({ visible, onClose, solution, areas }: SneakInSolutionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Solution Review</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {solution.map((entry, i) => {
              const area = areas[i];
              const lastAttempt = area.failedCombos.length > 0
                ? area.failedCombos[area.failedCombos.length - 1]
                : null;
              const attemptSum = lastAttempt
                ? lastAttempt.reduce((s, sc) => s + parseInt(sc.card.rank, 10), 0)
                : 0;

              return (
                <View key={i} style={styles.section}>
                  <View style={styles.areaHeader}>
                    <Text style={styles.areaIcon}>{AREA_ICONS[i]}</Text>
                    <Text style={styles.areaName}>{AREA_LABELS[i]}</Text>
                    <Text style={styles.areaTarget}>→ {entry.target}</Text>
                  </View>

                  <View style={styles.rowBlock}>
                    <Text style={styles.rowLabel}>Possible solution</Text>
                    <View style={styles.chipRow}>
                      {entry.cards.map((val, j) => (
                        <View key={j} style={styles.chip}>
                          <Text style={styles.chipText}>{val}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.rowBlock}>
                    <Text style={styles.rowLabel}>Your last attempt</Text>
                    {lastAttempt ? (
                      <View style={styles.chipRow}>
                        {lastAttempt.map((sc, j) => (
                          <View key={j} style={[styles.chip, styles.chipAttempt]}>
                            <Text style={styles.chipText}>{sc.card.rank}</Text>
                          </View>
                        ))}
                        <Text style={styles.attemptSum}>= {attemptSum}</Text>
                      </View>
                    ) : (
                      <Text style={styles.firstTryText}>Solved on first attempt</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
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
    gap: theme.spacing.sm,
  },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  areaIcon: {
    fontSize: 18,
  },
  areaName: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
    flex: 1,
  },
  areaTarget: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
  },
  rowBlock: {
    gap: theme.spacing.xs,
  },
  rowLabel: {
    color: theme.colors.textDim,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  chip: {
    backgroundColor: theme.colors.bgPrimary,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.borderMedium,
  },
  chipAttempt: {
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.bgDeep,
  },
  chipText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
  },
  attemptSum: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
    marginLeft: theme.spacing.xs,
  },
  firstTryText: {
    color: theme.colors.greenSoft,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
    fontStyle: 'italic',
  },
  closeButton: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.bgPrimary,
    borderRadius: theme.radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderMedium,
  },
  closeButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
  },
});
