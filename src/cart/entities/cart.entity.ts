import { Cart as PrismaCart, CartStatus, PaymentStatus } from '@prisma/client';

export class Cart implements PrismaCart {
  id: string;
  userId: string | null;
  status: CartStatus;
  status_payment: PaymentStatus;
  data_time_completed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
