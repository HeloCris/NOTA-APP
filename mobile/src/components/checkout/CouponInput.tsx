import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { storesService, CouponValidationResponse } from '@/services/stores';

interface CouponInputProps {
  storeId: number;
  storeName?: string;
  subtotal: number;
  onCouponApplied: (result: CouponValidationResponse | null) => void;
}

export function CouponInput({
  storeId,
  storeName,
  subtotal,
  onCouponApplied,
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim()) {
      setErrorMessage('Digite o código do cupom.');
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);

    try {
      const res = await storesService.validateCoupon({
        store_id: storeId,
        code: code.trim().toUpperCase(),
        subtotal,
      });

      if (res.valid) {
        setAppliedCoupon(res);
        onCouponApplied(res);
        setErrorMessage(null);
      } else {
        setErrorMessage(res.error || 'Cupom inválido para esta loja.');
        onCouponApplied(null);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        'Não foi possível validar o cupom. Tente novamente.';
      setErrorMessage(errorMsg);
      onCouponApplied(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setAppliedCoupon(null);
    setErrorMessage(null);
    onCouponApplied(null);
  };

  if (appliedCoupon && appliedCoupon.valid) {
    const discountFormatted =
      appliedCoupon.discount_type === 'PERCENTAGE'
        ? `${Number(appliedCoupon.discount_value).toFixed(0)}% OFF (-R$ ${Number(appliedCoupon.applied_discount).toFixed(2)})`
        : `-R$ ${Number(appliedCoupon.applied_discount).toFixed(2)}`;

    return (
      <View style={styles.appliedCard}>
        <View style={styles.appliedLeft}>
          <View style={styles.iconCircleSuccess}>
            <Feather name="tag" size={15} color="#2E7D32" />
          </View>
          <View>
            <View style={styles.codeRow}>
              <Text style={styles.appliedCode}>{appliedCoupon.code}</Text>
              <Text style={styles.appliedDiscount}>{discountFormatted}</Text>
            </View>
            {storeName && (
              <Text style={styles.storeScopeNote}>Aplicado aos itens de {storeName}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={handleRemove} activeOpacity={0.7} style={styles.removeBtn}>
          <Feather name="x" size={16} color="#717171" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Cupom da Loja {storeName ? `(${storeName})` : ''}</Text>
      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <Feather name="tag" size={16} color="#93927F" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Digite seu cupom"
            placeholderTextColor="#93927F"
            value={code}
            onChangeText={(txt) => {
              setCode(txt.toUpperCase());
              setErrorMessage(null);
            }}
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={handleApply}
          />
        </View>

        <TouchableOpacity
          testID="apply-coupon-btn"
          style={[styles.applyBtn, !code.trim() && styles.applyBtnDisabled]}
          onPress={handleApply}
          disabled={!code.trim() || isValidating}
          activeOpacity={0.8}
        >
          {isValidating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.applyBtnText}>Aplicar</Text>
          )}
        </TouchableOpacity>
      </View>

      {errorMessage && (
        <View style={styles.errorRow}>
          <Feather name="alert-circle" size={13} color="#C62828" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    gap: 6,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1C252E',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1D2',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 42,
  },
  inputIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C252E',
    letterSpacing: 0.5,
    paddingVertical: 0,
  },
  applyBtn: {
    backgroundColor: '#354B5E',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.5,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  errorText: {
    fontSize: 11.5,
    color: '#C62828',
    flex: 1,
  },
  appliedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F8E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 4,
  },
  appliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircleSuccess: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCEDC8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appliedCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
    fontFamily: 'monospace',
  },
  appliedDiscount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  storeScopeNote: {
    fontSize: 10.5,
    color: '#558B2F',
    marginTop: 1,
  },
  removeBtn: {
    padding: 6,
  },
});
