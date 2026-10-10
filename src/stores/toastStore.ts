import { create } from 'zustand'

type ToastVariant = 'success' | 'error'

type Toast = {
  id: string
  message: string
  variant: ToastVariant
}

type ToastState = {
  toasts: Toast[]
  push: (message: string, variant: ToastVariant) => void
  dismiss: (id: string) => void
}

let nextId = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, variant) => {
    const id = String(++nextId)
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }))
    window.setTimeout(() => {
      useToastStore.getState().dismiss(id)
    }, 4000)
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
