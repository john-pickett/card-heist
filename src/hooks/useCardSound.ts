import { useAudioPlayer } from 'expo-audio';
import { useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export function useCardSound() {
  const player = useAudioPlayer(require('../../assets/sounds/tap.wav'));
  const soundEnabled = useSettingsStore(s => s.soundEnabled);

  const playTap = useCallback(() => {
    if (!soundEnabled) return;
    player.seekTo(0);
    player.play();
  }, [player, soundEnabled]);

  return { playTap };
}
