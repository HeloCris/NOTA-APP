import React from 'react';
import { ScrollView, Pressable, StyleSheet, Text } from 'react-native';

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
          <Pressable
            key={item.value}
            onPress={() => onSelectFamily(item.value)}
            style={[styles.chip, isSelected && styles.chipActive]}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 10,
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE4',
  },
  chipActive: {
    backgroundColor: '#2C4659',
    borderColor: '#2C4659',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});