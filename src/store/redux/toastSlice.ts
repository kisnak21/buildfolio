import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  message: string
  type: ToastType
  visible: boolean
}

const initialState: ToastState = {
  message: '',
  type: 'info',
  visible: false,
}

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: (
      state,
      action: PayloadAction<{ message: string; type?: ToastType }>,
    ) => {
      state.message = action.payload.message
      state.type = action.payload.type || 'info'
      state.visible = true
    },
    hideToast: (state) => {
      state.visible = false
    },
  },
})

export const { showToast, hideToast } = toastSlice.actions
export default toastSlice.reducer
