import { z } from 'zod'
import { connectCodeSchema } from '@/schemas/connectCodeSchemas'

const childClassSchema = z.object({ id: z.string(), name: z.string(), teacherName: z.string().nullable() })

export const parentChildSchema = z.object({
  uniqueId: z.string(),
  name: z.string(),
  surname: z.string(),
  classes: z.array(childClassSchema),
})

const taskItemSchema = z.object({
  taskId: z.string(),
  title: z.string(),
  description: z.string(),
  dueDate: z.string().nullable(),
  priority: z.enum(['normal', 'important']),
  className: z.string(),
  lessonTitle: z.string().nullable(),
  submitted: z.boolean(),
})

/** Everything a parent may see about one linked child. Read-only. */
export const childOverviewSchema = z.object({
  student: z.object({ uniqueId: z.string(), name: z.string(), surname: z.string() }),
  classes: z.array(childClassSchema),
  attendance: z.object({
    present: z.number(),
    late: z.number(),
    absent: z.number(),
    excused: z.number(),
    total: z.number(),
    pct: z.number().nullable(),
    recent: z.array(z.object({ date: z.string(), className: z.string(), status: z.enum(['present', 'late', 'absent', 'excused']) })),
  }),
  homework: z.object({
    upcoming: z.array(taskItemSchema),
    missing: z.array(taskItemSchema),
    recent: z.array(z.object({
      id: z.string(),
      className: z.string(),
      lessonTitle: z.string(),
      status: z.enum(['submitted', 'reviewed', 'late']),
      submittedAt: z.string(),
      photoCount: z.number(),
      comment: z.string(),
    })),
  }),
  payments: z.object({
    outstanding: z.number(),
    overdue: z.number(),
    unpaid: z.array(z.object({
      className: z.string(),
      period: z.string(),
      balance: z.number(),
      dueDate: z.string(),
      status: z.enum(['due', 'partial', 'overdue']),
    })),
    recent: z.array(z.object({ id: z.string(), className: z.string(), period: z.string(), amount: z.number(), paidAt: z.string() })),
  }),
})

export const studentParentSchema = z.object({
  uniqueId: z.string(),
  name: z.string(),
  surname: z.string(),
  phone: z.string(),
  email: z.string(),
})

export const parentLookupSchema = z.object({ uniqueId: z.string(), name: z.string(), surname: z.string() })

export const linkParentInputSchema = z.object({ parentId: connectCodeSchema })
