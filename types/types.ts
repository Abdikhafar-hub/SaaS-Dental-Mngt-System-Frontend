// Global type definitions for the dental clinic system

export interface User {
  id: string
  email: string
  role: string
  full_name?: string
}

export interface Patient {
  id: string
  name: string
  email?: string
  phone?: string
  date_of_birth?: string
  address?: string
  created_at: string
}

export interface Appointment {
  id: string
  patient_id: string
  dentist_id: string
  date: string
  time: string
  status: string
  notes?: string
  created_at: string
}

export interface Visit {
  id: string
  patient_id: string
  dentist_id: string
  date: string
  diagnosis?: string
  treatment?: string
  notes?: string
  created_at: string
}

export interface Invoice {
  id: string
  patient_id: string
  amount: number
  status: string
  due_date: string
  created_at: string
} 