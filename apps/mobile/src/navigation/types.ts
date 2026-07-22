import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { EquipmentType, ReportDraft } from '@spectech/shared-types';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Market: undefined;
  Orders: undefined;
  Reports: undefined;
  Fleet: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  EquipmentDetail: { equipmentId: string };
  CreateOrder: { equipmentType?: EquipmentType; equipmentId?: string } | undefined;
  OrderDetail: { orderId: string };
  AssignOrder: { orderId: string; equipmentType: EquipmentType };
  Chat: { orderId: string; title: string };
  AddEquipment: undefined;
  Passport: { equipmentId: string };
  ReportCreate: {
    orderId: string;
    clientReportId?: string;
    startedAt?: string;
    endedAt?: string;
    durationMin?: number;
    /** Prefill for editing an already-queued or already-synced-but-unconfirmed report. */
    initialDraft?: ReportDraft;
  };
  Profile: undefined;
  Notifications: undefined;
};

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
