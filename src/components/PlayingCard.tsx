import React, { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Card, Suit } from '../types/card';

const CARD_WIDTH = 220;
const CARD_HEIGHT = 308;

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const SUIT_COLORS: Record<Suit, string> = {
  spades: '#1a1a2e',
  hearts: '#c0392b',
  diamonds: '#c0392b',
  clubs: '#1a1a2e',
};

// 5-column checkerboard of diamonds on a crimson background
function CardBack() {
  return (
    <View style={backStyles.back}>
      <View style={backStyles.outerBorder}>
        <View style={backStyles.innerBorder}>
          <View style={backStyles.pattern}>
            {Array.from({ length: 40 }).map((_, i) => {
              const row = Math.floor(i / 5);
              const col = i % 5;
              return (
                <Text
                  key={i}
                  style={[
                    backStyles.diamond,
                    { opacity: (row + col) % 2 === 0 ? 0.85 : 0.2 },
                  ]}
                >
                  ◆
                </Text>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const backStyles = StyleSheet.create({
  back: {
    flex: 1,
    backgroundColor: '#9B1C1C',
    borderRadius: 13,
    padding: 10,
  },
  outerBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: 6,
    padding: 3,
  },
  innerBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  pattern: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diamond: {
    width: '20%',
    textAlign: 'center',
    fontSize: 22,
    color: '#ffffff',
    lineHeight: 30,
  },
});

interface Props {
  card: Card;
}

export function PlayingCard({ card }: Props) {
  const symbol = SUIT_SYMBOLS[card.suit];
  const color = SUIT_COLORS[card.suit];

  const flipAnim = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    const toValue = flipped ? 0 : 1;
    setFlipped(f => !f);
    Animated.timing(flipAnim, {
      toValue,
      duration: 380,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });

  return (
    <TouchableWithoutFeedback onPress={handleFlip}>
      <View style={styles.wrapper}>
        {/* Front face */}
        <Animated.View
          style={[
            styles.card,
            { transform: [{ perspective: 1000 }, { rotateY: frontRotateY }] },
          ]}
        >
          <View style={styles.cornerTopLeft}>
            <Text style={[styles.cornerRank, { color }]}>{card.rank}</Text>
            <Text style={[styles.cornerSuit, { color }]}>{symbol}</Text>
          </View>

          <View style={styles.center}>
            <Text style={[styles.centerRank, { color }]}>{card.rank}</Text>
            <Text style={[styles.centerSuit, { color }]}>{symbol}</Text>
          </View>

          <View style={[styles.cornerBottomRight, { transform: [{ rotate: '180deg' }] }]}>
            <Text style={[styles.cornerRank, { color }]}>{card.rank}</Text>
            <Text style={[styles.cornerSuit, { color }]}>{symbol}</Text>
          </View>
        </Animated.View>

        {/* Back face */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            { transform: [{ perspective: 1000 }, { rotateY: backRotateY }] },
          ]}
        >
          <CardBack />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 10,
    left: 12,
    alignItems: 'center',
    zIndex: 1,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    alignItems: 'center',
    zIndex: 1,
  },
  cornerRank: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  cornerSuit: {
    fontSize: 16,
    lineHeight: 18,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerRank: {
    fontSize: 80,
    fontWeight: '900',
    lineHeight: 84,
  },
  centerSuit: {
    fontSize: 48,
    marginTop: 4,
  },
});
