import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../../core/prisma/prisma.service'
import { CreateServiceDto } from './dto/create-service.dto'
import { UpdateServiceDto } from './dto/update-service.dto'

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.serviceOffering.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' }
    })
  }

  create(dto: CreateServiceDto) {
    return this.prisma.serviceOffering.create({ data: dto })
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.ensureExists(id)
    return this.prisma.serviceOffering.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    await this.ensureExists(id)
    return this.prisma.serviceOffering.update({ where: { id }, data: { isActive: false } })
  }

  private async ensureExists(id: string) {
    if (!(await this.prisma.serviceOffering.findUnique({ where: { id }, select: { id: true } }))) {
      throw new NotFoundException('Service not found')
    }
  }
}
