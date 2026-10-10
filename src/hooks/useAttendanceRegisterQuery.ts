import { useQuery } from '@tanstack/react-query'
import { getAttendanceRegister } from '@/services/teacherClassService'

export function useAttendanceRegisterQuery(classId: string, date: string) {
  return useQuery({
    queryKey: ['attendance', classId, date],
    queryFn: () => getAttendanceRegister(classId, date),
  })
}
