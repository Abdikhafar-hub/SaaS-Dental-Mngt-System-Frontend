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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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


export default function ReceptionistPatientsPage() {
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

  // Fetch patients from API with pagination and filters
  const fetchPatients = useCallback(async (search: string, page: number, filters: any) => {
    setLoading(true)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      })

      // Apply search filters
      if (search) {
        params.append('search', search)
      }

      // Apply status filter
      if (filters.status) {
        params.append('status', filters.status)
      }

      // Apply priority filter
      if (filters.priority) {
        params.append('priority', filters.priority)
      }

      // Apply date range filter
      if (filters.dateRange?.from) {
        params.append('fromDate', filters.dateRange.from.toISOString())
      }
      if (filters.dateRange?.to) {
        params.append('toDate', filters.dateRange.to.toISOString())
      }

      const response = await api.get('/patients', {
        params: Object.fromEntries(params)
      })

      if (!response.data.success) {
        console.error('Error fetching patients:', response.data.error)
        return
      }

      setPatients(response.data.patients || [])
      setTotalPatients(response.data.totalCount || 0)
      setTotalPages(Math.ceil((response.data.totalCount || 0) / pageSize))
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  // Fetch patients when search, page, or filters change
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
      if (isEditMode && editingPatient) {
        // Update existing patient
        const response = await api.post('/patients', {
          action: 'update',
          patientData: {
            id: editingPatient.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            age: formData.age ? parseInt(formData.age) : null,
            gender: formData.gender,
            phone: formData.phone,
            avatar: formData.avatar
          }
        })

        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to update patient')
        }

        // Update local state immediately
        setPatients(prevPatients => prevPatients.map(patient => 
          patient.id === editingPatient.id ? response.data.patient : patient
        ))

        toast({
          title: "Patient updated",
          description: "Patient updated successfully!",
        })
      } else {
        // Create new patient
        const response = await api.post('/patients', {
          action: 'create',
          patientData: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              age: formData.age ? parseInt(formData.age) : null,
              gender: formData.gender,
              phone: formData.phone,
              avatar: formData.avatar
            }
          }
        })

        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to create patient')
        }

        // Add new patient to local state immediately (at the beginning since we sort by created_at desc)
        setPatients(prevPatients => [response.data.patient, ...prevPatients])
        
        // Update total count
        setTotalPatients(prev => prev + 1)

        toast({
          title: "Patient added",
          description: "Patient added successfully!",
        })
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
      toast({
        title: "Error saving patient",
        description: "Error saving patient. Please try again.",
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

      if (!response.data.success) {
        console.error('Error deleting patient:', response.data.error)
        toast({
          title: "Error deleting patient",
          description: "Error deleting patient. Please try again.",
          variant: "destructive",
        })
      } else {
        // Remove from local state immediately
        setPatients(prevPatients => prevPatients.filter(patient => patient.id !== patientToDelete.id))
        
        // Update total count
        setTotalPatients(prev => prev - 1)
        
        toast({
          title: "Patient deleted",
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
    
    setLoading(true)
    try {
      // TODO: Implement batch delete endpoint or delete one by one
      // For now, delete one by one
      let deletedCount = 0
      for (const id of selectedPatients) {
        try {
          await api.delete(`/patients/${id}`)
          deletedCount++
        } catch (error) {
          console.error('Error deleting patient:', error)
        }
      }

      if (deletedCount > 0) {
        // Remove from local state immediately
        setPatients(prevPatients => prevPatients.filter(patient => !selectedPatients.has(patient.id)))
        
        // Update total count
        setTotalPatients(prev => prev - deletedCount)
        
        toast({
          title: "Patients deleted",
          description: `${deletedCount} patient(s) deleted successfully!`,
        })
        setSelectedPatients(new Set())
      } else {
        toast({
          title: "Error deleting patients",
          description: "Failed to delete some patients. Please try again.",
          variant: "destructive",
        })
      }
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
      const response = await api.post('/patients', {
        action: 'batchUpdatePriority',
        patientIds: Array.from(selectedPatients),
        priority
      })

      if (!response.data.success) {
        console.error('Error updating patients:', data.error)
        toast({
          title: "Error updating patients",
          description: "Error updating patients. Please try again.",
          variant: "destructive",
        })
      } else {
        // Update local state immediately
        setPatients(prevPatients => prevPatients.map(patient => {
          const updatedPatient = data.patients?.find(up => up.id === patient.id)
          return updatedPatient || patient
        }))
        
        toast({
          title: "Patients updated",
          description: `${selectedPatients.size} patient(s) updated successfully!`,
        })
        setSelectedPatients(new Set())
      }
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

  // Pagination functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }
  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)
  const firstPage = () => goToPage(1)
  const lastPage = () => goToPage(totalPages)

  // Utility functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500",
      "bg-indigo-500", "bg-red-500", "bg-yellow-500", "bg-teal-500"
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
              Patient Management
            </h1>
              <p className="text-gray-600 text-lg">Manage patient records and information</p>
          </div>
            <div className="flex gap-3">
                  <Button 
                onClick={() => {
                  setIsEditMode(false)
                  setEditingPatient(null)
                  setFormData({
                    firstName: "",
                    lastName: "",
                    age: "",
                    gender: "",
                    phone: "",
                    avatar: ""
                  })
                  setIsAddDialogOpen(true)
                }}
                className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Patient
                  </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

          {/* Patients Table View */}
          {viewMode === 'table' && (
            <Card className="bg-white border border-gray-200 shadow-lg">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedPatients.size === patients.length && patients.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">Patient</TableHead>
                      <TableHead className="font-semibold text-slate-700">Contact</TableHead>
                      <TableHead className="font-semibold text-slate-700">Age/Gender</TableHead>
                      <TableHead className="font-semibold text-slate-700">Priority</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Balance</TableHead>
                      <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-slate-600">Loading patients...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : patients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="text-slate-500">
                            <User className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-lg font-semibold">No patients found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                          </div>
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
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(patient.first_name || patient.last_name)}`}>
                                {(patient.first_name?.[0] || '') + (patient.last_name?.[0] || '')}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {patient.first_name} {patient.last_name}
                                </div>
                                <div className="text-sm text-slate-500">ID: {patient.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-700">{patient.phone}</span>
                              </div>
                              {patient.email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-4 w-4 text-slate-400" />
                                  <span className="text-slate-700">{patient.email}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-slate-700">
                              {patient.age} years • {patient.gender}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getPriorityColor(patient.priority)} border`}>
                              {patient.priority}
                            </Badge>
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
                            <div className="text-sm font-semibold text-slate-700">
                              KES {(patient.balance || 0).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPatient(patient)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditPatient(patient)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                  <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeletePatient(patient)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
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
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the patient
                  "{patientToDelete?.first_name} {patientToDelete?.last_name}" and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeletePatient} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </MainLayout>
  )
}
