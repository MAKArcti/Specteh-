/** In-app notification (SoW 9). Push delivery is out of scope for this pass. */
export interface Notification {
  id: string;
  userId: string;
  text: string;
  read: boolean;
  createdAt: string;
}
