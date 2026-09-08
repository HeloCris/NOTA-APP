import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  withRepeat,
  withSequence,
  Easing 
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/use-theme';

// A logo SVG foi removida porque o estilo 3D dourado requirido pela marca (textura e sombreamento) 
// não pode ser renderizado com perfeição usando apenas paths e strokes sólidos via código puro.
// Voltamos a utilizar o asset de alta qualidade.

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useTheme();

  // Valores de animação para o Fade In encadeado
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(20);

  // Valor de animação para o Breathing Effect da Logo
  const logoBreathingScale = useSharedValue(0.98);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) });
    textOpacity.value = withDelay(800, withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) }));
    buttonsOpacity.value = withDelay(1600, withTiming(1, { duration: 800 }));
    buttonsTranslateY.value = withDelay(1600, withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) }));

    logoBreathingScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.98, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, 
      true
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoBreathingScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  return (
    <LinearGradient 
      colors={[colors.background, colors.backgroundElement, colors.background]}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <View style={styles.content}>
        
        {/* Usando o asset da imagem para preservar a textura 3D dourada da marca */}
        <Animated.Image 
          source={require('../../../assets/images/logo-icon-fundoTransp.png')}
          style={[styles.logo, logoStyle]}
          resizeMode="contain"
        />

        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={[styles.title, { color: colors.text }]}>NŌTA</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            YOUR SCENT, UNDERSTOOD.
          </Text>
        </Animated.View>

      </View>

      {/* Botões de Ação Inferior (Fade In e Slide Up encadeado) */}
      <Animated.View style={[styles.footer, buttonsStyle]}>
        <Pressable 
          style={({ pressed }) => [
            styles.primaryButton, 
            { 
              borderColor: colors.text, 
              backgroundColor: pressed ? colors.backgroundSelected : 'transparent' 
            }
          ]} 
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>
            Entrar
          </Text>
        </Pressable>
        
        <Pressable 
          style={({ pressed }) => [
            styles.secondaryButton,
            { opacity: pressed ? 0.6 : 1 }
          ]}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
            Criar Conta
          </Text>
        </Pressable>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logo: {
    width: '45%',
    aspectRatio: 1,
    maxWidth: 240,
    maxHeight: 240,
    marginBottom: 24,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 54,
    fontWeight: '300',
    letterSpacing: 10,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 50, 
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },
});
