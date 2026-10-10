import type { z } from 'zod'
import type {
  classSchema,
  lessonSchema,
  moduleSchema,
  taskPrioritySchema,
  taskSchema,
  homeworkStatusSchema,
  homeworkSubmissionSchema,
  studentSummarySchema,
  studentLookupSchema,
  studentCredentialsSchema,
  removeStudentResultSchema,
  createTeacherClassInputSchema,
  createTitleInputSchema,
  createTaskInputSchema,
  createStudentInputSchema,
  submitHomeworkInputSchema,
  attendanceStatusSchema,
  attendanceRegisterSchema,
  saveAttendanceInputSchema,
} from '@/schemas/teacherClassSchemas'

export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>
export type AttendanceRegister = z.infer<typeof attendanceRegisterSchema>
export type SaveAttendanceInput = z.infer<typeof saveAttendanceInputSchema>

export type ClassItem = z.infer<typeof classSchema>
export type Lesson = z.infer<typeof lessonSchema>
export type Module = z.infer<typeof moduleSchema>
export type TaskPriority = z.infer<typeof taskPrioritySchema>
export type Task = z.infer<typeof taskSchema>
export type HomeworkStatus = z.infer<typeof homeworkStatusSchema>
export type HomeworkSubmission = z.infer<typeof homeworkSubmissionSchema>
export type StudentSummary = z.infer<typeof studentSummarySchema>
export type StudentLookup = z.infer<typeof studentLookupSchema>
export type StudentCredentials = z.infer<typeof studentCredentialsSchema>
export type RemoveStudentResult = z.infer<typeof removeStudentResultSchema>
export type CreateTeacherClassInput = z.infer<typeof createTeacherClassInputSchema>
export type CreateTitleInput = z.infer<typeof createTitleInputSchema>
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>
export type CreateStudentInput = z.infer<typeof createStudentInputSchema>
export type SubmitHomeworkInput = z.infer<typeof submitHomeworkInputSchema>
