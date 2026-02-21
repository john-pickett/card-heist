import { useAudioPlayer } from 'expo-audio';
import { useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export function useCardSound() {
  const tapPlayer = useAudioPlayer(require('../../assets/sounds/tap.wav'));
  const lootGainPlayer = useAudioPlayer(require('../../assets/sounds/coins-in-bag.wav'));
  const lootLossPlayer = useAudioPlayer(require('../../assets/sounds/coins-out-of-bag.wav'));
  const soundEnabled = useSettingsStore(s => s.soundEnabled);

  const playTap = useCallback(() => {
    if (!soundEnabled) return;
    tapPlayer.seekTo(0);
    tapPlayer.play();
  }, [tapPlayer, soundEnabled]);

  const playLootGain = useCallback(() => {
    if (!soundEnabled) return;
    lootGainPlayer.seekTo(0);
    lootGainPlayer.play();
  }, [lootGainPlayer, soundEnabled]);

  const playLootLoss = useCallback(() => {
    if (!soundEnabled) return;
    lootLossPlayer.seekTo(0);
    lootLossPlayer.play();
  }, [lootLossPlayer, soundEnabled]);

  return { playTap, playLootGain, playLootLoss };
}
