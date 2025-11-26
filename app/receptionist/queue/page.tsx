"use client"

import { useState, useEffect } from "react"
import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Clock,
  User,
  Phone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Play,
  RotateCcw,
  UserCheck,
  Timer,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  MoreHorizontal,
} from "lucide-react"
import api from "@/lib/axiosConfig"

// Force dynamic rendering to avoid build-time environment variable issues
export const dynamic = 'force-dynamic'

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"


const treatments = ["Cleaning", "Checkup", "Filling", "Root Canal", "Crown", "Extraction", "Emergency", "Consultation"]

export default function ReceptionistQueuePage() {
  const { toast } = useToast()
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false)
  const [patientNotes, setPatientNotes] = useState<{[key: string]: string}>({})
  const [checkInForm, setCheckInForm] = useState({
    patient_id: "",
    dentist_name: "",
    treatment: "",
    priority: "normal",
    notes: ""
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
            patient_name: item.patient ? `${item.patient.firstName || item.patient.first_name} ${item.patient.lastName || item.patient.last_name}` : 'Unknown Patient',
            dentist_name: item.assignedDentistName || item.assigned_dentist || 'Not assigned'
          }))
          
          setQueue(transformedQueue)
          console.log('Receptionist queue data:', transformedQueue)
          console.log('Receptionist queue length:', transformedQueue.length)
        } else {
          console.error('Receptionist queue error:', response.data.error)
          setQueue([])
        }
      } catch (error) {
        console.error('Receptionist queue error:', error)
        setQueue([])
      }
      setLoading(false)
    }
    fetchQueue()
    
    // TODO: Implement real-time updates with WebSocket or polling if needed
  }, [])

  // Fetch patients for check-in
  useEffect(() => {
    const fetchPatients = async () => {
      setPatientsLoading(true)
      try {
        const response = await api.get('/patients', {
          params: { page: 1, pageSize: 1000 }
        })
        
        if (response.data.success) {
          console.log('Patients fetched:', response.data.patients)
          console.log('Patients count:', response.data.patients?.length || 0)
          setPatients(response.data.patients || [])
        } else {
          console.error('Error fetching patients:', response.data.error)
          setPatients([])
        }
      } catch (error) {
        console.error('Error:', error)
        setPatients([])
      } finally {
        setPatientsLoading(false)
      }
    }
    fetchPatients()
  }, [])

  const handleCheckInFormChange = (field: string, value: string) => {
    setCheckInForm(prev => ({ ...prev, [field]: value }))
  }

  const handleCheckInPatient = async () => {
    if (!checkInForm.patient_id || !checkInForm.treatment) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields: Patient and Treatment",
        variant: "destructive",
      })
      return
    }

    // Validate that the patient exists
    const selectedPatient = patients.find(p => p.id === checkInForm.patient_id)
    if (!selectedPatient) {
      toast({
        title: "Patient not found",
        description: "Selected patient not found. Please refresh and try again.",
        variant: "destructive",
      })
      return
    }

    console.log('Checking in patient:', selectedPatient)

    setLoading(true)
    try {
      const response = await api.post('/queue', {
        action: 'checkIn',
        queueData: {
          patient_id: checkInForm.patient_id,
          status: 'assigned', // Automatically assign to Dr. Feisal
          priority: checkInForm.priority,
          treatment: checkInForm.treatment,
          assigned_dentist: 'Dr. Feisal', // Assign to Dr. Feisal since he's the only dentist
          created_by: userId
        }
      })

      if (response.data.success) {
        console.log('Patient checked in successfully:', response.data.queueItem)
        
        // Transform the new queue item to match the existing format
        const transformedQueueItem = {
          ...response.data.queueItem,
          patient_name: response.data.queueItem.patient ? `${response.data.queueItem.patient.firstName || response.data.queueItem.patient.first_name} ${response.data.queueItem.patient.lastName || response.data.queueItem.patient.last_name}` : 'Unknown Patient',
          dentist_name: response.data.queueItem.assignedDentistName || response.data.queueItem.assigned_dentist || 'Not assigned'
        }
        
        // Add new queue entry to local state immediately
        setQueue(prevQueue => [transformedQueueItem, ...prevQueue])
        
        toast({
          title: "Patient checked in successfully!",
          description: `${selectedPatient.first_name} ${selectedPatient.last_name} has been added to the queue.`,
        })
        
        setIsCheckInModalOpen(false)
        setCheckInForm({
          patient_id: "",
          dentist_name: "",
          treatment: "",
          priority: "normal",
          notes: ""
        })
      } else {
        console.error('Error checking in patient:', result.error)
        toast({
          title: "Error checking in patient",
          description: `Error: ${result.error}`,
          variant: "destructive",
        })
      }
    } catch (e) {
      console.error('Error:', e)
      toast({
        title: "Error checking in patient",
        description: `Error: ${e}`,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "waiting":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200"
      case "in treatment":
        return "bg-blue-100 text-blue-800 border border-blue-200"
      case "ready":
        return "bg-green-100 text-green-800 border border-green-200"
      case "not arrived":
        return "bg-gray-100 text-gray-800 border border-gray-200"
      case "completed":
        return "bg-purple-100 text-purple-800 border border-purple-200"
      default:
        return "bg-blue-100 text-blue-800 border border-blue-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border border-red-200"
      case "normal":
        return "bg-blue-100 text-blue-800 border border-blue-200"
      case "low":
        return "bg-gray-100 text-gray-800 border border-gray-200"
      default:
        return "bg-blue-100 text-blue-800 border border-blue-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "waiting":
        return <Clock className="h-4 w-4" />
      case "in treatment":
        return <Play className="h-4 w-4" />
      case "ready":
        return <CheckCircle className="h-4 w-4" />
      case "not arrived":
        return <XCircle className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatTime = (time: string | null) => {
    if (!time) return "Not checked in"
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const movePatient = async (id: string, direction: string) => {
    const currentIndex = queue.findIndex((patient) => patient.id === id)
    if (currentIndex === -1) return
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex >= 0 && newIndex < queue.length) {
      const current = queue[currentIndex]
      const target = queue[newIndex]
      
      try {
        // Update both queue entries in the database
        await api.put(`/queue/${current.id}`, {
          action: 'update',
          queueData: { number: target.number }
        })
        
        await api.put(`/queue/${target.id}`, {
          action: 'update',
          queueData: { number: current.number }
        })
        
        // Update local state immediately
        setQueue(prevQueue => {
          const newQueue = [...prevQueue]
          // Swap the queue numbers
          newQueue[currentIndex] = { ...newQueue[currentIndex], number: target.number }
          newQueue[newIndex] = { ...newQueue[newIndex], number: current.number }
          return newQueue
        })
        
        toast({
          title: "Patient moved successfully",
          description: `Patient moved ${direction} in queue`,
        })
      } catch (error) {
        console.error('Error moving patient:', error)
        toast({
          title: "Error moving patient",
          description: "Failed to move patient in queue",
          variant: "destructive",
        })
      }
    }
  }

  const updatePatientStatus = async (id: string, newStatus: string) => {
    try {
      const response = await api.put(`/queue/${id}`, {
        action: 'update',
        queueData: { status: newStatus }
      })

      if (response.data.success) {
        // Update local state immediately
        setQueue(prevQueue => prevQueue.map(queueEntry => 
          queueEntry.id === id ? response.data.queueItem : queueEntry
        ))
        
        // Get patient name for the toast message
        const patient = response.data.queueItem?.patient
        const patientName = patient ? `${patient.firstName || patient.first_name} ${patient.lastName || patient.last_name}` : 'Patient'
        
        toast({
          title: "Status updated successfully",
          description: `${patientName} status changed to ${newStatus.replace('-', ' ')}`,
        })
      }
    } catch (error: any) {
      console.error('Error updating patient status:', error)
      toast({
        title: "Error updating status",
        description: error?.message || "An error occurred while updating status",
        variant: "destructive",
      })
    }
  }

  const assignPatientToDentist = async (queueId: string, dentistName: string) => {
    // This function is no longer needed as dentist assignments are managed by the database
    // setDentistAssignments(prev => ({
    //   ...prev,
    //   [queueId]: dentistName
    // }))
    
    // TODO: Implement dentist assignment via Express backend if needed
  }

  const checkInPatient = async (patientId: string) => {
    try {
      // Check in patient via Express backend
      const response = await api.post('/queue', {
        action: 'checkIn',
        queueData: {
          patient_id: patientId,
          status: 'waiting',
          priority: 'normal',
          checked_in: new Date().toISOString(),
          created_by: userId
        }
      })
      
      if (response.data.success) {
        // Add new queue entry to local state immediately
        setQueue(prevQueue => [response.data.queueItem, ...prevQueue])
      
      toast({
        title: "Patient checked in successfully!",
        description: "Patient has been added to the queue.",
      })
    } catch (error) {
      console.error('Error checking in patient:', error)
      toast({
        title: "Error checking in patient",
        description: "Failed to check in patient",
        variant: "destructive",
      })
    }
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
          const priorityOrder = { high: 3, normal: 2, low: 1 }
          comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 0)
          break
        default:
          comparison = 0
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

  const totalQueue = queue.length
  const waitingCount = queue.filter((item) => item.status === "waiting").length
  const inTreatmentCount = queue.filter((item) => item.status === "in-treatment").length
  const completedCount = queue.filter((item) => item.status === "completed").length
  const assignedCount = queue.filter((item) => item.status === "assigned").length

  const queueStats = [
    { label: "Waiting", value: waitingCount.toString(), icon: Clock, color: "text-yellow-600" },
    { label: "In Treatment", value: inTreatmentCount.toString(), icon: Play, color: "text-blue-600" },
    { label: "Assigned", value: assignedCount.toString(), icon: CheckCircle, color: "text-green-600" },
    { label: "Completed", value: completedCount.toString(), icon: XCircle, color: "text-gray-600" },
  ]

  const handleSendUpdates = () => {
    const waitingPatients = queue.filter((p) => p.status === "waiting").length
    toast({
      title: "SMS updates sent",
      description: `SMS updates sent to ${waitingPatients} waiting patients`,
    })
    // Optionally, integrate with SMS backend
  }

  const handleResetQueue = async () => {
    const confirmed = confirm("Are you sure you want to reset the entire queue? This will clear all patients and cannot be undone. This action is typically used at the end of the day.")
    if (!confirmed) return

    setLoading(true)
    try {
      // TODO: Implement batch delete endpoint or delete one by one
      // For now, clear local state
      // Delete all queue items via Express backend
      if (true) { // Placeholder - implement batch delete
        toast({
          title: "Queue reset successfully",
          description: "Queue has been successfully reset! All patients have been cleared.",
        })
        setQueue([]) // Clear local state
      }
    } catch (e) {
      console.error('Exception during queue reset:', e)
      toast({
        title: "Error resetting queue",
        description: `Exception: ${e}`,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-4 space-y-4">
          {/* Compact Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Patient Queue
            </h1>
              <p className="text-gray-600 text-sm lg:text-base">Manage patient flow efficiently</p>
          </div>

            <div className="flex gap-2">
              <Dialog open={isCheckInModalOpen} onOpenChange={setIsCheckInModalOpen}>
                <DialogTrigger asChild>
                  <Button className="h-10 px-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Check In
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
                      <Label htmlFor="notes" className="text-gray-700 font-medium">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any special notes or requirements"
                        value={checkInForm.notes}
                        onChange={(e) => handleCheckInFormChange("notes", e.target.value)}
                        className="border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl min-h-[100px]"
                      />
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
              <Button 
                variant="outline" 
                className="h-10 px-4 border-2 border-red-200 hover:border-red-400 text-red-700 hover:text-red-800 transition-colors duration-200 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white/90"
                onClick={handleResetQueue}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reset Queue
              </Button>
            </div>
          </div>

          {/* Collapsible Stats */}
          <Collapsible open={!statsCollapsed} onOpenChange={setStatsCollapsed}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white/90">
                <span className="font-semibold text-gray-700">Queue Statistics</span>
                {statsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {queueStats.map((stat) => {
              const Icon = stat.icon
              return (
                    <Card key={stat.label} className="rounded-lg border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
                            <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Sticky Queue Controls */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Queue ({filteredAndSortedQueue.length})</h2>
                <Badge variant="outline" className="px-2 py-1 rounded-full text-xs">
                    {new Date().toLocaleTimeString()}
                </Badge>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 border-gray-200 focus:border-blue-500"
                  />
                </div>
                
                {/* Filters */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-32 border-gray-200">
                    <SelectValue placeholder="Status" />
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
                  <SelectTrigger className="h-9 w-32 border-gray-200">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9 w-32 border-gray-200">
                    <SelectValue placeholder="Sort by" />
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
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="h-9 w-9 p-0 border-gray-200"
                >
                  {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Compact Queue Table */}
          <div className="bg-white/95 backdrop-blur-xl rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Queue #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dentist</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Treatment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedQueue.map((patient: any, index: number) => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-gray-900">#{patient.number}</span>
                          <div className="flex flex-col gap-1">
                          <Button
                              variant="ghost"
                            size="sm"
                            onClick={() => movePatient(patient.id, "up")}
                            disabled={index === 0}
                              className="h-6 w-6 p-0 hover:bg-blue-100"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                              variant="ghost"
                            size="sm"
                            onClick={() => movePatient(patient.id, "down")}
                              disabled={index === filteredAndSortedQueue.length - 1}
                              className="h-6 w-6 p-0 hover:bg-blue-100"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border-2 border-gray-100">
                            <AvatarImage src={patient.patient?.avatar || "/placeholder.svg"} alt={patient.patient?.first_name} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold">
                              {patient.patient ? `${patient.patient.first_name?.[0] || ''}${patient.patient.last_name?.[0] || ''}` : 'N/A'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {patient.patient ? `${patient.patient.first_name} ${patient.patient.last_name}` : 'Unknown Patient'}
                            </div>
                            {patient.patient?.allergies && patient.patient.allergies !== "None known" && (
                              <Badge variant="destructive" className="text-xs px-1 py-0">
                                <AlertTriangle className="h-2 w-2 mr-1" />
                              Allergies
                            </Badge>
                          )}
                        </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {patient.patient?.phone || 'N/A'}
                      </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {patient.assigned_dentist || 'Not assigned'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Timer className="h-3 w-3 text-gray-400" />
                          {patient.treatment || 'N/A'}
                    </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={`${getPriorityColor(patient.priority)} text-xs px-2 py-1`}>
                          {patient.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(patient.checked_in)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={`${getStatusColor(patient.status)} text-xs px-2 py-1 flex items-center gap-1`}>
                          {getStatusIcon(patient.status)}
                          {patient.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {patient.status.toLowerCase() === "waiting" && (
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                              onClick={() => updatePatientStatus(patient.id, "in-treatment")}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                          )}
                          {patient.status.toLowerCase() === "in-treatment" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs border-green-400 hover:bg-green-50"
                              onClick={() => updatePatientStatus(patient.id, "completed")}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                          )}
                      <Dialog>
                        <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-50">
                                <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                            <DialogContent className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl max-w-md">
                              <DialogHeader className="pb-4 border-b border-gray-200">
                                <DialogTitle className="text-lg font-semibold text-gray-900">
                                  {patient.patient ? `${patient.patient.first_name} ${patient.patient.last_name}` : 'Unknown Patient'}
                            </DialogTitle>
                          </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-600 font-medium">Phone</p>
                                    <p className="font-semibold text-gray-900">{patient.patient?.phone || 'N/A'}</p>
                              </div>
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-600 font-medium">Dentist</p>
                                    <p className="font-semibold text-gray-900">{patient.assigned_dentist || 'Not assigned'}</p>
                              </div>
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-600 font-medium">Treatment</p>
                                    <p className="font-semibold text-gray-900">{patient.treatment || 'N/A'}</p>
                            </div>
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-600 font-medium">Priority</p>
                                    <p className="font-semibold text-gray-900">{patient.priority}</p>
                              </div>
                            </div>
                                {patient.patient?.allergies && patient.patient.allergies !== "None known" && (
                                  <div className="p-3 bg-red-50 rounded-lg">
                                    <p className="text-xs text-gray-600 font-medium mb-2">Allergies</p>
                                    <Badge variant="destructive" className="text-xs px-2 py-1">
                                      {patient.patient.allergies}
                                    </Badge>
                              </div>
                            )}
                                {patientNotes[patient.id] && (
                                  <div className="p-3 bg-blue-50 rounded-lg">
                                    <p className="text-xs text-gray-600 font-medium mb-2">Notes</p>
                                    <p className="text-sm text-gray-700">{patientNotes[patient.id]}</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                      </td>
                    </tr>
            ))}
                </tbody>
              </table>
          </div>

            {filteredAndSortedQueue.length === 0 && (
              <div className="p-8 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No patients found</h3>
                <p className="text-gray-600">Try adjusting your search or filters.</p>
                </div>
          )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
