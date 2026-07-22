import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '@/navigation/types';
import { colors, fontSizes, spacing } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface TopBarProps {
  title: string;
  mode?: 'root' | 'back';
}

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

export default function TopBar({ title, mode = 'back' }: TopBarProps) {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
      {mode === 'back' ? (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
          hitSlop={HIT_SLOP}
        >
          <Text style={styles.icon}>‹</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.iconButton} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {mode === 'root' ? (
        <View style={styles.rightIcons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.iconButton}
            hitSlop={HIT_SLOP}
          >
            <Text style={styles.icon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.iconButton}
            hitSlop={HIT_SLOP}
          >
            <Text style={styles.icon}>👤</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.iconButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIcons: {
    flexDirection: 'row',
  },
  icon: {
    fontSize: fontSizes.xl,
    color: colors.text,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
});
