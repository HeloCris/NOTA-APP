import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  name: string;
  isSelected: boolean;
  onPress: () => void;
}

export function OlfactoryFamilyCard({ name, isSelected, onPress }: Props) {
  return (
    <TouchableOpacity 
      style={[styles.card, isSelected && styles.selectedCard]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconPlaceholder}>
        <MaterialIcons 
          name="local-florist" 
          size={32} 
          color={isSelected ? '#1E3446' : '#A4BBD1'} 
        />
      </View>
      <Text style={[styles.text, isSelected && styles.selectedText]}>{name}</Text>
      {isSelected && (
        <View style={styles.checkIcon}>
          <MaterialIcons name="check-circle" size={20} color="#1E3446" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FCFBF7',
    borderWidth: 2,
    borderColor: '#ECE8DD',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  selectedCard: {
    borderColor: '#1E3446',
    backgroundColor: '#F6F4EA',
  },
  iconPlaceholder: {
    marginBottom: 8,
  },
  text: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#63666A',
    fontWeight: '600',
  },
  selectedText: {
    color: '#1E3446',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  }
});