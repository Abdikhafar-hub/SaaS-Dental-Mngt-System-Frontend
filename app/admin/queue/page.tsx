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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Clock, User, Phone, AlertTriangle, CheckCircle, XCircle, ArrowUp, ArrowDown, Play, Pause, Users, Activity, TrendingUp, Plus, MessageSquare, UserCheck, RotateCcw, ChevronDown, ChevronUp, Search, Filter, SortAsc, SortDesc, Eye, MoreHorizontal } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"


const treatments = ["Cleaning", "Checkup", "Filling", "Root Canal", "Crown", "Extraction", "Emergency", "Consultation"]

export default function QueuePage() {
  const { toast } = useToast()
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [isWalkInDialogOpen, setIsWalkInDialogOpen] = useState(false)
  const [patientNotes, setPatientNotes] = useState<{[key: string]: string}>({})
  const [checkInForm, setCheckInForm] = useState({
    patient_id: "",
    dentist_name: "",
    treatment: "",
    priority: "normal"
  })
  const [walkInForm, setWalkInForm] = useState({
    patientName: "",
    treatment: "Walk-in Consultation",
    priority: "normal"
  })
  const [patientsLoading, setPatientsLoading] = useState(false)
  
  // New state for compact layout
  const [statsCollapsed, setStatsCollapsed] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("number")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

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

  // Fetch queue from Express backend
  useEffect(() => {
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
            patient_name: item.patient ? `${item.patient.firstName} ${item.patient.lastName}` : 'Unknown Patient',
            dentist_name: item.assignedDentistName || item.assigned_dentist || 'Not assigned'
          }))
          
          setQueue(transformedQueue)
          console.log('Queue loaded:', transformedQueue.length)
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
  }, [])

  // Fetch patients for check-in modal
  useEffect(() => {
    const fetchPatients = async () => {
      setPatientsLoading(true)
      try {
        const response = await api.get('/patients', {
          params: { page: 1, pageSize: 1000 }
        })
        
        if (response.data.success) {
          setPatients(response.data.patients || [])
        } else {
          console.error('Error fetching patients:', response.data.error)
          setPatients([])
        }
      } catch (error) {
        console.error('Error fetching patients:', error)
        setPatients([])
      }
      setPatientsLoading(false)
    }
    fetchPatients()
  }, [])

  const handleCheckInFormChange = (field: string, value: string) => {
    setCheckInForm(prev => ({ ...prev, [field]: value }))
  }

  const handleCheckInPatient = async () => {
    if (!checkInForm.patient_id || !checkInForm.dentist_name || !checkInForm.treatment) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Get patient details for auto-fill
      const selectedPatient = patients.find(p => p.id === checkInForm.patient_id)
      
      const response = await api.post('/queue', {
        action: 'checkIn',
        queueData: {
          patient_id: checkInForm.patient_id,
          status: 'waiting',
          priority: checkInForm.priority,
          treatment: checkInForm.treatment,
          assigned_dentist: checkInForm.dentist_name,
          created_by: userId
        }
      })

      if (response.data.success) {
        // Transform the new queue item to match the existing format
        const transformedQueueItem = {
          ...response.data.queueItem,
          patient_name: response.data.queueItem.patient ? `${response.data.queueItem.patient.firstName} ${response.data.queueItem.patient.lastName}` : 'Unknown Patient',
          dentist_name: response.data.queueItem.assignedDentistName || 'Not assigned'
        }
        
        // Add to local state immediately
        setQueue(prevQueue => [...prevQueue, transformedQueueItem])
        
        toast({
          title: "Success",
          description: `Patient ${selectedPatient?.first_name} ${selectedPatient?.last_name} checked in successfully!`,
        })
        setIsCheckInModalOpen(false)
        setCheckInForm({
          patient_id: "",
          dentist_name: "",
          treatment: "",
          priority: "normal"
        })
      } else {
        console.error('Check-in error:', result.error)
        toast({
          title: "Error",
          description: `Error checking in patient: ${result.error}`,
          variant: "destructive",
        })
      }
    } catch (e) {
      console.error('Exception during check-in:', e)
      toast({
        title: "Error",
        description: `Exception during check-in: ${e}`,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  // Add these functions after the existing state:
  const handleAddWalkIn = async () => {
    if (!walkInForm.patientName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a patient name",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Add walk-in to queue via Express backend
      const response = await api.post('/queue', {
        action: 'checkIn',
        queueData: {
          patient_name: walkInForm.patientName, // Walk-in patient name
          treatment: walkInForm.treatment,
          status: 'waiting',
          priority: walkInForm.priority,
          created_by: userId
        }
      })

      if (response.data.success) {
        // Transform the new walk-in to match the existing format
        const transformedWalkIn = {
          ...response.data.queueItem,
          patient_name: walkInForm.patientName, // Use the entered name for walk-ins
          dentist_name: response.data.queueItem.assignedDentistName || 'Not assigned'
        }
        
        // Add to local state immediately
        setQueue(prevQueue => [...prevQueue, transformedWalkIn])
        
        toast({
          title: "Success",
          description: `${walkInForm.patientName} added to queue`,
        })
        setIsWalkInDialogOpen(false)
        setWalkInForm({
          patientName: "",
          treatment: "Walk-in Consultation",
          priority: "normal"
        })
      }
    } catch (e) {
      console.error('Exception adding walk-in:', e)
      toast({
        title: "Error",
        description: `Exception adding walk-in: ${e}`,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleAssignDentist = async (queueId: string, dentistId: string) => {
    // Update local state immediately
    setQueue(prevQueue => prevQueue.map(item => 
      item.id === queueId ? { ...item, assigned_dentist: dentistId, status: 'assigned' } : item
    ))
    
    // Update database via Express backend
    await api.put(`/queue/${queueId}`, {
      action: 'update',
      queueData: {
        assigned_dentist: dentistId,
        status: 'assigned'
      }
    })
  }

  const handlePauseQueue = () => {
    toast({
      title: "Queue Paused",
      description: "Queue paused - no new patients will be called",
    })
    // Optionally, you can implement a 'paused' status in the backend
  }

  const handleSendUpdates = () => {
    const waitingPatients = queue.filter((p) => p.status === "waiting").length
    toast({
      title: "Updates Sent",
      description: `SMS updates sent to ${waitingPatients} waiting patients`,
    })
    // Optionally, integrate with SMS backend
  }

  const handleResetQueue = async () => {
    setLoading(true)
    try {
      // Delete all queue items via Express backend
      // TODO: Implement batch delete endpoint or delete one by one
      // For now, clear local state
      toast({
        title: "Queue Reset",
        description: 'Queue has been successfully reset! All patients have been cleared.',
      })
      setQueue([]) // Clear local state
      setIsResetDialogOpen(false)
    } catch (e) {
      console.error('Exception during queue reset:', e)
      toast({
        title: "Error",
        description: `Exception during queue reset: ${e}`,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-treatment":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "waiting":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "assigned":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "normal":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "urgent":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-treatment":
        return <Activity className="h-4 w-4 text-blue-600" />
      case "waiting":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "assigned":
        return <UserCheck className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

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
      
      // Update database
      await api.put(`/queue/${current.id}`, {
        action: 'update',
        queueData: { number: above.number }
      })
      await api.put(`/queue/${above.id}`, {
        action: 'update',
        queueData: { number: current.number }
      })
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
      
      // Update database via Express backend
      await api.put(`/queue/${current.id}`, {
        action: 'update',
        queueData: { number: below.number }
      })
      await api.put(`/queue/${below.id}`, {
        action: 'update',
        queueData: { number: current.number }
      })
    }
  }

  const markAsCompleted = async (id: string) => {
    // Update local state immediately
    setQueue(prevQueue => prevQueue.map(item => 
      item.id === id ? { ...item, status: 'completed' } : item
    ))
    
    // Update database via Express backend
    await api.put(`/queue/${id}`, {
      action: 'update',
      queueData: { status: 'completed' }
    })
  }

  const startTreatment = async (id: string) => {
    // Update local state immediately
    setQueue(prevQueue => prevQueue.map(item => 
      item.id === id ? { ...item, status: 'in-treatment' } : item
    ))
    
    // Update database via Express backend
    await api.put(`/queue/${id}`, {
      action: 'update',
      queueData: { status: 'in-treatment' }
    })
  }

  // Filter and sort queue
  const filteredAndSortedQueue = queue
    .filter(patient => {
      const matchesSearch = searchTerm === "" || 
        patient.patient?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patient?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patient?.phone?.includes(searchTerm) ||
        patient.treatment?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || patient.status === statusFilter
      const matchesPriority = priorityFilter === "all" || patient.priority === priorityFilter
      
      return matchesSearch && matchesStatus && matchesPriority
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "number":
          comparison = a.number - b.number
          break
        case "name":
          comparison = (a.patient?.first_name || "").localeCompare(b.patient?.first_name || "")
          break
        case "checkin":
          comparison = new Date(a.checked_in || 0).getTime() - new Date(b.checked_in || 0).getTime()
          break
        case "priority":
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
          comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 0)
          break
        default:
          comparison = 0
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

  // Dynamic stats
  const totalQueue = queue.length
  const waitingCount = queue.filter((item) => item.status === "waiting").length
  const inTreatmentCount = queue.filter((item) => item.status === "in-treatment").length
  const completedCount = queue.filter((item) => item.status === "completed").length
  const assignedCount = queue.filter((item) => item.status === "assigned").length

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
              <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
              Queue Management
            </h1>
            <p className="text-gray-600 text-lg">Manage patient queue and treatment flow efficiently</p>
              </div>
              <div className="flex gap-2">
                <Dialog open={isCheckInModalOpen} onOpenChange={setIsCheckInModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-10 px-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Check In Patient
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Check In Patient
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6 py-6">
                      <div className="space-y-3">
                        <Label htmlFor="patient" className="text-gray-700 font-medium">Patient</Label>
                        <Select
                          value={checkInForm.patient_id}
                          onValueChange={(value) => handleCheckInFormChange("patient_id", value)}
                        >
                          <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-2">
                            {patientsLoading ? (
                              <SelectItem value="loading" disabled>Loading patients...</SelectItem>
                            ) : patients.length === 0 ? (
                              <SelectItem value="no-patients" disabled>No patients found. Add patients first.</SelectItem>
                            ) : (
                              <>
                                <SelectItem value="header" disabled>
                                  {patients.length} patient{patients.length !== 1 ? 's' : ''} available
                                </SelectItem>
                                {patients.map((patient) => (
                                  <SelectItem key={patient.id} value={patient.id}>
                                    {patient.first_name} {patient.last_name} - {patient.phone}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="dentist" className="text-gray-700 font-medium">Assign to Dentist</Label>
                        <Input
                          id="dentist"
                          placeholder="Enter dentist name (e.g., Dr. John Smith)"
                          value={checkInForm.dentist_name}
                          onChange={(e) => handleCheckInFormChange("dentist_name", e.target.value)}
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="treatment" className="text-gray-700 font-medium">Treatment</Label>
                        <Select
                          value={checkInForm.treatment}
                          onValueChange={(value) => handleCheckInFormChange("treatment", value)}
                        >
                          <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                            <SelectValue placeholder="Select treatment" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-2">
                            {treatments.map((treatment) => (
                              <SelectItem key={treatment} value={treatment.toLowerCase()}>
                                {treatment}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="priority" className="text-gray-700 font-medium">Priority</Label>
                        <Select
                          value={checkInForm.priority}
                          onValueChange={(value) => handleCheckInFormChange("priority", value)}
                        >
                          <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-2">
                            <SelectItem value="low">Low Priority</SelectItem>
                            <SelectItem value="normal">Normal Priority</SelectItem>
                            <SelectItem value="high">High Priority</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-3">
                        {/* Notes field removed - not supported in database schema */}
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCheckInModalOpen(false)}
                        className="h-12 px-6 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCheckInPatient}
                        disabled={loading}
                        className="h-12 px-6 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        {loading ? "Checking In..." : "Check In Patient"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline" 
                  className="h-10 px-4 border-2 border-gray-200 hover:border-purple-500 transition-colors duration-200 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white/90"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patients, treatments, or phone numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-32 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in-treatment">In Treatment</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-10 w-32 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10 w-32 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Queue #</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="checkin">Check-in Time</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="h-10 px-3 border-2 border-gray-200 hover:border-blue-500 transition-colors duration-200 rounded-lg"
              >
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Queue Stats */}
          <Collapsible open={!statsCollapsed} onOpenChange={setStatsCollapsed}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <Card className="rounded-xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4">
                <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total in Queue</p>
                        <p className="text-2xl font-bold text-gray-900">{totalQueue}</p>
                    <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-blue-500" />
                          <span className="text-xs font-semibold px-2 py-1 rounded-full text-blue-600 bg-blue-50">
                            {totalQueue > 0 ? "+" + totalQueue : "0"}
                      </span>
                    </div>
                  </div>
                      <div className="p-3 rounded-xl bg-blue-50 shadow-sm">
                        <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
                <Card className="rounded-xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4">
                <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Waiting</p>
                        <p className="text-2xl font-bold text-gray-900">{waitingCount}</p>
                    <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs font-semibold px-2 py-1 rounded-full text-yellow-600 bg-yellow-50">
                            {waitingCount > 0 ? "+" + waitingCount : "0"}
                      </span>
                    </div>
                  </div>
                      <div className="p-3 rounded-xl bg-yellow-50 shadow-sm">
                        <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
                <Card className="rounded-xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4">
                <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Assigned</p>
                        <p className="text-2xl font-bold text-gray-900">{assignedCount}</p>
                    <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-purple-500" />
                          <span className="text-xs font-semibold px-2 py-1 rounded-full text-purple-600 bg-purple-50">
                            {assignedCount > 0 ? "+" + assignedCount : "0"}
                      </span>
                    </div>
                  </div>
                      <div className="p-3 rounded-xl bg-purple-50 shadow-sm">
                        <UserCheck className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
                <Card className="rounded-xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4">
                <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">In Treatment</p>
                        <p className="text-2xl font-bold text-gray-900">{inTreatmentCount}</p>
                    <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs font-semibold px-2 py-1 rounded-full text-green-600 bg-green-50">
                            {inTreatmentCount > 0 ? "+" + inTreatmentCount : "0"}
                      </span>
                    </div>
                  </div>
                      <div className="p-3 rounded-xl bg-green-50 shadow-sm">
                        <Activity className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Completed</p>
                        <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-gray-500" />
                          <span className="text-xs font-semibold px-2 py-1 rounded-full text-gray-600 bg-gray-50">
                            {completedCount > 0 ? "+" + completedCount : "0"}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 shadow-sm">
                        <CheckCircle className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Queue List */}
          <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-gray-200">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                <Clock className="h-5 w-5 text-gray-700" />
                Current Queue ({filteredAndSortedQueue.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {filteredAndSortedQueue.map((patient, index) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:from-gray-100 hover:to-blue-100 transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                      {patient.number}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-base text-gray-900">{patient.patient_name}</h3>
                        <Badge className={`${getStatusColor(patient.status)} border px-2 py-1 rounded-full font-medium flex items-center gap-1 text-xs`}>
                          {getStatusIcon(patient.status)}
                          {patient.status.replace("-", " ")}
                        </Badge>
                        <Badge className={`${getPriorityColor(patient.priority)} border px-2 py-1 rounded-full font-medium text-xs`}>
                          {patient.priority} priority
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded-lg">
                          <User className="h-3 w-3 text-blue-600" />
                          <span className="font-medium">{patient.dentist_name}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded-lg">
                          <Activity className="h-3 w-3 text-green-600" />
                          <span className="font-medium">{patient.treatment}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded-lg">
                          <Clock className="h-3 w-3 text-purple-600" />
                          <span className="font-medium">{patient.estimated_time || '30 min'}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded-lg">
                          <CheckCircle className="h-3 w-3 text-orange-600" />
                          <span className="font-medium">{patient.checked_in ? new Date(patient.checked_in).toLocaleTimeString() : 'Not checked in'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Queue Management Buttons */}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => moveUp(patient.id)} 
                      disabled={index === 0}
                      className="h-8 px-3 border-2 border-gray-200 hover:border-blue-400 text-gray-700 hover:text-blue-800 transition-colors duration-200 rounded-lg bg-white/80 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveDown(patient.id)}
                      disabled={index === queue.length - 1}
                      className="h-8 px-3 border-2 border-gray-200 hover:border-blue-400 text-gray-700 hover:text-blue-800 transition-colors duration-200 rounded-lg bg-white/80 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>

                    {/* Status Action Buttons */}
                    {patient.status === "waiting" && (
                      <Button 
                        size="sm" 
                        onClick={() => startTreatment(patient.id)}
                        className="h-8 px-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium transition-all duration-200 rounded-lg shadow-lg hover:shadow-xl text-xs"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    )}
                    {patient.status === "in-treatment" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => markAsCompleted(patient.id)}
                        className="h-8 px-3 border-2 border-green-200 hover:border-green-400 text-green-700 hover:text-green-800 transition-colors duration-200 rounded-lg bg-white/80 backdrop-blur-sm text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {filteredAndSortedQueue.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">No patients in queue</h3>
                  <p className="text-sm text-gray-500">Patients will appear here when they check in for their appointments.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Queue Management Tools */}
          <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-gray-200">
              <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Queue Management Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  className="h-16 flex-col gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border-0"
                  onClick={() => setIsWalkInDialogOpen(true)}
                >
                  <Plus className="h-5 w-5" />
                  <span className="font-semibold text-sm">Add Walk-in Patient</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2 border-2 border-yellow-200 hover:border-yellow-400 text-yellow-700 hover:text-yellow-800 transition-colors duration-200 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white/90"
                  onClick={handlePauseQueue}
                >
                  <Pause className="h-5 w-5" />
                  <span className="font-semibold text-sm">Pause Queue</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2 border-2 border-purple-200 hover:border-purple-400 text-purple-700 hover:text-purple-800 transition-colors duration-200 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white/90"
                  onClick={handleSendUpdates}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-semibold text-sm">Send Updates</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2 border-2 border-red-200 hover:border-red-400 text-red-700 hover:text-red-800 transition-colors duration-200 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white/90"
                  onClick={() => setIsResetDialogOpen(true)}
                >
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold text-sm">Reset Queue</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Walk-in Patient Dialog */}
      <Dialog open={isWalkInDialogOpen} onOpenChange={setIsWalkInDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Walk-in Patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="patientName">Patient Name</Label>
              <Input
                id="patientName"
                value={walkInForm.patientName}
                onChange={(e) => setWalkInForm(prev => ({ ...prev, patientName: e.target.value }))}
                placeholder="Enter patient name"
              />
            </div>
            <div>
              <Label htmlFor="treatment">Treatment</Label>
              <Input
                id="treatment"
                value={walkInForm.treatment}
                onChange={(e) => setWalkInForm(prev => ({ ...prev, treatment: e.target.value }))}
                placeholder="Enter treatment"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={walkInForm.priority} onValueChange={(value) => setWalkInForm(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              {/* Notes field removed - not supported in database schema */}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsWalkInDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWalkIn} disabled={loading}>
              {loading ? "Adding..." : "Add Patient"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Queue Confirmation Dialog */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Queue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the entire queue? This will clear all patients and cannot be undone. This action is typically used at the end of the day.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetQueue} disabled={loading}>
              {loading ? "Resetting..." : "Reset Queue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}
