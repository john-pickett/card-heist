import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { PlayingCard } from './src/components/PlayingCard';
import { createDeck, shuffleDeck } from './src/data/deck';
import { Card } from './src/types/card';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SUIT_LABEL: Record<string, string> = {
  spades: '♠ Spades',
  hearts: '♥ Hearts',
  diamonds: '♦ Diamonds',
  clubs: '♣ Clubs',
};

export default function App() {
  const [deck, setDeck] = useState<Card[]>(() => createDeck());
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Card>>(null);

  const currentCard = deck[currentIndex];

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleShuffle = () => {
    const shuffled = shuffleDeck(deck);
    setDeck(shuffled);
    setCurrentIndex(0);
    flatListRef.current?.scrollToIndex({ index: 0, animated: false });
  };

  const handleReset = () => {
    setDeck(createDeck());
    setCurrentIndex(0);
    flatListRef.current?.scrollToIndex({ index: 0, animated: false });
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Card Deck</Text>

          {/* Card info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>
              {currentCard.rank} of {SUIT_LABEL[currentCard.suit]}
            </Text>
            <Text style={styles.counter}>
              {currentIndex + 1} / {deck.length}
            </Text>
          </View>

          {/* Swipeable card list */}
          <FlatList
            ref={flatListRef}
            data={deck}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={styles.cardPage}>
                <PlayingCard card={item} />
              </View>
            )}
            style={styles.flatList}
          />

          {/* Swipe hint */}
          <Text style={styles.hint}>← swipe to browse →</Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={handleShuffle}>
              <Text style={styles.buttonText}>Shuffle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleReset}>
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Reset Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2d6a4f',
  },
  container: {
    flex: 1,
    backgroundColor: '#2d6a4f',
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 1,
  },
  cardInfo: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  cardName: {
    color: '#d8f3dc',
    fontSize: 18,
    fontWeight: '600',
  },
  counter: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 2,
  },
  flatList: {
    flex: 1,
  },
  cardPage: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#1b4332',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextSecondary: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
});
