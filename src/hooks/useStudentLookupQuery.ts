import { useQuery } from '@tanstack/react-query'
import { lookupStudentForClass } from '@/services/teacherClassService'
import { isConnectCode } from '@/utils/connectCode'

export function useStudentLookupQuery(classId: string, uniqueId: string) {
  return useQuery({
    queryKey: ['student-lookup', classId, uniqueId],
    queryFn: () => lookupStudentForClass(classId, uniqueId),
    enabled: isConnectCode(uniqueId),
    retry: false,
  })
}
