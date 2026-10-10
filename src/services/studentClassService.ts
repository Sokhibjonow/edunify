import { env } from '@/config/env'
import { api as mockApi } from '@/services/mocks/fakeBackend'
import { api, type Envelope } from '@/services/api'
import { unwrap } from '@/services/teacherClassService'
import { useAuthStore } from '@/stores/authStore'
import { compressImage } from '@/utils/compressImage'
import { classPageSchema, homeworkSubmissionSchema, submitHomeworkInputSchema } from '@/schemas/teacherClassSchemas'
import type { ClassItem, HomeworkSubmission, SubmitHomeworkInput } from '@/types/teacherClass'

function tok(): string {
  return useAuthStore.getState().token ?? ''
}

export async function listStudentClasses(studentId: string): Promise<ClassItem[]> {
  if (env.useMocks) return unwrap(await mockApi.listStudentClasses(studentId, tok()), classPageSchema).items
  const res = await api.get<Envelope<unknown>>(`/students/${studentId}/classes`, { params: { page: 1, pageSize: 100 } })
  return unwrap(res.data, classPageSchema).items
}

export async function submitHomework(classId: string, input: SubmitHomeworkInput): Promise<HomeworkSubmission> {
  const body = submitHomeworkInputSchema.parse(input)
  if (env.useMocks) return unwrap(await mockApi.submitHomework(classId, body, tok()), homeworkSubmissionSchema)
  const form = new FormData()
  form.append('lessonId', body.lessonId)
  form.append('comment', body.comment)
  for (const photo of await Promise.all(body.photos.map((p) => compressImage(p)))) form.append('photos', photo)
  const res = await api.post<Envelope<unknown>>(`/classes/${classId}/homeworks`, form, {
    headers: { 'Content-Type': undefined },
  })
  return unwrap(res.data, homeworkSubmissionSchema)
}
