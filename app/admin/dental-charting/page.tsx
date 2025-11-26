"use client"

import { useState, useEffect } from "react"
import api from "@/lib/axiosConfig"
import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Camera, History, User, FileText, Download, PrinterIcon as Print, Activity, TrendingUp, Brain, Image as ImageIcon, Plus, MessageCircle, Send, Bot } from "lucide-react"
import DentalChart from "@/components/dental-charting/dental-chart"
import ToothDetailModal from "@/components/dental-charting/tooth-detail-modal"
import ImageGallery from "@/components/dental-charting/image-gallery"
import AIDiagnosisPanel from "@/components/dental-charting/ai-diagnosis-panel"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Patient {
  id: string
  name: string
  age: number
  phone: string
  email: string
  medicalHistory: string
  lastVisit: string | null
  totalVisits: number
}

interface Visit {
  id: string
  date: string
  time: string
  diagnosis: string
  treatment: string
  cost: number
  notes: string
  status: string
  dentist: string
}

interface ToothData {
  conditions: string[]
  surfaces: string[]
  notes: string
  images: string[]
  confidence_score?: number
  ai_diagnosis?: boolean
}

interface ToothDataRecord {
  [key: string]: ToothData
}

interface ChartStats {
  totalTeeth: number
  healthyTeeth: number
  treatedTeeth: number
  imagesCount: number
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function DentalChartingPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState<Patient[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null)
  const [toothData, setToothData] = useState<ToothDataRecord>({})
  const [viewMode, setViewMode] = useState<"current" | "historical">("current")
  const [isToothModalOpen, setIsToothModalOpen] = useState(false)
  const [aiDiagnosis, setAiDiagnosis] = useState<any>(null)
  const [highlightedTeeth, setHighlightedTeeth] = useState<string[]>([])
  const [chartId, setChartId] = useState<string | null>(null)
  const [stats, setStats] = useState<ChartStats>({
    totalTeeth: 32,
    healthyTeeth: 0,
    treatedTeeth: 0,
    imagesCount: 0
  })

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      console.log('Fetching patients...')
      const response = await api.get('/dental-charting', {
        params: { action: 'patients' }
      })
      
      console.log('Patients API response:', response.data)
      
      if (response.data.success) {
        setPatients(response.data.patients)
        if (data.patients.length > 0) {
          setSelectedPatient(data.patients[0])
          await fetchVisits(data.patients[0].id)
        } else {
          console.log('No patients found')
          toast({
            title: "No Patients Found",
            description: "No patients found in the database. Please add patients first.",
            variant: "destructive",
          })
        }
      } else {
        console.error('API Error:', data)
        toast({
          title: "Error",
          description: data.error || "Failed to fetch patients",
          variant: "destructive",
        })
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
  }

  const fetchVisits = async (patientId: string) => {
    try {
      const response = await api.get('/dental-charting', {
        params: { action: 'visits', patientId }
      })
      
      if (response.data.success) {
        setVisits(response.data.visits)
        if (data.visits.length > 0) {
          setSelectedVisit(data.visits[0])
          await fetchChartData(patientId, data.visits[0].id)
        } else {
          // Create a default visit if none exist
          const defaultVisit = {
            id: "default-visit",
            date: new Date().toISOString().split('T')[0],
            time: "10:00",
            diagnosis: "Initial consultation",
            treatment: "Dental examination",
            cost: 0,
            notes: "New patient visit",
            status: "scheduled",
            dentist: "Dr. Smith"
          }
          setVisits([defaultVisit])
          setSelectedVisit(defaultVisit)
          await fetchChartData(patientId, defaultVisit.id)
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch visits",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching visits:', error)
      toast({
        title: "Error",
        description: "Failed to fetch visits",
        variant: "destructive",
      })
    }
  }

  const fetchChartData = async (patientId: string, visitId: string) => {
    try {
      const response = await api.get('/dental-charting', {
        params: { action: 'chart', patientId, visitId }
      })
      
      if (response.data.success) {
        setChartId(response.data.chart.id)
        setToothData(response.data.toothData)
        
        // Fetch stats
        await fetchStats(patientId)
        
        // Set AI diagnosis if available
        if (response.data.aiDiagnoses && response.data.aiDiagnoses.length > 0) {
          setAiDiagnosis(response.data.aiDiagnoses[0])
          setHighlightedTeeth(response.data.aiDiagnoses[0].affected_teeth || [])
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch chart data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch chart data",
        variant: "destructive",
      })
    }
  }

  const fetchStats = async (patientId: string) => {
    try {
      const response = await api.get('/dental-charting', {
        params: { action: 'stats', patientId }
      })
      
      if (response.data.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handlePatientChange = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId)
    if (patient) {
      setSelectedPatient(patient)
      await fetchVisits(patientId)
    }
  }

  const handleVisitChange = async (visitId: string) => {
    const visit = visits.find(v => v.id === visitId)
    if (visit && selectedPatient) {
      setSelectedVisit(visit)
      await fetchChartData(selectedPatient.id, visitId)
    }
  }

  const handleToothClick = (toothNumber: string) => {
    setSelectedTooth(toothNumber)
    setIsToothModalOpen(true)
  }

  const handleToothUpdate = async (toothNumber: string, data: ToothData) => {
    if (!chartId) return

    try {
      const response = await api.post('/dental-charting', {
        action: 'update-tooth',
        data: {
          chartId,
          toothNumber,
          conditionData: data
        }
      })

      if (response.data.success) {
        setToothData((prev) => ({
          ...prev,
          [toothNumber]: data,
        }))
        
        // Refresh stats
        if (selectedPatient) {
          await fetchStats(selectedPatient.id)
        }
      } else {
        toast({
          title: "Error",
          description: response.data.error || "Failed to update tooth data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating tooth data:', error)
      toast({
        title: "Error",
        description: "Failed to update tooth data",
        variant: "destructive",
      })
    }
  }

  const getToothStatus = (toothNumber: string) => {
    const tooth = toothData[toothNumber]
    if (!tooth || tooth.conditions.includes("Healthy")) return "healthy"
    if (tooth.conditions.includes("Missing")) return "missing"
    if (tooth.conditions.includes("Crown") || tooth.conditions.includes("Bridge")) return "crown"
    if (tooth.conditions.includes("Filling")) return "filling"
    if (tooth.conditions.includes("Cavity")) return "cavity"
    if (tooth.conditions.includes("Root Canal")) return "root-canal"
    return "healthy"
  }

  const handleAiDiagnosis = async (diagnosis: any) => {
    if (!chartId) return

    try {
      const response = await api.post('/dental-charting', {
        action: 'save-ai-diagnosis',
        data: {
          chartId,
          diagnosis
        }
      })

      if (response.data.success) {
        setAiDiagnosis(diagnosis)
        setHighlightedTeeth(diagnosis.affectedTeeth.map((t: any) => t.toothNumber))
      } else {
        toast({
          title: "Error",
          description: response.data.error || "Failed to save AI diagnosis",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving AI diagnosis:', error)
      toast({
        title: "Error",
        description: "Failed to save AI diagnosis",
        variant: "destructive",
      })
    }
  }

  const handleAcceptDiagnosis = async (diagnosis: any) => {
    if (!chartId) return

    try {
      // Auto-fill tooth data with AI suggestions
      const updatedToothData: ToothDataRecord = { ...toothData }
      diagnosis.affectedTeeth.forEach((tooth: any) => {
        updatedToothData[tooth.toothNumber] = {
          conditions: tooth.conditions,
          surfaces: tooth.surfaces,
          notes: `AI Diagnosis: ${tooth.diagnosis} (Confidence: ${tooth.confidence}%)`,
          images: toothData[tooth.toothNumber]?.images || [],
        }
      })
      
      // Update each tooth in the database
      for (const [toothNumber, data] of Object.entries(updatedToothData)) {
        if (diagnosis.affectedTeeth.some((t: any) => t.toothNumber === toothNumber)) {
          await handleToothUpdate(toothNumber, data)
        }
      }
      
      setToothData(updatedToothData)
      setAiDiagnosis(null)
      setHighlightedTeeth([])
      
      toast({
        title: "Success",
        description: "AI diagnosis accepted and applied to dental chart!",
      })
    } catch (error) {
      console.error('Error accepting AI diagnosis:', error)
      toast({
        title: "Error",
        description: "Failed to accept AI diagnosis",
        variant: "destructive",
      })
    }
  }

  // Chat functionality
  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput("")
    setIsChatLoading(true)

    try {
      const response = await api.post('/chat', {
        message: chatInput,
        patientData: selectedPatient,
        toothData: toothData,
        visitData: selectedVisit
      })

      if (response.data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, assistantMessage])
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.error || "Sorry, I encountered an error. Please try again.",
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsChatLoading(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dental charting data...</p>
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
                  Dental Charting
                </h1>
                <p className="text-gray-600 text-lg">Interactive dental chart with FDI numbering system and AI-powered diagnosis</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Teeth</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalTeeth}</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-semibold px-2 py-1 rounded-full text-blue-600 bg-blue-50">
                        FDI System
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 shadow-sm">
                    <Activity className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Healthy Teeth</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.healthyTeeth}</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-semibold px-2 py-1 rounded-full text-green-600 bg-green-50">
                        {Math.round((stats.healthyTeeth / stats.totalTeeth) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-green-50 shadow-sm">
                    <User className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Treated Teeth</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.treatedTeeth}</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-semibold px-2 py-1 rounded-full text-purple-600 bg-purple-50">
                        {Math.round((stats.treatedTeeth / stats.totalTeeth) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50 shadow-sm">
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Clinical Images</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.imagesCount}</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-semibold px-2 py-1 rounded-full text-orange-600 bg-orange-50">
                        X-rays & Photos
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-orange-50 shadow-sm">
                    <Camera className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Patient & Visit Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  <User className="h-5 w-5 text-blue-600" />
                  Select Patient
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={selectedPatient?.id || ""}
                  onValueChange={handlePatientChange}
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} (Age: {patient.age})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPatient && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    <History className="h-4 w-4 text-gray-500" />
                    <span>Last visit: {selectedPatient.lastVisit || 'No visits'}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Select Visit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={selectedVisit?.id || ""}
                  onValueChange={handleVisitChange}
                  disabled={!selectedPatient}
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                    <SelectValue placeholder="Select a visit" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    {visits.map((visit) => (
                      <SelectItem key={visit.id} value={visit.id}>
                        {visit.date} - {visit.treatment}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedVisit && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>Dentist: {selectedVisit.dentist}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Chart View
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                  <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl border-2">
                    <TabsTrigger value="current" className="rounded-lg">Current</TabsTrigger>
                    <TabsTrigger value="historical" className="rounded-lg">Historical</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span>{viewMode === "current" ? "Ongoing treatments" : "Previous diagnoses"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mb-8">
            <Button 
              variant="outline" 
              size="sm"
              className="h-12 px-6 border-2 border-gray-200 hover:border-blue-500 transition-colors duration-200 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white/90"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Chart
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="h-12 px-6 border-2 border-gray-200 hover:border-purple-500 transition-colors duration-200 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white/90"
            >
              <Print className="h-4 w-4 mr-2" />
              Print Chart
            </Button>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* 2D Dental Chart */}
              <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-6 border-b border-gray-200">
                  <CardTitle className="flex items-center justify-between text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    <span className="flex items-center gap-3">
                      <Activity className="h-6 w-6 text-blue-600" />
                      2D Dental Chart - {selectedPatient?.name || 'Select Patient'}
                    </span>
                    <Badge 
                      variant={viewMode === "current" ? "default" : "secondary"}
                      className="px-3 py-1 rounded-full font-medium"
                    >
                      {viewMode === "current" ? "Current Chart" : "Historical Chart"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <DentalChart
                    onToothClick={handleToothClick}
                    getToothStatus={getToothStatus}
                    toothData={toothData}
                    highlightedTeeth={highlightedTeeth}
                  />
                </CardContent>
              </Card>

              {/* AI Diagnosis Panel */}
              <AIDiagnosisPanel
                patientName={selectedPatient?.name || 'Select Patient'}
                onDiagnosisComplete={handleAiDiagnosis}
                onAcceptDiagnosis={handleAcceptDiagnosis}
                currentDiagnosis={aiDiagnosis}
                patientData={selectedPatient}
                toothData={toothData}
              />
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* AI Chat Section */}
              <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    <div className="p-2 bg-blue-100/80 rounded-lg">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                    AI Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-col h-96">
                    <ScrollArea className="flex-1 mb-4">
                      <div className="space-y-4">
                        {chatMessages.length === 0 && (
                          <div className="text-center text-gray-500 py-8">
                            <Bot className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">Ask me anything about dental charting, patient care, or treatment recommendations!</p>
                          </div>
                        )}
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                <p className="text-sm">AI is thinking...</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                        placeholder="Ask about dental charting..."
                        className="flex-1"
                        disabled={isChatLoading}
                      />
                      <Button
                        onClick={sendChatMessage}
                        disabled={!chatInput.trim() || isChatLoading}
                        size="sm"
                        className="px-4"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chart Legend with Glassmorphism */}
              <Card className="rounded-2xl border-0 shadow-lg bg-white/60 backdrop-blur-sm border border-white/20">
                <CardHeader className="pb-4 border-b border-white/20">
                  <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent flex items-center gap-3">
                    <div className="p-2 bg-blue-100/80 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    Chart Legend
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50/80 backdrop-blur-sm rounded-xl border border-green-200/50 hover:bg-green-50/90 transition-all duration-300">
                    <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow-md"></div>
                    <span className="text-sm font-medium text-green-800">Healthy</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50/80 backdrop-blur-sm rounded-xl border border-yellow-200/50 hover:bg-yellow-50/90 transition-all duration-300">
                    <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full shadow-md"></div>
                    <span className="text-sm font-medium text-yellow-800">Cavity</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-200/50 hover:bg-blue-50/90 transition-all duration-300">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-md"></div>
                    <span className="text-sm font-medium text-blue-800">Filling</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50/80 backdrop-blur-sm rounded-xl border border-purple-200/50 hover:bg-purple-50/90 transition-all duration-300">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full shadow-md"></div>
                    <span className="text-sm font-medium text-purple-800">Crown</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50/80 backdrop-blur-sm rounded-xl border border-red-200/50 hover:bg-red-50/90 transition-all duration-300">
                    <div className="w-4 h-4 bg-gradient-to-r from-red-400 to-red-600 rounded-full shadow-md"></div>
                    <span className="text-sm font-medium text-red-800">Root Canal</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:bg-gray-50/90 transition-all duration-300">
                    <div className="w-4 h-4 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full shadow-md"></div>
                    <span className="text-sm font-medium text-gray-800">Missing</span>
                  </div>
                </CardContent>
              </Card>

              {/* Clinical Images with Glassmorphism */}
              <Card className="rounded-2xl border-0 shadow-lg bg-white/60 backdrop-blur-sm border border-white/20">
                <CardHeader className="pb-4 border-b border-white/20">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    <div className="p-2 bg-orange-100/80 rounded-lg">
                      <Camera className="h-5 w-5 text-orange-600" />
                    </div>
                    Clinical Images
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ImageGallery 
                    patientId={selectedPatient?.id || ''} 
                    visitId={selectedVisit?.id || ''} 
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tooth Detail Modal */}
          {selectedTooth && (
            <ToothDetailModal
              isOpen={isToothModalOpen}
              onClose={() => setIsToothModalOpen(false)}
              toothNumber={selectedTooth}
              toothData={toothData[selectedTooth] || { conditions: ["Healthy"], surfaces: [], notes: "", images: [] }}
              onUpdate={(data) => handleToothUpdate(selectedTooth, data)}
              patientName={selectedPatient?.name || 'Unknown Patient'}
            />
          )}
        </div>
      </div>
    </MainLayout>
  )
}
