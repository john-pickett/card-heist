import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../theme';

interface Props {
  title: string;
  paragraph: string;
  onDismiss: () => void;
  children: React.ReactNode;
}

export function ActTutorialOverlay({ title, paragraph, onDismiss, children }: Props) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.paragraph}>{paragraph}</Text>

        <View style={styles.screenshotFrame}>
          <Text style={styles.screenshotLabel}>Board Snapshot</Text>
          <View style={styles.snapshotArea}>{children}</View>
        </View>

        <TouchableOpacity style={styles.button} onPress={onDismiss}>
          <Text style={styles.buttonText}>Got It</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlayTutorial,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12000,
    elevation: 12000,
    paddingHorizontal: theme.spacing.xl,
  },
  card: {
    width: '100%',
    height: '80%',
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.xl,
    borderWidth: 2,
    borderColor: theme.colors.textPrimary,
    padding: theme.spacing.lg,
    gap: 10,
  },
  title: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 1,
  },
  paragraph: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: theme.fontSizes.md,
    lineHeight: 19,
  },
  screenshotFrame: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderMedium,
    padding: 10,
    gap: 6,
  },
  screenshotLabel: {
    color: theme.colors.textSoft,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  snapshotArea: {
    flex: 1,
    backgroundColor: theme.colors.bgDeep,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderFaint,
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: 4,
    alignSelf: 'center',
    backgroundColor: theme.colors.greenPrimary,
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  buttonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
    letterSpacing: 0.4,
  },
});
