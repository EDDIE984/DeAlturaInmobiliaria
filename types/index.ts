export interface User {
  id: string
  email: string
  name: string | null
  role: string | null
  is_active: boolean
  created_at: string
}
