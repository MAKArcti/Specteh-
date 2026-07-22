import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import TopBar from './TopBar';
import { colors, spacing } from '@/theme';

interface ScreenProps {
  title: string;
  mode?: 'root' | 'back';
  scroll?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function Screen({ title, mode = 'back', scroll = true, footer, children }: ScreenProps) {
  return (
    <View style={styles.container}>
      <TopBar title={title} mode={mode} />
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
