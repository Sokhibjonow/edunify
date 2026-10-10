import { z } from 'zod'
import { connectCodeSchema } from '@/schemas/connectCodeSchemas'
import { pageSchema } from '@/schemas/branchSchemas'

export const classSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  branchId: z.string(),
  name: z.string(),
  teacherId: z.string().nullable(),
  studentIds: z.array(z.string()),
  classPrice: z.number(),
  joinCode: z.string(),
  createdAt: z.string(),
})

export const lessonSchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  title: z.string(),
  order: z.number(),
})

export const moduleSchema = z.object({
  id: z.string(),
  teacherId: z.string(),
  title: z.string(),
  classId: z.string().nullable(),
  lessons: z.array(lessonSchema),
  createdAt: z.string(),
})

export const taskPrioritySchema = z.enum(['normal', 'important'])

export const taskSchema = z.object({
  id: z.string(),
  classId: z.string(),
  lessonId: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  dueDate: z.string().nullable(),
  priority: taskPrioritySchema,
  createdBy: z.string(),
  createdAt: z.string(),
})

export const homeworkStatusSchema = z.enum(['submitted', 'reviewed', 'late'])

export const homeworkSubmissionSchema = z.object({
  id: z.string(),
  classId: z.string(),
  lessonId: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  comment: z.string(),
  photos: z.array(z.string()),
  submittedAt: z.string(),
  status: homeworkStatusSchema,
})

export const studentSummarySchema = z.object({
  uniqueId: z.string(),
  name: z.string(),
  surname: z.string(),
  email: z.string(),
  phone: z.string(),
  role: z.literal('student'),
})

export const studentLookupSchema = z.object({
  uniqueId: z.string(),
  name: z.string(),
  surname: z.string(),
  alreadyInClass: z.boolean(),
})

export const studentCredentialsSchema = z.object({
  student: studentSummarySchema,
  login: z.string(),
  password: z.string(),
})

/** `undone`: removed on the day they were added, so nothing is billed. Otherwise the month of leaving is still billed. */
export const removeStudentResultSchema = z.object({
  studentId: z.string(),
  undone: z.boolean(),
  lastBilledPeriod: z.string().nullable(),
})

export const attendanceStatusSchema = z.enum(['present', 'late', 'absent', 'excused'])

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const attendanceRegisterSchema = z.object({
  date: isoDate,
  lessonId: z.string().nullable(),
  recordedAt: z.string().nullable(),
  records: z.array(z.object({ studentId: z.string(), status: attendanceStatusSchema })),
})

export const saveAttendanceInputSchema = z.object({
  date: isoDate,
  lessonId: z.string().nullable(),
  records: z.array(z.object({ studentId: z.string(), status: attendanceStatusSchema })).min(1),
})

export const classPageSchema = pageSchema(classSchema)
export const modulePageSchema = pageSchema(moduleSchema)
export const studentPageSchema = pageSchema(studentSummarySchema)

export const createTeacherClassInputSchema = z.object({ name: z.string().trim().min(1) })
export const createTitleInputSchema = z.object({ title: z.string().trim().min(1) })

export const createTaskInputSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string(),
  lessonId: z.string().nullable(),
  dueDate: z.string().nullable(),
  priority: taskPrioritySchema,
})

export const createStudentInputSchema = z.object({
  name: z.string().trim().min(1),
  surname: z.string().trim().min(1),
})

export const linkStudentInputSchema = z.object({ uniqueId: connectCodeSchema })

export const submitHomeworkInputSchema = z.object({
  lessonId: z.string().min(1),
  comment: z.string(),
  photos: z.array(z.instanceof(File)).min(1).max(5),
})
