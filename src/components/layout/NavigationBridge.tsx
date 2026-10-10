import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setNavigate } from '@/services/navigationRef'

/**
 * Registers the router's navigate function so the axios interceptor can
 * redirect on 401 without touching window.location. Renders nothing.
 */
export default function NavigationBridge() {
  const navigate = useNavigate()
  useEffect(() => {
    setNavigate(navigate)
  }, [navigate])
  return null
}
