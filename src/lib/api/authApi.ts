import realApiClient from './realApiClient'

export const registerUser = async ({ name, email, password }: { name: string; email: string; password: string }) => {
  const response = await realApiClient.post('/users', { name, email, password })
  return response.data.data
}

export const loginUserApi = async ({ email, password }: { email: string; password: string }) => {
  const response = await realApiClient.post('/users/login', { email, password })
  return response.data.data
}

export const changePasswordApi = async (
  id: string | number,
  { currentPassword, newPassword }: { currentPassword: string; newPassword: string },
) => {
  const response = await realApiClient.patch(`/users/${id}/password`, {
    currentPassword,
    newPassword,
  })
  return response.data
}

export const updateUserApi = async (id: string | number, { name, bio }: { name: string; bio: string }) => {
  const response = await realApiClient.patch(`/users/${id}`, { name, bio })
  return response.data.data
}
