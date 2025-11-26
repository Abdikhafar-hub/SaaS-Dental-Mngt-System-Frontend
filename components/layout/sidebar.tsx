"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import {
  Users,
  Calendar,
  Clock,
  FileText,
  Receipt,
  Package,
  MessageSquare,
  BarChart3,
  DollarSign,
  SmileIcon as Tooth,
  LogOut,
  Home,
  Settings,
  Bell,
  User,
  Activity,
  Database,
  CreditCard,
  TrendingUp,
  Shield,
  Building2,
  Mail,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import api from "@/lib/axiosConfig"

interface UserProfile {
  name: string
  role: string
}

const roleMenus = {
  super_admin: [
    { icon: Home, label: "Dashboard", href: "/super-admin/dashboard", color: "text-blue-600" },
    { icon: Building2, label: "Clinics", href: "/super-admin/clinics", color: "text-indigo-600" },
    { icon: CreditCard, label: "Billing", href: "/super-admin/billing", color: "text-emerald-600" },
    { icon: Bell, label: "Notifications", href: "/super-admin/notifications", color: "text-amber-600" },
    { icon: MessageCircle, label: "Messages", href: "/super-admin/messages", color: "text-violet-600" },
    { icon: Settings, label: "Settings", href: "/super-admin/settings", color: "text-gray-600" },
  ],
  admin: [
    { icon: Home, label: "Dashboard", href: "/admin/dashboard", color: "text-blue-600" },
    { icon: Users, label: "Patients", href: "/admin/patients", color: "text-green-600" },
    { icon: Calendar, label: "Appointments", href: "/admin/appointments", color: "text-purple-600" },
    { icon: Clock, label: "Queue", href: "/admin/queue", color: "text-orange-600" },
    { icon: FileText, label: "Visit Records", href: "/admin/visits", color: "text-indigo-600" },
    { icon: Tooth, label: "Dental Charting", href: "/admin/dental-charting", color: "text-pink-600" },
    { icon: Receipt, label: "Invoices", href: "/admin/invoices", color: "text-emerald-600" },
    { icon: Package, label: "Inventory", href: "/admin/inventory", color: "text-cyan-600" },
    { icon: MessageSquare, label: "SMS Center", href: "/admin/sms", color: "text-violet-600" },
    { icon: BarChart3, label: "Reports", href: "/admin/reports", color: "text-amber-600" },
    { icon: DollarSign, label: "Finances", href: "/admin/finances", color: "text-teal-600" },
  ],
  dentist: [
    { icon: Home, label: "Dashboard", href: "/dentist/dashboard", color: "text-blue-600" },
    { icon: Calendar, label: "My Appointments", href: "/dentist/appointments", color: "text-purple-600" },
    { icon: Clock, label: "Queue", href: "/dentist/queue", color: "text-orange-600" },
    { icon: FileText, label: "Visit Records", href: "/dentist/visits", color: "text-indigo-600" },
    { icon: Users, label: "Patient History", href: "/dentist/patients", color: "text-green-600" },
  ],
  receptionist: [
    { icon: Home, label: "Dashboard", href: "/receptionist/dashboard", color: "text-blue-600" },
    { icon: Users, label: "Patients", href: "/receptionist/patients", color: "text-green-600" },
    { icon: Calendar, label: "Appointments", href: "/receptionist/appointments", color: "text-purple-600" },
    { icon: Clock, label: "Queue", href: "/receptionist/queue", color: "text-orange-600" },
    { icon: MessageSquare, label: "SMS", href: "/receptionist/sms", color: "text-violet-600" },
  ],
}

export default function Sidebar() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const getProfile = async () => {
      // Check if user is logged in (token exists in localStorage)
      const token = localStorage.getItem('token') || localStorage.getItem('authToken')
      if (!token) return

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
        }
      }
    }
    getProfile()
  }, [])

  const handleLogout = async () => {
    try {
      // Call Express backend logout endpoint (optional - clears server-side session)
      await api.post('/auth/logout').catch(() => {
        // Ignore errors - we'll clear client-side anyway
      })
    } catch (error) {
      // Ignore errors
    } finally {
      // Clear client-side auth data
      localStorage.removeItem('token')
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('clinicId')
      localStorage.removeItem('organizationId')
      router.push("/")
    }
  }

  if (!user) return null

  const menuItems = roleMenus[user?.role as keyof typeof roleMenus] || []

  return (
    <div className="flex h-screen w-72 flex-col bg-gradient-to-b from-white via-white to-gray-50/50 border-r-2 border-gray-200 shadow-2xl backdrop-blur-sm">
      {/* Header with Logo */}
      <div className="flex items-center gap-4 p-6 border-b-2 border-gray-200 bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-purple-50/80 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-3 rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105">
          <Image 
            src="https://res.cloudinary.com/ddkkfumkl/image/upload/v1750490845/20230208_dental-removebg-preview_uapb8o.png"
            alt="Coco Dental Logo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
          />
        </div>
        <div>
          <h1 className="font-bold text-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Coco Dental Clinic
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]" 
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 hover:scale-[1.01] hover:shadow-md hover:border hover:border-gray-200/50"
                )}
              >
                {/* Background gradient for active state */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
                )}
                
                {/* Hover gradient overlay */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
                
                {/* Icon */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-white/20 text-white shadow-inner" 
                    : `${item.color} bg-gray-100/80 group-hover:bg-gray-200/80 group-hover:scale-110`
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                
                {/* Label */}
                <span className={cn(
                  "relative z-10 font-semibold transition-colors duration-300",
                  isActive ? "text-white" : "text-gray-700 group-hover:text-gray-900"
                )}>
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-lg" />
                )}
                
                {/* Hover arrow indicator */}
                {!isActive && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t-2 border-gray-200 bg-gradient-to-br from-gray-50/80 via-blue-50/50 to-indigo-50/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/80 backdrop-blur-sm shadow-md border-2 border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300">
          <Avatar className="h-11 w-11 border-2 border-blue-200/80 shadow-md">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white font-bold text-sm shadow-lg">
              {user.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900 truncate">
              {user.name || "User"}
            </p>
            <p className="text-xs text-gray-600 capitalize font-semibold">
              {user?.role || "User"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50/80 rounded-lg transition-all duration-300 hover:scale-110 hover:shadow-md"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
