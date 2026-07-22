import type { Notification } from '@spectech/shared-types';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text } from 'react-native';
import { getNotifications, markAllNotificationsRead } from '@/api/notifications';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import Screen from '@/components/Screen';
import type { RootScreenProps } from '@/navigation/types';
import { colors, fontSizes } from '@/theme';
import { formatDateTime } from '@/utils/format';

type Props = RootScreenProps<'Notifications'>;

export default function NotificationsScreen(_props: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getNotifications()
      .then((items) => {
        setNotifications(items);
        return markAllNotificationsRead();
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Не вдалося завантажити сповіщення'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Screen title="Сповіщення" scroll={false}>
      {isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyState text="Сповіщень ще немає" />}
          renderItem={({ item }) => (
            <Card>
              <Text style={[styles.text, !item.read && styles.unread]}>{item.text}</Text>
              <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  text: { color: colors.text, fontSize: fontSizes.md },
  unread: { fontWeight: '700' },
  time: { color: colors.textMuted, fontSize: fontSizes.xs, marginTop: 4 },
});
