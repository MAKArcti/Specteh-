import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UserRole } from '@spectech/shared-types';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import Button from '@/components/Button';
import Chip from '@/components/Chip';
import TextField from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, fontSizes, spacing } from '@/theme';
import { USER_ROLE_LABELS } from '@/utils/labels';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const SELECTABLE_ROLES = [UserRole.CUSTOMER, UserRole.EQUIPMENT_OWNER, UserRole.OPERATOR];

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleRole = (role: UserRole) => {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const canSubmit =
    fullName.trim().length > 0 && phone.trim().length > 0 && password.length >= 8 && roles.length > 0;

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        roles,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка реєстрації');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Реєстрація</Text>

      <TextField label="Повне ім'я" value={fullName} onChangeText={setFullName} />
      <TextField
        label="Телефон"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoCapitalize="none"
        placeholder="+380..."
      />
      <TextField
        label="Email (необов'язково)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField
        label="Пароль (мінімум 8 символів)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <Text style={styles.rolesLabel}>Ролі (можна декілька)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rolesRow}>
        {SELECTABLE_ROLES.map((role) => (
          <Chip
            key={role}
            label={USER_ROLE_LABELS[role]}
            selected={roles.includes(role)}
            onPress={() => toggleRole(role)}
          />
        ))}
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label="Зареєструватися"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={!canSubmit}
        style={styles.submitButton}
      />
      <Button label="Вже маю акаунт" onPress={() => navigation.goBack()} variant="secondary" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xl,
  },
  rolesLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    marginBottom: spacing.sm,
  },
  rolesRow: { marginBottom: spacing.lg },
  error: { color: colors.danger, marginBottom: spacing.md },
  submitButton: { marginBottom: spacing.md },
});
