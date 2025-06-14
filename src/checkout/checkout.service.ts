import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class CheckoutService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
  ) {}

  async createOrder(checkoutDto: CheckoutDto) {
    const { cartId, deliveryAddress, paymentMethod } = checkoutDto;
  
    // 1 - Buscar carrinho completo com itens e preços
    const cart = await this.cartService.getCart(cartId);
  
    if (!cart || cart.items.length === 0) {
      throw new NotFoundException('Cart is empty or not found');
    }
  
    // 2 - Calcular totalItems e totalAmount
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.items.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);
    const shippingFee = 5; // Exemplo fixo, ou calcular
  
    // 3 - Criar pedido no banco
    const order = await this.prisma.order.create({
      data: {
        cart: { connect: { id: cartId } },
        totalItems,
        shippingFee,
        totalAmount: totalAmount + shippingFee,
        // salvar endereço e método de pagamento, se modelados
      },
      include: {
        cart: {
          include: { items: true }
        }
      }
    });
  
    // 4 - Retornar dados formatados
    return {
      id: order.id,
      items: order.cart.items,
      uniqueCategories: new Set(order.cart.items.map(i => i.coffeeId)).size,
      itemsTotal: totalItems,
      shippingFee,
      total: totalAmount + shippingFee,
      status: order.status,
      createdAt: order.createdAt,
    };
  }
} 