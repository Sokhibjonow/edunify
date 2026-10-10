import { z } from 'zod'
import { CONNECT_CODE_PATTERN } from '@/utils/connectCode'

export const connectCodeSchema = z.string().regex(CONNECT_CODE_PATTERN)
