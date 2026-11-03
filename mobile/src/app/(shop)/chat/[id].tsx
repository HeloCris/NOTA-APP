import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import {
  listConversations,
  listMessages,
  markConversationRead,
  resolveMediaUrl,
  sendChatMessage,
  type ChatConversation,
  type ChatMessage,
} from '@/services/communication';

const POLL_INTERVAL_MS = 5000;

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Aguardando pagamento',
  PAID: 'Pago',
  PROCESSING: 'Em separação',
  CANCEL_REQUESTED: 'Cancelamento solicitado',
  SHIPPED: 'Enviado',
  DELIVERY_DISPUTED: 'Entrega contestada',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const conversationId = Number(params.id);

  const [conversation, setConversation] = useState<ChatConversation | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const isValidConversation = Number.isFinite(conversationId);
  const [isLoading, setIsLoading] = useState(isValidConversation);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(
    isValidConversation ? null : 'Conversa inválida.',
  );

  const lastMessageIdRef = useRef<number | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const loadConversation = useCallback(async () => {
    try {
      const conversations = await listConversations();
      const found =
        conversations.find((item) => item.id === conversationId) ?? null;
      setConversation(found);
    } catch (loadError) {
      console.error('Erro ao carregar conversa:', loadError);
    }
  }, [conversationId]);

  const loadMessages = useCallback(
    async (onlyNew = false) => {
      if (!Number.isFinite(conversationId)) {
        return;
      }

      try {
        const data = await listMessages(conversationId, {
          since_id: onlyNew
            ? lastMessageIdRef.current ?? undefined
            : undefined,
          page_size: 100,
        });

        if (onlyNew) {
          if (data.results.length > 0) {
            setMessages((current) => [...current, ...data.results]);
            lastMessageIdRef.current =
              data.results[data.results.length - 1].id;
          }
        } else {
          setMessages(data.results);
          lastMessageIdRef.current =
            data.results.length > 0
              ? data.results[data.results.length - 1].id
              : null;
        }

        setError(null);
      } catch (loadError) {
        console.error('Erro ao carregar mensagens:', loadError);
        setError('Não foi possível carregar as mensagens.');
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId],
  );

  useEffect(() => {
    if (!isValidConversation) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void loadConversation();
      void loadMessages();
      void markConversationRead(conversationId).catch((readError) => {
        console.error('Erro ao marcar conversa como lida:', readError);
      });
    }, 0);

    const intervalId = setInterval(() => {
      void loadMessages(true);
    }, POLL_INTERVAL_MS);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [conversationId, isValidConversation, loadConversation, loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd?.({ animated: true });
      }, 50);
    }
  }, [messages.length]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Permita o acesso à galeria para anexar uma foto.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSend = async () => {
    const trimmedText = text.trim();

    if ((!trimmedText && !imageUri) || isSending) {
      return;
    }

    setIsSending(true);

    try {
      await sendChatMessage(conversationId, {
        text: trimmedText || undefined,
        imageUri,
      });

      setText('');
      setImageUri(null);
      await loadMessages();
    } catch (sendError) {
      console.error('Erro ao enviar mensagem:', sendError);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
    } finally {
      setIsSending(false);
    }
  };

  const order = conversation?.order ?? null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="#1C252E" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {conversation?.store_name ?? 'Chat'}
            </Text>
            <Text style={styles.headerSubtitle}>Atendimento da loja</Text>
          </View>
        </View>

        {order && (
          <View style={styles.orderCard}>
            <Ionicons name="pricetag-outline" size={16} color="#2C4659" />
            <View style={styles.orderInfo}>
              <Text style={styles.orderTitle}>
                Referente ao Pedido {order.number}
              </Text>
              <Text style={styles.orderStatus}>
                {statusLabel(order.status)}
              </Text>
            </View>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2C4659" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.messagesContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Nenhuma mensagem ainda. Envie a primeira.
              </Text>
            }
            renderItem={({ item }) => {
              const isOwnMessage = item.sender_id === user?.id;
              const imageUrl = resolveMediaUrl(item.attachment_image);

              return (
                <View
                  style={[
                    styles.bubbleRow,
                    isOwnMessage
                      ? styles.bubbleRowRight
                      : styles.bubbleRowLeft,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isOwnMessage
                        ? styles.bubbleOwn
                        : styles.bubbleOther,
                    ]}
                  >
                    <Text
                      style={[
                        styles.senderName,
                        isOwnMessage && styles.senderNameOwn,
                      ]}
                    >
                      {item.sender_name}
                    </Text>

                    {item.text ? (
                      <Text
                        style={[
                          styles.messageText,
                          isOwnMessage && styles.messageTextOwn,
                        ]}
                      >
                        {item.text}
                      </Text>
                    ) : null}

                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.attachment}
                        accessibilityLabel="Imagem anexada"
                      />
                    ) : null}

                    <Text
                      style={[
                        styles.time,
                        isOwnMessage && styles.timeOwn,
                      ]}
                    >
                      {formatTime(item.created_at)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {imageUri ? (
          <View style={styles.previewRow}>
            <Image source={{ uri: imageUri }} style={styles.preview} />
            <TouchableOpacity
              onPress={() => setImageUri(null)}
              accessibilityRole="button"
              accessibilityLabel="Remover foto"
            >
              <Ionicons name="close-circle" size={22} color="#A85A38" />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => void handlePickImage()}
            accessibilityRole="button"
            accessibilityLabel="Anexar foto"
            activeOpacity={0.7}
          >
            <Ionicons name="attach" size={22} color="#2C4659" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Escreva uma mensagem..."
            placeholderTextColor="#9CA3AF"
            maxLength={1500}
            multiline
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!text.trim() && !imageUri) || isSending
                ? styles.sendButtonDisabled
                : null,
            ]}
            onPress={() => void handleSend()}
            disabled={isSending || (!text.trim() && !imageUri)}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem"
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E1D2',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C252E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 1,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6E1D2',
    backgroundColor: '#F8F6F0',
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C252E',
  },
  orderStatus: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 24,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOwn: {
    backgroundColor: '#2C4659',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E6E1D2',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78716C',
    marginBottom: 2,
  },
  senderNameOwn: {
    color: '#D7E1EA',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1C252E',
  },
  messageTextOwn: {
    color: '#FFFFFF',
  },
  attachment: {
    width: 190,
    height: 150,
    borderRadius: 10,
    marginTop: 8,
  },
  time: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeOwn: {
    color: '#C9D6E1',
  },
  errorText: {
    color: '#A85A38',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  preview: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E6E1D2',
    backgroundColor: '#FFFFFF',
  },
  attachButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6E1D2',
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E6E1D2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1C252E',
    backgroundColor: '#FAF9F6',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C4659',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
