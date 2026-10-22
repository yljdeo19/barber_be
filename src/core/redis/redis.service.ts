import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { createClient } from 'redis'

import { buildRedisUrl } from '../../configs/redis-url'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  readonly client = createClient({ url: buildRedisUrl() })

  constructor() {
    this.client.on('error', (error: Error) => console.error('Redis error:', error.message))
  }

  async onModuleInit() {
    await this.client.connect()
  }

  async onModuleDestroy() {
    if (this.client.isOpen) await this.client.quit()
  }
}
