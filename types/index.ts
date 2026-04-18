export interface User {
  id: string
  email: string
  name: string | null
  role: string | null
  is_active: boolean
  created_at: string
}

export interface Agent {
  id: string
  name: string
  email: string | null
  phone: string | null
  active: boolean
  frio: boolean | null
  created_at: string
}

export interface Integration {
  id: number
  mongo_id: string | null
  type: string | null
  active: boolean | null
  project_name: string | null
  project_slogan: string | null
  project_description: string | null
  location: string | null
  total_area: string | null
  contact_office_name: string | null
  contact_address: string | null
  contact_city: string | null
  contact_phone: string | null
  contact_whatsapp: string | null
  contact_email: string | null
  contact_schedule: string | null
  contact_google_maps_url: string | null
  nombre_robot: string | null
  updated_at: string | null
  data_updated_at: string | null
}

export interface Amenity {
  id: number
  integration_id: number | null
  amenity_id: string | null
  name: string | null
  description: string | null
  icon: string | null
}

export interface Lot {
  id: number
  integration_id: number | null
  lot_id: string | null
  zone: string | null
  features: string[] | null
  available: boolean | null
  google_maps_url: string | null
  images: string[] | null
}

export interface Zone {
  id: number
  integration_id: number | null
  zone_id: string | null
  name: string | null
  description: string | null
  characteristics: string[] | null
  google_maps_url: string | null
  images: string[] | null
  size_m2: number | null
  price: number | null
  monthly_payment: number | null
  lot_id: string | null
}
