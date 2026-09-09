import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  note: string;
  isSelected: boolean;
  onPress: () => void;
}

export function NoteChip({ note, isSelected, onPress }: Props) {
  return (
    <TouchableOpacity 
      style={[styles.chip, isSelected && styles.selectedChip]} 
      onPress={onPress}
    >
      <Text style={[styles.text, isSelected && styles.selectedText]}>{note}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E4EAEF',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedChip: {
    backgroundColor: '#1E3446',
    borderColor: '#1E3446',
  },
  text: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#33495C',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  }
});