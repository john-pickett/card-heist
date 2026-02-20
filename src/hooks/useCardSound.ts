import { useAudioPlayer } from 'expo-audio';
import { useCallback } from 'react';

export function useCardSound() {
  const player = useAudioPlayer(require('../../assets/sounds/tap.wav'));

  const playTap = useCallback(() => {
    player.seekTo(0);
    player.play();
  }, [player]);

  return { playTap };
}
