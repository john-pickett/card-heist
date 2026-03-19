import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { CrewMemberId } from '../types/crew';
import { crewMembers } from '../data/crew';
import theme from '../theme';

interface Props {
  crewIds: CrewMemberId[];
}

export function CrewBonusesPanel({ crewIds }: Props) {
  const crew = crewIds
    .map(id => crewMembers.find(m => m.id === id))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);

  if (crew.length === 0) return null;

  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>CREW BONUSES</Text>
      {crew.map(member => (
        <View key={member.id} style={styles.crewRow}>
          <Image source={member.imageSource} style={styles.crewImage} />
          <View style={styles.crewInfo}>
            <Text style={styles.crewName}>{member.fullName}</Text>
            <Text style={styles.crewSummary}>{member.summary}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    width: '100%',
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderFaint,
    gap: theme.spacing.fourteen,
    marginBottom: theme.spacing.fourteen,
  },
  panelTitle: {
    color: theme.colors.textDim,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  crewImage: {
    width: 40,
    height: 40,
  },
  crewInfo: {
    flex: 1,
    gap: theme.spacing.two,
  },
  crewName: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
  },
  crewSummary: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.md,
  },
});
