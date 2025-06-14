import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCart() {
    return this.cartService.getOrCreateCart();
  }

  @Get(':id')
  async getCart(@Param('id') id: string) {
    return this.cartService.getCart(id);
  }

  @Post(':id/items')
  @HttpCode(HttpStatus.CREATED)
  async addItem(@Param('id') id: string, @Body() addItemDto: AddItemDto) {
    return this.cartService.addItem(id, addItemDto);
  }

  @Patch(':id/items/:itemId')
  async updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    return this.cartService.updateItem(id, itemId, updateItemDto);
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    await this.cartService.removeItem(id, itemId);
  }
}
