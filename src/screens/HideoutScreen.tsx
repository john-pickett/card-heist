import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import theme from '../theme';

export function HideoutScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>HIDEOUT</Text>
      <View style={styles.noticeCard}>
        {/* <Text style={styles.noticeTitle}>COMING SOON</Text> */}
        <Text style={styles.noticeBody}>
          The Hideout is not available just yet. Check back soon.
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
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 3,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  noticeCard: {
    width: '100%',
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.bgPanel,
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  noticeTitle: {
    color: theme.colors.gold,
    fontSize: 34,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 2,
    textAlign: 'center',
  },
  noticeBody: {
    marginTop: theme.spacing.md,
    color: theme.colors.text72,
    fontSize: theme.fontSizes.base,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});
