import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSizes, radii, spacing } from '@/theme';

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

const TONE_COLORS: Record<StatusTone, string> = {
  neutral: colors.textMuted,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  info: colors.info,
  accent: colors.accent,
};

interface StatusTagProps {
  label: string;
  tone?: StatusTone;
}

export default function StatusTag({ label, tone = 'neutral' }: StatusTagProps) {
  const tint = TONE_COLORS[tone];
  return (
    <View style={[styles.pill, { borderColor: tint, backgroundColor: `${tint}22` }]}>
      <Text style={[styles.text, { color: tint }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  text: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
});
