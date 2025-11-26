"use client"

import { useState, useEffect, useCallback } from "react"
import api from "@/lib/axiosConfig"

// Force dynamic rendering to avoid build-time environment variable issues
export const dynamic = 'force-dynamic'

import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Plus, Filter, Phone, Mail, Calendar, FileText, Edit, Eye, User, Heart, Clock, Trash2, Grid3X3, List, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { addDays, format } from "date-fns"
import { DateRange } from "react-day-picker"
import { useToast } from "@/hooks/use-toast"


export default function PatientsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingPatient, setEditingPatient] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<any>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPatients, setTotalPatients] = useState(0)
  const [pageSize] = useState(20)
  
  // View and filter state
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    dateRange: undefined as DateRange | undefined
  })
  const [showFilters, setShowFilters] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    phone: "",
    avatar: ""
  })

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page on search
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch patients from Express backend with pagination and filters
  const fetchPatients = useCallback(async (search: string, page: number, filters: any) => {
    setLoading(true)
    
    try {
      const response = await api.get('/patients', {
        params: {
          page: page.toString(),
          pageSize: pageSize.toString(),
          search: search,
          status: filters.status || '',
          priority: filters.priority || ''
        }
      })

      if (response.data.success) {
        setPatients(response.data.patients || [])
        setTotalPatients(response.data.totalCount || 0)
        setTotalPages(Math.ceil((response.data.totalCount || 0) / pageSize))
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast({
        title: "Error",
        description: "Failed to fetch patients",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  useEffect(() => {
    fetchPatients(debouncedSearchTerm, currentPage, filters)
  }, [debouncedSearchTerm, currentPage, filters, fetchPatients])

  // Add form handlers:
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSavePatient = async () => {
    setLoading(true)
    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.age || !formData.phone) {
        toast({
          title: "Validation Error",
          description: "First name, last name, age, and phone number are required",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const patientData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        phone: formData.phone,
        // Add date_of_birth if age is provided
        ...(formData.age && {
          date_of_birth: (() => {
            const currentYear = new Date().getFullYear()
            const birthYear = currentYear - parseInt(formData.age)
            return `${birthYear}-01-01`
          })()
        })
      }

      console.log('Attempting to save patient with data:', patientData)

      if (isEditMode && editingPatient) {
        // Update existing patient
        console.log('Updating patient:', editingPatient.id)
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

          const response = await api.put(`/patients/${editingPatient.id}`, {
            action: 'update',
            patientData: {
              id: editingPatient.id,
              ...patientData
            }
          })

          console.log('Update response result:', response.data)

          if (response.data.success) {
            // Update local state immediately
            setPatients(prevPatients => prevPatients.map(patient => 
              patient.id === editingPatient.id ? response.data.patient : patient
            ))
          }

          toast({
            title: "Patient updated successfully!",
            description: "Patient updated successfully!",
          })
        } catch (fetchError) {
          console.error('Fetch error during update:', fetchError)
          console.error('Error details:', {
            message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
            stack: fetchError instanceof Error ? fetchError.stack : undefined,
            error: fetchError
          })
          
          // Handle timeout specifically
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.')
          }
          
          throw fetchError
        }
      } else {
        // Create new patient
        console.log('Creating new patient')
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

          const response = await api.post('/patients', {
            action: 'create',
            patientData
          })

          console.log('Create response result:', response.data)

          if (response.data.success) {
            console.log('Successfully created patient:', response.data.patient)

            // Add new patient to local state immediately (at the beginning since we sort by created_at desc)
            setPatients(prevPatients => [response.data.patient, ...prevPatients])
          }
          
          // Update total count
          setTotalPatients(prev => prev + 1)

          toast({
            title: "Patient added successfully!",
            description: "Patient added successfully!",
          })
        } catch (fetchError) {
          console.error('Fetch error during create:', fetchError)
          console.error('Error details:', {
            message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
            stack: fetchError instanceof Error ? fetchError.stack : undefined,
            error: fetchError
          })
          
          // Handle timeout specifically
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.')
          }
          
          throw fetchError
        }
      }
      setIsAddDialogOpen(false)
      setIsEditMode(false)
      setFormData({
        firstName: "",
        lastName: "",
        age: "",
        gender: "",
        phone: "",
        avatar: ""
      })
    } catch (e) {
      console.error('Error saving patient:', e)
      console.error('Error details:', {
        message: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined,
        error: e
      })
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      toast({
        title: "Error saving patient",
        description: errorMessage,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleEditPatient = (patient: any) => {
    setIsEditMode(true)
    setEditingPatient(patient)
    setFormData({
      firstName: patient.first_name || "",
      lastName: patient.last_name || "",
      age: patient.age?.toString() || "",
      gender: patient.gender || "",
      phone: patient.phone || "",
      avatar: patient.avatar || ""
    })
    setIsAddDialogOpen(true)
  }

  const handleDeletePatient = (patient: any) => {
    setPatientToDelete(patient)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return
    
    setLoading(true)
    try {
      const response = await api.delete(`/patients/${patientToDelete.id}`)

      if (response.data.success) {
        // Remove from local state immediately
        setPatients(prevPatients => prevPatients.filter(patient => patient.id !== patientToDelete.id))
        
        // Update total count
        setTotalPatients(prev => prev - 1)
        
        toast({
          title: "Patient deleted successfully!",
          description: "Patient deleted successfully!",
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error deleting patient",
        description: "Error deleting patient. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsDeleteDialogOpen(false)
      setPatientToDelete(null)
    }
  }

  // Batch actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPatients(new Set(patients.map(p => p.id)))
    } else {
      setSelectedPatients(new Set())
    }
  }

  const handleSelectPatient = (patientId: string, checked: boolean) => {
    const newSelected = new Set(selectedPatients)
    if (checked) {
      newSelected.add(patientId)
    } else {
      newSelected.delete(patientId)
    }
    setSelectedPatients(newSelected)
  }

  const handleBatchDelete = async () => {
    if (selectedPatients.size === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedPatients.size} patients?`)) return
    
    setLoading(true)
    try {
      // Delete patients one by one (or implement batch delete endpoint)
      for (const patientId of selectedPatients) {
        await api.delete(`/patients/${patientId}`)
      }

      // Remove from local state immediately
      setPatients(prevPatients => prevPatients.filter(patient => !selectedPatients.has(patient.id)))
      
      // Update total count
      setTotalPatients(prev => prev - selectedPatients.size)
      
      toast({
        title: `${selectedPatients.size} patients deleted successfully!`,
        description: `${selectedPatients.size} patients deleted successfully!`,
      })
      setSelectedPatients(new Set())
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error deleting patients",
        description: "Error deleting patients. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBatchUpdatePriority = async (priority: string) => {
    if (selectedPatients.size === 0) return
    
    setLoading(true)
    try {
      // Update patients one by one (or implement batch update endpoint)
      for (const patientId of selectedPatients) {
        await api.put(`/patients/${patientId}`, {
          action: 'update',
          patientData: { priority }
        })
      }

      // Update local state immediately
      setPatients(prevPatients => prevPatients.map(patient => 
        selectedPatients.has(patient.id) ? { ...patient, priority } : patient
      ))
      
      toast({
        title: `${selectedPatients.size} patients updated successfully!`,
        description: `${selectedPatients.size} patients updated successfully!`,
      })
      setSelectedPatients(new Set())
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error updating patients",
        description: "Error updating patients. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)
  const firstPage = () => goToPage(1)
  const lastPage = () => goToPage(totalPages)

  // patients state is now always from Express backend

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-700 border-green-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-gradient-to-br from-purple-500 to-pink-500",
      "bg-gradient-to-br from-blue-500 to-cyan-500",
      "bg-gradient-to-br from-green-500 to-emerald-500",
      "bg-gradient-to-br from-orange-500 to-red-500",
      "bg-gradient-to-br from-indigo-500 to-purple-500",
    ]
    return colors[name.length % colors.length]
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Patient Management
              </h1>
              <p className="text-slate-600 text-lg">Manage patient records and information with ease</p>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Patient
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Patients</p>
                    <p className="text-3xl font-bold text-gray-900">{totalPatients}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Active Patients</p>
                    <p className="text-3xl font-bold text-gray-900">{patients.filter((p) => p.status === "Active").length}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl">
                    <Heart className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">This Month</p>
                    <p className="text-3xl font-bold text-gray-900">12</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-xl">
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Outstanding</p>
                    <div className="text-2xl font-bold text-gray-900">
                      KES {(patients.reduce((sum, p) => sum + (p.balance || 0), 0)).toLocaleString()}
                  </div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-xl">
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sticky Header with Search, Filters, and Controls */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg">
            <Card className="border-0 shadow-none">
            <CardContent className="p-6">
                {/* Search and View Controls */}
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    placeholder="Search patients by name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-12 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-lg"
                  />
                </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                      <Button
                        variant={viewMode === 'table' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                        className="rounded-none border-0"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'cards' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('cards')}
                        className="rounded-none border-0"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowFilters(!showFilters)}
                      className={`h-12 px-6 border-slate-200 ${showFilters ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}`}
                    >
                  <Filter className="h-5 w-5 mr-2" />
                  Filters
                </Button>
                  </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                  <div className="border-t border-slate-200 pt-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">Status</Label>
                        <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger className="border-slate-200">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Status</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">Priority</Label>
                        <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                          <SelectTrigger className="border-slate-200">
                            <SelectValue placeholder="All Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Priority</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">Date Range</Label>
                        <DatePickerWithRange
                          date={filters.dateRange}
                          onDateChange={(range: DateRange | undefined) => setFilters(prev => ({ ...prev, dateRange: range }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Batch Actions */}
                {selectedPatients.size > 0 && (
                  <div className="border-t border-slate-200 pt-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-600">
                          {selectedPatients.size} patient(s) selected
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPatients(new Set())}
                          className="text-slate-600"
                        >
                          Clear Selection
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select onValueChange={(value) => handleBatchUpdatePriority(value)}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Set Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High Priority</SelectItem>
                            <SelectItem value="medium">Medium Priority</SelectItem>
                            <SelectItem value="low">Low Priority</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBatchDelete}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pagination Info */}
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalPatients)} of {totalPatients} patients
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={firstPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 py-1 bg-slate-100 rounded">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={lastPage}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Patients List - Table View */}
          {viewMode === 'table' && (
          <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedPatients.size === patients.length && patients.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Last Visit</TableHead>
                        <TableHead className="w-32">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            Loading patients...
                          </TableCell>
                        </TableRow>
                      ) : patients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            No patients found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        patients.map((patient) => (
                          <TableRow key={patient.id} className="hover:bg-slate-50">
                            <TableCell>
                              <Checkbox
                                checked={selectedPatients.has(patient.id)}
                                onCheckedChange={(checked) => handleSelectPatient(patient.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 ${getAvatarColor(patient.first_name + " " + patient.last_name)} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                                  {patient.first_name.charAt(0) + patient.last_name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900">
                                    {patient.first_name} {patient.last_name}
                                  </div>
                                  <div className="text-sm text-slate-500">
                                    Age: {patient.age} • {patient.gender}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3 text-blue-500" />
                                  {patient.phone}
                                </div>
                                {patient.email && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-3 w-3 text-green-500" />
                                    {patient.email}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  patient.status === "Active"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-slate-100 text-slate-800 border-slate-200"
                                }
                              >
                                {patient.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`border ${getPriorityColor(patient.priority)}`}>
                                {patient.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {patient.balance > 0 ? (
                                <span className="text-red-600 font-semibold">
                                  KES {(patient.balance || 0).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-green-600 font-semibold">Paid</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-600">
                                {patient.last_visit || 'Never'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedPatient(patient)}
                                  className="h-8 w-8 p-0 hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditPatient(patient)}
                                  className="h-8 w-8 p-0 hover:bg-purple-50"
                                >
                                  <Edit className="h-4 w-4 text-purple-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeletePatient(patient)}
                                  className="h-8 w-8 p-0 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Patients List - Card View */}
          {viewMode === 'cards' && (
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid gap-6">
                  {loading ? (
                    <p className="text-center py-8">Loading patients...</p>
                  ) : patients.length === 0 ? (
                    <p className="text-center py-8">No patients found.</p>
                  ) : (
                    patients.map((patient) => (
                  <Card
                    key={patient.id}
                      className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-white ${
                        selectedPatients.has(patient.id) ? 'ring-2 ring-blue-500' : ''
                      }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedPatients.has(patient.id)}
                                onCheckedChange={(checked) => handleSelectPatient(patient.id, checked as boolean)}
                              />
                          <div
                                  className={`w-16 h-16 ${getAvatarColor(patient.first_name + " " + patient.last_name)} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}
                          >
                                  {patient.first_name.charAt(0) + patient.last_name.charAt(0)}
                              </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                                  <h3 className="text-xl font-bold text-slate-800">{patient.first_name} {patient.last_name}</h3>
                              <Badge
                                className={
                                  patient.status === "Active"
                                    ? "bg-green-100 text-green-800 border-green-200 px-3 py-1"
                                    : "bg-slate-100 text-slate-800 border-slate-200 px-3 py-1"
                                }
                              >
                                {patient.status}
                              </Badge>
                              <Badge className={`px-3 py-1 border ${getPriorityColor(patient.priority)}`}>
                                {patient.priority} priority
                              </Badge>
                              {patient.balance > 0 && (
                                <Badge className="bg-red-100 text-red-800 border-red-200 px-3 py-1">
                                    <p className="text-sm text-gray-600">
                                      Balance: KES {(patient.balance || 0).toLocaleString()}
                                    </p>
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-slate-600">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">{patient.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-green-500" />
                                <span className="font-medium">{patient.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-purple-500" />
                                    <span className="font-medium">Last: {patient.last_visit}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-orange-500" />
                                <span className="font-medium">{patient.treatments} treatments</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPatient(patient)}
                            className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPatient(patient)}
                            className="hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePatient(patient)}
                              className="hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                    ))
                  )}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Add/Edit Patient Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl">
              <DialogHeader className="pb-6 border-b border-slate-100">
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {isEditMode ? "Edit Patient" : "Add New Patient"}
                </DialogTitle>
                <DialogDescription className="text-lg text-slate-600">
                  Manage patient records and their details.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label htmlFor="firstName" className="text-lg font-semibold text-slate-700">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="h-12 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-lg"
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="lastName" className="text-lg font-semibold text-slate-700">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="h-12 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-lg"
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="age" className="text-lg font-semibold text-slate-700">
                      Age *
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Enter age"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      className="h-12 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-lg"
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="gender" className="text-lg font-semibold text-slate-700">
                      Gender *
                    </Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                      <SelectTrigger className="h-12 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-lg">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="phone" className="text-lg font-semibold text-slate-700">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      placeholder="e.g., +254 700 000 000"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="h-12 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-lg"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="px-8 py-3 text-lg hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePatient}
                  disabled={!formData.firstName || !formData.lastName || !formData.age || !formData.phone}
                  className="px-8 py-3 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isEditMode ? "Update Patient" : "Save Patient"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Patient Details Modal */}
          {selectedPatient && (
            <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl">
                <DialogHeader className="pb-6 border-b border-slate-100">
                  <DialogTitle className="text-3xl font-bold text-slate-800">
                    Patient Details - {selectedPatient.first_name} {selectedPatient.last_name}
                  </DialogTitle>
                </DialogHeader>
                <div className="py-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <Card className="border-slate-200 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                          <CardTitle className="text-xl font-bold text-slate-800">Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-blue-500" />
                            <span className="font-semibold text-slate-700">Age:</span>
                            <span className="text-slate-600">{selectedPatient.age} years</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-green-500" />
                            <span className="font-semibold text-slate-700">Phone:</span>
                            <span className="text-slate-600">{selectedPatient.phone}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-purple-500" />
                            <span className="font-semibold text-slate-700">Email:</span>
                            <span className="text-slate-600">{selectedPatient.email}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Heart className="h-5 w-5 text-red-500" />
                            <span className="font-semibold text-slate-700">Status:</span>
                            <Badge
                              className={
                                selectedPatient.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-slate-100 text-slate-800"
                              }
                            >
                              {selectedPatient.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                          <CardTitle className="text-xl font-bold text-slate-800">Treatment Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <span className="font-semibold text-slate-700">Total Treatments:</span>
                            <span className="text-slate-600">{selectedPatient.treatments}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-purple-500" />
                            <span className="font-semibold text-slate-700">Last Visit:</span>
                            <span className="text-slate-600">{selectedPatient.last_visit}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-orange-500" />
                            <span className="font-semibold text-slate-700">Outstanding Balance:</span>
                            <span className="text-slate-600">KES {(selectedPatient.balance || 0).toLocaleString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <Card className="border-slate-200 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                          <CardTitle className="text-xl font-bold text-slate-800">Recent Visits</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                            <p className="font-semibold text-blue-800">Dental Cleaning</p>
                            <p className="text-sm text-blue-600">Jan 15, 2024 - Dr. Smith</p>
                          </div>
                          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                            <p className="font-semibold text-green-800">Cavity Filling</p>
                            <p className="text-sm text-green-600">Dec 10, 2023 - Dr. Johnson</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
                          <CardTitle className="text-xl font-bold text-slate-800">Uploaded Files</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
                            <FileText className="h-6 w-6 text-red-500" />
                            <span className="font-medium text-slate-700">X-ray_Jan2024.pdf</span>
                            <Eye className="h-4 w-4 text-slate-400 ml-auto" />
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
                            <FileText className="h-6 w-6 text-blue-500" />
                            <span className="font-medium text-slate-700">Treatment_Plan.pdf</span>
                            <Eye className="h-4 w-4 text-slate-400 ml-auto" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Delete Patient Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-bold text-red-600">
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-lg text-slate-600">
                  This action cannot be undone. This will permanently delete your patient record.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} className="px-8 py-3 text-lg hover:bg-slate-50">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeletePatient} className="px-8 py-3 text-lg bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  {loading ? 'Deleting...' : 'Delete Patient'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </MainLayout>
  )
}
