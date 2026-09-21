import React from 'react';
import { ScrollView, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface FamilyFilterChipsProps {
  selectedFamily: string;
  onSelectFamily: (family: string) => void;
}

const FAMILIES = [
  { label: 'Todos', value: '' },
  { label: '🌲 Amadeirado', value: 'Amadeirado' },
  { label: '🌸 Floral', value: 'Floral' },
  { label: '🍊 Cítrico', value: 'Cítrico' },
  { label: '✨ Oriental', value: 'Oriental' },
];

export function FamilyFilterChips({ selectedFamily, onSelectFamily }: FamilyFilterChipsProps) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      contentContainerStyle={styles.container}
    >
      {FAMILIES.map((item) => {
        const isSelected = selectedFamily === item.value;
        return (
          <Pressable key={item.value} onPress={() => onSelectFamily(item.value)}>
            <ThemedView
              type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
              style={styles.chip}
            >
              <ThemedText type={isSelected ? 'smallBold' : 'small'}>
                {item.label}
              </ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});