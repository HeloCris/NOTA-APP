import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const { control, handleSubmit, formState: { errors, isValid, isSubmitting } } =
    useForm<LoginData>({
      resolver: zodResolver(loginSchema),
      mode: 'onChange',
      defaultValues: { email: '', password: '' },
    });

  const onSubmit = async (data: LoginData) => {
    setApiError('');
    try {
      await signIn(data);
      router.replace('/(shop)');
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setApiError('Credenciais inválidas. Verifique seu e-mail e senha.');
      } else {
        setApiError('Erro de rede: não foi possível conectar ao servidor.');
      }
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.header}>
        <Text style={styles.logo}>NŌTA</Text>
        <Text style={styles.subtitle}>Your scent, understood.</Text>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-MAIL</Text>
            <TextInput
              style={styles.input}
              value={value || ''}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="ana@email.com"
              placeholderTextColor="#A8A39A"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SENHA</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.inputPassword}
                value={value || ''}
                onChangeText={onChange}
                secureTextEntry={!showPassword}
                autoComplete="password"
                placeholder="••••••••"
                placeholderTextColor="#A8A39A"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={24}
                  color="#63666A"
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>
        )}
      />

      <TouchableOpacity style={styles.forgotLink} onPress={() => {}}>
        <Text style={styles.forgotText}>Esqueci minha senha</Text>
      </TouchableOpacity>

      {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryButton, !isValid && styles.disabledButton]}
        onPress={handleSubmit(onSubmit)}
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Entrar</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.orText}>ou</Text>

      {/* RF-07.3: Entrar com Google desabilitado temporariamente —
          aguardando correção do fluxo expo-auth-session pela equipe. */}
      <TouchableOpacity style={styles.secondaryButton} disabled activeOpacity={1}>
        <Text style={styles.googleIcon}>G</Text>
        <Text style={styles.secondaryButtonText}>Entrar com Google</Text>
      </TouchableOpacity>

      <Link href="/(auth)/register" asChild>
        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>Não tem conta? Cadastre-se</Text>
        </TouchableOpacity>
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3E9',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 44,
    fontWeight: '300',
    letterSpacing: 10,
    color: '#1E3446',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: '600',
    color: '#63666A',
    textTransform: 'uppercase',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3446',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FCFBF7',
    borderWidth: 1,
    borderColor: '#ECE8DD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E3446',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCFBF7',
    borderWidth: 1,
    borderColor: '#ECE8DD',
    borderRadius: 8,
  },
  inputPassword: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1E3446',
  },
  eyeIcon: {
    padding: 12,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    color: '#1E3446',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#BA1A1A',
    fontSize: 12,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#1E3446',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  orText: {
    textAlign: 'center',
    color: '#63666A',
    marginVertical: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ECE8DD',
    padding: 16,
    borderRadius: 8,
    gap: 12,
    opacity: 0.6,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  secondaryButtonText: {
    color: '#1E3446',
    fontWeight: '600',
    fontSize: 16,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  linkText: {
    color: '#1E3446',
    fontSize: 14,
    fontWeight: '600',
  },
});