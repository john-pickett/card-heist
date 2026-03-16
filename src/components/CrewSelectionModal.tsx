import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { crewMembers } from '../data/crew';
import { useCrewStore, isCrewAvailable } from '../store/crewStore';
import { CrewMemberId } from '../types/crew';
import theme from '../theme';

const MAX_CREW = 3;

interface Props {
  visible: boolean;
  onApply: (selectedIds: CrewMemberId[]) => void;
}

export function CrewSelectionModal({ visible, onApply }: Props) {
  const unlockedIds = useCrewStore(s => s.unlockedIds);
  const consecutiveHeists = useCrewStore(s => s.consecutiveHeists);
  const [selectedIds, setSelectedIds] = useState<CrewMemberId[]>([]);

  const unlockedMembers = crewMembers.filter(m => unlockedIds.includes(m.id));

  useEffect(() => {
    if (visible) {
      // Pre-select all available members up to MAX_CREW
      const available = unlockedMembers
        .filter(m => isCrewAvailable(m.id, unlockedIds, consecutiveHeists))
        .slice(0, MAX_CREW)
        .map(m => m.id);
      setSelectedIds(available);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  function toggleMember(id: CrewMemberId) {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id));
    } else if (selectedIds.length < MAX_CREW) {
      setSelectedIds(prev => [...prev, id]);
    }
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Assemble Your Crew</Text>
        <Text style={styles.subtitle}>
          Choose up to {MAX_CREW} crew members. Resting members need a heist off.
        </Text>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {unlockedMembers.map(member => {
            const available = isCrewAvailable(member.id, unlockedIds, consecutiveHeists);
            const selected = selectedIds.includes(member.id);
            const atMax = selectedIds.length >= MAX_CREW && !selected;
            const disabled = !available || atMax;

            return (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.memberRow,
                  selected && styles.memberRowSelected,
                  !available && styles.memberRowResting,
                ]}
                onPress={() => available && toggleMember(member.id)}
                activeOpacity={available ? 0.75 : 1}
                disabled={disabled}
              >
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.memberText}>
                  <View style={styles.memberNameRow}>
                    <Text style={[styles.memberNickname, !available && styles.textDim]}>
                      {member.nickname}
                    </Text>
                    {!available && (
                      <View style={styles.restingBadge}>
                        <Text style={styles.restingBadgeText}>Resting</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.memberEffect, !available && styles.textDim]}>
                    {member.effect}
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
          <Text style={styles.applyButtonText}>
            Let's Go{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
          </Text>
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
  memberRow: {
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
  memberRowSelected: {
    borderColor: theme.colors.gold,
    backgroundColor: 'rgba(244,208,63,0.06)',
  },
  memberRowResting: {
    opacity: 0.5,
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
  checkboxSelected: {
    borderColor: theme.colors.gold,
    backgroundColor: theme.colors.gold,
  },
  checkmark: {
    color: theme.colors.bgDeep,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    lineHeight: 14,
  },
  memberText: {
    flex: 1,
    gap: theme.spacing.two,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  memberNickname: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.basePlus,
    fontWeight: theme.fontWeights.heavy,
  },
  memberEffect: {
    color: theme.colors.text85,
    fontSize: theme.fontSizes.md,
    lineHeight: 18,
  },
  textDim: {
    color: theme.colors.textDim,
  },
  restingBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.radii.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  restingBadgeText: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 0.3,
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
