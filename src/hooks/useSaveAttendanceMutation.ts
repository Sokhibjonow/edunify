import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saveAttendanceRegister } from '@/services/teacherClassService'
import type { SaveAttendanceInput } from '@/types/teacherClass'

export function useSaveAttendanceMutation(classId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SaveAttendanceInput) => saveAttendanceRegister(classId, input),
    onSuccess: (register) => {
      queryClient.setQueryData(['attendance', classId, register.date], register)
    },
  })
}
