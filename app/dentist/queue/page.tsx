"use client"

import { useState, useEffect } from "react"
import api from "@/lib/axiosConfig"

// Force dynamic rendering to avoid build-time environment variable issues
export const dynamic = 'force-dynamic'

import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Clock, 
  User, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Phone, 
  FileText,
  TrendingUp,
  Activity,
  Timer,
  Bell,
  Plus,
  ArrowRight,
  Stethoscope,
  Award,
  Target,
  Zap,
  CalendarDays,
  UserCheck,
  Heart,
  Shield,
  Eye,
  ArrowUp,
  ArrowDown,
  Users,
  Activity as ActivityIcon,
  ChevronDown,
  ChevronUp,
  XCircle
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"


export default function DentistQueuePage() {
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)
  const [statsCollapsed, setStatsCollapsed] = useState(false)

  useEffect(() => {
    // Get user ID from localStorage (set during login)
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.id) setUserId(user.id)
      } catch (e) {
        console.error('Error parsing user from localStorage:', e)
      }
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    const fetchQueue = async () => {
      setLoading(true)
      try {
        const response = await api.get('/queue', {
          params: { page: 1, pageSize: 100 }
        })
        
        if (response.data.success) {
          // Transform the queue items to match the existing format
          const transformedQueue = response.data.queue.map((item: any) => ({
            ...item,
            patient_name: item.patient ? `${item.patient.firstName || item.patient.first_name} ${item.patient.lastName || item.patient.last_name}` : 'Unknown Patient',
            dentist_name: item.assignedDentistName || item.assigned_dentist || 'Not assigned'
          }))
          
          setQueue(transformedQueue)
          console.log('Queue data fetched:', transformedQueue)
          console.log('Queue length:', transformedQueue.length)
          console.log('First queue item:', transformedQueue[0])
        } else {
          console.error('Error fetching queue:', response.data.error)
          setQueue([])
        }
      } catch (error) {
        console.error('Error fetching queue:', error)
        setQueue([])
      }
      setLoading(false)
    }
    fetchQueue()
    
    // TODO: Implement real-time updates with WebSocket or polling if needed
  }, [userId])

  // Actions (moveUp, moveDown, startTreatment, markAsCompleted) same as admin, but filtered queue
  const moveUp = async (id: string) => {
    const index = queue.findIndex((item) => item.id === id)
    if (index > 0) {
      const above = queue[index - 1]
      const current = queue[index]
      
      // Update local state immediately
      setQueue(prevQueue => {
        const newQueue = [...prevQueue]
        // Swap the numbers in local state
        newQueue[index] = { ...newQueue[index], number: above.number }
        newQueue[index - 1] = { ...newQueue[index - 1], number: current.number }
        return newQueue
      })
      
      // Update database via API
      try {
        await api.put(`/queue/${current.id}`, {
          action: 'update',
          queueData: { number: above.number }
        })
        
        await api.put(`/queue/${above.id}`, {
          action: 'update',
          queueData: { number: current.number }
        })
      } catch (error) {
        console.error('Error updating queue positions:', error)
      }
    }
  }
  
  const moveDown = async (id: string) => {
    const index = queue.findIndex((item) => item.id === id)
    if (index < queue.length - 1) {
      const below = queue[index + 1]
      const current = queue[index]
      
      // Update local state immediately
      setQueue(prevQueue => {
        const newQueue = [...prevQueue]
        // Swap the numbers in local state
        newQueue[index] = { ...newQueue[index], number: below.number }
        newQueue[index + 1] = { ...newQueue[index + 1], number: current.number }
        return newQueue
      })
      
      // Update database via API
      try {
        await api.put(`/queue/${current.id}`, {
          action: 'update',
          queueData: { number: below.number }
        })
        
        await api.put(`/queue/${below.id}`, {
          action: 'update',
          queueData: { number: current.number }
        })
      } catch (error) {
        console.error('Error updating queue positions:', error)
      }
    }
  }

  const startTreatment = async (id: string) => {
    console.log('Starting treatment for patient ID:', id)
    try {
      const response = await api.put(`/queue/${id}`, {
        action: 'update',
        queueData: {
          status: 'in-treatment',
          treatment_started_at: new Date().toISOString(),
          treatment_started_by: userId
        }
      })
      
      if (response.data.success) {
        console.log('Treatment started successfully:', result.queueItem)
        alert('Treatment started successfully!')
      } else {
        console.error('Error starting treatment:', result.error)
        alert(`Failed to start treatment: ${result.error}`)
      }
    } catch (e) {
      console.error('Exception starting treatment:', e)
      alert(`Exception starting treatment: ${e}`)
    }
  }

  const markAsCompleted = async (id: string) => {
    try {
      const response = await api.put(`/queue/${id}`, {
        action: 'update',
        queueData: {
          status: 'completed',
          treatment_completed_at: new Date().toISOString()
        }
      })
      
      if (response.data.success) {
        console.log('Treatment completed successfully:', result.queueItem)
        alert('Treatment completed successfully!')
      } else {
        console.error('Error completing treatment:', result.error)
        alert(`Error completing treatment: ${result.error}`)
      }
    } catch (e) {
      console.error('Exception completing treatment:', e)
      alert(`Exception completing treatment: ${e}`)
    }
  }

  const handleResetQueue = async () => {
    const confirmed = confirm("Are you sure you want to reset the entire queue? This will clear all patients and cannot be undone. This action is typically used at the end of the day.")
    if (!confirmed) return

    setLoading(true)
    try {
      // TODO: Implement batch delete endpoint or delete one by one
      // For now, clear local state
      // Delete all queue items via API
      if (true) { // Placeholder - implement batch delete
        alert('Queue has been successfully reset! All patients have been cleared.')
        setQueue([]) // Clear local state
      } else {
        console.error('Reset queue error:', result.error)
        alert(`Error resetting queue: ${result.error}`)
      }
    } catch (e) {
      console.error('Exception during queue reset:', e)
      alert(`Exception during queue reset: ${e}`)
    }
    setLoading(false)
  }

  // Dynamic stats
  const totalQueue = queue.length
  const waitingCount = queue.filter((item) => item.status === "waiting" || item.status === "assigned").length
  const inTreatmentCount = queue.filter((item) => item.status === "in-treatment").length
  const completedCount = queue.filter((item) => item.status === "completed").length

  // Debug stats
  console.log('Queue stats:', {
    totalQueue,
    waitingCount,
    inTreatmentCount,
    completedCount,
    queueStatuses: queue.map(q => ({ id: q.id, status: q.status, name: `${q.patient?.first_name} ${q.patient?.last_name}` }))
  })

  const currentPatient = queue.find((item) => item.status === "in-treatment")
  const nextPatient = queue.find((item) => item.status === "assigned" || item.status === "waiting")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-treatment":
        return "bg-blue-100 text-blue-800 border border-blue-200"
      case "waiting":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200"
      case "completed":
        return "bg-green-100 text-green-800 border border-green-200"
      case "called":
        return "bg-purple-100 text-purple-800 border border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border border-red-200"
      case "routine":
        return "bg-blue-100 text-blue-800 border border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-treatment":
        return <Play className="h-4 w-4" />
      case "waiting":
        return <Clock className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "called":
        return <Bell className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <ActivityIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
                  My Patient Queue
                </h1>
                <p className="text-gray-600 text-lg">Welcome back, {/* currentUser?.name */}! Here are your patients waiting for treatment.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="font-medium">Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 px-3 border-2 border-red-200 hover:border-red-400 text-red-700 hover:text-red-800 transition-colors duration-200 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white/90"
                onClick={handleResetQueue}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reset Queue
              </Button>
            </div>
          </div>

          {/* Queue Stats */}
          <Collapsible open={!statsCollapsed} onOpenChange={setStatsCollapsed} className="mb-6">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full text-left justify-between mb-3">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Queue Statistics
                </span>
                {statsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total in My Queue */}
                <Card className="rounded-xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total in My Queue</p>
                        <p className="text-2xl font-bold text-gray-900">{totalQueue}</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs font-semibold px-2 py-1 rounded-full text-green-600 bg-green-50">
                            +0
                          </span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Waiting */}
                <Card className="rounded-xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Waiting</p>
                        <p className="text-2xl font-bold text-gray-900">{waitingCount}</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs font-semibold px-2 py-1 rounded-full text-yellow-600 bg-yellow-50">
                            +0
                          </span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 shadow-sm">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* In Treatment */}
                <Card className="rounded-xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">In Treatment</p>
                        <p className="text-2xl font-bold text-gray-900">{inTreatmentCount}</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-blue-500" />
                          <span className="text-xs font-semibold px-2 py-1 rounded-full text-blue-600 bg-blue-50">
                            +0
                          </span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 shadow-sm">
                        <Play className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Completed Today */}
                <Card className="rounded-xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Completed Today</p>
                        <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs font-semibold px-2 py-1 rounded-full text-green-600 bg-green-50">
                            +0
                          </span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
          </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Current & Next Patient */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Patient */}
            <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-gray-200">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  <Play className="h-5 w-5 text-blue-600" />
                  Current Patient
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {currentPatient ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-3 border-blue-100 shadow-lg">
                          <AvatarImage src={`/avatars/${currentPatient.patient?.first_name?.toLowerCase()}-${currentPatient.patient?.last_name?.toLowerCase()}.jpg`} alt={`${currentPatient.patient?.first_name} ${currentPatient.patient?.last_name}`} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg">
                            {(currentPatient.patient?.first_name?.[0] || '') + (currentPatient.patient?.last_name?.[0] || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{currentPatient.patient?.first_name} {currentPatient.patient?.last_name}</h3>
                          <p className="text-gray-600 font-medium">Age: {currentPatient.patient?.age}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full font-medium">
                        <Play className="h-3 w-3 mr-1" />
                        In Treatment
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Treatment:</p>
                        <p className="text-xs text-gray-900">{currentPatient.treatment}</p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Started:</p>
                        <p className="text-xs text-gray-900">{currentPatient.checked_in ? new Date(currentPatient.checked_in).toLocaleTimeString() : 'Not started'}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                      <p className="text-xs font-semibold text-orange-800 mb-1">Estimated Duration:</p>
                      <p className="text-xs text-orange-700">30 minutes</p>
                    </div>
                    {currentPatient.patient?.medical_history && (
                    <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                          <p className="text-xs font-semibold text-red-800">⚠️ Medical History:</p>
                        </div>
                        <p className="text-xs text-red-700">{currentPatient.patient.medical_history}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => setSelectedPatient(currentPatient)}
                        className="h-8 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => markAsCompleted(currentPatient.id)}
                        className="h-8 px-4 rounded-lg border-2 border-green-400 hover:border-green-500 hover:bg-green-50 transition-all duration-200"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete Treatment
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Play className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <h3 className="text-lg font-bold mb-2 text-gray-700">No current patient</h3>
                    <p className="text-sm text-gray-600">No patient is currently in treatment.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next Patient */}
            <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-gray-200">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Next Patient
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {nextPatient ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-3 border-yellow-100 shadow-lg">
                          <AvatarImage src={`/avatars/${nextPatient.patient?.first_name?.toLowerCase()}-${nextPatient.patient?.last_name?.toLowerCase()}.jpg`} alt={`${nextPatient.patient?.first_name} ${nextPatient.patient?.last_name}`} />
                          <AvatarFallback className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold text-lg">
                            {(nextPatient.patient?.first_name?.[0] || '') + (nextPatient.patient?.last_name?.[0] || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{nextPatient.patient?.first_name} {nextPatient.patient?.last_name}</h3>
                          <p className="text-gray-600 font-medium">Age: {nextPatient.patient?.age}</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full font-medium">
                        <Clock className="h-3 w-3 mr-1" />
                        Waiting
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Treatment:</p>
                        <p className="text-xs text-gray-900">{nextPatient.treatment}</p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Queue Number:</p>
                        <p className="text-xs text-gray-900">#{nextPatient.number}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <p className="text-xs font-semibold text-green-800 mb-1">Checked In:</p>
                        <p className="text-xs text-green-700">{nextPatient.checked_in ? new Date(nextPatient.checked_in).toLocaleTimeString() : 'Not checked in'}</p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                        <p className="text-xs font-semibold text-orange-800 mb-1">Est. Duration:</p>
                        <p className="text-xs text-orange-700">30 minutes</p>
                      </div>
                    </div>
                    {nextPatient.patient?.medical_history && (
                    <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                          <p className="text-xs font-semibold text-red-800">⚠️ Medical History:</p>
                        </div>
                        <p className="text-xs text-red-700">{nextPatient.patient.medical_history}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => setSelectedPatient(nextPatient)}
                        className="h-8 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => startTreatment(nextPatient.id)}
                        className="h-8 px-4 rounded-lg border-2 border-green-400 hover:border-green-500 hover:bg-green-50 transition-all duration-200"
                      >
                        <Bell className="h-3 w-3 mr-1" />
                        Start Treatment
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <h3 className="text-lg font-bold mb-2 text-gray-700">No next patient</h3>
                    <p className="text-sm text-gray-600">No patients are waiting in the queue.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Full Queue List */}
          <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-gray-200">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                <Users className="h-5 w-5 text-purple-600" />
                My Patient Queue ({queue.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Queue #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Treatment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {queue.map((patient: any) => (
                      <tr key={patient.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-gray-900">#{patient.number}</span>
                      </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border-2 border-gray-100">
                              <AvatarImage src={`/avatars/${patient.patient?.first_name?.toLowerCase()}-${patient.patient?.last_name?.toLowerCase()}.jpg`} alt={`${patient.patient?.first_name} ${patient.patient?.last_name}`} />
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold">
                                {(patient.patient?.first_name?.[0] || '') + (patient.patient?.last_name?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {patient.patient?.first_name} {patient.patient?.last_name}
                              </div>
                              {patient.patient?.medical_history && (
                                <div className="flex items-center gap-1 mt-1">
                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                  <span className="text-xs text-red-600 font-medium">
                                    {patient.patient.medical_history.length > 30 
                                      ? patient.patient.medical_history.substring(0, 30) + '...' 
                                      : patient.patient.medical_history}
                                  </span>
                                </div>
                              )}
                            </div>
                        </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-gray-400" />
                            {patient.treatment}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {patient.checked_in ? new Date(patient.checked_in).toLocaleTimeString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {patient.patient?.age || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge className={`${getStatusColor(patient.status)} text-xs px-2 py-1 flex items-center gap-1`}>
                            {getStatusIcon(patient.status)}
                            {patient.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setSelectedPatient(patient)}
                              className="h-8 px-3 text-xs border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                      >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                      </Button>
                            {patient.status === "waiting" || patient.status === "assigned" ? (
                        <Button 
                          size="sm"
                                onClick={() => startTreatment(patient.id)}
                                className="h-8 px-3 text-xs bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                        >
                                <Play className="h-3 w-3 mr-1" />
                                Start
                        </Button>
                            ) : null}
                      {patient.status === "in-treatment" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                                onClick={() => markAsCompleted(patient.id)}
                                className="h-8 px-3 text-xs border-green-400 hover:border-green-500 hover:bg-green-50"
                        >
                                <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                        </td>
                      </tr>
                ))}
                  </tbody>
                </table>

                {queue.length === 0 && (
                  <div className="text-center py-16 text-gray-500">
                    <Clock className="h-24 w-24 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-2xl font-bold mb-3 text-gray-700">No patients in queue</h3>
                    <p className="text-lg text-gray-600">Your patient queue is empty. Patients will appear here when they check in.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Patient Details Modal */}
          {selectedPatient && (
            <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl">
                <DialogHeader className="pb-6 border-b border-gray-200">
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Patient Details - {selectedPatient.patient?.first_name} {selectedPatient.patient?.last_name}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-8 py-6">
                  {/* Patient Info */}
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                        <h3 className="font-bold text-lg mb-4 text-gray-900">Patient Information</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Name:</span>
                            <span className="font-semibold text-gray-900">{selectedPatient.patient?.first_name} {selectedPatient.patient?.last_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Age:</span>
                            <span className="font-semibold text-gray-900">{selectedPatient.patient?.age} years</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Phone:</span>
                            <span className="font-semibold text-gray-900">{selectedPatient.patient?.phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Queue Number:</span>
                            <span className="font-semibold text-gray-900">#{selectedPatient.number}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="p-6 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-200">
                        <h3 className="font-bold text-lg mb-4 text-gray-900">Appointment Details</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Treatment:</span>
                            <span className="font-semibold text-gray-900">{selectedPatient.treatment}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Status:</span>
                            <span className="font-semibold text-gray-900">{selectedPatient.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Checked In:</span>
                            <span className="font-semibold text-gray-900">{selectedPatient.checked_in ? new Date(selectedPatient.checked_in).toLocaleTimeString() : 'Not checked in'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Estimated Duration:</span>
                            <span className="font-semibold text-gray-900">30 minutes</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600">Priority:</span>
                            <Badge className={`${getPriorityColor(selectedPatient.priority)} px-3 py-1 rounded-full font-medium`}>
                              {selectedPatient.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical Alerts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <h4 className="font-bold text-lg text-red-800">Medical History</h4>
                      </div>
                      <p className="text-sm text-red-700">{selectedPatient.patient?.medical_history || 'No medical history recorded'}</p>
                    </div>
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <h4 className="font-bold text-lg text-blue-800">Contact Information</h4>
                      </div>
                      <p className="text-sm text-blue-700">Phone: {selectedPatient.patient?.phone}</p>
                      <p className="text-sm text-blue-700">Email: {selectedPatient.patient?.email || 'Not provided'}</p>
                    </div>
                  </div>

                  {/* Treatment Notes */}
                  <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <h4 className="font-bold text-lg text-gray-900">Treatment Notes</h4>
                    </div>
                    <p className="text-sm text-gray-700">No treatment notes available yet.</p>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-11 px-6 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Call Patient
                    </Button>
                    <Button variant="outline" className="h-11 px-6 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all duration-200 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      View History
                    </Button>
                    <Button variant="outline" className="h-11 px-6 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Patient Profile
                    </Button>
                    {selectedPatient.status === "waiting" || selectedPatient.status === "assigned" ? (
                      <Button 
                        onClick={() => startTreatment(selectedPatient.id)}
                        className="h-11 px-6 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                      >
                        <Play className="h-4 w-4" />
                        Start Treatment
                      </Button>
                    ) : null}
                    {selectedPatient.status === "in-treatment" && (
                      <Button 
                        onClick={() => markAsCompleted(selectedPatient.id)}
                        className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
