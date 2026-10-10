import './App.css'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppRoutes from '@/routes'
import NavigationBridge from '@/components/layout/NavigationBridge'
import Toaster from '@/components/ui/Toaster'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NavigationBridge />
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
