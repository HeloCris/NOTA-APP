import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';

interface CreditCardFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export function CreditCardForm({ onSubmit, isLoading }: CreditCardFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [cvv, setCvv] = useState('');

  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  const handleExpirationChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setExpirationDate(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setExpirationDate(cleaned);
    }
  };

  const handleSubmit = () => {
    if (!cardNumber || !cardHolder || !expirationDate || !cvv) {
      Alert.alert('Atenção', 'Preencha todos os campos do cartão para prosseguir.');
      return;
    }

    onSubmit({
      payment_method: 'CREDIT_CARD',
      payment_token: 'tok_mocked_12345',
      card_number: cardNumber.replace(/\s/g, ''),
      card_last_digits: cardNumber.replace(/\s/g, '').slice(-4),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Número do Cartão</Text>
      <TextInput 
        style={styles.input} 
        placeholder="0000 0000 0000 0000" 
        value={cardNumber} 
        onChangeText={handleCardNumberChange} 
        keyboardType="numeric"
        maxLength={19}
        testID="card-number-input"
      />

      <Text style={styles.label}>Nome impresso no cartão</Text>
      <TextInput 
        style={styles.input} 
        placeholder="NOME COMO NO CARTÃO" 
        value={cardHolder} 
        onChangeText={setCardHolder} 
        autoCapitalize="characters" 
        testID="card-holder-input"
      />

      <View style={styles.row}>
        <View style={styles.halfInputContainer}>
          <Text style={styles.label}>Validade</Text>
          <TextInput 
            style={styles.input} 
            placeholder="MM/AA" 
            value={expirationDate} 
            onChangeText={handleExpirationChange} 
            keyboardType="numeric"
            maxLength={5}
            testID="expiration-input"
          />
        </View>

        <View style={styles.halfInputContainer}>
          <Text style={styles.label}>CVV</Text>
          <TextInput 
            style={styles.input} 
            placeholder="123" 
            value={cvv} 
            onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))} 
            keyboardType="numeric" 
            secureTextEntry 
            maxLength={4}
            testID="cvv-input"
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.confirmButton, isLoading && styles.disabledButton]} 
        onPress={handleSubmit} 
        disabled={isLoading}
        activeOpacity={0.8}
        testID="card-submit-button"
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.confirmText}>Finalizar Pagamento ✓</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInputContainer: {
    width: '48%',
  },
  confirmButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});