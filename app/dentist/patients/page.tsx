"use client"

import { useState, useEffect } from "react"
import api from "@/lib/axiosConfig"

// Force dynamic rendering to avoid build-time environment variable issues
export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  Eye,
  Search,
  Filter,
  History,
  AlertTriangle,
  Users,
  Activity,
  Clock,
  DollarSign,
  Stethoscope,
  ClipboardList,
  TrendingUp,
  Shield,
  Heart,
  Zap,
  ChevronDown
} from "lucide-react"


export default function DentistPatientsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [allergyFilter, setAllergyFilter] = useState("all")
  const [visitFilter, setVisitFilter] = useState("all")
  const [balanceFilter, setBalanceFilter] = useState("all")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddTreatmentPlan, setShowAddTreatmentPlan] = useState(false)
  const [showAddVisitRecord, setShowAddVisitRecord] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState({
    personal: false,
    medical: false,
    treatment: false,
    risk: false
  })
  const [newTreatmentPlan, setNewTreatmentPlan] = useState({
    treatment: '',
    tooth: '',
    priority: 'medium',
    estimatedCost: '',
    notes: ''
  })
  const [newVisitRecord, setNewVisitRecord] = useState({
    date: '',
    time: '',
    diagnosis: '',
    treatment: '',
    cost: '',
    notes: ''
  })
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    patientsWithBalance: 0,
    upcomingAppointments: 0
  })

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

  // Fetch all patient data
  useEffect(() => {
    const fetchPatientsData = async () => {
      setLoading(true)
      try {
        // Fetch patients from Express backend
        const patientsResponse = await api.get('/patients', {
          params: { page: 1, pageSize: 1000 }
        })
        
        if (!patientsResponse.data.success) {
          console.error('Error fetching patients:', patientsResponse.data.error)
          return
        }
        
        const patientsData = patientsResponse.data.patients || []

        // Transform the data to match the expected format
        const transformedPatients = patientsData?.map(patient => {
          // TODO: Fetch visits, appointments, invoices separately if needed
          // For now, use default values
          const totalVisits = 0 // Will be populated when backend includes related data
          const lastVisit = null
          const nextAppointment = null
          const outstandingBalance = patient.balance || 0
          
          // Determine patient status
          let status = "Active"
          if (lastVisit) {
            const lastVisitDate = new Date(lastVisit)
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
            if (lastVisitDate < sixMonthsAgo) {
              status = "Inactive"
            }
          } else {
            status = "New"
          }
          
          // Check if overdue for next appointment
          if (nextAppointment && new Date(nextAppointment) < new Date()) {
            status = "Overdue"
          }

          return {
            id: patient.id,
            name: `${patient.first_name} ${patient.last_name}`,
            age: patient.age,
            phone: patient.phone,
            email: patient.email,
            status: status,
            lastVisit: lastVisit,
            nextAppointment: nextAppointment,
            totalVisits: totalVisits,
            outstandingBalance: outstandingBalance,
            allergies: patient.medical_history || "None known",
            medicalHistory: patient.medical_history || "No significant medical history",
            insurance: "Not specified", // Add insurance field to patients table if needed
            emergencyContact: `${patient.first_name} ${patient.last_name} (${patient.phone})`,
            riskFactors: patient.medical_history?.toLowerCase().includes('diabetes') ? ["Diabetes"] : 
                        patient.medical_history?.toLowerCase().includes('hypertension') ? ["Hypertension"] : [],
            visitHistory: [], // TODO: Fetch from visits endpoint
            treatmentPlan: [], // TODO: Fetch from treatment plans endpoint
          }
        }) || []

        setPatients(transformedPatients)

        // Calculate stats
        const totalPatients = transformedPatients.length
        const activePatients = transformedPatients.filter(p => p.status === "Active").length
        const patientsWithBalance = transformedPatients.filter(p => p.outstandingBalance > 0).length
        const upcomingAppointments = transformedPatients.filter(p => p.nextAppointment).length

        setStats({
          totalPatients,
          activePatients,
          patientsWithBalance,
          upcomingAppointments
        })

      } catch (error) {
        console.error('Error fetching patients data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPatientsData()

    // TODO: Implement real-time updates with WebSocket or polling if needed
  }, [])

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || patient.status.toLowerCase() === statusFilter
    
    const matchesAllergy = allergyFilter === "all" || 
      (allergyFilter === "has" && patient.allergies !== "None known") ||
      (allergyFilter === "none" && patient.allergies === "None known")
    
    const matchesVisit = visitFilter === "all" ||
      (visitFilter === "frequent" && patient.totalVisits >= 5) ||
      (visitFilter === "occasional" && patient.totalVisits >= 2 && patient.totalVisits < 5) ||
      (visitFilter === "new" && patient.totalVisits < 2)
    
    const matchesBalance = balanceFilter === "all" ||
      (balanceFilter === "has" && patient.outstandingBalance > 0) ||
      (balanceFilter === "none" && patient.outstandingBalance === 0)
    
    return matchesSearch && matchesStatus && matchesAllergy && matchesVisit && matchesBalance
  })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "inactive":
        return "bg-slate-100 text-slate-800 border-slate-200"
      case "overdue":
        return "bg-rose-100 text-rose-800 border-rose-200"
      case "new":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-rose-100 text-rose-800 border-rose-200"
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  // Handle Add Treatment Plan
  const handleAddTreatmentPlan = async () => {
    if (!selectedPatient || !newTreatmentPlan.treatment) return
    
    try {
      // TODO: Implement treatment plans endpoint in backend
      // For now, just update local state
      console.log('Adding treatment plan:', newTreatmentPlan)

      // Refresh patient data
      const updatedPatients = patients.map(patient => {
        if (patient.id === selectedPatient.id) {
          return {
            ...patient,
            treatmentPlan: [
              ...patient.treatmentPlan,
              {
                treatment: newTreatmentPlan.treatment,
                tooth: newTreatmentPlan.tooth,
                priority: newTreatmentPlan.priority,
                estimatedCost: newTreatmentPlan.estimatedCost,
                notes: newTreatmentPlan.notes
              }
            ]
          }
        }
        return patient
      })
      setPatients(updatedPatients)
      setSelectedPatient(updatedPatients.find(p => p.id === selectedPatient.id))
      
      // Reset form
      setNewTreatmentPlan({
        treatment: '',
        tooth: '',
        priority: 'medium',
        estimatedCost: '',
        notes: ''
      })
      setShowAddTreatmentPlan(false)
    } catch (error) {
      console.error('Error adding treatment plan:', error)
    }
  }

  // Handle Add Visit Record
  const handleAddVisitRecord = async () => {
    if (!selectedPatient || !newVisitRecord.treatment) return
    
    try {
      // Add visit record via Express backend
      const response = await api.post('/visits', {
        action: 'create',
        visitData: {
          patient_id: selectedPatient.id,
          date: newVisitRecord.date,
          time: newVisitRecord.time,
          diagnosis: newVisitRecord.diagnosis,
          treatment: newVisitRecord.treatment,
          cost: parseFloat(newVisitRecord.cost) || 0,
          notes: newVisitRecord.notes,
          status: 'completed'
        }
      })

      if (!response.data.success) {
        console.error('Error adding visit record:', response.data.error)
        return
      }

      // Refresh patient data
      const updatedPatients = patients.map(patient => {
        if (patient.id === selectedPatient.id) {
          return {
            ...patient,
            visitHistory: [
              ...patient.visitHistory,
              {
                date: newVisitRecord.date,
                treatment: newVisitRecord.treatment,
                diagnosis: newVisitRecord.diagnosis,
                notes: newVisitRecord.notes,
                cost: newVisitRecord.cost
              }
            ],
            totalVisits: patient.totalVisits + 1,
            lastVisit: newVisitRecord.date
          }
        }
        return patient
      })
      setPatients(updatedPatients)
      setSelectedPatient(updatedPatients.find(p => p.id === selectedPatient.id))
      
      // Reset form
      setNewVisitRecord({
        date: '',
        time: '',
        diagnosis: '',
        treatment: '',
        cost: '',
        notes: ''
      })
      setShowAddVisitRecord(false)
    } catch (error) {
      console.error('Error adding visit record:', error)
    }
  }

  // Handle Schedule Appointment
  const handleScheduleAppointment = () => {
    if (selectedPatient) {
      // Navigate to appointments page with patient data
      router.push(`/dentist/appointments?patientId=${selectedPatient.id}&patientName=${encodeURIComponent(selectedPatient.name)}`)
    }
  }

  // Toggle collapsible sections
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }))
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Escape to close modal
      if (event.key === 'Escape' && selectedPatient) {
        setSelectedPatient(null)
      }
      
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
      
      // Ctrl/Cmd + F to toggle advanced filters
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault()
        setShowAdvancedFilters(!showAdvancedFilters)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [selectedPatient, showAdvancedFilters])

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading patient data...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Patient History
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Welcome back, {currentUser?.name}! Access comprehensive patient records and treatment history.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <Users className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalPatients}</p>
                  <p className="text-sm text-slate-600 font-medium">Total Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{stats.activePatients}</p>
                  <p className="text-sm text-slate-600 font-medium">Active Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{stats.upcomingAppointments}</p>
                  <p className="text-sm text-slate-600 font-medium">Upcoming Appointments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{stats.patientsWithBalance}</p>
                  <p className="text-sm text-slate-600 font-medium">Outstanding Balance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Basic Search */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search patients by name, phone, or email... (Ctrl+K)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full lg:w-40 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    className="border-slate-200 hover:bg-slate-50 rounded-xl whitespace-nowrap"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{showAdvancedFilters ? "Hide" : "Advanced"} Filters</span>
                    <span className="sm:hidden">Filters</span>
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Allergies</label>
                    <Select value={allergyFilter} onValueChange={setAllergyFilter}>
                      <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder="All allergies" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Patients</SelectItem>
                        <SelectItem value="has">Has Allergies</SelectItem>
                        <SelectItem value="none">No Allergies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Visit Frequency</label>
                    <Select value={visitFilter} onValueChange={setVisitFilter}>
                      <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder="All visits" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Patients</SelectItem>
                        <SelectItem value="frequent">Frequent (5+ visits)</SelectItem>
                        <SelectItem value="occasional">Occasional (2-4 visits)</SelectItem>
                        <SelectItem value="new">New (0-1 visits)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Outstanding Balance</label>
                    <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                      <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder="All balances" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Patients</SelectItem>
                        <SelectItem value="has">Has Balance</SelectItem>
                        <SelectItem value="none">No Balance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              My Patients ({filteredPatients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Patient</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 hidden md:table-cell">Age</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 hidden lg:table-cell">Contact</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 hidden sm:table-cell">Last Visit</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 hidden md:table-cell">Visits</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 hidden lg:table-cell">Balance</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr 
                      key={patient.id}
                      className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-200"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">
                            {patient.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{patient.name}</div>
                            <div className="text-xs text-slate-500 md:hidden">
                              Age: {patient.age} • {patient.totalVisits} visits
                            </div>
                            {patient.allergies !== "None known" && (
                              <div className="text-xs text-rose-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Allergies
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 hidden md:table-cell">{patient.age}</td>
                      <td className="py-3 px-4">
                        <Badge className={`${getStatusColor(patient.status)} border text-xs font-medium`}>
                          {patient.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="text-sm text-slate-600">
                          <div className="flex items-center gap-1 mb-1">
                            <Phone className="h-3 w-3 text-green-500" />
                            {patient.phone}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-purple-500" />
                            {patient.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 hidden sm:table-cell">
                        {patient.lastVisit || "No visits"}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 hidden md:table-cell">
                        {patient.totalVisits}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        {patient.outstandingBalance > 0 ? (
                          <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-xs font-medium">
                            ${patient.outstandingBalance}
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400">$0</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg text-xs px-2 py-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(patient);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-slate-200 hover:bg-slate-50 rounded-lg text-xs px-2 py-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Print functionality
                            }}
                          >
                            <History className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-slate-200 hover:bg-slate-50 rounded-lg text-xs px-2 py-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(patient);
                              setShowAddVisitRecord(true);
                            }}
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Patient Details Modal */}
        {selectedPatient && (
          <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl">
              <DialogHeader className="pb-6">
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Patient History - {selectedPatient.name}
                </DialogTitle>
              </DialogHeader>

              {/* Tabs */}
              <div className="flex space-x-1 bg-slate-100 p-2 rounded-xl w-fit mb-6">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    activeTab === "overview" 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <Stethoscope className="h-4 w-4 inline mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    activeTab === "history" 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <History className="h-4 w-4 inline mr-2" />
                  Visit History
                </button>
                <button
                  onClick={() => setActiveTab("treatment-plan")}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    activeTab === "treatment-plan"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <ClipboardList className="h-4 w-4 inline mr-2" />
                  Treatment Plan
                </button>
              </div>

              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Patient Info - Compact Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Personal Information */}
                    <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                      <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection('personal')}>
                        <CardTitle className="text-base font-semibold text-blue-800 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Personal Information
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${collapsedSections.personal ? 'rotate-180' : ''}`} />
                        </CardTitle>
                      </CardHeader>
                      {!collapsedSections.personal && (
                        <CardContent className="pt-0 space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-medium text-slate-700">Name:</span>
                              <div className="text-slate-900">{selectedPatient.name}</div>
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Age:</span>
                              <div className="text-slate-900">{selectedPatient.age} years</div>
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Phone:</span>
                              <div className="text-slate-900">{selectedPatient.phone}</div>
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Email:</span>
                              <div className="text-slate-900">{selectedPatient.email}</div>
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Emergency Contact:</span>
                            <div className="text-slate-900">{selectedPatient.emergencyContact}</div>
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Medical Information */}
                    <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
                      <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection('medical')}>
                        <CardTitle className="text-base font-semibold text-emerald-800 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            Medical Information
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${collapsedSections.medical ? 'rotate-180' : ''}`} />
                        </CardTitle>
                      </CardHeader>
                      {!collapsedSections.medical && (
                        <CardContent className="pt-0 space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-medium text-slate-700">Allergies:</span>
                              <div className={selectedPatient.allergies !== "None known" ? "text-rose-600 font-medium" : "text-slate-900"}>
                                {selectedPatient.allergies}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Insurance:</span>
                              <div className="text-slate-900">{selectedPatient.insurance}</div>
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Medical History:</span>
                            <div className="text-slate-900">{selectedPatient.medicalHistory}</div>
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Treatment Summary */}
                    <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
                      <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection('treatment')}>
                        <CardTitle className="text-base font-semibold text-purple-800 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Treatment Summary
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${collapsedSections.treatment ? 'rotate-180' : ''}`} />
                        </CardTitle>
                      </CardHeader>
                      {!collapsedSections.treatment && (
                        <CardContent className="pt-0 space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-medium text-slate-700">Total Visits:</span>
                              <div className="text-slate-900">{selectedPatient.totalVisits}</div>
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Outstanding Balance:</span>
                              <div className="text-slate-900">${selectedPatient.outstandingBalance}</div>
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Last Visit:</span>
                              <div className="text-slate-900">{selectedPatient.lastVisit || "No visits"}</div>
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Next Appointment:</span>
                              <div className="text-slate-900">{selectedPatient.nextAppointment || "None scheduled"}</div>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Risk Factors */}
                    <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
                      <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection('risk')}>
                        <CardTitle className="text-base font-semibold text-amber-800 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Risk Factors
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${collapsedSections.risk ? 'rotate-180' : ''}`} />
                        </CardTitle>
                      </CardHeader>
                      {!collapsedSections.risk && (
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-2">
                            {selectedPatient.riskFactors.length > 0 ? (
                              selectedPatient.riskFactors.map((factor: string, idx: number) => (
                                <Badge key={idx} className="bg-amber-200 text-amber-800 border-amber-300 font-medium px-2 py-1 text-xs">
                                  {factor}
                                </Badge>
                              ))
                            ) : (
                              <p className="text-slate-600 text-sm">No specific risk factors identified</p>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </div>
                </div>
              )}

              {/* Visit History Tab */}
              {activeTab === "history" && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                      <History className="h-5 w-5 text-blue-600" />
                      Complete Visit History
                    </h3>
                    <Button 
                      size="sm"
                      onClick={() => setShowAddVisitRecord(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg text-xs px-3 py-1"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Add Visit
                    </Button>
                  </div>
                  {selectedPatient.visitHistory.length > 0 ? (
                    <div className="space-y-3">
                      {selectedPatient.visitHistory.map((visit: any, idx: number) => (
                        <Card key={idx} className="rounded-xl border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-200">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900">{visit.treatment}</h4>
                                <p className="text-xs text-slate-600 flex items-center gap-2 mt-1">
                                  <Calendar className="h-3 w-3" />
                                  {visit.date}
                                </p>
                              </div>
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 font-medium px-3 py-1 text-xs">
                                ${visit.cost}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="font-medium text-slate-700">Diagnosis:</span>
                                <div className="text-slate-900 mt-1">{visit.diagnosis}</div>
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">Notes:</span>
                                <div className="text-slate-900 mt-1">{visit.notes}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="rounded-xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                      <CardContent className="text-center py-8">
                        <History className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-500">No visit history available</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Treatment Plan Tab */}
              {activeTab === "treatment-plan" && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                      <ClipboardList className="h-5 w-5 text-purple-600" />
                      Recommended Treatment Plan
                    </h3>
                    <Button 
                      onClick={() => setShowAddTreatmentPlan(true)}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg text-xs px-3 py-1"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Add Treatment Plan
                    </Button>
                  </div>
                  {selectedPatient.treatmentPlan.length > 0 ? (
                    <div className="space-y-3">
                      {selectedPatient.treatmentPlan.map((treatment: any, idx: number) => (
                        <Card key={idx} className="rounded-xl border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-200">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900">{treatment.treatment}</h4>
                                <p className="text-xs text-slate-600 flex items-center gap-2 mt-1">
                                  <Zap className="h-3 w-3" />
                                  Tooth: {treatment.tooth}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`${getPriorityColor(treatment.priority)} border font-medium px-2 py-1 text-xs`}>
                                  {treatment.priority} Priority
                                </Badge>
                                <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 font-medium px-3 py-1 text-xs">
                                  ${treatment.estimatedCost}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-slate-600">{treatment.notes}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="rounded-xl border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                      <CardContent className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-500">No treatment plan currently recommended</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                <Button variant="outline" className="border-slate-200 hover:bg-slate-50 rounded-xl">
                  <History className="h-4 w-4 mr-2" />
                  Print History
                </Button>
                <Button 
                  onClick={handleScheduleAppointment}
                  variant="outline" 
                  className="border-slate-200 hover:bg-slate-50 rounded-xl"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
                <Button 
                  onClick={() => setShowAddVisitRecord(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add Visit Record
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Treatment Plan Modal */}
        {showAddTreatmentPlan && (
          <Dialog open={showAddTreatmentPlan} onOpenChange={setShowAddTreatmentPlan}>
            <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-800">
                  Add Treatment Plan for {selectedPatient?.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Treatment</label>
                    <Input
                      value={newTreatmentPlan.treatment}
                      onChange={(e) => setNewTreatmentPlan({...newTreatmentPlan, treatment: e.target.value})}
                      placeholder="e.g., Root Canal, Filling"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Tooth</label>
                    <Input
                      value={newTreatmentPlan.tooth}
                      onChange={(e) => setNewTreatmentPlan({...newTreatmentPlan, tooth: e.target.value})}
                      placeholder="e.g., Upper Right Molar"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Priority</label>
                    <Select value={newTreatmentPlan.priority} onValueChange={(value) => setNewTreatmentPlan({...newTreatmentPlan, priority: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Estimated Cost</label>
                    <Input
                      value={newTreatmentPlan.estimatedCost}
                      onChange={(e) => setNewTreatmentPlan({...newTreatmentPlan, estimatedCost: e.target.value})}
                      placeholder="0.00"
                      type="number"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Notes</label>
                  <textarea
                    value={newTreatmentPlan.notes}
                    onChange={(e) => setNewTreatmentPlan({...newTreatmentPlan, notes: e.target.value})}
                    placeholder="Additional notes..."
                    className="w-full mt-1 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowAddTreatmentPlan(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTreatmentPlan} className="bg-gradient-to-r from-purple-600 to-purple-700">
                    Add Treatment Plan
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Visit Record Modal */}
        {showAddVisitRecord && (
          <Dialog open={showAddVisitRecord} onOpenChange={setShowAddVisitRecord}>
            <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-800">
                  Add Visit Record for {selectedPatient?.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Date</label>
                    <Input
                      value={newVisitRecord.date}
                      onChange={(e) => setNewVisitRecord({...newVisitRecord, date: e.target.value})}
                      type="date"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Time</label>
                    <Input
                      value={newVisitRecord.time}
                      onChange={(e) => setNewVisitRecord({...newVisitRecord, time: e.target.value})}
                      type="time"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Treatment</label>
                    <Input
                      value={newVisitRecord.treatment}
                      onChange={(e) => setNewVisitRecord({...newVisitRecord, treatment: e.target.value})}
                      placeholder="e.g., Cleaning, Filling"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Cost</label>
                    <Input
                      value={newVisitRecord.cost}
                      onChange={(e) => setNewVisitRecord({...newVisitRecord, cost: e.target.value})}
                      placeholder="0.00"
                      type="number"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Diagnosis</label>
                  <Input
                    value={newVisitRecord.diagnosis}
                    onChange={(e) => setNewVisitRecord({...newVisitRecord, diagnosis: e.target.value})}
                    placeholder="Patient diagnosis..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Notes</label>
                  <textarea
                    value={newVisitRecord.notes}
                    onChange={(e) => setNewVisitRecord({...newVisitRecord, notes: e.target.value})}
                    placeholder="Visit notes..."
                    className="w-full mt-1 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowAddVisitRecord(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddVisitRecord} className="bg-gradient-to-r from-blue-600 to-purple-600">
                    Add Visit Record
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MainLayout>
  )
}
