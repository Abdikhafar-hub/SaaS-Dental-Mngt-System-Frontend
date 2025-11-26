"use client"

import type React from "react"

import { useState, useEffect } from "react"
import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Filter, FileText, Upload, Eye, Calendar, User, Clock, Stethoscope, Pill, FileCheck, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Download } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import api from "@/lib/axiosConfig"

// Force dynamic rendering to avoid build-time environment variable issues
export const dynamic = 'force-dynamic'

import { v4 as uuidv4 } from 'uuid'
import type { v4 as uuidv4Type } from 'uuid'
import { useToast } from "@/hooks/use-toast"
import dayjs from 'dayjs'


const treatments = [
  "Dental Cleaning",
  "Cavity Filling",
  "Root Canal",
  "Crown Placement",
  "Tooth Extraction",
  "Teeth Whitening",
  "Dental Implant",
  "Orthodontic Treatment",
]

export default function DentistVisitsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [isAddVisitDialogOpen, setIsAddVisitDialogOpen] = useState(false)
  const [isViewEditDialogOpen, setIsViewEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<any>(null)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    doctor: "",
    status: "",
    treatment: "",
  })
  const [visitForm, setVisitForm] = useState<{
    patient_id: string,
    dentist_name: string,
    date: string,
    time: string,
    diagnosis: string,
    treatment: string,
    cost: string,
    medications: string,
    notes: string,
    files: string[],
    status: string,
  }>({
    patient_id: "",
    dentist_name: "",
    date: "",
    time: "",
    diagnosis: "",
    treatment: "",
    cost: "",
    medications: "",
    notes: "",
    files: [],
    status: "completed",
  })
  const [visitRecords, setVisitRecords] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const { toast } = useToast()

  // Function to generate proper file URLs
  const getFileUrl = (filename: string) => {
    if (!filename) return ''
    // TODO: Get file URL from Express backend or Cloudinary
    // For now, return the filename as-is or construct URL if stored in backend
    return filename
  }

  useEffect(() => {
    const fetchPatients = async () => {
      setLoadingPatients(true)
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
      setLoadingPatients(false)
    }
    fetchPatients()
  }, [])

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const response = await api.get('/visits', {
          params: { page: 1, pageSize: 100 }
        })
        
        if (response.data.success) {
          setVisitRecords(response.data.visits || [])
        } else {
          console.error('Error fetching visits:', response.data.error)
          setVisitRecords([])
        }
      } catch (error) {
        console.error('Error fetching visits:', error)
        setVisitRecords([])
      }
    }
    fetchVisits()
  }, [])

  const handleVisitFormChange = (field: string, value: string) => {
    setVisitForm(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    const uploaded: any[] = []
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const filePath = `${uuidv4()}.${fileExt}`
        
        // TODO: Upload file via Express backend file upload endpoint
        // For now, store file metadata
        uploaded.push({
          name: file.name,
          path: filePath,
          size: file.size,
          type: file.type
        })
          toast({
            title: "File Upload Error",
            description: `Failed to upload ${file.name}: ${error.message}`,
            variant: "destructive",
          })
        }
      }
      
      if (uploaded.length > 0) {
        setUploadedFiles((prev) => [...prev, ...uploaded])
        setVisitForm((prev) => ({
          ...prev,
          files: [...(prev.files || []), ...uploaded]
        }))
        toast({
          title: "Files Uploaded",
          description: `${uploaded.length} file(s) uploaded successfully.`,
        })
      }
    } catch (error) {
      console.error('File upload exception:', error)
      toast({
        title: "Upload Error",
        description: "An error occurred during file upload.",
        variant: "destructive",
      })
    }
    
    setUploading(false)
  }

  const handleSaveVisitRecord = async () => {
    // Validate required fields
    if (!visitForm.patient_id || !visitForm.dentist_name || !visitForm.date || !visitForm.time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Patient, Dentist, Date, Time).",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await api.post('/visits', {
        action: 'create',
        visitData: {
          patient_id: visitForm.patient_id,
          dentist_name: visitForm.dentist_name,
          date: visitForm.date,
          time: visitForm.time,
          diagnosis: visitForm.diagnosis,
          treatment: visitForm.treatment,
          cost: visitForm.cost ? Number(visitForm.cost) : null,
          medications: visitForm.medications,
          notes: visitForm.notes,
          files: visitForm.files || [],
          status: visitForm.status
        }
      })

      if (response.data.success) {
        // Add to local state immediately
        setVisitRecords(prevRecords => [response.data.visit, ...prevRecords])

        setIsAddVisitDialogOpen(false)
        setVisitForm({
          patient_id: "",
          dentist_name: "",
          date: "",
          time: "",
          diagnosis: "",
          treatment: "",
          cost: "",
          medications: "",
          notes: "",
          files: [],
          status: "completed",
        })
        setUploadedFiles([])
        toast({
          title: "Visit Record Added",
          description: "New visit record has been added successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: `Failed to save visit record: ${result.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving visit record:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving the visit record.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteVisitRecord = async (recordId: string) => {
    const record = visitRecords.find(r => r.id === recordId)
    setRecordToDelete(record)
    setIsDeleteDialogOpen(true)
  }

  const handleViewEditRecord = (record: any) => {
    setSelectedRecord(record)
    setIsViewEditDialogOpen(true)
  }

  const handleUpdateVisitRecord = async () => {
    if (!selectedRecord) return

    try {
      const response = await api.put(`/visits/${selectedRecord.id}`, {
        action: 'update',
        visitData: {
          patient_id: selectedRecord.patient_id,
          dentist_name: selectedRecord.dentist_name,
          date: selectedRecord.date,
          time: selectedRecord.time,
          diagnosis: selectedRecord.diagnosis,
          treatment: selectedRecord.treatment,
          cost: selectedRecord.cost ? Number(selectedRecord.cost) : null,
          medications: selectedRecord.medications,
          notes: selectedRecord.notes,
          files: selectedRecord.files || [],
          status: selectedRecord.status,
        }
      })

      if (response.data.success) {
        // Update local state immediately
        setVisitRecords(prevRecords => prevRecords.map(record => 
          record.id === selectedRecord.id ? response.data.visit : record
        ))

        setIsViewEditDialogOpen(false)
        setSelectedRecord(null)
        toast({
          title: "Visit Record Updated",
          description: "Visit record has been updated successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: `Failed to update visit record: ${result.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating visit record:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the visit record.",
        variant: "destructive",
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return

    try {
      const response = await api.delete(`/visits/${recordToDelete.id}`)

      if (response.data.success) {
        // Remove from local state immediately
        setVisitRecords(prevRecords => prevRecords.filter(record => record.id !== recordToDelete.id))

        setIsDeleteDialogOpen(false)
        setRecordToDelete(null)
        toast({
          title: "Visit Record Deleted",
          description: "Visit record has been deleted successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: `Failed to delete visit record: ${result.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting visit record:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the visit record.",
        variant: "destructive",
      })
    }
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      doctor: "",
      status: "",
      treatment: "",
    })
  }

  // Filter records based on search term and filters
  const filteredRecords = visitRecords.filter((record) => {
    const matchesSearch = 
      record.patient?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patient?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.treatment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.dentist_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDateFrom = !filters.dateFrom || record.date >= filters.dateFrom
    const matchesDateTo = !filters.dateTo || record.date <= filters.dateTo
    const matchesDoctor = !filters.doctor || record.dentist_name === filters.doctor
    const matchesStatus = !filters.status || record.status === filters.status
    const matchesTreatment = !filters.treatment || record.treatment === filters.treatment

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesDoctor && matchesStatus && matchesTreatment
  })

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex)

  const getUniqueDoctors = () => {
    const doctors = visitRecords.map(r => r.dentist_name).filter(Boolean)
    return [...new Set(doctors)]
  }

  const getUniqueTreatments = () => {
    const treatments = visitRecords.map(r => r.treatment).filter(Boolean)
    return [...new Set(treatments)]
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                My Visit Records
              </h1>
                <p className="text-gray-600">Manage your patient visit records and treatment history</p>
            </div>
            <Dialog open={isAddVisitDialogOpen} onOpenChange={setIsAddVisitDialogOpen}>
              <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Visit Record
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Add New Visit Record
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="patient" className="text-gray-700 font-medium">Patient</Label>
                      <Select value={visitForm.patient_id} onValueChange={(value) => handleVisitFormChange("patient_id", value)} disabled={loadingPatients}>
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                          {loadingPatients ? (
                            <SelectItem value="loading">Loading patients...</SelectItem>
                          ) : patients.length === 0 ? (
                            <SelectItem value="no-patients">No patients found</SelectItem>
                          ) : (
                            patients.map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>{`${p.first_name} ${p.last_name}`}</SelectItem>
                            ))
                          )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dentist" className="text-gray-700 font-medium">Dentist</Label>
                      <Input
                        id="dentist"
                        placeholder="Enter dentist name"
                        value={visitForm.dentist_name}
                        onChange={(e) => handleVisitFormChange("dentist_name", e.target.value)}
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl w-full"
                      />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-gray-700 font-medium">Visit Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={visitForm.date}
                      onChange={(e) => handleVisitFormChange("date", e.target.value)}
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-gray-700 font-medium">Visit Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={visitForm.time}
                      onChange={(e) => handleVisitFormChange("time", e.target.value)}
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl w-full"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="diagnosis" className="text-gray-700 font-medium">Diagnosis</Label>
                    <Textarea
                      id="diagnosis"
                      placeholder="Enter diagnosis details"
                      value={visitForm.diagnosis}
                      onChange={(e) => handleVisitFormChange("diagnosis", e.target.value)}
                      className="h-24 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="treatment" className="text-gray-700 font-medium">Treatment Performed</Label>
                    <Select
                      value={visitForm.treatment}
                      onValueChange={(value) => handleVisitFormChange("treatment", value)}
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                        <SelectValue placeholder="Select treatment" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatments.map((treatment) => (
                          <SelectItem key={treatment} value={treatment.toLowerCase()}>
                            {treatment}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="cost" className="text-gray-700 font-medium">Treatment Cost (KSH)</Label>
                    <Input
                      id="cost"
                      type="number"
                      placeholder="0.00"
                      value={visitForm.cost}
                      onChange={(e) => handleVisitFormChange("cost", e.target.value)}
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl w-full"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="medications" className="text-gray-700 font-medium">Medications Prescribed</Label>
                    <Textarea
                      id="medications"
                      placeholder="List medications with dosage"
                      value={visitForm.medications}
                      onChange={(e) => handleVisitFormChange("medications", e.target.value)}
                      className="h-24 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl w-full"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="notes" className="text-gray-700 font-medium">Treatment Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes and observations"
                      value={visitForm.notes}
                      onChange={(e) => handleVisitFormChange("notes", e.target.value)}
                      className="h-24 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl w-full"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="files" className="text-gray-700 font-medium">Upload Files</Label>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer"
                      onClick={() => document.getElementById("fileInput")?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Click to upload X-rays, photos, or documents</p>
                      <Input id="fileInput" type="file" multiple className="hidden" onChange={handleFileUpload} />
                      {uploading && <p className="text-blue-600 mt-2">Uploading...</p>}
                      {visitForm.files && visitForm.files.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 justify-center">
                          {visitForm.files.map((file: string, idx: number) => (
                            <a
                              key={idx}
                              href={getFileUrl(file)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-blue-600 text-xs"
                            >
                              {file.split('/').pop()}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsAddVisitDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveVisitRecord}>Save Visit Record</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter Section */}
            <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                  placeholder="Search by patient, diagnosis, treatment, or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-11 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
              />
            </div>
              <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-11 px-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50">
                    <Filter className="h-4 w-4 mr-2 text-gray-500" />
              Filters
                    {(filters.dateFrom || filters.dateTo || filters.doctor || filters.status || filters.treatment) && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">!</Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Advanced Filters</h4>
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
                        <X className="h-4 w-4" />
            </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium">Date From</Label>
                        <Input
                          type="date"
                          value={filters.dateFrom}
                          onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Date To</Label>
                        <Input
                          type="date"
                          value={filters.dateTo}
                          onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Doctor</Label>
                      <Select value={filters.doctor} onValueChange={(value) => setFilters(prev => ({ ...prev, doctor: value }))}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="All doctors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All doctors</SelectItem>
                          {getUniqueDoctors().map((doctor) => (
                            <SelectItem key={doctor} value={doctor}>{doctor}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All statuses</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Treatment</Label>
                      <Select value={filters.treatment} onValueChange={(value) => setFilters(prev => ({ ...prev, treatment: value }))}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="All treatments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All treatments</SelectItem>
                          {getUniqueTreatments().map((treatment) => (
                            <SelectItem key={treatment} value={treatment}>{treatment}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Stats and Summary */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Visit Records ({filteredRecords.length})
            </h2>
                <Badge variant="outline" className="text-xs">
                  Page {currentPage} of {totalPages}
                </Badge>
              </div>
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} records
              </div>
            </div>
                        </div>
                        
          {/* Table */}
          <Card className="rounded-xl border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="w-32 font-semibold text-gray-700">Date & Time</TableHead>
                      <TableHead className="w-48 font-semibold text-gray-700">Patient</TableHead>
                      <TableHead className="w-40 font-semibold text-gray-700">Doctor</TableHead>
                      <TableHead className="w-48 font-semibold text-gray-700">Diagnosis</TableHead>
                      <TableHead className="w-40 font-semibold text-gray-700">Treatment</TableHead>
                      <TableHead className="w-24 font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="w-24 font-semibold text-gray-700">Cost</TableHead>
                      <TableHead className="w-32 font-semibold text-gray-700">Files</TableHead>
                      <TableHead className="w-20 font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {dayjs(record.date).format('MMM DD')}
                            </span>
                            <span className="text-sm text-gray-500">
                              {record.time}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="font-medium text-gray-900">
                            {`${record.patient?.first_name || ''} ${record.patient?.last_name || ''}`}
                            </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-gray-700">{record.dentist_name}</div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-gray-700 max-w-xs truncate" title={record.diagnosis}>
                            {record.diagnosis}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-gray-700">{record.treatment}</div>
                        </TableCell>
                        <TableCell className="py-3">
                            <Badge className={cn(
                            "text-xs font-medium",
                              record.status === "completed" ? "bg-green-100 text-green-800" :
                              record.status === "in-progress" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            )}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="font-medium text-gray-900">
                            KSH {record.cost || 0}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          {record.files && Array.isArray(record.files) && record.files.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {record.files.slice(0, 2).map((file: string, idx: number) => (
                                    <a
                                      key={idx}
                                      href={getFileUrl(file)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                  <Download className="h-3 w-3" />
                                  {file.split('/').pop()?.substring(0, 8)}...
                                </a>
                              ))}
                              {record.files.length > 2 && (
                                <span className="text-xs text-gray-500">+{record.files.length - 2} more</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No files</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => handleViewEditRecord(record)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteVisitRecord(record.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                        </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} records
                      </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-9 px-3"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-9 px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
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
                        onClick={() => setCurrentPage(page)}
                        className="h-9 w-9 p-0"
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-9 px-3"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-9 px-3"
                >
                  <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
            </div>
          )}
        </div>
      </div>

      {/* View/Edit Dialog */}
      <Dialog open={isViewEditDialogOpen} onOpenChange={setIsViewEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              View & Edit Visit Record
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="grid grid-cols-2 gap-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="view-patient" className="text-gray-700 font-medium">Patient</Label>
                <Select 
                  value={selectedRecord.patient_id} 
                  onValueChange={(value) => setSelectedRecord((prev: any) => ({ ...prev, patient_id: value }))}
                  disabled={loadingPatients}
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingPatients ? (
                      <SelectItem value="loading">Loading patients...</SelectItem>
                    ) : patients.length === 0 ? (
                      <SelectItem value="no-patients">No patients found</SelectItem>
                    ) : (
                      patients.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{`${p.first_name} ${p.last_name}`}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="view-dentist" className="text-gray-700 font-medium">Dentist</Label>
                <Input
                  id="view-dentist"
                  placeholder="Enter dentist name"
                  value={selectedRecord.dentist_name || ""}
                  onChange={(e) => setSelectedRecord((prev: any) => ({ ...prev, dentist_name: e.target.value }))}
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="view-date" className="text-gray-700 font-medium">Visit Date</Label>
                <Input
                  id="view-date"
                  type="date"
                  value={selectedRecord.date || ""}
                  onChange={(e) => setSelectedRecord((prev: any) => ({ ...prev, date: e.target.value }))}
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="view-time" className="text-gray-700 font-medium">Visit Time</Label>
                <Input
                  id="view-time"
                  type="time"
                  value={selectedRecord.time || ""}
                  onChange={(e) => setSelectedRecord((prev: any) => ({ ...prev, time: e.target.value }))}
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl w-full"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="view-diagnosis" className="text-gray-700 font-medium">Diagnosis</Label>
                <Textarea
                  id="view-diagnosis"
                  placeholder="Enter diagnosis details"
                  value={selectedRecord.diagnosis || ""}
                  onChange={(e) => setSelectedRecord((prev: any) => ({ ...prev, diagnosis: e.target.value }))}
                  className="h-24 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="view-treatment" className="text-gray-700 font-medium">Treatment Performed</Label>
                <Select
                  value={selectedRecord.treatment || ""}
                  onValueChange={(value) => setSelectedRecord((prev: any) => ({ ...prev, treatment: value }))}
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                    <SelectValue placeholder="Select treatment" />
                  </SelectTrigger>
                  <SelectContent>
                    {treatments.map((treatment) => (
                      <SelectItem key={treatment} value={treatment.toLowerCase()}>
                        {treatment}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="view-cost" className="text-gray-700 font-medium">Treatment Cost (KSH)</Label>
                <Input
                  id="view-cost"
                  type="number"
                  placeholder="0.00"
                  value={selectedRecord.cost || ""}
                  onChange={(e) => setSelectedRecord((prev: any) => ({ ...prev, cost: e.target.value }))}
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl w-full"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="view-medications" className="text-gray-700 font-medium">Medications Prescribed</Label>
                <Textarea
                  id="view-medications"
                  placeholder="List medications with dosage"
                  value={selectedRecord.medications || ""}
                  onChange={(e) => setSelectedRecord((prev: any) => ({ ...prev, medications: e.target.value }))}
                  className="h-24 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl w-full"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="view-notes" className="text-gray-700 font-medium">Treatment Notes</Label>
                <Textarea
                  id="view-notes"
                  placeholder="Additional notes and observations"
                  value={selectedRecord.notes || ""}
                  onChange={(e) => setSelectedRecord((prev: any) => ({ ...prev, notes: e.target.value }))}
                  className="h-24 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl w-full"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-gray-700 font-medium">Status</Label>
                <Select
                  value={selectedRecord.status || "completed"}
                  onValueChange={(value) => setSelectedRecord((prev: any) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-gray-700 font-medium">Uploaded Files</Label>
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  {selectedRecord.files && Array.isArray(selectedRecord.files) && selectedRecord.files.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.files.map((file: string, idx: number) => (
                        <a
                          key={idx}
                          href={getFileUrl(file)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          {file.split('/').pop()}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No files uploaded</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setIsViewEditDialogOpen(false)
              setSelectedRecord(null)
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateVisitRecord} className="bg-blue-600 hover:bg-blue-700">
              Update Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visit Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this visit record? This action cannot be undone.
              {recordToDelete && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">Patient: {recordToDelete.patient?.first_name} {recordToDelete.patient?.last_name}</p>
                  <p className="text-sm text-gray-600">Date: {recordToDelete.date} at {recordToDelete.time}</p>
                  <p className="text-sm text-gray-600">Treatment: {recordToDelete.treatment}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false)
              setRecordToDelete(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}
