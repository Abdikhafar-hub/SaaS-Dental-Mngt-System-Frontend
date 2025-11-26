"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "./sidebar"
import { Toaster } from "@/components/ui/toaster"
import api from "@/lib/axiosConfig"

interface User {
  name: string
  role: string
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getProfile = async () => {
      // Check if user is logged in (token exists in localStorage)
      const token = localStorage.getItem('token') || localStorage.getItem('authToken')
      if (!token) {
        router.push("/")
        setLoading(false)
        return
      }

      // Get user from localStorage (set during login)
      const userStr = localStorage.getItem('user')
      const userType = localStorage.getItem('userType')
      
      if (userStr) {
        try {
          const userData = JSON.parse(userStr)
          
          // Determine role: super admin uses 'type', regular users use 'role' from currentClinic
          let role = 'user'
          if (userType === 'super_admin' || userData.type === 'super_admin') {
            role = 'super_admin'
          } else if (userData.currentClinic?.role) {
            role = userData.currentClinic.role
          } else if (userData.role) {
            role = userData.role
          }
          
          // Fetch profile from Express backend to get latest role (only for regular users)
          if (role !== 'super_admin') {
            try {
              const response = await api.get('/profiles/me')
              if (response.data.success && response.data.profile) {
                const profile = response.data.profile
                setUser({ 
                  name: profile.full_name || userData.fullName || userData.email || userData.name || 'User', 
                  role: profile.role || role
                })
                setLoading(false)
                return
              }
            } catch (error) {
              // Fallback to localStorage user data if API call fails
            }
          }
          
          // Set user from localStorage data
          setUser({ 
            name: userData.fullName || userData.full_name || userData.name || userData.email || 'User', 
            role: role
          })
        } catch (error) {
          console.error('Error parsing user data:', error)
          router.push("/")
          setLoading(false)
          return
        }
      } else {
        router.push("/")
        setLoading(false)
        return
      }
      setLoading(false)
    }
    getProfile()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar/Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b-2 border-gray-200 shadow-sm z-10">
          <div className="h-full flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              {/* Breadcrumb or page title can go here */}
            </div>
            <div className="flex items-center gap-4">
              {/* Additional header actions can go here */}
            </div>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
