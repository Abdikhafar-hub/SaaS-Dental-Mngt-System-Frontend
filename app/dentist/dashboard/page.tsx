"use client"

import { useState, useEffect } from "react"
import api from "@/lib/axiosConfig"

// Force dynamic rendering to avoid build-time environment variable issues
export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  TrendingUp, 
  Activity,
  Play,
  Bell,
  ArrowRight,
  Stethoscope,
  Award,
  Zap
} from "lucide-react"


interface Appointment {
  id: string
  time: string
  patient: string
  type: string
  status: string
  duration: string
  avatar: string | undefined
  patientId: string
  date: string // Added date to the interface
}

interface Notification {
  message: string
  time: string
  type: string
}

interface DashboardData {
  todayAppointments: Appointment[]
  notifications: Notification[]
  quickStats: {
    todayAppointments: number
    completed: number
    remaining: number
    totalPatients: number
  }
  performance: {
    satisfaction: number
    weeklyPatients: number
    monthlyGoal: number
  }
}

// Add interface for the raw appointment data from Express backend
interface RawAppointment {
  id: string
  time: string | null
  treatment: string | null
  status: string | null
  patient_id: string | null
  date: string | null
  patients?: {
    id: string
    first_name: string
    last_name: string
    phone: string
    email: string
  } | null
}

export default function DentistDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    todayAppointments: [],
    notifications: [],
    quickStats: {
      todayAppointments: 0,
      completed: 0,
      remaining: 0,
      totalPatients: 0
    },
    performance: {
      satisfaction: 0,
      weeklyPatients: 0,
      monthlyGoal: 0
    }
  })

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        console.log('=== STARTING DASHBOARD DATA FETCH ===')
        
        // Fetch appointments from Express backend
        const appointmentsResponse = await api.get('/appointments', {
          params: { page: 1, pageSize: 10, viewAll: true }
        })
        const appointmentsData = appointmentsResponse.data.success ? appointmentsResponse.data.appointments : []

        console.log('RAW APPOINTMENTS DATA:', appointmentsData)

        // Fetch patients from Express backend
        let patientsData: any[] = []
        try {
          const patientsResponse = await api.get('/patients', {
            params: { page: 1, pageSize: 1000 }
          })
          patientsData = patientsResponse.data.success ? patientsResponse.data.patients : []
          
          console.log('RAW PATIENTS DATA:', patientsData)
          console.log('PATIENTS COUNT:', patientsData.length)
        } catch (error) {
          console.error('Error fetching patients:', error)
        }

        // Transform appointments data with real patient names
        const transformedAppointments = appointmentsData?.map((apt: any) => ({
          id: apt.id,
          time: apt.time || '00:00',
          patient: apt.patient ? `${apt.patient.firstName || apt.patient.first_name} ${apt.patient.lastName || apt.patient.last_name}` : `Patient ${apt.id.slice(0, 8)}`,
          type: apt.treatment || 'Checkup',
          status: apt.status || 'scheduled',
          duration: '30 min',
          avatar: undefined,
          patientId: apt.patientId || apt.patient_id || apt.id,
          date: apt.date || '2024-01-01'
        })) || []

        console.log('TRANSFORMED APPOINTMENTS:', transformedAppointments)

        // Calculate stats
        const today = new Date().toISOString().split('T')[0]
        const totalAppointments = transformedAppointments.length
        const todayAppointments = transformedAppointments.filter((apt: Appointment) => apt.date === today).length
        const todayCompleted = transformedAppointments.filter((apt: Appointment) => apt.date === today && apt.status === 'completed').length
        const todayRemaining = todayAppointments - todayCompleted
        const totalPatients = patientsData?.length || 0

        console.log('CALCULATED STATS:', { 
          totalAppointments, 
          todayAppointments, 
          todayCompleted, 
          todayRemaining, 
          totalPatients,
          today 
        })

        const newDashboardData = {
          todayAppointments: transformedAppointments,
          notifications: [{
            message: `Found ${totalAppointments} total appointments, ${todayAppointments} for today`,
            time: new Date().toLocaleTimeString(),
            type: 'info'
          }],
          quickStats: {
            todayAppointments: todayAppointments, // TODAY's appointments
            completed: todayCompleted, // TODAY's completed
            remaining: todayRemaining, // TODAY's remaining
            totalPatients
          },
          performance: {
            satisfaction: 95,
            weeklyPatients: totalPatients,
            monthlyGoal: 85
          }
        }

        console.log('FINAL DASHBOARD DATA:', newDashboardData)
        setDashboardData(newDashboardData)

      } catch (error) {
        console.error('ERROR IN DASHBOARD FETCH:', error)
        setDashboardData({
          todayAppointments: [],
          notifications: [{
            message: `Error: ${error}`,
            time: new Date().toLocaleTimeString(),
            type: 'warning'
          }],
          quickStats: {
            todayAppointments: 0,
            completed: 0,
            remaining: 0,
            totalPatients: 0
          },
          performance: {
            satisfaction: 0,
            weeklyPatients: 0,
            monthlyGoal: 0
          }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border border-blue-200"
      case "waiting":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200"
      case "scheduled":
        return "bg-gray-100 text-gray-800 border border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "in-progress":
        return <Play className="h-4 w-4" />
      case "waiting":
        return <Clock className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  // Handle appointment status updates
  const handleUpdateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}`, {
        action: 'update',
        appointmentData: { status: newStatus }
      })

      if (!response.data.success) {
        console.error('Error updating appointment status:', response.data.error)
        return
      }

      // Update local state
      setDashboardData(prev => ({
        ...prev,
        todayAppointments: prev.todayAppointments.map(apt => 
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        ),
        quickStats: {
          ...prev.quickStats,
          completed: newStatus === 'completed' 
            ? prev.quickStats.completed + 1 
            : prev.quickStats.completed,
          remaining: newStatus === 'completed' 
            ? prev.quickStats.remaining - 1 
            : prev.quickStats.remaining
        }
      }))
    } catch (error) {
      console.error('Error updating appointment status:', error)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  const quickStats = [
    { 
      label: "Today's Appointments", 
      value: dashboardData.quickStats.todayAppointments.toString(), 
      icon: Calendar, 
      change: "+2", 
      color: "text-blue-600",
      bgColor: "from-blue-50 to-indigo-50"
    },
    { 
      label: "Today's Completed", 
      value: dashboardData.quickStats.completed.toString(), 
      icon: CheckCircle, 
      change: "+1", 
      color: "text-green-600",
      bgColor: "from-green-50 to-emerald-50"
    },
    { 
      label: "Today's Remaining", 
      value: dashboardData.quickStats.remaining.toString(), 
      icon: Clock, 
      change: "+1", 
      color: "text-orange-600",
      bgColor: "from-orange-50 to-amber-50"
    },
    { 
      label: "Total Patients", 
      value: dashboardData.quickStats.totalPatients.toString(), 
      icon: Users, 
      change: "+12", 
      color: "text-purple-600",
      bgColor: "from-purple-50 to-violet-50"
    },
  ]

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-1">
                  Dentist Dashboard
                </h1>
                <p className="text-gray-600 text-sm">Good morning! Here's your schedule for today.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3 text-green-500" />
                <span className="font-medium">Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
              
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {quickStats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="rounded-xl border-0 shadow-md hover:shadow-lg bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-green-600 bg-green-50">
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bgColor} shadow-sm`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Today's Appointments */}
            <div className="lg:col-span-2">
              <Card className="rounded-xl border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    All Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {dashboardData.todayAppointments.map((appointment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all duration-300 bg-white/50 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="font-bold text-sm text-gray-900">{appointment.time}</p>
                            <p className="text-xs text-gray-600 font-medium">{appointment.duration}</p>
                            <p className="text-xs text-gray-500 font-medium">
                              {new Date(appointment.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <Avatar className="h-10 w-10 border-2 border-gray-100 shadow-sm">
                            <AvatarImage src={appointment.avatar} alt={appointment.patient} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm">
                              {appointment.patient.split(" ").map((n: string) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <h3 className="font-bold text-base text-gray-900">{appointment.patient}</h3>
                            <p className="text-gray-600 text-sm">{appointment.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(appointment.status)} px-3 py-1 rounded-full text-xs font-medium`}>
                            {getStatusIcon(appointment.status)}
                            <span className="ml-1">{appointment.status.replace("-", " ")}</span>
                          </Badge>
                          {appointment.status === "waiting" && (
                            <Button 
                              size="sm" 
                              className="h-8 px-4 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-sm hover:shadow-md transition-all duration-300 text-xs"
                              onClick={() => handleUpdateAppointmentStatus(appointment.id, 'in-progress')}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                          )}
                          {appointment.status === "in-progress" && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 px-4 rounded-lg border border-green-400 hover:border-green-500 hover:bg-green-50 transition-all duration-200 text-xs"
                              onClick={() => handleUpdateAppointmentStatus(appointment.id, 'completed')}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notifications & Quick Actions */}
            <div className="space-y-4">
              {/* Notifications */}
              <Card className="rounded-xl border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    <Bell className="h-5 w-5 text-orange-600" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {dashboardData.notifications.map((notification, index) => (
                      <div key={index} className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-all duration-200">
                        <div className="flex items-start gap-2">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-900">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="rounded-xl border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    <Zap className="h-5 w-5 text-purple-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <Button 
                    className="w-full justify-start h-10 px-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 bg-white/80 backdrop-blur-sm text-xs" 
                    variant="outline"
                    onClick={() => router.push('/dentist/patients')}
                  >
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    Add Visit Record
                    <ArrowRight className="h-3 w-3 ml-auto" />
                  </Button>
                  <Button 
                    className="w-full justify-start h-10 px-4 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all duration-200 bg-white/80 backdrop-blur-sm text-xs" 
                    variant="outline"
                    onClick={() => router.push('/dentist/patients')}
                  >
                    <Users className="h-4 w-4 mr-2 text-green-600" />
                    View Patient History
                    <ArrowRight className="h-3 w-3 ml-auto" />
                  </Button>
                  <Button 
                    className="w-full justify-start h-10 px-4 rounded-lg border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 bg-white/80 backdrop-blur-sm text-xs" 
                    variant="outline"
                    onClick={() => router.push('/dentist/queue')}
                  >
                    <Clock className="h-4 w-4 mr-2 text-orange-600" />
                    Check Queue
                    <ArrowRight className="h-3 w-3 ml-auto" />
                  </Button>
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card className="rounded-xl border-0 shadow-md bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                <CardHeader className="pb-3 border-b border-white/20">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Award className="h-5 w-5 text-yellow-300" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                      <p className="text-2xl font-bold text-white">{dashboardData.performance.satisfaction}%</p>
                      <p className="text-xs text-blue-100">Patient Satisfaction</p>
                    </div>
                    <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                      <p className="text-2xl font-bold text-white">{dashboardData.performance.weeklyPatients}</p>
                      <p className="text-xs text-blue-100">This Week</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-blue-100">Monthly Goal</span>
                      <span className="text-xs font-bold text-white">{dashboardData.performance.monthlyGoal}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-emerald-400 h-1.5 rounded-full" 
                        style={{ width: `${dashboardData.performance.monthlyGoal}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
