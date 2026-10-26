import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export type CheckoutStep = 'sacola' | 'entrega' | 'pagamento' | 'confirmacao';

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
}

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  const steps: { id: CheckoutStep; label: string; number: number }[] = [
    { id: 'sacola', label: 'Sacola', number: 1 },
    { id: 'entrega', label: 'Entrega', number: 2 },
    { id: 'pagamento', label: 'Pagamento', number: 3 },
  ];

  const getStepIndex = (step: CheckoutStep) => {
    switch (step) {
      case 'sacola':
        return 0;
      case 'entrega':
        return 1;
      case 'pagamento':
        return 2;
      case 'confirmacao':
        return 3;
    }
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <View style={styles.container}>
      {steps.map((s, idx) => {
        const isCompleted = idx < currentIndex;
        const isActive = idx === currentIndex;

        return (
          <React.Fragment key={s.id}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isActive && styles.circleActive,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.circleText,
                      isActive && styles.circleTextActive,
                    ]}
                  >
                    {s.number}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  (isActive || isCompleted) && styles.stepLabelActive,
                ]}
              >
                {s.label}
              </Text>
            </View>

            {idx < steps.length - 1 && (
              <View
                style={[
                  styles.line,
                  idx < currentIndex && styles.lineCompleted,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E6E1D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: '#1E2B37',
  },
  circleCompleted: {
    backgroundColor: '#1B8754',
  },
  circleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A867E',
  },
  circleTextActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A867E',
  },
  stepLabelActive: {
    color: '#1C252E',
    fontWeight: '700',
  },
  line: {
    width: 24,
    height: 1.5,
    backgroundColor: '#E0DDD5',
    marginHorizontal: 8,
  },
  lineCompleted: {
    backgroundColor: '#1B8754',
  },
});
