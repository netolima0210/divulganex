export type UserRole = 'client' | 'professional'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type ServiceMode = 'task' | 'professional'
export type RequestStatus = 'open' | 'in_progress' | 'closed' | 'expired'
export type ProposalStatus = 'pending' | 'accepted' | 'rejected'
export type CategoryType = 'task' | 'professional' | 'both'

export interface Profile {
  id: string
  name: string
  avatar_url: string | null
  bio: string | null
  phone: string | null
  city: string | null
  state: string | null
  cpf_cnpj: string | null
  role: UserRole
  verified: boolean
  verification_status: VerificationStatus
  push_token: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  icon: string
  type: CategoryType
  active: boolean
}

export interface ServiceRequest {
  id: string
  client_id: string
  category_id: string
  mode: ServiceMode
  title: string
  description: string
  city: string
  state: string
  deadline: string | null
  status: RequestStatus
  proposals_count: number
  created_at: string
  expires_at: string
  category?: Category
  client?: Profile
}

export interface Proposal {
  id: string
  request_id: string
  professional_id: string
  message: string | null
  status: ProposalStatus
  contact_revealed: boolean
  created_at: string
  professional?: Profile
  request?: ServiceRequest
}

export interface Review {
  id: string
  reviewer_id: string
  reviewed_id: string
  request_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  read: boolean
  payload: Record<string, unknown> | null
  created_at: string
}

export const NORDESTE_STATES = [
  { label: 'Alagoas', value: 'AL' },
  { label: 'Bahia', value: 'BA' },
  { label: 'Ceará', value: 'CE' },
  { label: 'Maranhão', value: 'MA' },
  { label: 'Paraíba', value: 'PB' },
  { label: 'Pernambuco', value: 'PE' },
  { label: 'Piauí', value: 'PI' },
  { label: 'Rio Grande do Norte', value: 'RN' },
  { label: 'Sergipe', value: 'SE' },
]
