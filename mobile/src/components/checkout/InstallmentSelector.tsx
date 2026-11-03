import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface InstallmentOption {
  count: number;
  amount: number;
  total: number;
  isFreeInterest: boolean;
  label: string;
}

interface InstallmentSelectorProps {
  totalAmount: number;
  maxInstallments?: number;
  freeInterestInstallments?: number;
  minInstallmentAmount?: number;
  selectedCount: number;
  onSelectOption: (option: InstallmentOption) => void;
}

export function InstallmentSelector({
  totalAmount,
  maxInstallments = 6,
  freeInterestInstallments = 3,
  minInstallmentAmount = 30.0,
  selectedCount,
  onSelectOption,
}: InstallmentSelectorProps) {
  const options = useMemo(() => {
    const list: InstallmentOption[] = [];
    const max = Math.min(12, Math.max(1, maxInstallments));
    const freeMax = Math.min(max, Math.max(1, freeInterestInstallments));

    for (let n = 1; n <= max; n++) {
      const baseAmount = totalAmount / n;
      if (n > 1 && baseAmount < minInstallmentAmount) {
        break; // Respeita a parcela mínima configurada pela loja (RN-06)
      }

      const isFree = n <= freeMax;
      // Taxa estimada informativa para parcelas com juros (RN-06)
      const interestRate = isFree ? 0 : 0.0199; // ~1.99% a.m.
      const finalTotal = isFree
        ? totalAmount
        : totalAmount * Math.pow(1 + interestRate, n);
      const installmentVal = finalTotal / n;

      list.push({
        count: n,
        amount: installmentVal,
        total: finalTotal,
        isFreeInterest: isFree,
        label: isFree
          ? `${n}x de R$ ${installmentVal.toFixed(2).replace('.', ',')} sem juros`
          : `${n}x de R$ ${installmentVal.toFixed(2).replace('.', ',')} (com acréscimo)`,
      });
    }

    return list;
  }, [totalAmount, maxInstallments, freeInterestInstallments, minInstallmentAmount]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Opções de Parcelamento</Text>
      <View style={styles.list}>
        {options.map((opt) => {
          const isSelected = opt.count === selectedCount;
          return (
            <TouchableOpacity
              key={opt.count}
              style={[styles.optionRow, isSelected && styles.optionRowSelected]}
              onPress={() => onSelectOption(opt)}
              activeOpacity={0.7}
            >
              <View style={styles.left}>
                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </View>

              {opt.isFreeInterest && opt.count > 1 && (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>Sem Juros</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C252E',
  },
  list: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1D2',
    borderRadius: 14,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F3E9',
  },
  optionRowSelected: {
    backgroundColor: '#F8FAF8',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#B0B8C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#354B5E',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#354B5E',
  },
  optionText: {
    fontSize: 13,
    color: '#333333',
  },
  optionTextSelected: {
    fontWeight: '700',
    color: '#1C252E',
  },
  freeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freeBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2E7D32',
  },
});
