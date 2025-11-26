"use client"

import { useState, useEffect } from "react"
import api from "@/lib/axiosConfig"
import { useRouter } from "next/navigation"
import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Calendar, Clock, Users, Plus, Receipt, Phone, UserPlus, MessageSquare, TrendingUp, CheckCircle, ChevronDown, ChevronUp, Eye, MoreHorizontal } from "lucide-react"
import dayjs from 'dayjs'
import { useToast } from "@/hooks/use-toast"

// Force dynamic rendering to avoid build-time environment variable issues
export const dynamic = 'force-dynamic'

export default function ReceptionistDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
  const [currentQueue, setCurrentQueue] = useState<any[]>([])
  const [todayStats, setTodayStats] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  
  // UI State
  const [statsCollapsed, setStatsCollapsed] = useState(false)
  const [queueCollapsed, setQueueCollapsed] = useState(false)
  const [appointmentsCollapsed, setAppointmentsCollapsed] = useState(false)
  const [sortBy, setSortBy] = useState('number')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const navigateToPatients = () => router.push('/receptionist/patients')
  const navigateToAppointments = () => router.push('/receptionist/appointments')
  const navigateToQueue = () => router.push('/receptionist/queue')
  const navigateToInvoices = () => router.push('/receptionist/invoices')
  const navigateToSMS = () => {
    router.push('/receptionist/sms')
  }

  const handleSendUpdates = () => {
    navigateToSMS()
  }

  // Sort queue data
  const sortedQueue = [...currentQueue].sort((a, b) => {
    switch (sortBy) {
      case 'number':
        return sortOrder === 'asc' ? a.number - b.number : b.number - a.number
      case 'name':
        const nameA = `${a.patient?.first_name || ''} ${a.patient?.last_name || ''}`.toLowerCase()
        const nameB = `${b.patient?.first_name || ''} ${b.patient?.last_name || ''}`.toLowerCase()
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
      case 'doctor':
        const doctorA = a.assigned_dentist || 'Not assigned'
        const doctorB = b.assigned_dentist || 'Not assigned'
        return sortOrder === 'asc' ? doctorA.localeCompare(doctorB) : doctorB.localeCompare(doctorA)
      case 'time':
        const timeA = a.checked_in ? new Date(a.checked_in).getTime() : 0
        const timeB = b.checked_in ? new Date(b.checked_in).getTime() : 0
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
      default:
        return 0
    }
  })

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const SortableHeader = ({ column, children }: { column: string, children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortBy === column && (
          sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        )}
      </div>
    </TableHead>
  )

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setLoading(true)
    
    try {
      const today = new Date().toISOString().split('T')[0] // Use same format as appointments page
      
      // Fetch today's appointments using Express backend
      const appointmentsResponse = await api.get('/appointments', {
        params: { date: today, page: 1, pageSize: 1000 }
      })
      const appointments = appointmentsResponse.data.success ? appointmentsResponse.data.appointments : []

      console.log('Fetched appointments:', appointments)
      console.log('Today date:', today)
      console.log('Appointments count:', appointments?.length || 0)

      // Fetch current queue using Express backend
      const queueResponse = await api.get('/queue', {
        params: { page: 1, pageSize: 1000 }
      })
      const allQueueItems = queueResponse.data.success ? queueResponse.data.queue : []
      // Filter to only show active queue items (waiting, assigned, in-treatment)
      const queue = allQueueItems.filter((item: any) => ['waiting', 'assigned', 'in-treatment'].includes(item.status))

      // Fetch patients for quick actions using Express backend
      const patientsResponse = await api.get('/patients', {
        params: { page: 1, pageSize: 1000 }
      })
      const allPatients = patientsResponse.data.success ? patientsResponse.data.patients : []

      // Calculate statistics using Express backend
      const allTodayAppointmentsResponse = await api.get('/appointments', {
        params: { date: today, page: 1, pageSize: 10000, viewAll: true }
      })
      const allTodayAppointments = allTodayAppointmentsResponse.data.success ? allTodayAppointmentsResponse.data.appointments : []

      const allQueueResponse = await api.get('/queue', {
        params: { page: 1, pageSize: 10000 }
      })
      const allQueueStats = allQueueResponse.data.success ? allQueueResponse.data.queue : []
      // Filter queue items checked in today
      const todayQueue = allQueueStats.filter((item: any) => {
        if (!item.checked_in) return false
        const checkedInDate = new Date(item.checked_in).toISOString().split('T')[0]
        return checkedInDate === today
      })

      // Filter completed appointments from today's appointments
      const completedAppointments = allTodayAppointments.filter((appt: any) => appt.status === 'completed')

      // Calculate previous day for comparison
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      // Fetch yesterday's data for comparison using Express backend
      const yesterdayAppointmentsResponse = await api.get('/appointments', {
        params: { date: yesterdayStr, page: 1, pageSize: 10000, viewAll: true }
      })
      const yesterdayAppointments = yesterdayAppointmentsResponse.data.success ? yesterdayAppointmentsResponse.data.appointments : []

      const yesterdayQueueResponse = await api.get('/queue', {
        params: { page: 1, pageSize: 10000 }
      })
      const yesterdayQueue = yesterdayQueueResponse.data.success ? yesterdayQueueResponse.data.queue : []

      // Filter yesterday's completed appointments
      const yesterdayCompleted = yesterdayAppointments.filter((appt: any) => appt.status === 'completed')

      console.log('Stats calculation:', {
        today,
        yesterday: yesterdayStr,
        allTodayAppointments: allTodayAppointments?.length || 0,
        allQueueStats: allQueueStats?.length || 0,
        completedAppointments: completedAppointments?.length || 0,
        yesterdayAppointments: yesterdayAppointments?.length || 0,
        yesterdayQueue: yesterdayQueue?.length || 0,
        yesterdayCompleted: yesterdayCompleted?.length || 0
      })

      // Calculate current values
      const totalAppointments = allTodayAppointments?.length || 0
      const walkIns = todayQueue?.filter(q => q.status === 'waiting').length || 0
      const inQueue = queue?.length || 0
      const completed = completedAppointments?.length || 0

      // Calculate previous values
      const yesterdayTotalAppointments = yesterdayAppointments?.length || 0
      const yesterdayWalkIns = yesterdayQueue?.filter(q => q.status === 'waiting').length || 0
      const yesterdayInQueue = yesterdayQueue?.length || 0
      const yesterdayCompletedCount = yesterdayCompleted?.length || 0

      // Calculate percentage changes
      const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) {
          return current > 0 ? '+100%' : '0%'
        }
        const change = ((current - previous) / previous) * 100
        const sign = change >= 0 ? '+' : ''
        return `${sign}${Math.round(change)}%`
      }

      const getChangeColor = (current: number, previous: number) => {
        if (previous === 0) {
          return current > 0 ? 'text-green-600' : 'text-gray-600'
        }
        const change = current - previous
        return change >= 0 ? 'text-green-600' : 'text-red-600'
      }

      const getChangeIcon = (current: number, previous: number) => {
        if (previous === 0) {
          return current > 0 ? TrendingUp : 'text-gray-400'
        }
        const change = current - previous
        return change >= 0 ? TrendingUp : 'text-red-500'
      }

      // Calculate stats with dynamic changes
      const stats = [
        { 
          label: "Appointments", 
          value: totalAppointments.toString(), 
          icon: Calendar, 
          change: calculatePercentageChange(totalAppointments, yesterdayTotalAppointments),
          changeColor: getChangeColor(totalAppointments, yesterdayTotalAppointments),
          color: "text-blue-600" 
        },
        { 
          label: "Walk-ins", 
          value: walkIns.toString(), 
          icon: Users, 
          change: calculatePercentageChange(walkIns, yesterdayWalkIns),
          changeColor: getChangeColor(walkIns, yesterdayWalkIns),
          color: "text-green-600" 
        },
        { 
          label: "In Queue", 
          value: inQueue.toString(), 
          icon: Clock, 
          change: calculatePercentageChange(inQueue, yesterdayInQueue),
          changeColor: getChangeColor(inQueue, yesterdayInQueue),
          color: "text-orange-600" 
        },
        { 
          label: "Completed", 
          value: completed.toString(), 
          icon: Receipt, 
          change: calculatePercentageChange(completed, yesterdayCompletedCount),
          changeColor: getChangeColor(completed, yesterdayCompletedCount),
          color: "text-purple-600" 
        },
      ]

      setUpcomingAppointments(appointments || [])
      setCurrentQueue(queue || [])
      setTodayStats(stats)
      setPatients(allPatients || [])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const formatTime = (time: string) => {
    return dayjs(`2000-01-01 ${time}`).format('h:mm A')
  }

  const formatCheckedInTime = (timestamp: string) => {
    return dayjs(timestamp).format('h:mm A')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-treatment':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-treatment':
        return 'In Treatment'
      case 'assigned':
        return 'Assigned'
      default:
        return 'Waiting'
    }
  }

  const handleCheckIn = async (appointment: any) => {
    try {
      // Add patient to queue using Express backend
      const response = await api.post('/queue', {
        action: 'checkIn',
        queueData: {
          patient_id: appointment.patient_id,
          assigned_dentist: appointment.dentist_name,
          treatment: appointment.treatment
        }
      })

      if (!response.data.success) {
        console.error('Error adding patient to queue:', response.data.error)
        toast({
          title: 'Failed to check in patient',
          description: response.data.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Patient checked in successfully!',
          description: `Patient ${appointment.patient?.first_name} ${appointment.patient?.last_name} checked in.`,
        })
        
        // Refresh dashboard data
        fetchDashboardData()
      }
    } catch (error: any) {
      console.error('Error checking in patient:', error)
      toast({
        title: 'Failed to check in patient',
        description: error?.message || 'An error occurred',
        variant: 'destructive',
      })
    }
  }

  const handleCall = (appointment: any) => {
    const phone = appointment.patient?.phone
    if (phone) {
      window.open(`tel:${phone}`, '_self')
    } else {
      toast({
        title: 'No phone number available',
        description: 'No phone number available for this patient.',
      })
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="p-6 space-y-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading dashboard...</p>
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
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
              Reception Dashboard
            </h1>
            <p className="text-gray-600">Manage appointments, queue, and patient check-ins efficiently</p>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={navigateToPatients}
                className="h-10 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                New Patient
              </Button>
              <Button 
                onClick={navigateToAppointments}
                className="h-10 px-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
              <Button 
                onClick={navigateToQueue}
                className="h-10 px-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-lg shadow-lg"
              >
                <Clock className="h-4 w-4 mr-2" />
                Manage Queue
              </Button>
            </div>
          </div>

          {/* Compact Stats */}
          <Collapsible open={!statsCollapsed} onOpenChange={setStatsCollapsed}>
            <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50/50 transition-colors">
                  <CardTitle className="flex items-center justify-between text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Today's Statistics
                    </div>
                    {statsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {todayStats.map((stat) => {
                      const Icon = stat.icon
                      return (
                        <div key={stat.label} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <div className="flex items-center gap-1">
                              <TrendingUp className={`h-3 w-3 ${stat.changeColor}`} />
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stat.changeColor} ${stat.changeColor.includes('green') ? 'bg-green-50' : stat.changeColor.includes('red') ? 'bg-red-50' : 'bg-gray-50'}`}>
                                {stat.change}
                              </span>
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-white shadow-sm">
                            <Icon className={`h-6 w-6 ${stat.color}`} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Current Queue and Upcoming Appointments - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Current Queue - Compact Table */}
            <Collapsible open={!queueCollapsed} onOpenChange={setQueueCollapsed}>
              <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50/50 transition-colors">
                    <CardTitle className="flex items-center justify-between text-lg font-semibold">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        Current Queue ({currentQueue.length} patients)
                      </div>
                      {queueCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {currentQueue.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <SortableHeader column="number">#</SortableHeader>
                            <SortableHeader column="name">Patient</SortableHeader>
                            <SortableHeader column="doctor">Doctor</SortableHeader>
                            <SortableHeader column="time">Check-in Time</SortableHeader>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableHeader>
                          <TableBody>
                            {sortedQueue.map((patient) => (
                              <TableRow key={patient.id} className="hover:bg-gray-50/50">
                                <TableCell className="font-bold">
                                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm">
                                    {patient.number}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {patient.patient ? `${patient.patient.first_name} ${patient.patient.last_name}` : 'Unknown Patient'}
                                </TableCell>
                                <TableCell>{patient.assigned_dentist || 'Not assigned'}</TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {patient.checked_in ? formatCheckedInTime(patient.checked_in) : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <Badge className={`px-2 py-1 text-xs ${getStatusColor(patient.status)}`}>
                                    {getStatusText(patient.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                      <Phone className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No patients in queue</p>
                        <p className="text-sm text-gray-400">All clear for now!</p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Upcoming Appointments - Compact Table */}
            <Collapsible open={!appointmentsCollapsed} onOpenChange={setAppointmentsCollapsed}>
              <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50/50 transition-colors">
                    <CardTitle className="flex items-center justify-between text-lg font-semibold">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        Upcoming Appointments ({upcomingAppointments.length})
                      </div>
                      {appointmentsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {upcomingAppointments.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Doctor</TableHead>
                            <TableHead>Treatment</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableHeader>
                          <TableBody>
                            {upcomingAppointments.map((appointment) => (
                              <TableRow key={appointment.id} className="hover:bg-gray-50/50">
                                <TableCell className="text-sm text-gray-600">
                                  {dayjs(appointment.date).format('MMM DD')}
                                </TableCell>
                                <TableCell className="font-medium">
                                  <Badge variant="outline" className="text-xs">
                                    {formatTime(appointment.time)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : 'Unknown Patient'}
                                </TableCell>
                                <TableCell>{appointment.dentist_name}</TableCell>
                                <TableCell className="text-sm text-gray-600">{appointment.treatment}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button 
                                      onClick={() => handleCheckIn(appointment)}
                                      size="sm" 
                                      variant="outline" 
                                      className="h-8 px-2 text-xs border-green-200 hover:border-green-400 hover:bg-green-50"
                                    >
                                      Check In
                                    </Button>
                                    <Button 
                                      onClick={() => handleCall(appointment)}
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                                    >
                                      <Phone className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No upcoming appointments</p>
                        <p className="text-sm text-gray-400">All appointments completed for today!</p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Quick Actions - Compact */}
          <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Button 
                  onClick={navigateToPatients}
                  className="h-16 flex-col gap-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <UserPlus className="h-5 w-5" />
                  <span className="text-xs">Register Patient</span>
                </Button>
                <Button 
                  onClick={navigateToAppointments}
                  variant="outline" 
                  className="h-16 flex-col gap-2 bg-gradient-to-r from-gray-50 to-blue-50 hover:from-gray-100 hover:to-blue-100 border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 rounded-lg hover:shadow-lg" 
                >
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-900">Book Appointment</span>
                </Button>
                <Button 
                  onClick={navigateToQueue}
                  variant="outline" 
                  className="h-16 flex-col gap-2 bg-gradient-to-r from-gray-50 to-orange-50 hover:from-gray-100 hover:to-orange-100 border-2 border-gray-200 hover:border-orange-400 transition-all duration-300 rounded-lg hover:shadow-lg" 
                >
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="text-xs font-semibold text-gray-900">Manage Queue</span>
                </Button>
                <Button 
                  onClick={handleSendUpdates}
                  variant="outline" 
                  className="h-16 flex-col gap-2 bg-gradient-to-r from-gray-50 to-purple-50 hover:from-gray-100 hover:to-purple-100 border-2 border-gray-200 hover:border-purple-400 transition-all duration-300 rounded-lg hover:shadow-lg" 
                >
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  <span className="text-xs font-semibold text-gray-900">Send SMS</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
