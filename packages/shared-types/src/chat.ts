/**
 * A message on an order's chat thread (SoW 6). Before the order reaches
 * IN_WORK, only the renter and owner can see/post; the operator joins once
 * the contract starts. `senderId` is undefined for system messages
 * ("Призначено оператора", "Роботи розпочато", "Роботи завершено").
 */
export interface ChatMessage {
  id: string;
  orderId: string;
  senderId?: string;
  isSystem: boolean;
  text: string;
  createdAt: string;
}

export interface SendChatMessageDto {
  text: string;
}
