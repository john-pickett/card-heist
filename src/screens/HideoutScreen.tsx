import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme';
import { HideoutRelaxScreen } from './HideoutRelaxScreen';
import { HideoutCrewScreen } from './HideoutCrewScreen';
import { HideoutJobBoardScreen } from './HideoutJobBoardScreen';

type HideoutView = 'home' | 'relax' | 'crew' | 'job-board';

const BUTTONS: { id: HideoutView; label: string; subtitle: string }[] = [
  { id: 'relax', label: 'Relax', subtitle: 'Take the edge off between runs' },
  { id: 'crew', label: 'Crew', subtitle: 'Hire and manage your crew' },
  { id: 'job-board', label: 'Job Board', subtitle: 'Scope out what\'s coming next' },
];

export function HideoutScreen() {
  const [view, setView] = useState<HideoutView>('home');

  if (view === 'relax') return <HideoutRelaxScreen onBack={() => setView('home')} />;
  if (view === 'crew') return <HideoutCrewScreen onBack={() => setView('home')} />;
  if (view === 'job-board') return <HideoutJobBoardScreen onBack={() => setView('home')} />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>HIDEOUT</Text>

      <View style={styles.introCard}>
        <Text style={styles.introLead}>A quiet block. An unmarked door.</Text>
        <Text style={styles.introBody}>
          This is your base between jobs — a place where you and your crew can rest, regroup,
          and plan the next move without looking over your shoulder. Every great outfit needs
          somewhere to call home. This is yours.
        </Text>
      </View>

      <View style={styles.buttonList}>
        {BUTTONS.map((btn) => (
          <TouchableOpacity
            key={btn.id}
            style={styles.navButton}
            onPress={() => setView(btn.id)}
            activeOpacity={0.75}
          >
            <View style={styles.navButtonInner}>
              <Text style={styles.navButtonLabel}>{btn.label}</Text>
              <Text style={styles.navButtonSubtitle}>{btn.subtitle}</Text>
            </View>
            <Text style={styles.navButtonArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.forty,
    paddingBottom: theme.spacing.xxl,
    alignItems: 'center',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 3,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  introCard: {
    width: '100%',
    backgroundColor: theme.colors.bgStory,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
  introLead: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.basePlus,
    fontWeight: theme.fontWeights.heavy,
    marginBottom: theme.spacing.sm,
  },
  introBody: {
    color: theme.colors.text85,
    fontSize: theme.fontSizes.base,
    lineHeight: 22,
  },
  buttonList: {
    width: '100%',
    gap: theme.spacing.md,
  },
  navButton: {
    width: '100%',
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderMedium,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  navButtonInner: {
    flex: 1,
  },
  navButtonLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  navButtonSubtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
    lineHeight: 18,
  },
  navButtonArrow: {
    color: theme.colors.greenPastel,
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.bold,
    marginLeft: theme.spacing.md,
  },
});
