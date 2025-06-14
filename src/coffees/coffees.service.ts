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

    // Busca tags que já existem
    const existingTags = await this.prisma.tag.findMany({ where: { id: { in: tagIds } } });

    // Filtra as que ainda não existem
    const existingTagIds = existingTags.map((tag) => tag.id);
    const newTagIds = tagIds.filter((id) => !existingTagIds.includes(id));

    // Cria as que não existem
    for (const tagId of newTagIds) {
      await this.prisma.tag.create({ data: { id: tagId, name: `Tag ${tagId}` } });
    }

    // Agora relaciona tudo
    return this.prisma.coffee.create({
      data: {
        ...data,
        tags: {
          create: tagIds.map(id => ({ tagId: id }))
        }
      },
      include: { tags: { include: { tag: true } } }
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
    // Deleta as associações CoffeeTag
    await this.prisma.coffeeTag.deleteMany({
      where: { coffeeId: id },
    });

    // Deleta o Coffee
    return this.prisma.coffee.delete({
      where: { id },
    });
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
  
    // Construindo filtro dinâmico
    const where: Prisma.CoffeeWhereInput = {};
  
    // Filtro por intervalo de datas
    if (start_date || end_date) {
      where.createdAt = {};
      if (start_date) where.createdAt.gte = start_date;
      if (end_date) where.createdAt.lte = end_date;
    }
  
    // Filtro por nome (case insensitive, busca parcial)
    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }
  
    // Filtro por tags: coffees que tenham pelo menos uma das tags informadas
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: tags, mode: 'insensitive' }
          }
        }
      };
    }
  
    // Contar total para paginação
    const total = await this.prisma.coffee.count({ where });
  
    // Buscar cafés com paginação
    const coffees = await this.prisma.coffee.findMany({
      where,
      include: {
        tags: {
          include: { tag: true }
        }
      },
      skip: offset,
      take: limit,
    });
  
    // Formatando retorno: extrair as tags do relacionamento
    const data = coffees.map(coffee => ({
      ...coffee,
      tags: coffee.tags.map(ct => ct.tag),
    }));
  
    return {
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

} 