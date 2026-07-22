import { useFocusEffect } from '@react-navigation/native';
import type { ChatMessage } from '@spectech/shared-types';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getMessages, sendMessage } from '@/api/chat';
import EmptyState from '@/components/EmptyState';
import Screen from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import type { RootScreenProps } from '@/navigation/types';
import { colors, fontSizes, radii, spacing } from '@/theme';
import { formatDateTime } from '@/utils/format';

type Props = RootScreenProps<'Chat'>;

export default function ChatScreen({ route }: Props) {
  const { orderId, title } = route.params;
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setMessages(await getMessages(orderId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити чат');
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSend = async () => {
    if (!text.trim()) return;
    setIsSending(true);
    try {
      await sendMessage(orderId, text.trim());
      setText('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося надіслати повідомлення');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Screen title={title} scroll={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState text="Повідомлень ще немає" />}
          renderItem={({ item }) =>
            item.isSystem ? (
              <Text style={styles.systemMessage}>{item.text}</Text>
            ) : (
              <View
                style={[
                  styles.bubble,
                  item.senderId === profile?.id ? styles.bubbleSelf : styles.bubbleOther,
                ]}
              >
                <Text style={styles.bubbleText}>{item.text}</Text>
                <Text style={styles.bubbleMeta}>{formatDateTime(item.createdAt)}</Text>
              </View>
            )
          }
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Повідомлення..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (!text.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || isSending}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  error: { color: colors.danger, padding: spacing.md },
  list: { padding: spacing.lg, flexGrow: 1 },
  systemMessage: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  bubbleSelf: { alignSelf: 'flex-end', backgroundColor: colors.accent },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: colors.surface },
  bubbleText: { color: colors.text, fontSize: fontSizes.md },
  bubbleMeta: { color: colors.textMuted, fontSize: fontSizes.xs, marginTop: spacing.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#fff', fontSize: fontSizes.md },
});
