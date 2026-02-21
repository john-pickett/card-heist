import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';

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
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#40916c' }}
            thumbColor="#ffffff"
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
    backgroundColor: '#2d6a4f',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 20,
    textAlign: 'center',
  },
  panel: {
    backgroundColor: '#1b4332',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 16,
    gap: 10,
  },
  panelSpaced: {
    marginTop: 12,
  },
  settingTitle: {
    color: '#f4d03f',
    fontSize: 15,
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingDesc: {
    flex: 1,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    lineHeight: 18,
  },
  resetBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#40916c',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  resetBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  message: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
  },
});
