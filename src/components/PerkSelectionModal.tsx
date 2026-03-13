import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MarketItemDefinition } from '../types/market';
import theme from '../theme';

interface Props {
  visible: boolean;
  perks: MarketItemDefinition[];
  onApply: (selectedIds: string[]) => void;
}

export function PerkSelectionModal({ visible, perks, onApply }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pre-select all perks whenever the modal opens with a new perk set
  useEffect(() => {
    if (visible) {
      setSelectedIds(perks.map(p => p.id));
    }
  }, [visible, perks]);

  if (!visible) return null;

  function togglePerk(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Choose Your Perks</Text>
        <Text style={styles.subtitle}>
          Select which perks to activate for this act. Unused perks stay in your inventory.
        </Text>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {perks.map(perk => {
            const active = selectedIds.includes(perk.id);
            return (
              <TouchableOpacity
                key={perk.id}
                style={[styles.perkRow, active && styles.perkRowActive]}
                onPress={() => togglePerk(perk.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.checkbox, active && styles.checkboxActive]}>
                  {active && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.perkIcon}>{perk.icon}</Text>
                <View style={styles.perkText}>
                  <Text style={[styles.perkTitle, !active && styles.perkTitleInactive]}>
                    {perk.title}
                  </Text>
                  <Text style={[styles.perkEffect, !active && styles.perkEffectInactive]}>
                    {perk.effect}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => onApply(selectedIds)}
          activeOpacity={0.8}
        >
          <Text style={styles.applyButtonText}>Let's Go</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlayDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12000,
    elevation: 12000,
    paddingHorizontal: theme.spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderStrong,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    maxHeight: '80%',
  },
  title: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1,
  },
  subtitle: {
    color: theme.colors.text75,
    fontSize: theme.fontSizes.md,
    lineHeight: 19,
  },
  list: {
    flexShrink: 1,
  },
  listContent: {
    gap: theme.spacing.sm,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.bgOverlaySoft,
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderSubtle,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  perkRowActive: {
    borderColor: theme.colors.gold,
    backgroundColor: 'rgba(244,208,63,0.06)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: theme.radii.xs,
    borderWidth: theme.borderWidths.medium,
    borderColor: theme.colors.textSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: theme.colors.gold,
    backgroundColor: theme.colors.gold,
  },
  checkmark: {
    color: theme.colors.bgDeep,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    lineHeight: 14,
  },
  perkIcon: {
    fontSize: theme.fontSizes.xxl2,
  },
  perkText: {
    flex: 1,
    gap: theme.spacing.two,
  },
  perkTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.basePlus,
    fontWeight: theme.fontWeights.heavy,
  },
  perkTitleInactive: {
    color: theme.colors.textSoft,
  },
  perkEffect: {
    color: theme.colors.text85,
    fontSize: theme.fontSizes.md,
    lineHeight: 18,
  },
  perkEffectInactive: {
    color: theme.colors.textDim,
  },
  applyButton: {
    backgroundColor: theme.colors.gold,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  applyButtonText: {
    color: theme.colors.bgDeep,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 0.5,
  },
});
