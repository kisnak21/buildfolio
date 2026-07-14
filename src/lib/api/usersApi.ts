import axiosClient from './axiosClient'

const RESOURCE = '/users'

interface CreateUserInput {
  name: string
  email: string
  password: string
}

export const getUsers = async () => {
  const response = await axiosClient.get(RESOURCE)
  return response.data
}

export const createUser = async (user: CreateUserInput) => {
  const response = await axiosClient.post(RESOURCE, user)
  return response.data
}
