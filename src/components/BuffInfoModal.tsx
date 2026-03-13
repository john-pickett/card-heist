import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme';

export interface BuffInfo {
  icon: string;
  initials: string;
  name: string;
  effect: string;
  isPassive?: boolean;
}

interface BuffInfoModalProps {
  visible: boolean;
  onClose: () => void;
  actTitle: string;
  buffList: BuffInfo[];
}

export function BuffInfoModal({ visible, onClose, actTitle, buffList }: BuffInfoModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Tools and Perks — {actTitle}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.explainer}>
              Tap a chip to use that item during this act. Active items glow gold. Tap an active item chip again to cancel it.
            </Text>

            <Text style={styles.sectionHeading}>Your Items This Act</Text>
            {buffList.map(buff => (
              <View key={buff.initials} style={styles.buffRow}>
                <View style={styles.initialsChip}>
                  <Text style={styles.chipIcon}>{buff.icon}</Text>
                  <Text style={styles.initialsText}>{buff.initials}</Text>
                </View>
                <View style={styles.buffInfo}>
                  <Text style={styles.buffName}>
                    {buff.name}
                    {buff.isPassive ? <Text style={styles.passiveLabel}> (passive)</Text> : null}
                  </Text>
                  <Text style={styles.buffEffect}>{buff.effect}</Text>
                </View>
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
    height: '80%',
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
    fontSize: theme.fontSizes.title,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: theme.spacing.xs,
  },
  closeBtnText: {
    color: theme.colors.text50,
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
  explainer: {
    color: theme.colors.text75,
    fontSize: theme.fontSizes.md,
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  sectionHeading: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.md,
  },
  buffRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  initialsChip: {
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.ten,
    backgroundColor: theme.colors.bgPrimary,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderBright,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    gap: 2,
  },
  chipIcon: {
    fontSize: theme.fontSizes.md,
    lineHeight: 16,
  },
  initialsText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.caption,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 0.5,
  },
  buffInfo: {
    flex: 1,
  },
  buffName: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
    marginBottom: 2,
  },
  passiveLabel: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
  },
  buffEffect: {
    color: theme.colors.text75,
    fontSize: theme.fontSizes.s,
    lineHeight: 17,
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
