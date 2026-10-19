import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ToastAndroid, Platform, Alert } from 'react-native';

interface PixViewProps {
  onSubmit: (paymentData?: any) => void;
  isLoading: boolean;
  pixCode?: string;
}

export function PixView({ 
  onSubmit, 
  isLoading, 
  pixCode = "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865405374.905802BR5913NŌTA STORE6008PALMAS62070503***6304E2CA" 
}: PixViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyPix = () => {
    setCopied(true);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Código PIX copiado!', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copiado!', 'Código PIX copiado para a área de transferência.');
    }
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrText}>[ QR CODE PIX ]</Text>
        </View>
        <Text style={styles.instructionText}>
          Escaneie o QR Code acima com o app do seu banco ou copie o código abaixo:
        </Text>
      </View>

      <View style={styles.codeBox}>
        <Text style={styles.payloadText} numberOfLines={2} ellipsizeMode="middle">
          {pixCode}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.copyButton, copied && styles.copiedButton]} 
        onPress={handleCopyPix}
        activeOpacity={0.7}
      >
        <Text style={[styles.copyButtonText, copied && styles.copiedButtonText]}>
          {copied ? '✓ Código Copiado!' : '📋 Copiar Código PIX'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.confirmButton, isLoading && styles.disabledButton]} 
        onPress={() => onSubmit({ payment_method: 'PIX' })} 
        disabled={isLoading}
        activeOpacity={0.8}
        testID="pix-submit-button"
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.confirmText}>Simular Pagamento PIX Aprovado</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  qrText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
  },
  instructionText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  codeBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 12,
  },
  payloadText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  copyButton: {
    width: '100%',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#FFF',
  },
  copiedButton: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  copyButtonText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 14,
  },
  copiedButtonText: {
    color: '#059669',
  },
  confirmButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});