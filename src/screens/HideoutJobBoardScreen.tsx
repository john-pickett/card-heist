import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HideoutSubBar } from '../components/HideoutSubBar';
import theme from '../theme';

interface Props {
  onBack: () => void;
}

export function HideoutJobBoardScreen({ onBack }: Props) {
  return (
    <View style={styles.screen}>
      <HideoutSubBar title="JOB BOARD" onBack={onBack} />

      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderBody}>
          Coming soon — scope out upcoming heists before committing. Intel on targets, risk levels, and potential payouts will be posted here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.fourteen,
    alignItems: 'center',
  },
  placeholderCard: {
    width: '100%',
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.bgPanel,
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  placeholderBody: {
    color: theme.colors.text72,
    fontSize: theme.fontSizes.base,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});
