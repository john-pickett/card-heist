import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function SettingsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>SETTINGS</Text>
      <Text style={styles.placeholder}>Nothing here yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    paddingTop: 60,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 16,
  },
  placeholder: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
