"use client"

import { useState, useEffect } from "react"
import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import { 
  Search,
  Plus,
  Phone,
  Clock, 
  CalendarIcon,
  User, 
  Edit,
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SortAsc,
  SortDesc,
  Eye,
  MoreHorizontal,
  RotateCcw,
  Trash2,
  Play,
  Timer,
  Bell,
  ArrowRight,
  Stethoscope,
  Award,
  Target,
  Zap,
  CalendarDays,
  UserCheck,
  AlertTriangle,
  Heart,
  Shield,
  FileText,
  Activity
} from "lucide-react"
import api from "@/lib/axiosConfig"

// Force dynamic rendering to avoid build-time environment variable issues
export const dynamic = 'force-dynamic'



export default function DentistAppointmentsPage() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Default to today's date for appointments
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState<string>(today)
  const [viewAllAppointments, setViewAllAppointments] = useState(false)
  
  const [filterStatus, setFilterStatus] = useState("all")
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  
  // Modal states
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  
  const [bookingForm, setBookingForm] = useState({
    patient_id: "",
    dentist_name: "",
    date: today, // Default to today
    time: "",
    treatment: "",
    duration: "30",
    status: "pending",
    notes: "",
  })
  const [patients, setPatients] = useState<any[]>([])
  const [dentists, setDentists] = useState<any[]>([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Sorting state
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Additional filters
  const [filterTreatment, setFilterTreatment] = useState("all")
  const [dateRangeStart, setDateRangeStart] = useState("")
  const [dateRangeEnd, setDateRangeEnd] = useState("")

  // Fetch appointments from Express backend
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true)
      
      try {
        console.log('Fetching appointments via API...')
        
        // Build query parameters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
          sortBy: sortBy,
          sortOrder: sortOrder
        })
        
        if (selectedDate && !viewAllAppointments) {
          params.append('date', selectedDate)
        }
        if (filterStatus !== "all") {
          params.append('status', filterStatus)
        }
        if (filterTreatment !== "all") {
          params.append('treatment', filterTreatment)
        }
        if (dateRangeStart) {
          params.append('dateRangeStart', dateRangeStart)
        }
        if (dateRangeEnd) {
          params.append('dateRangeEnd', dateRangeEnd)
        }
        if (searchTerm) {
          params.append('search', searchTerm)
        }
        if (viewAllAppointments) {
          params.append('viewAll', 'true')
        }
        
        const response = await api.get('/appointments', {
          params: Object.fromEntries(params)
        })
        
        console.log('Appointments API response:', response.data)
        
        if (response.data.success) {
          setAppointments(response.data.appointments || [])
          setTotalAppointments(response.data.totalCount || 0)
          setTotalPages(response.data.totalPages || 1)
          
          // Log each appointment to see the structure
          if (result.appointments && result.appointments.length > 0) {
            console.log('All appointments data:', result.appointments)
            console.log('First appointment patient data:', result.appointments[0]?.patient)
            console.log('First appointment dentist name:', result.appointments[0]?.dentist_name)
          }
        } else {
          console.error('Error fetching appointments:', result.error)
          toast({
            title: "Error",
            description: `Error fetching appointments: ${result.error}`,
            variant: "destructive",
          })
        }
      } catch (e) {
        console.error('Exception during appointments fetch:', e)
        toast({
          title: "Error",
          description: `Exception during appointments fetch: ${e}`,
          variant: "destructive",
        })
      }
      
      setLoading(false)
    }
    
    const fetchPatients = async () => {
      console.log('Fetching patients...')
      try {
        const response = await api.get('/patients', {
          params: { page: 1, pageSize: 1000 }
        })
        
        console.log('Patients API response:', response.data)
        
        if (response.data.success) {
          setPatients(response.data.patients || [])
          console.log('Patients loaded:', response.data.patients?.length || 0)
        } else {
          console.error('Error fetching patients:', response.data.error)
        }
      } catch (error) {
        console.error('Error fetching patients:', error)
      }
    }
    
    const fetchDentists = async () => {
      console.log('Fetching dentists...')
      
      try {
        // Fetch profiles with role = 'dentist' from Express backend
        const response = await api.get('/profiles', {
          params: { role: 'dentist' }
        })
        
        if (response.data.success) {
          const dentists = response.data.profiles || []
          console.log('Dentists loaded:', dentists.length)
          setDentists(dentists.map((p: any) => ({
            id: p.id,
            full_name: p.full_name,
            role: p.role
          })))
        }
      } catch (error) {
        console.error('Error fetching dentists:', error)
      }
    }
    
    fetchAppointments()
    fetchPatients()
    fetchDentists()
    
    // TODO: Implement real-time updates with WebSocket or polling if needed
  }, [selectedDate, filterStatus, filterTreatment, dateRangeStart, dateRangeEnd, searchTerm, sortBy, sortOrder, currentPage, pageSize, viewAllAppointments])

  useEffect(() => {
    // Update booking form date when selected date changes
    setBookingForm(prev => ({
      ...prev,
      date: selectedDate
    }))
  }, [selectedDate])

  // Add/Edit appointment
  const handleBookingChange = (field: string, value: string) => {
    setBookingForm((prev) => ({ ...prev, [field]: value }))
  }
  
  const handleBookAppointment = async () => {
    // Validate required fields
    if (!bookingForm.patient_id || bookingForm.patient_id.trim() === '') {
      toast({
        title: "Error",
        description: "Please select a patient",
        variant: "destructive",
      })
      return
    }
    
    if (!bookingForm.dentist_name || bookingForm.dentist_name.trim() === '') {
      toast({
        title: "Error",
        description: "Please enter a dentist name",
        variant: "destructive",
      })
      return
    }
    
    if (!bookingForm.date || bookingForm.date.trim() === '') {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      })
      return
    }
    
    if (!bookingForm.time || bookingForm.time.trim() === '') {
      toast({
        title: "Error",
        description: "Please select a time",
        variant: "destructive",
      })
      return
    }
    
    if (!bookingForm.treatment || bookingForm.treatment.trim() === '') {
      toast({
        title: "Error",
        description: "Please select a treatment",
        variant: "destructive",
      })
      return
    }
    
    setLoading(true)
    try {
      console.log('Booking appointment with data:', bookingForm)
      
      const response = await api.post('/appointments', {
        action: 'create',
        appointmentData: {
          patient_id: bookingForm.patient_id,
          dentist_name: bookingForm.dentist_name,
          date: bookingForm.date,
          time: bookingForm.time,
          treatment: bookingForm.treatment,
          duration: bookingForm.duration,
          status: bookingForm.status,
          notes: bookingForm.notes,
        }
      })
      
      console.log('Appointment creation result:', response.data)
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Appointment booked successfully!",
        })
        setIsBookingDialogOpen(false)
        setBookingForm({
          patient_id: "",
          dentist_name: "",
          date: today, // Reset to today
          time: "",
          treatment: "",
          duration: "30",
          status: "pending",
          notes: "",
        })
        
        // Refresh the appointments list
        const refreshResponse = await api.get('/appointments', {
          params: { page: 1, pageSize: 100, viewAll: true }
        })
        
        if (refreshResponse.data.success) {
          setAppointments(refreshResponse.data.appointments || [])
        }
      } else {
        toast({
          title: "Error",
          description: `Error booking appointment: ${response.data.error || 'Unknown error'}`,
          variant: "destructive",
        })
      }
    } catch (e) {
      console.error('Exception during appointment booking:', e)
      toast({
        title: "Error",
        description: `Exception during appointment booking: ${e}`,
        variant: "destructive",
      })
    }
    setLoading(false)
  }
  
  const handleEditAppointment = (appointment: any) => {
    setBookingForm({
      patient_id: appointment.patient_id,
      dentist_name: appointment.dentist_name || appointment.dentist?.full_name || "",
      date: appointment.date,
      time: appointment.time,
      treatment: appointment.treatment,
      duration: appointment.duration,
      status: appointment.status,
      notes: appointment.notes,
    })
    setIsBookingDialogOpen(true)
  }
  
  const handleCancelAppointment = async (appointment: any) => {
    setSelectedAppointment(appointment)
    setIsCancelDialogOpen(true)
  }

  const handleConfirmCancelAppointment = async () => {
    if (!selectedAppointment) return
    
    setLoading(true)
    try {
      const response = await api.put(`/appointments/${selectedAppointment.id}`, {
        action: 'update',
        appointmentData: { status: 'cancelled' }
      })
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Appointment cancelled successfully!",
        })
        
        // Refresh the appointments list
        const refreshResponse = await api.get('/appointments', {
          params: { page: 1, pageSize: 100, viewAll: true }
        })
        
        if (refreshResponse.data.success) {
          setAppointments(refreshResponse.data.appointments || [])
        }
      } else {
        toast({
          title: "Error",
          description: `Error cancelling appointment: ${response.data.error || 'Unknown error'}`,
          variant: "destructive",
        })
      }
    } catch (e) {
      console.error('Exception during appointment cancellation:', e)
      toast({
        title: "Error",
        description: `Exception during appointment cancellation: ${e}`,
        variant: "destructive",
      })
    }
    setLoading(false)
    setIsCancelDialogOpen(false)
    setSelectedAppointment(null)
  }

  const handleDeleteAppointment = async (appointment: any) => {
    setSelectedAppointment(appointment)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDeleteAppointment = async () => {
    if (!selectedAppointment) return
    
    setLoading(true)
    try {
      console.log('Deleting appointment:', selectedAppointment.id)
      
      const response = await api.delete(`/appointments/${selectedAppointment.id}`)
      
      if (response.data.success) {
        console.log('Appointment deleted successfully')
        toast({
          title: "Success",
          description: "Appointment deleted successfully!",
        })
        
        // Refresh the appointments list
        const refreshResponse = await api.get('/appointments', {
          params: { page: 1, pageSize: 100, viewAll: true }
        })
        
        if (refreshResponse.data.success) {
          setAppointments(refreshResponse.data.appointments || [])
        }
      } else {
        toast({
          title: "Error",
          description: `Error deleting appointment: ${response.data.error || 'Unknown error'}`,
          variant: "destructive",
        })
      }
    } catch (e) {
      console.error('Exception during appointment deletion:', e)
      toast({
        title: "Error",
        description: `Exception during appointment deletion: ${e}`,
        variant: "destructive",
      })
    }
    setLoading(false)
    setIsDeleteDialogOpen(false)
    setSelectedAppointment(null)
  }

  const handleConfirmAppointment = async (appointment: any) => {
    setSelectedAppointment(appointment)
    setIsConfirmDialogOpen(true)
  }

  const handleConfirmConfirmAppointment = async () => {
    if (!selectedAppointment) return
    
    setLoading(true)
    try {
      const response = await api.put(`/appointments/${selectedAppointment.id}`, {
        action: 'update',
        appointmentData: { status: 'confirmed' }
      })
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Appointment confirmed successfully!",
        })
        
        // Refresh the appointments list
        const refreshResponse = await api.get('/appointments', {
          params: { page: 1, pageSize: 100, viewAll: true }
        })
        
        if (refreshResponse.data.success) {
          setAppointments(refreshResponse.data.appointments || [])
        }
      } else {
        toast({
          title: "Error",
          description: `Error confirming appointment: ${response.data.error || 'Unknown error'}`,
          variant: "destructive",
        })
      }
    } catch (e) {
      console.error('Exception during appointment confirmation:', e)
      toast({
        title: "Error",
        description: `Exception during appointment confirmation: ${e}`,
        variant: "destructive",
      })
    }
    setLoading(false)
    setIsConfirmDialogOpen(false)
    setSelectedAppointment(null)
  }

  const handleViewAppointment = (appointment: any) => {
    setSelectedAppointment(appointment)
    setIsViewDialogOpen(true)
  }

  // Start treatment function (dentist-specific)
  const handleStartTreatment = async (appointment: any) => {
    setLoading(true)
    try {
      const response = await api.put(`/appointments/${appointment.id}`, {
        action: 'update',
        appointmentData: { status: 'in-progress' }
      })
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Treatment started successfully!",
        })
        
        // Refresh the appointments list
        const refreshResponse = await api.get('/appointments', {
          params: { page: 1, pageSize: 100, viewAll: true }
        })
        
        if (refreshResponse.data.success) {
          setAppointments(refreshResponse.data.appointments || [])
        }
      } else {
        toast({
          title: "Error",
          description: `Error starting treatment: ${response.data.error || 'Unknown error'}`,
          variant: "destructive",
        })
      }
    } catch (e) {
      console.error('Exception during treatment start:', e)
      toast({
        title: "Error",
        description: `Exception during treatment start: ${e}`,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  // Complete treatment function (dentist-specific)
  const handleCompleteTreatment = async (appointment: any) => {
    setLoading(true)
    try {
      const response = await api.put(`/appointments/${appointment.id}`, {
        action: 'update',
        appointmentData: { status: 'completed' }
      })
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Treatment completed successfully!",
        })
        
        // Refresh the appointments list
        const refreshResponse = await api.get('/appointments', {
          params: { page: 1, pageSize: 100, viewAll: true }
        })
        
        if (refreshResponse.data.success) {
          setAppointments(refreshResponse.data.appointments || [])
        }
      } else {
        toast({
          title: "Error",
          description: `Error completing treatment: ${response.data.error || 'Unknown error'}`,
          variant: "destructive",
        })
      }
    } catch (e) {
      console.error('Exception during treatment completion:', e)
      toast({
        title: "Error",
        description: `Exception during treatment completion: ${e}`,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  // Dynamic stats
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Pagination helpers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedDate(today) // Reset to today
    setViewAllAppointments(false) // Reset to date-filtered view
    setFilterStatus("all")
    setFilterTreatment("all")
    setDateRangeStart("")
    setDateRangeEnd("")
    setCurrentPage(1)
    setSortBy("date")
    setSortOrder("asc")
    setPageSize(20)
    
    // Show success toast
    toast({
      title: "Filters Reset",
      description: "All filters have been reset to default values.",
    })
  }

  // Debug function to test data fetching
  const debugFetchAll = async () => {
    console.log('=== COMPREHENSIVE DEBUG: Dentist Appointments Page ===')
    
    // Check 0: Current user authentication
    console.log('0. Checking current user authentication...')
    // Get user from localStorage (set during login)
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null
    console.log('Current user:', user)
    console.log('Auth error:', authError)
    
    if (user) {
      console.log('User ID:', user.id)
      console.log('User email:', user.email)
      console.log('User metadata:', user.user_metadata)
    }
    
    // Debug function - use Express backend
    console.log('1. Checking appointments via Express backend...')
    try {
      const response = await api.get('/appointments', {
        params: { page: 1, pageSize: 100, viewAll: true }
      })
      
      console.log('Appointments count:', response.data.totalCount || 0)
      if (response.data.appointments && response.data.appointments.length > 0) {
        console.log('Sample appointment:', response.data.appointments[0])
      }
    } catch (error) {
      console.error('Debug fetch error:', error)
    }
    
    // Check 4: Current state values
    console.log('4. Current state values:')
    console.log('- selectedDate:', selectedDate)
    console.log('- viewAllAppointments:', viewAllAppointments)
    console.log('- filterStatus:', filterStatus)
    console.log('- filterTreatment:', filterTreatment)
    console.log('- searchTerm:', searchTerm)
    console.log('- currentPage:', currentPage)
    console.log('- pageSize:', pageSize)
    
    console.log('=== DEBUG COMPLETED ===')
  }

  // Function to create test appointments
  const createTestAppointments = async () => {
    console.log('=== CREATING TEST APPOINTMENTS ===')
    
    try {
      // Get patients from Express backend
      const patientsResponse = await api.get('/patients', {
        params: { page: 1, pageSize: 2 }
      })
      
      if (!patientsResponse.data.success || !patientsResponse.data.patients || patientsResponse.data.patients.length === 0) {
        console.error('No patients available for appointments')
        toast({
          title: "Error",
          description: "No patients available. Please create patients first.",
          variant: "destructive",
        })
        return
      }
      
      const patients = patientsResponse.data.patients
      console.log('Using patients for appointments:', patients)
      
      // Create test appointments via Express backend
      const testAppointments = [
        {
          patient_id: patients[0].id,
          dentist_name: 'Dr. Feisal',
          date: '2025-07-24',
          time: '09:00',
          treatment: 'consultation',
          duration: '30',
          status: 'confirmed',
          notes: 'Test appointment 1'
        },
        {
          patient_id: patients[1]?.id || patients[0].id,
          dentist_name: 'Dr. Feisal',
          date: '2025-07-24',
          time: '10:00',
          treatment: 'cleaning',
          duration: '45',
          status: 'pending',
          notes: 'Test appointment 2'
        },
        {
          patient_id: patients[0].id,
          dentist_name: 'Dr. Feisal',
          date: '2025-07-25',
          time: '14:00',
          treatment: 'filling',
          duration: '60',
          status: 'scheduled',
          notes: 'Test appointment 3'
        }
      ]
      
      console.log('Creating test appointments:', testAppointments)
      
      // Create appointments one by one
      let createdCount = 0
      for (const apt of testAppointments) {
        try {
          await api.post('/appointments', {
            action: 'create',
            appointmentData: apt
          })
          createdCount++
        } catch (error) {
          console.error('Error creating appointment:', error)
        }
      }
      
      if (createdCount > 0) {
        console.log('Successfully created test appointments:', createdCount)
        toast({
          title: "Success",
          description: `Created ${createdCount} test appointments!`,
        })
        
        // Refresh the appointments list
        const refreshResponse = await api.get('/appointments', {
          params: { page: 1, pageSize: 100, viewAll: true }
        })
        
        if (refreshResponse.data.success) {
          setAppointments(refreshResponse.data.appointments || [])
          setTotalAppointments(refreshResponse.data.totalCount || 0)
          setTotalPages(refreshResponse.data.totalPages || 1)
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to create test appointments",
          variant: "destructive",
        })
      }
      
    } catch (error) {
      console.error('Exception creating test appointments:', error)
      toast({
        title: "Error",
        description: `Exception creating test appointments: ${error}`,
        variant: "destructive",
      })
    }
  }

  // Calculate statistics based on current view
  const todayAppointments = viewAllAppointments ? appointments : appointments.filter(apt => apt.date === selectedDate)
  const totalToday = todayAppointments.length
  const confirmedToday = todayAppointments.filter(apt => apt.status === "confirmed").length
  const pendingToday = todayAppointments.filter(apt => apt.status === "pending").length
  const cancelledToday = todayAppointments.filter(apt => apt.status === "cancelled").length
  const inProgressToday = todayAppointments.filter(apt => apt.status === "in-progress").length
  const completedToday = todayAppointments.filter(apt => apt.status === "completed").length

  // Filter appointments for display (client-side filtering for current page)
  const filteredAppointments = appointments.filter(appointment => {
    const patientFullName = appointment.patient?.first_name && appointment.patient?.last_name ? 
      `${appointment.patient.first_name} ${appointment.patient.last_name}` : ''
    
    const matchesSearch = !searchTerm || 
      patientFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient?.phone?.includes(searchTerm) ||
      appointment.treatment?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || appointment.status === filterStatus
    const matchesTreatment = filterTreatment === "all" || appointment.treatment === filterTreatment
    
    return matchesSearch && matchesStatus && matchesTreatment
  })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800 border border-green-200"
      case "scheduled":
        return "bg-blue-100 text-blue-800 border border-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border border-red-200"
      case "completed":
        return "bg-gray-100 text-gray-800 border border-gray-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border border-blue-200"
      default:
        return "bg-blue-100 text-blue-800 border border-blue-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />
      case "scheduled":
        return <CalendarIcon className="h-4 w-4" />
      case "pending":
        return <AlertCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "in-progress":
        return <Clock className="h-4 w-4" />
      default:
        return <CalendarIcon className="h-4 w-4" />
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-4 space-y-4">
          {/* Compact Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  My Appointments
                </h1>
              <p className="text-gray-600 text-sm lg:text-base">
                Welcome back, Doctor! Here's your schedule for today.
              </p>
              
              {/* Date Selector */}
              <div className="flex items-center gap-3 mt-3">
                <Label className="text-sm font-medium text-gray-700">View Appointments for:</Label>
                <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-9 w-40 text-sm border-gray-200"
                  disabled={viewAllAppointments}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(today)
                    setViewAllAppointments(false)
                  }}
                  className="h-9 px-3 text-xs"
                  disabled={viewAllAppointments}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tomorrow = new Date()
                    tomorrow.setDate(tomorrow.getDate() + 1)
                    setSelectedDate(tomorrow.toISOString().split('T')[0])
                    setViewAllAppointments(false)
                  }}
                  className="h-9 px-3 text-xs"
                  disabled={viewAllAppointments}
                >
                  Tomorrow
                </Button>
                <Button
                  variant={viewAllAppointments ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewAllAppointments(!viewAllAppointments)}
                  className="h-9 px-3 text-xs"
                >
                  {viewAllAppointments ? "Hide All" : "See All Appointments"}
                </Button>
                </div>
              </div>
            <div className="flex gap-2">
              <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="h-10 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl">
                  <DialogHeader className="pb-6 border-b border-gray-200">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Schedule New Appointment
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="patient" className="text-gray-700 font-medium">Patient</Label>
                        <Select value={bookingForm.patient_id} onValueChange={v => handleBookingChange('patient_id', v)}>
                          <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-2">
                            {patients.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.first_name?.trim() && p.last_name?.trim() ? `${p.first_name.trim()} ${p.last_name.trim()}` : 'Unknown Patient'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
            </div>
                      <div className="space-y-3">
                        <Label htmlFor="dentist" className="text-gray-700 font-medium">Dentist</Label>
                        <Input
                          id="dentist"
                          type="text"
                          placeholder="Enter dentist name"
                          value={bookingForm.dentist_name}
                          onChange={e => handleBookingChange('dentist_name', e.target.value)}
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                        />
              </div>
            </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="date" className="text-gray-700 font-medium">Date</Label>
                        <Input id="date" type="date" className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl" value={bookingForm.date} onChange={e => handleBookingChange('date', e.target.value)} />
          </div>
                      <div className="space-y-3">
                        <Label htmlFor="time" className="text-gray-700 font-medium">Time</Label>
                        <Input id="time" type="time" className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl" value={bookingForm.time} onChange={e => handleBookingChange('time', e.target.value)} />
                        </div>
                      <div className="space-y-3">
                        <Label htmlFor="duration" className="text-gray-700 font-medium">Duration (min)</Label>
                        <Select value={bookingForm.duration} onValueChange={v => handleBookingChange('duration', v)}>
                          <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                            <SelectValue placeholder="Duration" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-2">
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="90">1.5 hours</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      </div>
                    <div className="space-y-3">
                      <Label htmlFor="treatment" className="text-gray-700 font-medium">Treatment</Label>
                      <Select value={bookingForm.treatment} onValueChange={v => handleBookingChange('treatment', v)}>
                        <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                          <SelectValue placeholder="Select treatment" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2">
                          <SelectItem value="cleaning">Routine Cleaning</SelectItem>
                          <SelectItem value="consultation">Consultation</SelectItem>
                          <SelectItem value="filling">Filling</SelectItem>
                          <SelectItem value="root-canal">Root Canal</SelectItem>
                          <SelectItem value="crown">Crown Placement</SelectItem>
                          <SelectItem value="extraction">Tooth Extraction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                        <div className="space-y-3">
                      <Label htmlFor="notes" className="text-gray-700 font-medium">Notes</Label>
                      <Textarea id="notes" placeholder="Additional notes or instructions" className="border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl min-h-[80px]" value={bookingForm.notes} onChange={e => handleBookingChange('notes', e.target.value)} />
                              </div>
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)} className="h-12 px-6 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-xl">
                        Cancel
                      </Button>
                      <Button onClick={handleBookAppointment} className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                        Schedule Appointment
                      </Button>
                          </div>
                            </div>
                </DialogContent>
              </Dialog>
                        <Button 
                          variant="outline" 
                className="h-10 px-4 border-2 border-gray-200 hover:border-purple-500 transition-colors duration-200 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white/90"
                onClick={resetFilters}
                        >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
                        </Button>
                          <Button 
                            variant="outline" 
                className="h-10 px-4 border-2 border-purple-200 hover:border-purple-400 text-purple-700 hover:text-purple-800 transition-colors duration-200 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white/90"
                onClick={debugFetchAll}
                          >
                Debug Data
                          </Button>
                          <Button 
                            variant="outline" 
                className="h-10 px-4 border-2 border-blue-200 hover:border-blue-400 text-blue-700 hover:text-blue-800 transition-colors duration-200 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white/90"
                onClick={() => {
                  console.log('Manually triggering fetchAppointments...');
                  // Manually trigger the fetchAppointments function
                  const manualFetch = async () => {
                    setLoading(true)
                    
                    try {
                      console.log('Manual fetch: Fetching appointments...')
                      
                      // Fetch appointments via Express backend with filters
                      const params: any = { page: 1, pageSize: 100 }
                      if (selectedDate && !viewAllAppointments) {
                        params.date = selectedDate
                      }
                      if (filterStatus !== "all") {
                        params.status = filterStatus
                      }
                      if (filterTreatment !== "all") {
                        params.treatment = filterTreatment
                      }
                      if (dateRangeStart) {
                        params.dateRangeStart = dateRangeStart
                      }
                      if (dateRangeEnd) {
                        params.dateRangeEnd = dateRangeEnd
                      }
                      if (searchTerm) {
                        params.search = searchTerm
                      }
                      params.sortBy = sortBy
                      params.sortOrder = sortOrder
                      params.page = currentPage
                      params.pageSize = pageSize
                      
                      const response = await api.get('/appointments', { params })
                      
                      console.log('Manual fetch result:', response.data)
                      
                      if (response.data.success) {
                        console.log('Manual fetch success - appointments found:', response.data.appointments?.length || 0)
                        setAppointments(response.data.appointments || [])
                        setTotalAppointments(response.data.totalCount || 0)
                        setTotalPages(response.data.totalPages || 1)
                      } else {
                        console.error('Error fetching appointments:', response.data.error)
                      }
                    } catch (e) {
                      console.error('Exception during manual fetch:', e)
                    }
                    
                    setLoading(false)
                  }
                  
                  manualFetch()
                }}
                          >
                Manual Fetch
                          </Button>
                          {/* <Button 
                            variant="outline" 
                className="h-10 px-4 border-2 border-green-200 hover:border-green-400 text-green-700 hover:text-green-800 transition-colors duration-200 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white/90"
                onClick={createTestAppointments}
                          >
                Create Test Data
                          </Button> */}
                      </div>
                    </div>

          {/* Collapsible Statistics */}
          <Collapsible open={true}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full text-left justify-between p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white/90">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {viewAllAppointments ? "All Appointments Statistics" : (selectedDate === today ? "Today's Statistics" : `Statistics for ${selectedDate}`)}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                {loading ? (
                  <Card className="rounded-lg border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-4 text-center">
                      <div className="text-gray-500">Loading...</div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card className="rounded-lg border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total</p>
                            <p className="text-xl font-bold text-gray-900">{totalToday}</p>
                        </div>
                          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
                            <CalendarIcon className="h-5 w-5 text-blue-500" />
                      </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Confirmed</p>
                            <p className="text-xl font-bold text-green-900">{confirmedToday}</p>
                      </div>
                          <div className="p-2 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Pending</p>
                            <p className="text-xl font-bold text-yellow-900">{pendingToday}</p>
                    </div>
                          <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50">
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                      </div>
                    </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">In Progress</p>
                            <p className="text-xl font-bold text-blue-900">{inProgressToday}</p>
                  </div>
                          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                            <Clock className="h-5 w-5 text-blue-500" />
                  </div>
              </div>
            </CardContent>
          </Card>
                    <Card className="rounded-lg border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Completed</p>
                            <p className="text-xl font-bold text-gray-900">{completedToday}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-gradient-to-br from-gray-50 to-slate-50">
                            <CheckCircle className="h-5 w-5 text-gray-500" />
                          </div>
                          </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Cancelled</p>
                            <p className="text-xl font-bold text-red-900">{cancelledToday}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-gradient-to-br from-red-50 to-rose-50">
                            <XCircle className="h-5 w-5 text-red-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
                      </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Enhanced Search and Filters */}
          <div className="bg-white/95 backdrop-blur-xl rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {viewAllAppointments ? `All Appointments (${totalToday})` : `Appointments for ${selectedDate === today ? "Today" : selectedDate} (${totalToday})`}
                  </h2>
                  <Badge variant="outline" className="px-2 py-1 rounded-full text-xs">
                    Page {currentPage} of {totalPages}
                  </Badge>
                    </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search patients, phone, or treatment..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-9 border-gray-200 focus:border-blue-500"
                    />
                          </div>
                  
                  {/* Status Filter */}
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-9 w-32 border-gray-200">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Treatment Filter */}
                  <Select value={filterTreatment} onValueChange={setFilterTreatment}>
                    <SelectTrigger className="h-9 w-32 border-gray-200">
                      <SelectValue placeholder="Treatment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Treatments</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="filling">Filling</SelectItem>
                      <SelectItem value="root-canal">Root Canal</SelectItem>
                      <SelectItem value="crown">Crown</SelectItem>
                      <SelectItem value="extraction">Extraction</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-9 w-32 border-gray-200">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="time">Time</SelectItem>
                      <SelectItem value="name">Patient Name</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="treatment">Treatment</SelectItem>
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
                  
                  {/* Export */}
                  <Button variant="outline" size="sm" className="h-9 px-3 border-gray-200">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                          </div>
                          </div>
                          </div>
            
            {/* Date Range Filters */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-gray-700">Date Range:</Label>
                  <Input
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className="h-8 w-32 text-sm border-gray-200"
                    placeholder="Start date"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className="h-8 w-32 text-sm border-gray-200"
                    placeholder="End date"
                  />
                          </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-gray-700">Page Size:</Label>
                  <Select value={pageSize.toString()} onValueChange={(v) => handlePageSizeChange(Number(v))}>
                    <SelectTrigger className="h-8 w-20 text-sm border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                        </div>
                      </div>
                    </div>
                  </div>

          {/* Compact Appointments Table */}
          <div className="bg-white/95 backdrop-blur-xl rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-16 text-center">
                <div className="text-gray-500">
                  <h3 className="text-xl font-bold mb-3 text-gray-700">Loading appointments...</h3>
                  <p className="text-gray-600">Please wait while we fetch the latest appointments.</p>
                      </div>
                    </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="p-16 text-center">
                <div className="text-gray-500">
                  <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold mb-3 text-gray-700">No appointments found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search criteria or schedule a new appointment.</p>
                  <Button 
                    className="h-10 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg"
                    onClick={() => setIsBookingDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule New Appointment
                  </Button>
                      </div>
                    </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Treatment</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAppointments.map((appointment) => (
                        <tr key={appointment.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border-2 border-gray-100">
                                <AvatarImage src="/placeholder.svg" alt={`${appointment.patient?.first_name} ${appointment.patient?.last_name}`} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold">
                                  {appointment.patient?.first_name && appointment.patient?.last_name ? 
                                    `${appointment.patient.first_name[0]}${appointment.patient.last_name[0]}` : "N/A"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {appointment.patient?.first_name?.trim() && appointment.patient?.last_name?.trim() ? 
                                    `${appointment.patient.first_name.trim()} ${appointment.patient.last_name.trim()}` : 'Unknown Patient'}
                  </div>
                    </div>
                  </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {appointment.patient?.phone || 'N/A'}
                      </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="font-semibold text-gray-900">{appointment.date}</div>
                              <div className="text-gray-600">{formatTime(appointment.time)}</div>
                      </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div className="font-medium capitalize">{appointment.treatment || 'N/A'}</div>
                            {appointment.notes && (
                              <div className="text-xs text-gray-500 mt-1 truncate max-w-32" title={appointment.notes}>
                                Notes: {appointment.notes}
                    </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              {appointment.duration} min
                  </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge className={`${getStatusColor(appointment.status)} text-xs px-2 py-1 flex items-center gap-1 w-fit`}>
                              {getStatusIcon(appointment.status)}
                              {appointment.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs border-gray-300 hover:bg-gray-50"
                                onClick={() => handleViewAppointment(appointment)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                  </Button>
                              {appointment.status.toLowerCase() === "confirmed" && (
                                <Button
                                  size="sm"
                                  className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleStartTreatment(appointment)}
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Start
                  </Button>
                              )}
                              {appointment.status.toLowerCase() === "in-progress" && (
                                <Button
                                  size="sm"
                                  className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => handleCompleteTreatment(appointment)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Complete
                    </Button>
                  )}
                              {appointment.status.toLowerCase() === "pending" && (
                                <Button
                                  size="sm"
                                  className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleConfirmAppointment(appointment)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Confirm
                    </Button>
                  )}
                              {appointment.status.toLowerCase() !== "cancelled" && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 px-3 text-xs"
                                  onClick={() => handleCancelAppointment(appointment)}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 px-3 text-xs bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleDeleteAppointment(appointment)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalToday)} of {totalToday} appointments
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 px-3"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                          if (page > totalPages) return null
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className="h-8 w-8 p-0"
                            >
                              {page}
                            </Button>
                          )
                        })}
                      </div>

                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-8 px-3"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Confirm Appointment */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to confirm the appointment for{" "}
              {selectedAppointment?.patient?.first_name && selectedAppointment?.patient?.last_name ? 
                `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 'this patient'}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmConfirmAppointment} disabled={loading}>
              {loading ? "Confirming..." : "Confirm"}
            </Button>
          </DialogFooter>
              </DialogContent>
            </Dialog>

      {/* Confirmation Modal for Cancel Appointment */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the appointment for{" "}
              {selectedAppointment?.patient?.first_name && selectedAppointment?.patient?.last_name ? 
                `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 'this patient'}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              No, Keep
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancelAppointment} disabled={loading}>
              {loading ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal for Delete Appointment */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete the appointment for{" "}
              {selectedAppointment?.patient?.first_name && selectedAppointment?.patient?.last_name ? 
                `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 'this patient'}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteAppointment} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Appointment Details Modal */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Patient</Label>
                  <p className="text-lg font-semibold">
                    {selectedAppointment.patient?.first_name && selectedAppointment.patient?.last_name ? 
                      `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 'Unknown Patient'}
                  </p>
        </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="text-lg">{selectedAppointment.patient?.phone || 'N/A'}</p>
      </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date</Label>
                  <p className="text-lg">{selectedAppointment.date}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Time</Label>
                  <p className="text-lg">{formatTime(selectedAppointment.time)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Treatment</Label>
                  <p className="text-lg capitalize">{selectedAppointment.treatment || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Duration</Label>
                  <p className="text-lg">{selectedAppointment.duration} minutes</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={`${getStatusColor(selectedAppointment.status)} text-sm px-2 py-1 flex items-center gap-1 w-fit`}>
                    {getStatusIcon(selectedAppointment.status)}
                    {selectedAppointment.status}
                  </Badge>
                </div>
              </div>
              {selectedAppointment.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="text-lg bg-gray-50 p-3 rounded-lg">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
