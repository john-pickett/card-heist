import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme';

export interface BuffChip {
  id: string;
  initials: string;
  isActive: boolean;
  isPassive: boolean;
  isDisabled: boolean;
  onPress?: () => void;
}

interface BuffChipBarProps {
  chips: BuffChip[];
  onInfoPress: () => void;
}

export function BuffChipBar({ chips, onInfoPress }: BuffChipBarProps) {
  if (chips.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.chipsRow}>
        {chips.map(chip => {
          const tappable = !chip.isPassive && !chip.isDisabled;
          return (
            <TouchableOpacity
              key={chip.id}
              onPress={tappable ? chip.onPress : undefined}
              activeOpacity={tappable ? 0.7 : 1}
              style={[
                styles.chip,
                chip.isActive && styles.chipActive,
                chip.isDisabled && !chip.isActive && styles.chipDisabled,
              ]}
            >
              <Text style={[styles.chipText, chip.isActive && styles.chipTextActive]}>
                {chip.initials}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity onPress={onInfoPress} hitSlop={8} style={styles.infoBtn}>
        <Text style={styles.infoBtnText}>ⓘ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    minHeight: 32,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  chip: {
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.ten,
    backgroundColor: theme.colors.bgPanel,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  chipActive: {
    borderColor: theme.colors.gold,
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.75,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  chipDisabled: {
    opacity: 0.35,
  },
  chipText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.caption,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 0.5,
  },
  chipTextActive: {
    color: theme.colors.gold,
  },
  infoBtn: {
    padding: theme.spacing.xs,
  },
  infoBtnText: {
    color: theme.colors.text60,
    fontSize: theme.fontSizes.subtitle,
  },
});
