import type { z } from 'zod'
import { env } from '@/config/env'
import { api as mockApi } from '@/services/mocks/fakeBackend'
import { api, ApiError, type Envelope } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import {
  classSchema,
  classPageSchema,
  lessonSchema,
  moduleSchema,
  modulePageSchema,
  taskSchema,
  homeworkSubmissionSchema,
  studentSummarySchema,
  studentPageSchema,
  studentLookupSchema,
  studentCredentialsSchema,
  removeStudentResultSchema,
  createTeacherClassInputSchema,
  createTitleInputSchema,
  createTaskInputSchema,
  createStudentInputSchema,
  linkStudentInputSchema,
  attendanceRegisterSchema,
  saveAttendanceInputSchema,
} from '@/schemas/teacherClassSchemas'
import type {
  ClassItem,
  Lesson,
  Module,
  Task,
  HomeworkSubmission,
  StudentSummary,
  StudentLookup,
  StudentCredentials,
  RemoveStudentResult,
  CreateTeacherClassInput,
  CreateTitleInput,
  CreateTaskInput,
  CreateStudentInput,
  AttendanceRegister,
  SaveAttendanceInput,
} from '@/types/teacherClass'

export function unwrap<S extends z.ZodType>(envelope: Envelope<unknown>, schema: S): z.infer<S> {
  if (!envelope.ok) throw new ApiError(envelope.error, envelope.status)
  return schema.parse(envelope.data)
}

function tok(): string {
  return useAuthStore.getState().token ?? ''
}

const MAX_PAGE = { page: 1, pageSize: 100 }

export async function listTeacherClasses(teacherId: string): Promise<ClassItem[]> {
  if (env.useMocks) return unwrap(await mockApi.listTeacherClasses(teacherId, tok()), classPageSchema).items
  const res = await api.get<Envelope<unknown>>(`/teachers/${teacherId}/classes`, { params: MAX_PAGE })
  return unwrap(res.data, classPageSchema).items
}

export async function createTeacherClass(teacherId: string, input: CreateTeacherClassInput): Promise<ClassItem> {
  const body = createTeacherClassInputSchema.parse(input)
  if (env.useMocks) return unwrap(await mockApi.createTeacherClass(teacherId, body, tok()), classSchema)
  const res = await api.post<Envelope<unknown>>(`/teachers/${teacherId}/classes`, body)
  return unwrap(res.data, classSchema)
}

export async function getClass(classId: string): Promise<ClassItem> {
  if (env.useMocks) return unwrap(await mockApi.getClass(classId, tok()), classSchema)
  const res = await api.get<Envelope<unknown>>(`/classes/${classId}`)
  return unwrap(res.data, classSchema)
}

export async function listClassModules(classId: string): Promise<Module[]> {
  if (env.useMocks) return unwrap(await mockApi.listClassModules(classId, tok(), MAX_PAGE), modulePageSchema).items
  const res = await api.get<Envelope<unknown>>(`/classes/${classId}/modules`, { params: MAX_PAGE })
  return unwrap(res.data, modulePageSchema).items
}

export async function createClassModule(classId: string, input: CreateTitleInput): Promise<Module> {
  const body = createTitleInputSchema.parse(input)
  if (env.useMocks) return unwrap(await mockApi.createClassModule(classId, body, tok()), moduleSchema)
  const res = await api.post<Envelope<unknown>>(`/classes/${classId}/modules`, body)
  return unwrap(res.data, moduleSchema)
}

export async function createLesson(moduleId: string, input: CreateTitleInput): Promise<Lesson> {
  const body = createTitleInputSchema.parse(input)
  if (env.useMocks) return unwrap(await mockApi.createLesson(moduleId, body, tok()), lessonSchema)
  const res = await api.post<Envelope<unknown>>(`/modules/${moduleId}/lessons`, body)
  return unwrap(res.data, lessonSchema)
}

export async function getAttendanceRegister(classId: string, date: string): Promise<AttendanceRegister> {
  if (env.useMocks) return unwrap(await mockApi.getAttendanceRegister(classId, date, tok()), attendanceRegisterSchema)
  const res = await api.get<Envelope<unknown>>(`/classes/${classId}/attendance`, { params: { date } })
  return unwrap(res.data, attendanceRegisterSchema)
}

export async function saveAttendanceRegister(classId: string, input: SaveAttendanceInput): Promise<AttendanceRegister> {
  const body = saveAttendanceInputSchema.parse(input)
  if (env.useMocks) return unwrap(await mockApi.saveAttendanceRegister(classId, body, tok()), attendanceRegisterSchema)
  const res = await api.put<Envelope<unknown>>(`/classes/${classId}/attendance`, body)
  return unwrap(res.data, attendanceRegisterSchema)
}

export async function listClassTasks(classId: string): Promise<Task[]> {
  const schema = taskSchema.array()
  if (env.useMocks) return unwrap(await mockApi.listClassTasks(classId, tok()), schema)
  const res = await api.get<Envelope<unknown>>(`/classes/${classId}/tasks`)
  return unwrap(res.data, schema)
}

export async function createTask(classId: string, input: CreateTaskInput): Promise<Task> {
  const body = createTaskInputSchema.parse(input)
  if (env.useMocks) return unwrap(await mockApi.createTask(classId, body, tok()), taskSchema)
  const res = await api.post<Envelope<unknown>>(`/classes/${classId}/tasks`, body)
  return unwrap(res.data, taskSchema)
}

export async function listClassHomeworks(classId: string, lessonId: string): Promise<HomeworkSubmission[]> {
  const schema = homeworkSubmissionSchema.array()
  if (env.useMocks) return unwrap(await mockApi.listClassHomeworks(classId, tok(), { lessonId }), schema)
  const res = await api.get<Envelope<unknown>>(`/classes/${classId}/homeworks`, { params: { lessonId } })
  return unwrap(res.data, schema)
}

export async function reviewHomework(homeworkId: string): Promise<HomeworkSubmission> {
  if (env.useMocks) return unwrap(await mockApi.reviewHomework(homeworkId, tok()), homeworkSubmissionSchema)
  const res = await api.patch<Envelope<unknown>>(`/homeworks/${homeworkId}/review`)
  return unwrap(res.data, homeworkSubmissionSchema)
}

export async function listClassStudents(classId: string): Promise<StudentSummary[]> {
  if (env.useMocks) return unwrap(await mockApi.listStudents(classId, tok(), MAX_PAGE), studentPageSchema).items
  const res = await api.get<Envelope<unknown>>(`/classes/${classId}/students`, { params: MAX_PAGE })
  return unwrap(res.data, studentPageSchema).items
}

export async function lookupStudentForClass(classId: string, uniqueId: string): Promise<StudentLookup> {
  if (env.useMocks) return unwrap(await mockApi.lookupStudentForClass(classId, uniqueId, tok()), studentLookupSchema)
  const res = await api.get<Envelope<unknown>>(`/classes/${classId}/students/lookup`, { params: { uniqueId } })
  return unwrap(res.data, studentLookupSchema)
}

export async function addExistingStudentToClass(classId: string, uniqueId: string): Promise<StudentSummary> {
  const body = linkStudentInputSchema.parse({ uniqueId })
  if (env.useMocks) return unwrap(await mockApi.addExistingStudentToClass(classId, body.uniqueId, tok()), studentSummarySchema)
  const res = await api.post<Envelope<unknown>>(`/classes/${classId}/students/link`, body)
  return unwrap(res.data, studentSummarySchema)
}

export async function addStudentToClass(classId: string, input: CreateStudentInput): Promise<StudentCredentials> {
  const body = createStudentInputSchema.parse(input)
  if (env.useMocks) return unwrap(await mockApi.addStudentToClass(classId, body, tok()), studentCredentialsSchema)
  const res = await api.post<Envelope<unknown>>(`/classes/${classId}/students`, body)
  return unwrap(res.data, studentCredentialsSchema)
}

/** Class teacher or branch staff. History and debts stay; the month of leaving is still billed. */
export async function removeClassStudent(classId: string, studentId: string): Promise<RemoveStudentResult> {
  if (env.useMocks) return unwrap(await mockApi.removeClassStudent(classId, studentId, tok()), removeStudentResultSchema)
  const res = await api.delete<Envelope<unknown>>(`/classes/${classId}/students/${studentId}`)
  return unwrap(res.data, removeStudentResultSchema)
}

export async function resetStudentPassword(classId: string, studentId: string): Promise<StudentCredentials> {
  if (env.useMocks) return unwrap(await mockApi.resetStudentPassword(classId, studentId, tok()), studentCredentialsSchema)
  const res = await api.post<Envelope<unknown>>(`/classes/${classId}/students/${studentId}/reset-password`)
  return unwrap(res.data, studentCredentialsSchema)
}
