"use client"

import { useEffect, useState } from "react"

// Force dynamic rendering to avoid build-time environment variable issues
export const dynamic = 'force-dynamic'

import dayjs from 'dayjs'
import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, Users, Clock, CheckCircle, XCircle, Plus, Filter, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"


// Add/adjust types for state and function parameters
interface SmsMessage {
  id: string
  to_number: string
  message: string
  status: string
  sent_at?: string
  delivered_at?: string
  failed_at?: string
  error_message?: string
  created_by?: string | null
  inserted_at: string
  cost?: number
  date?: string
  time?: string
  recipient?: string
  phone?: string
  template?: string
}

interface SendForm {
  to: string
  message: string
}

interface Patient {
  id: number
  first_name: string
  last_name: string
  phone: string
  email: string
  name: string
  status?: string
}

interface SmsTemplate {
  id: string
  name: string
  category: string
  message: string
  usage_count?: number
  created_at?: string
  updated_at?: string
}

export default function ReceptionistSmsPage() {
  const { toast } = useToast()
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [sendForm, setSendForm] = useState<SendForm>({ to: '', message: '' })
  const [sending, setSending] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  // Add missing state and stubs to fix linter errors without changing UI
  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'history'>('send')
  const [isNewTemplateDialogOpen, setIsNewTemplateDialogOpen] = useState(false)
  const [templateForm, setTemplateForm] = useState({ name: '', category: '', message: '' })
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const handleTemplateFormChange = (field: string, value: string) => setTemplateForm((prev) => ({ ...prev, [field]: value }))
  const handleSaveTemplate = async () => {
    // Validate form
    if (!templateForm.name.trim()) {
      toast({
        title: "Template name required",
        description: "Please enter a template name.",
        variant: "destructive",
      })
      return
    }

    if (!templateForm.category.trim()) {
      toast({
        title: "Category required",
        description: "Please select a category.",
        variant: "destructive",
      })
      return
    }

    if (!templateForm.message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message template.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await api.post('/sms-templates', {
        action: editingTemplateId ? 'update' : 'create',
        templateData: {
          id: editingTemplateId,
          name: templateForm.name.trim(),
          category: templateForm.category,
          message: templateForm.message.trim(),
        }
      })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to save template')
      }

      // Refresh templates
      const refreshResponse = await api.get('/sms-templates')
      if (refreshResponse.data.success) {
        setSmsTemplates(refreshResponse.data.templates || [])
      }

      // Reset form and state
      setTemplateForm({ name: '', category: '', message: '' })
      setEditingTemplateId(null)
      setIsNewTemplateDialogOpen(false)
      
      toast({
        title: editingTemplateId ? "Template updated" : "Template saved",
        description: editingTemplateId ? "SMS template has been updated successfully." : "SMS template has been saved successfully.",
      })
    } catch (error: any) {
      console.error('Error saving template:', error)
      toast({
        title: "Error saving template",
        description: error.message || "Failed to save template. Please try again.",
        variant: "destructive",
      })
    }
  }
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [selectedPatients, setSelectedPatients] = useState<number[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  // Add state for collapsible stats
  const [statsCollapsed, setStatsCollapsed] = useState(false)
  // Add state for recipient selection optimization
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  // Add stubs for missing properties on SmsMessage
  // (cost, date, time, recipient, phone, template)
  smsMessages.forEach((sms: any) => {
    if (sms.cost === undefined) sms.cost = 0
    if (sms.date === undefined) sms.date = ''
    if (sms.time === undefined) sms.time = ''
    if (sms.recipient === undefined) sms.recipient = ''
    if (sms.phone === undefined) sms.phone = ''
    if (sms.template === undefined) sms.template = ''
  })

  useEffect(() => {
    const fetchSms = async () => {
      setLoading(true)
      try {
        const response = await api.get('/sms', {
          params: { page: 1, pageSize: 1000 }
        })

        if (!response.data.success) {
          console.error('Error fetching SMS messages:', response.data.error)
          setSmsMessages([])
          return
        }

        setSmsMessages(response.data.messages || [])
      } catch (error) {
        console.error('Error fetching SMS messages:', error)
        setSmsMessages([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchSms()
  }, [])

  // Fetch patients for SMS
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get('/patients', {
          params: { page: 1, pageSize: 1000 }
        })

        if (!response.data.success) {
          console.error('Error fetching patients:', response.data.error)
          setPatients([])
          return
        }

        const patientsWithName = response.data.patients?.map((patient: any) => ({
          ...patient,
          name: `${patient.first_name} ${patient.last_name}`
        })) || []
        
        setPatients(patientsWithName)
      } catch (error) {
        console.error('Error fetching patients:', error)
        setPatients([])
      }
    }
    
    fetchPatients()
  }, [])

  // Fetch SMS templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await api.get('/sms-templates')

        if (!response.data.success) {
          console.error('Error fetching SMS templates:', response.data.error)
          setSmsTemplates([])
          return
        }

        setSmsTemplates(response.data.templates || [])
      } catch (error) {
        console.error('Error fetching SMS templates:', error)
        setSmsTemplates([])
      }
    }
    
    fetchTemplates()
  }, [])

  // Stats
  const today = dayjs().format('YYYY-MM-DD')
  const sentToday = smsMessages.filter((m: SmsMessage) => m.status === 'sent' && m.sent_at && dayjs(m.sent_at).format('YYYY-MM-DD') === today).length
  const failedToday = smsMessages.filter((m: SmsMessage) => m.status === 'failed' && m.failed_at && dayjs(m.failed_at).format('YYYY-MM-DD') === today).length
  const pending = smsMessages.filter((m: SmsMessage) => m.status === 'pending').length
  const totalSent = smsMessages.filter((m: SmsMessage) => m.status === 'sent').length

  // Dynamic change calculations for stat cards
  const now = dayjs();
  const startOfThisMonth = now.startOf('month');
  const startOfLastMonth = startOfThisMonth.subtract(1, 'month');
  const endOfLastMonth = startOfThisMonth.subtract(1, 'day');

  const messagesThisMonth = smsMessages.filter(sms => dayjs(sms.inserted_at).isAfter(startOfThisMonth.subtract(1, 'day')));
  const messagesLastMonth = smsMessages.filter(sms =>
    dayjs(sms.inserted_at).isAfter(startOfLastMonth.subtract(1, 'day')) &&
    dayjs(sms.inserted_at).isBefore(endOfLastMonth.add(1, 'day'))
  );

  const totalSentThisMonth = messagesThisMonth.filter(sms => sms.status === 'sent').length;
  const totalSentLastMonth = messagesLastMonth.filter(sms => sms.status === 'sent').length;
  const totalSentChange = totalSentLastMonth === 0 ? 0 : ((totalSentThisMonth - totalSentLastMonth) / totalSentLastMonth) * 100;

  const deliveredThisMonth = messagesThisMonth.filter(sms => sms.status === 'delivered').length;
  const deliveredLastMonth = messagesLastMonth.filter(sms => sms.status === 'delivered').length;
  const deliveredChange = deliveredLastMonth === 0 ? 0 : ((deliveredThisMonth - deliveredLastMonth) / deliveredLastMonth) * 100;

  const failedThisMonth = messagesThisMonth.filter(sms => sms.status === 'failed').length;
  const failedLastMonth = messagesLastMonth.filter(sms => sms.status === 'failed').length;
  const failedChange = failedLastMonth === 0 ? 0 : ((failedThisMonth - failedLastMonth) / failedLastMonth) * 100;

  const costThisMonth = messagesThisMonth.reduce((sum, sms) => sum + (sms.cost ?? 0), 0);
  const costLastMonth = messagesLastMonth.reduce((sum, sms) => sum + (sms.cost ?? 0), 0);
  const costChange = costLastMonth === 0 ? 0 : ((costThisMonth - costLastMonth) / costLastMonth) * 100;

  // Send SMS handler
  const handleSendSms = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSending(true)
    setError('')
    
    if (selectedPatients.length === 0) {
      toast({
        title: "No recipients selected",
        description: "Please select at least one patient to send SMS to.",
        variant: "destructive",
      })
      setSending(false)
      return
    }

    if (!customMessage.trim()) {
      toast({
        title: "No message",
        description: "Please enter a message to send.",
        variant: "destructive",
      })
      setSending(false)
      return
    }

    try {
      // Create SMS messages for each selected patient
      const newSmsMessages: SmsMessage[] = []
      
      for (const patientId of selectedPatients) {
        const patient = patients.find(p => p.id === patientId)
        if (patient && patient.phone) {
          // Create a new SMS message object
          const newSmsMessage: SmsMessage = {
            id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID
            to_number: patient.phone,
            message: customMessage,
            status: 'pending',
            inserted_at: new Date().toISOString(),
            recipient: patient.name,
            phone: patient.phone,
            date: dayjs().format('YYYY-MM-DD'),
            time: dayjs().format('HH:mm:ss'),
            cost: 0.05, // Default cost
            created_by: null
          }
          
          // Add to local state immediately
          newSmsMessages.push(newSmsMessage)
          
          // Send SMS via API
          const response = await api.post('/sms', {
            action: 'send',
            data: {
              to: patient.phone,
              message: customMessage,
              created_by: null, // Optionally, set user id
            }
          })
          
          if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to send SMS')
          }
          
          // Update status to sent after successful API call
          if (response.data.messageId) {
            // Update the temporary message with the real ID and status
            setSmsMessages(prevMessages => prevMessages.map(msg => 
              msg.id === newSmsMessage.id 
                ? { ...msg, id: response.data.messageId, status: 'sent', sent_at: new Date().toISOString() }
                : msg
            ))
          }
        }
      }
      
      // Add all new messages to local state immediately
      setSmsMessages(prevMessages => [...newSmsMessages, ...prevMessages])
      
      setCustomMessage('')
      setSelectedPatients([])
      toast({
        title: "SMS sent successfully",
        description: `SMS sent to ${selectedPatients.length} patient(s).`,
      })
      
      // Refresh SMS messages
      const refreshResponse = await api.get('/sms', {
        params: { page: 1, pageSize: 1000 }
      })
      if (refreshResponse.data.success) {
        setSmsMessages(refreshResponse.data.messages || [])
      }
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error sending SMS",
        description: err.message,
        variant: "destructive",
      })
    }
    setSending(false)
  }

  const handleScheduleSMS = () => {
    const scheduleTime = prompt('Enter schedule time (e.g., "2024-01-17 10:00"):')
    if (scheduleTime) {
      toast({
        title: "SMS scheduled",
        description: `SMS scheduled for ${scheduleTime}`,
      })
    }
  }

  const handleEditTemplate = (template: SmsTemplate) => {
    setEditingTemplateId(template.id)
    setTemplateForm({
      name: template.name,
      category: template.category,
      message: template.message,
    })
    setIsNewTemplateDialogOpen(true)
  }

  const handleNewTemplate = () => {
    setEditingTemplateId(null)
    setTemplateForm({ name: '', category: '', message: '' })
    setIsNewTemplateDialogOpen(true)
  }

  const handleResendSMS = async (sms: SmsMessage) => {
    if (confirm(`Resend SMS to ${sms.recipient}?`)) {
      try {
        // Update local state immediately to show pending status
        setSmsMessages(prevMessages => prevMessages.map(msg => 
          msg.id === sms.id 
            ? { ...msg, status: 'pending', sent_at: undefined, delivered_at: undefined, failed_at: undefined }
            : msg
        ))
        
        // Send SMS via API
        const response = await api.post('/sms', {
          action: 'resend',
          data: {
            messageId: sms.id
          }
        })
        
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to resend SMS')
        }
        
        // Update status to sent after successful API call
        setSmsMessages(prevMessages => prevMessages.map(msg => 
          msg.id === sms.id 
            ? { ...msg, status: 'sent', sent_at: new Date().toISOString() }
            : msg
        ))
        
        toast({
          title: "SMS resent successfully",
          description: `SMS resent to ${sms.recipient}`,
        })
        
        // Refresh SMS messages
        const refreshResponse = await api.get('/sms', {
          params: { page: 1, pageSize: 1000 }
        })
        if (refreshResponse.data.success) {
          setSmsMessages(refreshResponse.data.messages || [])
        }
      } catch (error: any) {
        // Revert to failed status if resend fails
        setSmsMessages(prevMessages => prevMessages.map(msg => 
          msg.id === sms.id 
            ? { ...msg, status: 'failed', failed_at: new Date().toISOString(), error_message: error.message }
            : msg
        ))
        
        toast({
          title: "Error resending SMS",
          description: error.message,
          variant: "destructive",
        })
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "failed":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Only use the new dynamic backend-driven variables and logic
  const deliveredCount = smsMessages.filter((sms) => sms.status === "delivered").length
  const failedCount = smsMessages.filter((sms) => sms.status === "failed").length
  const totalCost = smsMessages.reduce((sum, sms) => sum + (sms.cost ?? 0), 0)

  // Filter and sort patients for recipient selection
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.phone.includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    let aValue = a[sortBy as keyof typeof a] || ''
    let bValue = b[sortBy as keyof typeof b] || ''
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase()
    if (typeof bValue === 'string') bValue = bValue.toLowerCase()
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const paginatedPatients = sortedPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(sortedPatients.length / itemsPerPage)

  // Batch selection helpers
  const handleSelectAllOnPage = () => {
    const pagePatientIds = paginatedPatients.map(p => p.id)
    const newSelected = [...selectedPatients, ...pagePatientIds.filter(id => !selectedPatients.includes(id))]
    setSelectedPatients(newSelected)
  }

  const handleClearAllOnPage = () => {
    const pagePatientIds = paginatedPatients.map(p => p.id)
    setSelectedPatients(selectedPatients.filter(id => !pagePatientIds.includes(id)))
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-6 space-y-6">
        {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
              SMS Notification Center
            </h1>
            <p className="text-gray-600">Send SMS notifications and manage communication templates</p>
          </div>

          {/* Quick Stats */}
          <div className="mb-6">
            <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    SMS Summary
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatsCollapsed(!statsCollapsed)}
                    className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                  >
                    {statsCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {!statsCollapsed && (
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <div>
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Sent</p>
                        <p className="text-xl font-bold text-blue-900">{totalSent}</p>
                      </div>
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <div>
                        <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Delivered</p>
                        <p className="text-xl font-bold text-green-900">{deliveredCount}</p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                      <div>
                        <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Failed</p>
                        <p className="text-xl font-bold text-red-900">{failedCount}</p>
                      </div>
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                      <div>
                        <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Cost</p>
                        <p className="text-xl font-bold text-purple-900">${totalCost.toFixed(2)}</p>
                      </div>
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            {/* Tabs */}
            <div className="flex space-x-1 bg-white/80 backdrop-blur-sm p-1 rounded-2xl shadow-lg">
              <button
                onClick={() => setActiveTab("send")}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === "send" 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                Send SMS
              </button>
              <button
                onClick={() => setActiveTab("templates")}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === "templates" 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === "history" 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                History
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
          <Dialog open={isNewTemplateDialogOpen} onOpenChange={setIsNewTemplateDialogOpen}>
            <DialogTrigger asChild>
                  <Button 
                    onClick={handleNewTemplate}
                    className="h-12 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  >
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
              <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {editingTemplateId ? 'Edit SMS Template' : 'Create SMS Template'}
                    </DialogTitle>
              </DialogHeader>
                  <div className="space-y-6 py-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="templateName" className="text-gray-700 font-medium">Template Name</Label>
                    <Input
                      id="templateName"
                      placeholder="Enter template name"
                      value={templateForm.name}
                      onChange={(e) => handleTemplateFormChange("name", e.target.value)}
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                    />
                  </div>
                      <div className="space-y-3">
                        <Label htmlFor="templateCategory" className="text-gray-700 font-medium">Category</Label>
                    <Select
                      value={templateForm.category}
                      onValueChange={(value) => handleTemplateFormChange("category", value)}
                    >
                          <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                          <SelectContent className="rounded-xl border-2">
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                    <div className="space-y-3">
                      <Label htmlFor="templateMessage" className="text-gray-700 font-medium">Message Template</Label>
                  <Textarea
                    id="templateMessage"
                    placeholder="Enter your message template. Use {patient_name}, {dentist}, {date}, {time}, {treatment}, {amount} as placeholders."
                    rows={6}
                    value={templateForm.message}
                    onChange={(e) => handleTemplateFormChange("message", e.target.value)}
                        className="border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                  />
                  <div className="text-sm text-gray-500">Characters: {templateForm.message.length}/160</div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsNewTemplateDialogOpen(false)}
                      className="h-12 px-6 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-xl"
                    >
                  Cancel
                </Button>
                    <Button 
                      onClick={handleSaveTemplate}
                      className="h-12 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      {editingTemplateId ? 'Update Template' : 'Save Template'}
                    </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        </div>

        {/* Send SMS Tab */}
        {activeTab === "send" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-6 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    <MessageSquare className="h-6 w-6 text-gray-700" />
                    Compose Message
                  </CardTitle>
              </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-3">
                    <Label htmlFor="template" className="text-gray-700 font-medium">Use Template (Optional)</Label>
                  <Select
                    onValueChange={(value) => {
                      const template = smsTemplates.find((t) => t.id.toString() === value)
                      if (template) {
                        setSelectedTemplate(template)
                        setCustomMessage(template.message)
                      }
                    }}
                  >
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                      {smsTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="message" className="text-gray-700 font-medium">Message</Label>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`font-medium ${customMessage.length > 160 ? 'text-red-600' : 'text-gray-500'}`}>
                          {customMessage.length}/160 chars
                        </span>
                        <span className="text-gray-500">
                          {Math.ceil(customMessage.length / 160)} SMS
                        </span>
                      </div>
                    </div>
                  <Textarea
                    id="message"
                    placeholder="Type your message here... Use {{name}} for patient name, {{date}} for appointment date"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                    maxLength={480}
                    className={`border-2 transition-colors duration-200 rounded-xl resize-none ${
                      customMessage.length > 160 ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                  
                  {/* Message Preview */}
                  {customMessage && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Message Preview</span>
                      </div>
                      <div className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">
                        {customMessage}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-gray-500">
                    <span>
                      Estimated cost: $
                      {(Math.ceil(customMessage.length / 160) * selectedPatients.length * 0.05).toFixed(2)}
                    </span>
                    <span>
                      Recipients: {selectedPatients.length}
                    </span>
                  </div>
                </div>

                  <div className="space-y-3">
                    <Label className="text-gray-700 font-medium">Send Options</Label>
                  <div className="flex gap-4">
                      <form onSubmit={handleSendSms} className="flex-1">
                      <Button 
                          type="submit"
                          disabled={sending || selectedPatients.length === 0 || !customMessage.trim() || customMessage.length > 480}
                        className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                      >
                      <Send className="h-4 w-4 mr-2" />
                      {sending ? "Sending..." : `Send to ${selectedPatients.length} recipient${selectedPatients.length !== 1 ? 's' : ''}`}
                    </Button>
                    </form>
                      <Button 
                        variant="outline" 
                        className="flex-1 h-12 border-2 border-gray-200 hover:border-blue-500 transition-colors duration-200 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white/90" 
                        onClick={handleScheduleSMS}
                      >
                      <Clock className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

              <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-6 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    <Users className="h-6 w-6 text-gray-700" />
                    Select Recipients
                  </CardTitle>
              </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Search and Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Input
                          placeholder="Search by name or phone..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-10 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="h-10 w-32 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="h-10 px-3 border-2 border-gray-200 hover:border-blue-500 transition-colors duration-200 rounded-xl"
                        >
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </Button>
                      </div>
                    </div>

                    {/* Selection Summary and Batch Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 font-medium">
                          {selectedPatients.length} of {patients.length} patients selected
                        </span>
                        {selectedPatients.length > 0 && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {selectedPatients.length} selected
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSelectAllOnPage}
                          className="h-9 px-3 border-2 border-gray-200 hover:border-blue-500 transition-colors duration-200 rounded-lg"
                        >
                          Select Page
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setSelectedPatients(patients.map((p) => p.id))}
                          className="h-9 px-3 border-2 border-gray-200 hover:border-blue-500 transition-colors duration-200 rounded-lg"
                        >
                          Select All
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setSelectedPatients([])}
                          className="h-9 px-3 border-2 border-gray-200 hover:border-red-500 transition-colors duration-200 rounded-lg"
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>

                    {/* Compact Table */}
                    <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                      <div className="max-h-80 overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <Checkbox
                                  checked={paginatedPatients.length > 0 && paginatedPatients.every(p => selectedPatients.includes(p.id))}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleSelectAllOnPage()
                                    } else {
                                      handleClearAllOnPage()
                                    }
                                  }}
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Patient Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Phone Number
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tags
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedPatients.map((patient) => (
                              <tr 
                                key={patient.id}
                                className="hover:bg-gray-50 transition-colors duration-150"
                              >
                                <td className="px-4 py-3">
                                  <Checkbox
                                    checked={selectedPatients.includes(patient.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedPatients([...selectedPatients, patient.id])
                                      } else {
                                        setSelectedPatients(selectedPatients.filter((id) => id !== patient.id))
                                      }
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm text-gray-600">{patient.phone}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-1">
                                    <Badge variant="outline" className="text-xs px-2 py-1">
                                      Active
                                    </Badge>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedPatients.length)} of {sortedPatients.length} patients
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="h-8 px-3 border-2 border-gray-200 hover:border-blue-500 transition-colors duration-200 rounded-lg"
                          >
                            Previous
                          </Button>
                          <span className="flex items-center px-3 text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="h-8 px-3 border-2 border-gray-200 hover:border-blue-500 transition-colors duration-200 rounded-lg"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
            <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6 border-b border-gray-200">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  <MessageSquare className="h-6 w-6 text-gray-700" />
                  SMS Templates
                </CardTitle>
            </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {smsTemplates.map((template) => (
                    <div 
                      key={template.id} 
                      className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl hover:from-gray-100 hover:to-blue-100 transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:shadow-lg"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg text-gray-900">{template.name}</h3>
                          <Badge variant="outline" className="px-3 py-1 rounded-full font-medium">
                            {template.category}
                          </Badge>
                      </div>
                      <div className="text-right">
                          <p className="text-sm text-gray-600 font-medium">Used {template.usage_count || 0} times</p>
                      </div>
                    </div>

                      <div className="mb-6">
                        <p className="text-sm text-gray-700 bg-white/60 p-4 rounded-xl border border-gray-200">{template.message}</p>
                    </div>

                      <div className="flex justify-end gap-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditTemplate(template)}
                          className="h-10 px-4 border-2 border-gray-200 hover:border-gray-400 text-gray-700 hover:text-gray-800 transition-colors duration-200 rounded-xl bg-white/80 backdrop-blur-sm"
                        >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template)
                          setCustomMessage(template.message)
                          setActiveTab("send")
                        }}
                          className="h-10 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl"
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
            <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    <MessageSquare className="h-6 w-6 text-gray-700" />
                    SMS History
                  </CardTitle>
                  <Button 
                    variant="outline"
                    className="h-12 px-6 border-2 border-gray-200 hover:border-purple-500 transition-colors duration-200 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white/90"
                  >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {smsMessages.map((sms) => (
                  <div 
                    key={sms.id} 
                    className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl hover:from-gray-100 hover:to-blue-100 transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:shadow-lg"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-6">
                        <div className="text-center min-w-[80px] p-3 bg-white rounded-xl shadow-sm border border-gray-200">
                          <p className="font-bold text-sm text-gray-900">{sms.date}</p>
                          <p className="text-xs text-gray-500 font-medium">{sms.time}</p>
                        </div>
                        <div className="w-px h-12 bg-gradient-to-b from-gray-200 to-gray-300"></div>
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg text-gray-900">{sms.recipient}</h3>
                          <p className="text-sm text-gray-600">{sms.phone}</p>
                          <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-lg">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">{sms.template}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor(sms.status)} border px-3 py-1 rounded-full font-medium flex items-center gap-2`}>
                            {getStatusIcon(sms.status)}
                            {sms.status}
                        </Badge>
                        <Badge variant="outline" className="font-bold px-3 py-1 rounded-full">
                          ${ (sms.cost ?? 0).toFixed(2) }
                        </Badge>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-700 bg-white/60 p-4 rounded-xl border border-gray-200">{sms.message}</p>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleResendSMS(sms)}
                        className="h-10 px-4 border-2 border-blue-200 hover:border-blue-400 text-blue-700 hover:text-blue-800 transition-colors duration-200 rounded-xl bg-white/80 backdrop-blur-sm"
                      >
                        Resend
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-10 px-4 border-2 border-gray-200 hover:border-gray-400 text-gray-700 hover:text-gray-800 transition-colors duration-200 rounded-xl bg-white/80 backdrop-blur-sm"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </MainLayout>
  )
}
