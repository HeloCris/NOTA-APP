import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface CreditCardFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  totalFormatted: string;
}

export type CardBrand = 'VISA' | 'MASTERCARD' | 'ELO' | 'AMEX' | 'HIPERCARD' | 'CARTÃO';

export function detectCardBrand(digits: string): { name: CardBrand; color: string; bg: string } {
  const clean = digits.replace(/\D/g, '');
  if (!clean) {
    return { name: 'CARTÃO', color: '#64748B', bg: '#F1F5F9' };
  }

  // Elo: vários prefixos como 4011, 4389, 5041, 5067, 5090, 6362, 6363, 650, 651, 655
  const eloRegex = /^(4011(78|79)|431274|438935|451416|457393|457631|457632|504175|627780|636297|636368|(506699|5067[0-6][0-9]|50677[0-8])|(509[0-9]{3})|65003[1-3]|65003[5-9]|65004[0-9]|65005[0-1]|65040[5-9]|6504[1-3][0-9]|65048[5-9]|65049[0-9]|6505[0-2][0-9]|65053[0-8]|65054[1-9]|6505[5-8][0-9]|65059[0-8]|65070[0-9]|65071[0-8]|65072[0-7]|65090[1-9]|65091[0-9]|650920|65165[2-9]|6516[6-7][0-9]|65500[0-9]|65501[0-9]|65502[1-9]|6550[3-4][0-9]|65505[0-8])/;
  if (eloRegex.test(clean) || (clean.startsWith('50') && clean.length >= 2)) {
    return { name: 'ELO', color: '#FFFFFF', bg: '#00A4E4' };
  }

  // Amex: começa com 34 ou 37
  if (/^3[47]/.test(clean)) {
    return { name: 'AMEX', color: '#FFFFFF', bg: '#0070BA' };
  }

  // Hipercard: começa com 6062
  if (/^6062/.test(clean)) {
    return { name: 'HIPERCARD', color: '#FFFFFF', bg: '#B91C1C' };
  }

  // Mastercard: 51-55 ou 2221-2720
  if (/^(5[1-5]|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)/.test(clean)) {
    return { name: 'MASTERCARD', color: '#FFFFFF', bg: '#EB001B' };
  }

  // Visa: começa com 4
  if (/^4/.test(clean)) {
    return { name: 'VISA', color: '#FFFFFF', bg: '#1A1F71' };
  }

  return { name: 'CARTÃO', color: '#64748B', bg: '#F1F5F9' };
}

/**
 * Componente que renderiza os símbolos / logotipos fiéis das bandeiras
 */
export function CardBrandLogo({ brand }: { brand: CardBrand }) {
  if (brand === 'MASTERCARD') {
    // Símbolo icônico dos 2 círculos sobrepostos do Mastercard
    return (
      <View style={logoStyles.mastercardContainer}>
        <View style={[logoStyles.circle, { backgroundColor: '#EB001B' }]} />
        <View style={[logoStyles.circle, { backgroundColor: '#F79E1B', marginLeft: -8, opacity: 0.94 }]} />
      </View>
    );
  }

  if (brand === 'VISA') {
    // Símbolo oficial da bandeira Visa
    return (
      <View style={logoStyles.visaContainer}>
        <Text style={logoStyles.visaText}>VISA</Text>
      </View>
    );
  }

  if (brand === 'ELO') {
    // Símbolo com os 3 pontos coloridos do Elo
    return (
      <View style={logoStyles.eloContainer}>
        <View style={logoStyles.eloDotsRow}>
          <View style={[logoStyles.eloDot, { backgroundColor: '#EF4444' }]} />
          <View style={[logoStyles.eloDot, { backgroundColor: '#FBBF24' }]} />
          <View style={[logoStyles.eloDot, { backgroundColor: '#38BDF8' }]} />
        </View>
        <Text style={logoStyles.eloText}>elo</Text>
      </View>
    );
  }

  if (brand === 'AMEX') {
    return (
      <View style={logoStyles.amexContainer}>
        <FontAwesome name="cc-amex" size={20} color="#0070BA" />
      </View>
    );
  }

  if (brand === 'HIPERCARD') {
    return (
      <View style={logoStyles.hiperContainer}>
        <Text style={logoStyles.hiperText}>hiper</Text>
      </View>
    );
  }

  // Genérico / Padrão
  return (
    <View style={logoStyles.genericContainer}>
      <Feather name="credit-card" size={16} color="#64748B" />
    </View>
  );
}

const logoStyles = StyleSheet.create({
  mastercardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  circle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
  },
  visaContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  visaText: {
    fontSize: 11,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#1A1F71',
    letterSpacing: 0.5,
  },
  eloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eloDotsRow: {
    flexDirection: 'row',
    gap: 1.5,
  },
  eloDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.5,
  },
  eloText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  amexContainer: {
    paddingHorizontal: 2,
  },
  hiperContainer: {
    backgroundColor: '#B91C1C',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hiperText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  genericContainer: {
    paddingHorizontal: 2,
  },
});

export function CreditCardForm({ onSubmit, isLoading, totalFormatted }: CreditCardFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cpf, setCpf] = useState('');
  const [installments, setInstallments] = useState(`1x de R$ ${totalFormatted} sem juros`);
  const [saveCard, setSaveCard] = useState(true);

  // Erros campo a campo
  const [errors, setErrors] = useState<{
    cardNumber?: string;
    cardHolder?: string;
    expirationDate?: string;
    cvv?: string;
    cpf?: string;
  }>({});

  const brand = detectCardBrand(cardNumber);

  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
    if (errors.cardNumber) {
      setErrors((prev) => ({ ...prev, cardNumber: undefined }));
    }
  };

  const handleCardHolderChange = (text: string) => {
    // 2. Conforme o usuário for digitando, sempre em letras maiúsculas
    const upper = text.toUpperCase();
    setCardHolder(upper);
    if (errors.cardHolder) {
      setErrors((prev) => ({ ...prev, cardHolder: undefined }));
    }
  };

  const handleExpirationChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setExpirationDate(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setExpirationDate(cleaned);
    }
    if (errors.expirationDate) {
      setErrors((prev) => ({ ...prev, expirationDate: undefined }));
    }
  };

  const handleCvvChange = (text: string) => {
    // Permite 3 ou 4 dígitos (compatível com Visa/Master e Amex)
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    setCvv(cleaned);
    if (errors.cvv) {
      setErrors((prev) => ({ ...prev, cvv: undefined }));
    }
  };

  const handleCpfChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 11);
    let formatted = cleaned;
    if (cleaned.length > 9) {
      formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
    } else if (cleaned.length > 6) {
      formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    } else if (cleaned.length > 3) {
      formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    }
    setCpf(formatted);
    if (errors.cpf) {
      setErrors((prev) => ({ ...prev, cpf: undefined }));
    }
  };

  const handleFillTestData = () => {
    setCardNumber('4532 1234 5678 1234');
    setCardHolder('JOAO DA SILVA');
    setExpirationDate('12/28');
    setCvv('321');
    setCpf('123.456.789-09');
    setErrors({});
  };

  // Validação cuidadosa campo por campo com retorno estruturado
  const validateForm = () => {
    const newErrors: typeof errors = {};
    const rawNumber = cardNumber.replace(/\D/g, '');

    // Validação do Número
    if (!rawNumber) {
      newErrors.cardNumber = 'Informe o número do cartão impresso na frente.';
    } else if (rawNumber.length < 13 || rawNumber.length > 16) {
      newErrors.cardNumber = 'Número de cartão incompleto (deve ter entre 13 e 16 dígitos).';
    }

    // Validação do Nome do Titular
    const trimmedHolder = cardHolder.trim();
    if (!trimmedHolder) {
      newErrors.cardHolder = 'Informe o nome completo impresso no cartão.';
    } else if (trimmedHolder.length < 2) {
      newErrors.cardHolder = 'Digite o nome do titular como consta no cartão.';
    }

    // Validação da Validade MM/AA
    const rawExpiry = expirationDate.replace(/\D/g, '');
    if (!expirationDate) {
      newErrors.expirationDate = 'Informe a validade.';
    } else if (rawExpiry.length < 4) {
      newErrors.expirationDate = 'Use o formato MM/AA.';
    } else {
      const month = parseInt(rawExpiry.slice(0, 2), 10);
      const year = parseInt(rawExpiry.slice(2, 4), 10);

      if (month < 1 || month > 12) {
        newErrors.expirationDate = 'Mês inválido (01 a 12).';
      } else if (year < 24 || year > 60) {
        newErrors.expirationDate = 'Ano de validade inválido.';
      }
    }

    // Validação do CVV (3 ou 4 dígitos)
    if (!cvv) {
      newErrors.cvv = 'Informe o CVV.';
    } else if (cvv.length < 3 || cvv.length > 4) {
      newErrors.cvv = 'O CVV deve ter 3 ou 4 dígitos.';
    }

    // Validação do CPF do Titular (opcional para simulação de pagamento, mas validado se preenchido)
    const rawCpf = cpf.replace(/\D/g, '');
    if (rawCpf && rawCpf.length !== 11) {
      newErrors.cpf = 'CPF incompleto (deve conter 11 dígitos).';
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  const handleSubmit = () => {
    const { isValid, errors: validationErrors } = validateForm();
    if (!isValid) {
      const firstErrorMsg =
        validationErrors.cardNumber ||
        validationErrors.cardHolder ||
        validationErrors.expirationDate ||
        validationErrors.cvv ||
        validationErrors.cpf ||
        'Por favor, preencha corretamente os dados do cartão.';
      Alert.alert('Dados Incompletos', firstErrorMsg);
      return;
    }

    onSubmit({
      payment_method: 'CREDIT_CARD',
      payment_token: 'tok_mocked_12345',
      card_number: cardNumber.replace(/\s/g, ''),
      card_last_digits: cardNumber.replace(/\s/g, '').slice(-4),
      card_holder: cardHolder.toUpperCase(),
      expiration_date: expirationDate,
      card_brand: brand.name,
      save_card: saveCard,
      cpf: cpf.replace(/\D/g, ''),
    });
  };

  const displayCardNumber = cardNumber || '•••• •••• •••• ••••';
  const displayHolder = cardHolder || 'NOME DO TITULAR';
  const displayExpiry = expirationDate || 'MM/AA';

  return (
    <View style={styles.container}>
      {/* Visualização de Cartão Virtual Luxuoso */}
      <View style={styles.cardPreview}>
        <View style={styles.cardPreviewTop}>
          <Feather name="activity" size={20} color="#CBD5E1" />
          <View style={styles.brandBadgeWrapper}>
            <CardBrandLogo brand={brand.name} />
          </View>
        </View>

        <Text style={styles.cardPreviewNumber}>{displayCardNumber}</Text>

        <View style={styles.cardPreviewBottom}>
          <Text style={styles.cardPreviewHolder} numberOfLines={1}>
            {displayHolder.toUpperCase()}
          </Text>
          <Text style={styles.cardPreviewExpiry}>{displayExpiry}</Text>
        </View>
      </View>

      {/* 1. Número do Cartão */}
      <View style={styles.inputWrapper}>
        <Text style={styles.label}>Número do cartão</Text>
        <View style={[styles.inputWithIcon, errors.cardNumber ? styles.inputError : null]}>
          <TextInput
            style={styles.innerInput}
            placeholder="0000 0000 0000 0000"
            placeholderTextColor="#9CA3AF"
            value={cardNumber}
            onChangeText={handleCardNumberChange}
            keyboardType="numeric"
            maxLength={19}
            autoComplete="off"
            autoCorrect={false}
            spellCheck={false}
          />
          <View style={styles.brandBadgeWrapper}>
            <CardBrandLogo brand={brand.name} />
          </View>
        </View>
        {errors.cardNumber && (
          <View style={styles.errorMessageRow}>
            <Feather name="alert-circle" size={13} color="#DC2626" />
            <Text style={styles.errorMessageText}>{errors.cardNumber}</Text>
          </View>
        )}
      </View>

      {/* 2. Nome impresso no cartão */}
      <View style={styles.inputWrapper}>
        <Text style={styles.label}>Nome impresso no cartão</Text>
        <TextInput
          style={[styles.input, errors.cardHolder ? styles.inputError : null]}
          placeholder="COMO IMPRESSO NO CARTÃO"
          placeholderTextColor="#9CA3AF"
          value={cardHolder}
          onChangeText={handleCardHolderChange}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
        />
        {errors.cardHolder && (
          <View style={styles.errorMessageRow}>
            <Feather name="alert-circle" size={13} color="#DC2626" />
            <Text style={styles.errorMessageText}>{errors.cardHolder}</Text>
          </View>
        )}
      </View>

      {/* 3. Validade e CVV */}
      <View style={styles.row}>
        <View style={[styles.inputWrapper, { flex: 1 }]}>
          <Text style={styles.label}>Validade</Text>
          <TextInput
            style={[styles.input, errors.expirationDate ? styles.inputError : null]}
            placeholder="MM/AA"
            placeholderTextColor="#9CA3AF"
            value={expirationDate}
            onChangeText={handleExpirationChange}
            keyboardType="numeric"
            maxLength={5}
            autoComplete="off"
            autoCorrect={false}
            spellCheck={false}
          />
          {errors.expirationDate && (
            <View style={styles.errorMessageRow}>
              <Feather name="alert-circle" size={12} color="#DC2626" />
              <Text style={styles.errorMessageText}>{errors.expirationDate}</Text>
            </View>
          )}
        </View>
        <View style={[styles.inputWrapper, { flex: 1 }]}>
          <Text style={styles.label}>CVV</Text>
          <TextInput
            style={[styles.input, errors.cvv ? styles.inputError : null]}
            placeholder="•••"
            placeholderTextColor="#9CA3AF"
            value={cvv}
            onChangeText={handleCvvChange}
            keyboardType="numeric"
            secureTextEntry
            maxLength={4}
            autoComplete="off"
            autoCorrect={false}
            spellCheck={false}
          />
          {errors.cvv && (
            <View style={styles.errorMessageRow}>
              <Feather name="alert-circle" size={12} color="#DC2626" />
              <Text style={styles.errorMessageText}>{errors.cvv}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 4. CPF do titular */}
      <View style={styles.inputWrapper}>
        <Text style={styles.label}>CPF do titular (opcional)</Text>
        <TextInput
          style={[styles.input, errors.cpf ? styles.inputError : null]}
          placeholder="000.000.000-00"
          placeholderTextColor="#9CA3AF"
          value={cpf}
          onChangeText={handleCpfChange}
          keyboardType="numeric"
          maxLength={14}
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
        />
        {errors.cpf && (
          <View style={styles.errorMessageRow}>
            <Feather name="alert-circle" size={13} color="#DC2626" />
            <Text style={styles.errorMessageText}>{errors.cpf}</Text>
          </View>
        )}
      </View>

      {/* Parcelas */}
      <View style={styles.inputWrapper}>
        <Text style={styles.label}>Parcelas</Text>
        <View style={styles.selectBox}>
          <Text style={styles.selectText}>{installments}</Text>
          <Feather name="chevron-down" size={16} color="#4B5563" />
        </View>
      </View>

      {/* Switch Salvar cartão */}
      <View style={styles.switchRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.switchTitle}>Salvar cartão para próximas compras</Text>
          <Text style={styles.switchSub}>Você pode remover quando quiser</Text>
        </View>
        <Switch
          value={saveCard}
          onValueChange={setSaveCard}
          trackColor={{ false: '#D1D5DB', true: '#1E2B37' }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Botão de Preencher Dados de Teste */}
      <TouchableOpacity
        style={styles.testCardButton}
        onPress={handleFillTestData}
        activeOpacity={0.75}
      >
        <Feather name="zap" size={14} color="#1D4ED8" />
        <Text style={styles.testCardText}>Preencher dados de teste</Text>
      </TouchableOpacity>

      {/* Selo de segurança */}
      <View style={styles.securityRow}>
        <Feather name="lock" size={13} color="#6B7280" />
        <Text style={styles.securityText}>Pagamento seguro • dados criptografados</Text>
      </View>

      {/* Botão de Pagamento */}
      <TouchableOpacity
        style={[styles.payButton, isLoading && styles.payButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
        activeOpacity={0.88}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="lock-closed" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.payButtonText}>Pagar R$ {totalFormatted}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
  },
  cardPreview: {
    backgroundColor: '#27384A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#1E2B37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  cardPreviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 26,
  },
  cardPreviewType: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  cardPreviewNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 20,
  },
  cardPreviewBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPreviewHolder: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 10,
  },
  cardPreviewExpiry: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  inputWrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFEBE2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1C252E',
    fontWeight: '600',
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
        outlineWidth: 0,
      },
    }),
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFEBE2',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  innerInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1C252E',
    fontWeight: '600',
    borderWidth: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
        outlineWidth: 0,
      },
    }),
  },
  brandBadgeWrapper: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFEBE2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  selectText: {
    fontSize: 13,
    color: '#1C252E',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 14,
  },
  switchTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1C252E',
  },
  switchSub: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 1,
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
  payButton: {
    backgroundColor: '#1E2B37',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E2B37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  errorMessageText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '500',
  },
  testCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
    alignSelf: 'center',
  },
  testCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
});