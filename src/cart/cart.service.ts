import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(userId?: string) {
    if (userId) {
      const existingCart = await this.prisma.cart.findFirst({
        where: { userId },
        include: { items: { include: { coffee: true } } },
      });

      if (existingCart) {
        return existingCart;
      }
    }

    return this.prisma.cart.create({
      data: {
        userId: userId || null,
        status: 'AGUARDANDO_PAGAMENTO',
        status_payment: 'PENDENTE',
      },
    });
  }

  async getCart(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            coffee: true,
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    // Calcular subtotal para cada item
    const itemsWithSubtotal = cart.items.map(item => ({
      ...item,
      subtotal: item.quantity * Number(item.unitPrice),
    }));

    return {
      ...cart,
      items: itemsWithSubtotal,
    };
  }

  async addItem(cartId: string, addItemDto: AddItemDto) {
    const { coffeeId, quantity } = addItemDto;

    if (quantity < 1 || quantity > 5) {
      throw new BadRequestException('Quantity must be between 1 and 5');
    }

    const coffee = await this.prisma.coffee.findUnique({
      where: { id: coffeeId },
    });

    if (!coffee) {
      throw new NotFoundException(`Coffee with ID ${coffeeId} not found`);
    }

    // Verificar se o item já existe no carrinho
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        coffeeId,
      },
    });

    if (existingItem) {
      // Atualiza a quantidade somando com a já existente
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > 5) {
        throw new BadRequestException('Total quantity for this item cannot exceed 5');
      }

      const updatedItem = await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });

      return {
        ...updatedItem,
        subtotal: newQuantity * Number(existingItem.unitPrice),
      };
    }

    // Se não existe, cria um novo item
    const newItem = await this.prisma.cartItem.create({
      data: {
        cartId,
        coffeeId,
        quantity,
        unitPrice: coffee.price,
      },
      include: {
        coffee: true,
      },
    });

    return {
      ...newItem,
      subtotal: quantity * Number(coffee.price),
    };
  }

  async updateItem(cartId: string, itemId: string, updateItemDto: UpdateItemDto) {
    const { quantity } = updateItemDto;

    if (quantity < 1 || quantity > 5) {
      throw new BadRequestException('Quantity must be between 1 and 5');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId,
      },
      include: {
        coffee: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} not found in cart ${cartId}`);
    }

    const updatedItem = await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        coffee: true,
      },
    });

    return {
      ...updatedItem,
      subtotal: quantity * Number(updatedItem.unitPrice),
    };
  }

  async removeItem(cartId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId,
      },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} not found in cart ${cartId}`);
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return { success: true, message: 'Item removed successfully' };
  }
}
