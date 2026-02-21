import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import theme from '../theme';

interface Props {
  onResetTutorials: () => Promise<void>;
}

export function SettingsScreen({ onResetTutorials }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const soundEnabled = useSettingsStore(s => s.soundEnabled);
  const setSoundEnabled = useSettingsStore(s => s.setSoundEnabled);

  const handleReset = async () => {
    try {
      await onResetTutorials();
      setMessage('Tutorials reset. They will show again on your next run.');
    } catch {
      setMessage('Could not reset tutorials right now. Please try again.');
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>SETTINGS</Text>

      <View style={styles.panel}>
        <Text style={styles.settingTitle}>Sound Effects</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.settingDesc}>
            Play sounds during gameplay.
          </Text>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: theme.colors.borderMedium, true: theme.colors.greenPrimary }}
            thumbColor={theme.colors.textPrimary}
          />
        </View>
      </View>

      <View style={[styles.panel, styles.panelSpaced]}>
        <Text style={styles.settingTitle}>Tutorials</Text>
        <Text style={styles.settingDesc}>
          Show all act tutorial screens again for this device.
        </Text>

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>Reset Tutorials</Text>
        </TouchableOpacity>

        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
    paddingTop: theme.spacing.sixty,
    paddingHorizontal: theme.spacing.xl,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    letterSpacing: 3,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  panel: {
    backgroundColor: theme.colors.bgPanel,
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderLight,
    padding: theme.spacing.lg,
    gap: theme.spacing.ten,
  },
  panelSpaced: {
    marginTop: theme.spacing.md,
  },
  settingTitle: {
    color: theme.colors.gold,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.heavy,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  settingDesc: {
    flex: 1,
    color: theme.colors.text72,
    fontSize: theme.fontSizes.md,
    lineHeight: 18,
  },
  resetBtn: {
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.greenPrimary,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.ten,
    paddingHorizontal: theme.spacing.fourteen,
    borderWidth: theme.borderWidths.thin,
    borderColor: theme.colors.borderStrong,
  },
  resetBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.heavy,
  },
  message: {
    marginTop: theme.spacing.xs,
    color: theme.colors.text78,
    fontSize: theme.fontSizes.s,
  },
});
