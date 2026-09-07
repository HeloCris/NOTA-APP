import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth';

WebBrowser.maybeCompleteAuthSession();

const registerSchema = z.object({
  first_name: z.string().min(1, 'Informe seu nome.'),
  last_name: z.string().min(1, 'Informe seu sobrenome.'),
  email: z.string().email('Informe um e-mail válido.'),
  phone: z.string().min(10, 'Telefone inválido.'),
  password: z.string().min(8, 'Mínimo de 8 caracteres.'),
});

type RegisterData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const { control, handleSubmit, formState: { errors, isValid, isSubmitting } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
    }
  });

  // Configuração da descoberta automática do Google OAuth
  // console.log("CLIENT ID Carregado:", process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID);
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  const [request, response, promptAsync] = AuthSession.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID as string,
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'notaapp',
    }),
    scopes: ['openid', 'profile', 'email'],
  }, discovery);

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.accessToken) {
      handleGoogleSuccess(response.authentication.accessToken);
    }
  }, [response]);

  const handleGoogleSuccess = async (accessToken: string) => {
    try {
      await signInWithGoogle(accessToken);
      router.push('/(auth)/onboarding/families');
    } catch (error: any) {
      setApiError('Erro ao autenticar com o Google.');
    }
  };

  const onSubmit = async (data: RegisterData) => {
    setApiError('');
    try {
      await authService.register({ 
        ...data, 
        olfactory_families: [], 
        preferred_notes: [] 
      });
      await signIn({ email: data.email, password: data.password });
      router.push('/(auth)/onboarding/families');
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData) {
        const firstErrorKey = Object.keys(errorData)[0];
        setApiError(errorData[firstErrorKey]?.[0] || 'Erro ao criar conta.');
      } else {
        setApiError('Erro de rede: O aplicativo não conseguiu alcançar o backend.');
      }
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Text style={styles.title}>Crie sua conta</Text>
      <Text style={styles.subtitle}>Cadastre-se para explorar o universo NŌTA como cliente.</Text>

      <Controller control={control} name="first_name" render={({ field: { onChange, value } }) => (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>NOME</Text>
          <TextInput style={styles.input} value={value || ''} onChangeText={onChange} placeholder="Ana" />
          {errors.first_name && <Text style={styles.errorText}>{errors.first_name.message}</Text>}
        </View>
      )} />

      <Controller control={control} name="last_name" render={({ field: { onChange, value } }) => (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>SOBRENOME</Text>
          <TextInput style={styles.input} value={value || ''} onChangeText={onChange} placeholder="Ferreira" />
          {errors.last_name && <Text style={styles.errorText}>{errors.last_name.message}</Text>}
        </View>
      )} />

      <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-MAIL</Text>
          <TextInput style={styles.input} value={value || ''} onChangeText={onChange} keyboardType="email-address" autoCapitalize="none" placeholder="ana@email.com" />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
        </View>
      )} />

      <Controller control={control} name="phone" render={({ field: { onChange, value } }) => (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>TELEFONE</Text>
          <TextInput style={styles.input} value={value || ''} onChangeText={onChange} keyboardType="phone-pad" placeholder="11 99999-0000" />
          {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
        </View>
      )} />

      <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>SENHA</Text>
          <View style={styles.passwordContainer}>
            <TextInput style={styles.inputPassword} value={value || ''} onChangeText={onChange} secureTextEntry={!showPassword} placeholder="••••••••" />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={24} color="#63666A" />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
        </View>
      )} />

      {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}

      <TouchableOpacity style={[styles.primaryButton, !isValid && styles.disabledButton]} onPress={handleSubmit(onSubmit)} disabled={!isValid || isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Próximo →</Text>}
      </TouchableOpacity>

      <Text style={styles.orText}>ou</Text>

      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={() => promptAsync()} 
        disabled={!request}
      >
        <Text style={styles.secondaryButtonText}>Continuar com Google</Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" asChild>
        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>Já tem uma conta? Entrar</Text>
        </TouchableOpacity>
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3E9', padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#1E3446', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#63666A', marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#1E3446', marginBottom: 4 },
  input: { backgroundColor: '#FCFBF7', borderWidth: 1, borderColor: '#ECE8DD', borderRadius: 8, padding: 12, fontSize: 16 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FCFBF7', borderWidth: 1, borderColor: '#ECE8DD', borderRadius: 8 },
  inputPassword: { flex: 1, padding: 12, fontSize: 16 },
  eyeIcon: { padding: 12 },
  errorText: { color: '#BA1A1A', fontSize: 12, marginTop: 4 },
  primaryButton: { backgroundColor: '#1E3446', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  orText: { textAlign: 'center', color: '#63666A', marginVertical: 16 },
  secondaryButton: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#ECE8DD', padding: 16, borderRadius: 8, alignItems: 'center' },
  secondaryButtonText: { color: '#1E3446', fontWeight: '600', fontSize: 16 },
  linkButton: { alignItems: 'center', marginTop: 24 },
  linkText: { color: '#1E3446', fontSize: 14, fontWeight: '600' }
});