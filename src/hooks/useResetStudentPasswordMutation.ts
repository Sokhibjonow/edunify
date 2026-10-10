import { useMutation } from '@tanstack/react-query'
import { resetStudentPassword } from '@/services/teacherClassService'

export function useResetStudentPasswordMutation(classId: string) {
  return useMutation({
    mutationFn: (studentId: string) => resetStudentPassword(classId, studentId),
  })
}
