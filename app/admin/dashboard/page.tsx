"use client"

import { useState, useEffect } from "react"
import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Users,
  Calendar,
  DollarSign,
  UserCheck,
  TrendingUp,
  Clock,
  Plus,
  CalendarPlus,
  Receipt,
  Bell,
  BarChart3,
  Activity,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import api from "@/lib/axiosConfig"
import dayjs from 'dayjs'

// Force dynamic rendering to avoid build-time environment variable issues
export const dynamic = 'force-dynamic'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any[]>([])
  const [incomeExpensesData, setIncomeExpensesData] = useState<any[]>([])
  const [patientVisitsData, setPatientVisitsData] = useState<any[]>([])
  const [appointmentForecastData, setAppointmentForecastData] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      
      try {
        // Fetch patients using the API endpoint
        const patientsResponse = await api.get('/patients', {
          params: { page: 1, pageSize: 1000 }
        })
        const patients = patientsResponse.data.success ? patientsResponse.data.patients : []

        // Fetch appointments using the API endpoint
        const appointmentsResponse = await api.get('/appointments', {
          params: { page: 1, pageSize: 10000, viewAll: true }
        })
        const appointmentsData = appointmentsResponse.data
        let appointmentsWithPatients = appointmentsData.success ? appointmentsData.appointments : []

        console.log('Appointments API response:', appointmentsData)
        console.log('Appointments fetched:', appointmentsWithPatients?.length || 0)

        // Fetch other data from Express backend
        const [
          incomeResponse,
          expensesResponse,
          profilesResponse,
          visitsResponse,
          invoicesResponse
        ] = await Promise.all([
          api.get('/finances/income', { params: { page: 1, pageSize: 10000 } }).catch(() => ({ data: { transactions: [] } })),
          api.get('/finances/expenses', { params: { page: 1, pageSize: 10000 } }).catch(() => ({ data: { transactions: [] } })),
          api.get('/profiles', { params: { role: 'dentist' } }).catch(() => ({ data: { profiles: [] } })),
          api.get('/visits', { params: { page: 1, pageSize: 10000 } }).catch(() => ({ data: { visits: [] } })),
          api.get('/invoices', { params: { page: 1, pageSize: 10000 } }).catch(() => ({ data: { invoices: [] } }))
        ])

        const incomeTransactions = incomeResponse.data.transactions || []
        const expenseTransactions = expensesResponse.data.transactions || []
        const profiles = profilesResponse.data.profiles || []
        const visits = visitsResponse.data.visits || []
        const invoices = invoicesResponse.data.invoices || []

        console.log('Dashboard data fetched:', {
          patients: patients?.length || 0,
          appointments: appointmentsWithPatients?.length || 0,
          incomeTransactions: incomeTransactions?.length || 0,
          expenseTransactions: expenseTransactions?.length || 0
        })

        // Debug: Log some appointment data
        if (appointmentsWithPatients && appointmentsWithPatients.length > 0) {
          console.log('Sample appointments:', appointmentsWithPatients.slice(0, 3))
          console.log('Appointments with dates:', appointmentsWithPatients.map(apt => ({
            id: apt.id,
            date: apt.date,
            time: apt.time,
            status: apt.status,
            patient: apt.patient?.first_name ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'Unknown'
          })))
        }

        // Calculate today's data
        const today = dayjs().format('YYYY-MM-DD')
        const todayAppointments = appointmentsWithPatients?.filter(apt => apt.date === today) || []
        const todayIncome = incomeTransactions?.filter(inc => inc.date === today) || []
        const todayExpenses = expenseTransactions?.filter(exp => exp.date === today) || []
        const todayRevenue = todayIncome.reduce((sum, inc) => sum + Number(inc.amount), 0)
        const todayExpensesTotal = todayExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
        const todayProfit = todayRevenue - todayExpensesTotal

        // Calculate stats with percentage changes
        const lastMonth = dayjs().subtract(1, 'month')
        const lastMonthAppointments = appointmentsWithPatients?.filter(apt => 
          dayjs(apt.date).isSame(lastMonth, 'month')
        ) || []
        const lastMonthRevenue = incomeTransactions?.filter(inc => 
          dayjs(inc.date).isSame(lastMonth, 'month')
        ).reduce((sum, inc) => sum + Number(inc.amount), 0) || 0

        const currentMonthRevenue = incomeTransactions?.filter(inc => 
          dayjs(inc.date).isSame(dayjs(), 'month')
        ).reduce((sum, inc) => sum + Number(inc.amount), 0) || 0

        const revenueChange = lastMonthRevenue === 0 ? 0 : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100

        // Calculate patient growth
        const lastMonthPatients = patients?.filter(patient => 
          dayjs(patient.created_at).isSame(lastMonth, 'month')
        ).length || 0
        const currentMonthPatients = patients?.filter(patient => 
          dayjs(patient.created_at).isSame(dayjs(), 'month')
        ).length || 0
        const patientChange = lastMonthPatients === 0 ? 0 : ((currentMonthPatients - lastMonthPatients) / lastMonthPatients) * 100

        // Calculate appointment growth
        const lastMonthAppointmentCount = lastMonthAppointments.length
        const currentMonthAppointments = appointmentsWithPatients?.filter(apt => 
          dayjs(apt.date).isSame(dayjs(), 'month')
        ) || []
        const currentMonthAppointmentCount = currentMonthAppointments.length
        const appointmentChange = lastMonthAppointmentCount === 0 ? 0 : ((currentMonthAppointmentCount - lastMonthAppointmentCount) / lastMonthAppointmentCount) * 100

        // Calculate today vs yesterday appointments
        const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
        const yesterdayAppointments = appointmentsWithPatients?.filter(apt => apt.date === yesterday) || []
        const todayVsYesterdayChange = yesterdayAppointments.length === 0 ? 0 : ((todayAppointments.length - yesterdayAppointments.length) / yesterdayAppointments.length) * 100

        // Calculate yesterday's financial data for comparison
        const yesterdayIncome = incomeTransactions?.filter(inc => inc.date === yesterday) || []
        const yesterdayExpenses = expenseTransactions?.filter(exp => exp.date === yesterday) || []
        const yesterdayRevenue = yesterdayIncome.reduce((sum, inc) => sum + Number(inc.amount), 0)
        const yesterdayExpensesTotal = yesterdayExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
        const yesterdayProfit = yesterdayRevenue - yesterdayExpensesTotal

        // Calculate percentage changes for today's financial metrics
        const todayVsYesterdayRevenueChange = yesterdayRevenue === 0 ? 0 : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
        const todayVsYesterdayExpensesChange = yesterdayExpensesTotal === 0 ? 0 : ((todayExpensesTotal - yesterdayExpensesTotal) / yesterdayExpensesTotal) * 100
        const todayVsYesterdayProfitChange = yesterdayProfit === 0 ? 0 : ((todayProfit - yesterdayProfit) / yesterdayProfit) * 100

        // Set dynamic stats
        setStats([
          {
            title: "Total Patients",
            value: (patients?.length || 0).toLocaleString(),
            change: `${patientChange >= 0 ? '+' : ''}${patientChange.toFixed(1)}%`,
            icon: Users,
            iconColor: "text-blue-600",
            iconBg: "bg-blue-50",
            changeColor: patientChange >= 0 ? "text-green-600" : "text-red-600",
            changeBg: patientChange >= 0 ? "bg-green-50" : "bg-red-50",
          },
          {
            title: "Appointments Today",
            value: (todayAppointments?.length || 0).toString(),
            change: `${todayVsYesterdayChange >= 0 ? '+' : ''}${todayVsYesterdayChange.toFixed(1)}%`,
            icon: Calendar,
            iconColor: "text-green-600",
            iconBg: "bg-green-50",
            changeColor: todayVsYesterdayChange >= 0 ? "text-green-600" : "text-red-600",
            changeBg: todayVsYesterdayChange >= 0 ? "bg-green-50" : "bg-red-50",
          },
          {
            title: "Revenue Today",
            value: `KES ${(todayRevenue || 0).toLocaleString()}`,
            change: `${todayVsYesterdayRevenueChange >= 0 ? '+' : ''}${todayVsYesterdayRevenueChange.toFixed(1)}%`,
            icon: DollarSign,
            iconColor: "text-purple-600",
            iconBg: "bg-purple-50",
            changeColor: todayVsYesterdayRevenueChange >= 0 ? "text-green-600" : "text-red-600",
            changeBg: todayVsYesterdayRevenueChange >= 0 ? "bg-green-50" : "bg-red-50",
          },
          {
            title: "Today's Expenses",
            value: `KES ${(todayExpensesTotal || 0).toLocaleString()}`,
            change: `${todayVsYesterdayExpensesChange >= 0 ? '+' : ''}${todayVsYesterdayExpensesChange.toFixed(1)}%`,
            icon: Receipt,
            iconColor: "text-red-600",
            iconBg: "bg-red-50",
            changeColor: todayVsYesterdayExpensesChange >= 0 ? "text-green-600" : "text-red-600",
            changeBg: todayVsYesterdayExpensesChange >= 0 ? "bg-green-50" : "bg-red-50",
          },
          {
            title: "Today's Profit",
            value: `KES ${(todayProfit || 0).toLocaleString()}`,
            change: `${todayVsYesterdayProfitChange >= 0 ? '+' : ''}${todayVsYesterdayProfitChange.toFixed(1)}%`,
            icon: TrendingUp,
            iconColor: "text-green-600",
            iconBg: "bg-green-50",
            changeColor: todayVsYesterdayProfitChange >= 0 ? "text-green-600" : "text-red-600",
            changeBg: todayVsYesterdayProfitChange >= 0 ? "bg-green-50" : "bg-red-50",
          },
          {
            title: "Active Dentists",
            value: (profiles?.length || 0).toString(),
            change: "0%", // Dentist count doesn't change frequently
            icon: UserCheck,
            iconColor: "text-orange-600",
            iconBg: "bg-orange-50",
            changeColor: "text-gray-500",
            changeBg: "bg-gray-50",
          },
        ])

        // Generate Income vs Expenses Data (last 12 months)
        const monthlyData = []
        for (let i = 11; i >= 0; i--) {
          const month = dayjs().subtract(i, 'month')
          const monthStr = month.format('MMM')
          
          const monthIncome = incomeTransactions?.filter(inc => 
            dayjs(inc.date).isSame(month, 'month')
          ).reduce((sum, inc) => sum + Number(inc.amount), 0) || 0
          
          const monthExpenses = expenseTransactions?.filter(exp => 
            dayjs(exp.date).isSame(month, 'month')
          ).reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
          
          monthlyData.push({
            month: monthStr,
            income: monthIncome,
            expenses: monthExpenses
          })
        }
        setIncomeExpensesData(monthlyData)

        // Generate Patient Visits Data
        const visitsData = []
        for (let i = 11; i >= 0; i--) {
          const month = dayjs().subtract(i, 'month')
          const monthStr = month.format('MMM')
          
          const monthVisits = visits?.filter(visit => 
            dayjs(visit.date).isSame(month, 'month')
          ).length || 0
          
          const monthNewPatients = patients?.filter(patient => 
            dayjs(patient.created_at).isSame(month, 'month')
          ).length || 0
          
          visitsData.push({
            month: monthStr,
            visits: monthVisits,
            newPatients: monthNewPatients
          })
        }
        setPatientVisitsData(visitsData)

        // Generate Appointment Forecast (next 7 days)
        const forecastData = []
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        
        console.log('Generating appointment forecast...')
        console.log('Total appointments available:', appointmentsWithPatients?.length || 0)
        
        // Debug: Log all appointment dates to see what we have
        if (appointmentsWithPatients && appointmentsWithPatients.length > 0) {
          console.log('All appointment dates:', appointmentsWithPatients.map(apt => ({
            id: apt.id,
            date: apt.date,
            time: apt.time,
            status: apt.status,
            patient: apt.patient?.first_name ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'Unknown'
          })))
        }
        
        for (let i = 0; i < 7; i++) {
          const date = dayjs().add(i, 'day')
          const dayStr = days[date.day()]
          const dateStr = date.format('YYYY-MM-DD')
          
          const dayAppointments = appointmentsWithPatients?.filter(apt => apt.date === dateStr) || []
          
          console.log(`Day ${i + 1} (${dateStr}): ${dayAppointments.length} appointments`)
          
          // Calculate time slot distribution based on actual appointment times
          let morning = 0
          let afternoon = 0
          let evening = 0
          
          dayAppointments.forEach(apt => {
            const time = apt.time || '12:00'
            const hour = parseInt(time.split(':')[0])
            
            if (hour >= 9 && hour < 12) {
              morning++
            } else if (hour >= 12 && hour < 17) {
              afternoon++
            } else if (hour >= 17 && hour < 20) {
              evening++
            } else {
              // Default to afternoon for appointments without specific times
              afternoon++
            }
          })
          
          const dayData = {
            day: dayStr,
            morning,
            afternoon,
            evening,
            total: dayAppointments.length
          }
          
          console.log(`Day ${dayStr} data:`, dayData)
          forecastData.push(dayData)
        }
        
        console.log('Final forecast data:', forecastData)
        setAppointmentForecastData(forecastData)
        
        // Debug: Log the state after setting
        console.log('Appointment forecast data set:', forecastData)

        // Generate Recent Activities
        const activities: Array<{
          time: string;
          activity: string;
          type: string;
          dotColor: string;
        }> = []
        
        // Recent patient registrations - get the most recent patients
        const recentPatients = patients?.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 3) || []
        recentPatients.forEach(patient => {
          activities.push({
            time: dayjs(patient.created_at).format('h:mm A'),
            activity: `New patient registered: ${patient.first_name} ${patient.last_name}`,
            type: "patient",
            dotColor: "bg-blue-500",
          })
        })

        // Recent appointments - get the most recent appointments (only if appointments exist)
        if (appointmentsWithPatients && appointmentsWithPatients.length > 0) {
          const recentAppointments = appointmentsWithPatients?.sort((a, b) => 
            new Date(b.inserted_at || b.created_at).getTime() - new Date(a.inserted_at || a.created_at).getTime()
          ).slice(0, 3) || []
          recentAppointments.forEach(apt => {
            activities.push({
              time: dayjs(apt.inserted_at || apt.created_at).format('h:mm A'),
              activity: `Appointment ${apt.status}: ${apt.patient?.first_name} ${apt.patient?.last_name || 'Unknown'}`,
              type: "appointment",
              dotColor: "bg-gray-500",
            })
          })
        }

        // Recent payments - get the most recent payments
        const recentPayments = incomeTransactions?.sort((a, b) => 
          new Date(b.inserted_at || b.created_at).getTime() - new Date(a.inserted_at || a.created_at).getTime()
        ).slice(0, 2) || []
        recentPayments.forEach(payment => {
          activities.push({
            time: dayjs(payment.inserted_at || payment.created_at).format('h:mm A'),
            activity: `Payment received: KES ${Number(payment.amount).toLocaleString()} from ${payment.patient || 'Unknown'}`,
            type: "payment",
            dotColor: "bg-green-500",
          })
        })

        // Sort by time and take latest 5
        activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        setRecentActivities(activities.slice(0, 5))

        // Generate Upcoming Appointments
        const upcoming = appointmentsWithPatients?.filter(apt => 
          apt.date >= today && (apt.status === 'confirmed' || apt.status === 'pending')
        ).sort((a, b) => {
          // Sort by date first, then by time
          const dateA = new Date(`${a.date} ${a.time || '00:00'}`)
          const dateB = new Date(`${b.date} ${b.time || '00:00'}`)
          return dateA.getTime() - dateB.getTime()
        }).slice(0, 6) || []
        
        const upcomingFormatted = upcoming.map(apt => ({
          time: apt.time || '00:00',
          patient: apt.patient?.first_name && apt.patient?.last_name 
            ? `${apt.patient.first_name} ${apt.patient.last_name}` 
            : 'Unknown Patient',
          dentist: apt.dentist_name ?? 'Unknown',
          treatment: apt.treatment ?? 'Checkup',
          status: apt.status || 'pending'
        }))
        setUpcomingAppointments(upcomingFormatted)

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()

    // TODO: Implement real-time updates with WebSocket or polling if needed
    // For now, data is fetched on component mount and can be refreshed manually
  }, [])

  const formatTime = (time: string) => {
    if (!time) return 'Unknown'
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="p-6 space-y-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading dashboard data...</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 text-lg">Comprehensive insights into your dental clinic's performance</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card
                  key={stat.title}
                  className="rounded-2xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{stat.title}</p>
                        <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span
                            className={`text-xs font-semibold px-1 py-0.5 rounded-full ${stat.changeColor} ${stat.changeBg}`}
                          >
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <div className={`p-2 rounded-xl ${stat.iconBg} shadow-sm`}>
                        <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Main Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            {/* Income vs Expenses Bar Chart */}
            <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-green-600 to-red-600 bg-clip-text text-transparent">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                  Income vs Expenses (KES)
                </CardTitle>
                <p className="text-sm text-gray-600">Monthly financial comparison</p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    income: {
                      label: "Income",
                      color: "#10B981",
                    },
                    expenses: {
                      label: "Expenses",
                      color: "#EF4444",
                    },
                  }}
                  className="h-[350px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeExpensesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" tickFormatter={(value) => `${value / 1000}K`} />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value, name) => [
                          `KES ${value.toLocaleString()}`,
                          name === "income" ? "Income" : "Expenses",
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name="Income" />
                      <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Patient Visits Line Chart */}
            <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  <Activity className="h-6 w-6 text-blue-600" />
                  Patient Visits Over Time
                </CardTitle>
                <p className="text-sm text-gray-600">Monthly visit trends and new patient acquisition</p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    visits: {
                      label: "Total Visits",
                      color: "#3B82F6",
                    },
                    newPatients: {
                      label: "New Patients",
                      color: "#8B5CF6",
                    },
                  }}
                  className="h-[350px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={patientVisitsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value, name) => [`${value}`, name === "visits" ? "Total Visits" : "New Patients"]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="visits"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: "#3B82F6", strokeWidth: 2, r: 6 }}
                        name="Total Visits"
                      />
                      <Line
                        type="monotone"
                        dataKey="newPatients"
                        stroke="#8B5CF6"
                        strokeWidth={3}
                        dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 6 }}
                        name="New Patients"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Appointment Forecast Chart */}
          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                <Calendar className="h-6 w-6 text-orange-600" />
                7-Day Appointment Forecast
              </CardTitle>
              <p className="text-sm text-gray-600">Upcoming week appointment distribution by time slots</p>
            </CardHeader>
            <CardContent>
              {appointmentForecastData.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 font-medium">No forecast data available</p>
                  <p className="text-sm text-gray-400 mt-1">Appointment forecast will appear when appointments are scheduled</p>
                </div>
              ) : (
                <ChartContainer
                  config={{
                    morning: {
                      label: "Morning (9AM-12PM)",
                      color: "#F59E0B",
                    },
                    afternoon: {
                      label: "Afternoon (12PM-5PM)",
                      color: "#3B82F6",
                    },
                    evening: {
                      label: "Evening (5PM-8PM)",
                      color: "#8B5CF6",
                    },
                  }}
                  className="h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appointmentForecastData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="day" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value, name) => [
                          `${value} appointments`,
                          name === "morning" ? "Morning" : name === "afternoon" ? "Afternoon" : "Evening",
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="morning" stackId="a" fill="#F59E0B" name="Morning (9AM-12PM)" radius={[0, 0, 0, 0]} />
                      <Bar
                        dataKey="afternoon"
                        stackId="a"
                        fill="#3B82F6"
                        name="Afternoon (12PM-5PM)"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar dataKey="evening" stackId="a" fill="#8B5CF6" name="Evening (5PM-8PM)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Activities */}
            <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-gray-200">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  <Clock className="h-6 w-6 text-gray-700" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-150 border border-transparent hover:border-gray-200"
                  >
                    <div className="flex-shrink-0 mt-2">
                      <div className={`w-3 h-3 rounded-full ${activity.dotColor}`} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium text-gray-900 leading-relaxed">{activity.activity}</p>
                      <p className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full w-fit">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-gray-200">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  <Calendar className="h-6 w-6 text-gray-700" />
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 font-medium">No upcoming appointments</p>
                    <p className="text-sm text-gray-400 mt-1">Appointments will appear here when scheduled</p>
                  </div>
                ) : (
                  upcomingAppointments.map((appointment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:from-gray-100 hover:to-blue-100 transition-all duration-150 border border-gray-200 hover:border-blue-300"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">{appointment.patient}</p>
                        <p className="text-sm text-gray-600">
                          {appointment.dentist} • {appointment.treatment}
                        </p>
                        <Badge 
                          variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}
                          className={`text-xs ${
                            appointment.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-white border-2 border-blue-200 text-blue-700 font-semibold px-3 py-1 rounded-full hover:bg-blue-50 hover:border-blue-300"
                      >
                        {formatTime(appointment.time)}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </MainLayout>
  )
}
