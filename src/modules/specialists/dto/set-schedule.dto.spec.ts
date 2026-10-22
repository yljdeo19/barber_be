import 'reflect-metadata'

import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

import { SetScheduleDto } from './set-schedule.dto'

describe('SetScheduleDto', () => {
  it('accepts every weekday when working hours use 30-minute boundaries', async () => {
    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek += 1) {
      const dto = plainToInstance(SetScheduleDto, {
        days: [{ dayOfWeek, startMinute: 540, endMinute: 1020 }]
      })

      await expect(validate(dto)).resolves.toHaveLength(0)
    }
  })

  it('rejects working hours that do not use a 30-minute boundary', async () => {
    const dto = plainToInstance(SetScheduleDto, {
      days: [{ dayOfWeek: 1, startMinute: 545, endMinute: 1020 }]
    })

    await expect(validate(dto)).resolves.not.toHaveLength(0)
  })
})
