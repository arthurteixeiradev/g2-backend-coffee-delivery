import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CoffeesService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    const coffees = await this.prisma.coffee.findMany({
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return coffees.map(coffee => ({
      ...coffee,
      tags: coffee.tags.map(coffeeTag => coffeeTag.tag),
    }));
  }

  async findOne(id: string) {
    const coffee = await this.prisma.coffee.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!coffee) {
      throw new NotFoundException(`Coffee with ID ${id} not found`);
    }

    return {
      ...coffee,
      tags: coffee.tags.map(coffeeTag => coffeeTag.tag),
    };
  }

  // no coffees.service.ts
  async findAllTags() {
    return this.prisma.tag.findMany();
  }


  async create(createCoffeeDto: CreateCoffeeDto) {
    const { tagIds, ...data } = createCoffeeDto;

    const existingTags = await this.prisma.tag.findMany({
      where: { id: { in: tagIds } }
    });

    if (existingTags.length !== tagIds.length) {
      throw new BadRequestException('Algumas tags enviadas não existem.');
    }

    return this.prisma.coffee.create({
      data: {
        ...data,
        tags: {
          create: tagIds.map(tagId => ({
            tagId,
          })),
        },
      },
      include: { tags: true },
    });
  }



  async update(id: string, updateCoffeeDto: UpdateCoffeeDto) {
    const { tagIds, ...data } = updateCoffeeDto;

    if (tagIds && tagIds.length > 0) {
      const existingTags = await this.prisma.tag.findMany({
        where: { id: { in: tagIds } }
      });

      if (existingTags.length !== tagIds.length) {
        throw new BadRequestException('Algumas tags enviadas não existem.');
      }
    }

    await this.prisma.coffeeTag.deleteMany({ where: { coffeeId: id } });

    return this.prisma.coffee.update({
      where: { id },
      data: {
        ...data,
        tags: {
          create: tagIds?.map(tagId => ({ tagId }))
        }
      },
      include: { tags: { include: { tag: true } } }
    });
  }


  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.coffee.delete({ where: { id } });
  }

  async searchCoffees(params: {
    start_date?: Date;
    end_date?: Date;
    name?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }) {
    const { start_date, end_date, name, tags, limit = 10, offset = 0 } = params;

    // Construir o filtro

    // Filtro por data

    // Filtro por nome

    // Filtro por tags

    // Buscar os cafés com paginação

    // Formatar a resposta
    return {
      data: [],
      pagination: {
        total: [],
        limit,
        offset,
        hasMore: offset,
      },
    };
  }
} 