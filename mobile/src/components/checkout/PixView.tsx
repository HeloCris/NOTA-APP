import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';

interface PixViewProps {
  onSubmit: (paymentData?: any) => void;
  isLoading: boolean;
  pixCode?: string;
  totalFormatted?: string;
}

export function PixView({
  onSubmit,
  isLoading,
  pixCode = '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865405374.905802BR5913NOTA STORE6008GOIANIA62070503***6304E2CA',
  totalFormatted = '27,92',
}: PixViewProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1785); // 29m 45s

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyPix = async () => {
    try {
      await Clipboard.setStringAsync(pixCode);
      setCopied(true);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Código Pix copiado!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Copiado!', 'Código Pix copiado para a área de transferência.');
      }
      setTimeout(() => setCopied(false), 3000);
    } catch {
      Alert.alert('Código Pix', pixCode);
    }
  };

  // Imagem de QR Code gerada via API rápida do QuickChart/Google Chart para visualização 100% fiel
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixCode)}&color=1C252E&bgcolor=FFFFFF`;

  return (
    <View style={styles.container}>
      {/* Card Principal do QR Code */}
      <View style={styles.qrCard}>
        <Text style={styles.qrCardTitle}>Escaneie o QR code</Text>
        <Text style={styles.qrCardSubtitle}>
          Abra o app do seu banco e escolha pagar com Pix
        </Text>

        {/* QR Code Container */}
        <View style={styles.qrBox}>
          <Image
            source={{ uri: qrCodeUrl }}
            style={styles.qrImage}
            contentFit="contain"
            transition={300}
          />
        </View>

        {/* Badge Expira em */}
        <View style={styles.expireBadge}>
          <Feather name="clock" size={13} color="#92400E" />
          <Text style={styles.expireBadgeText}>Expira em {formatTimer(timeLeft)}</Text>
        </View>

        {/* Campo Copiar Código Pix */}
        <TouchableOpacity
          style={styles.copyBox}
          onPress={handleCopyPix}
          activeOpacity={0.75}
        >
          <Text style={styles.pixCodeInput} numberOfLines={1} ellipsizeMode="middle">
            {pixCode}
          </Text>
          <View style={styles.copyActionRow}>
            <Feather
              name={copied ? 'check' : 'copy'}
              size={14}
              color={copied ? '#15803D' : '#1C252E'}
            />
            <Text style={[styles.copyActionText, copied && { color: '#15803D' }]}>
              {copied ? 'Copiado!' : 'Copiar'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Indicador de Aguardando Pagamento */}
      <View style={styles.waitingRow}>
        <ActivityIndicator size="small" color="#1E2B37" style={{ transform: [{ scale: 0.8 }] }} />
        <Text style={styles.waitingText}>Aguardando o pagamento...</Text>
      </View>

      {/* Card Instruções: Como Pagar */}
      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>Como pagar</Text>

        <View style={styles.guideStepRow}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <Text style={styles.stepText}>Abra o app do seu banco e vá em Pix</Text>
        </View>

        <View style={styles.guideStepRow}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNumber}>2</Text>
          </View>
          <Text style={styles.stepText}>
            Escaneie o QR code ou cole o código copiado
          </Text>
        </View>

        <View style={styles.guideStepRow}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNumber}>3</Text>
          </View>
          <Text style={styles.stepText}>Confirme. A aprovação é na hora</Text>
        </View>
      </View>

      {/* Selo de segurança */}
      <View style={styles.securityRow}>
        <Feather name="lock" size={13} color="#6B7280" />
        <Text style={styles.securityText}>Pagamento seguro • dados criptografados</Text>
      </View>

      {/* Botão de Ação: "Já realizei o pagamento" */}
      <TouchableOpacity
        style={[styles.confirmButton, isLoading && styles.disabledButton]}
        onPress={() => onSubmit({ payment_method: 'PIX' })}
        disabled={isLoading}
        activeOpacity={0.88}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.confirmText}>Já realizei o pagamento</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#EFEBE2',
  },
  qrCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C252E',
    marginBottom: 4,
  },
  qrCardSubtitle: {
    fontSize: 12,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 18,
    paddingHorizontal: 14,
  },
  qrBox: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 6,
  },
  qrImage: {
    width: 190,
    height: 190,
  },
  expireBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  expireBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  copyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F5F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E3D8',
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: '100%',
  },
  pixCodeInput: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginRight: 10,
  },
  copyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C252E',
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  waitingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEBE2',
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C252E',
    marginBottom: 14,
  },
  guideStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ECE7DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  stepText: {
    fontSize: 12.5,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
    lineHeight: 17,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  securityText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#1E2B37',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E2B37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});