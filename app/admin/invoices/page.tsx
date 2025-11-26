"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Filter, Receipt, Download, Eye, DollarSign, CreditCard, Banknote, TrendingUp, Calendar, User, Phone, CheckCircle, AlertCircle, XCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal, FileText, Printer, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import api from "@/lib/axiosConfig"

// Force dynamic rendering to avoid build-time environment variable issues
export const dynamic = 'force-dynamic'

import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import { useToast } from "@/hooks/use-toast"


// Simple debounce function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [isRecordingPayment, setIsRecordingPayment] = useState(false)
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [doctorFilter, setDoctorFilter] = useState("all")
  const [dateRangeFilter, setDateRangeFilter] = useState("all")
  const [isCreateInvoiceDialogOpen, setIsCreateInvoiceDialogOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set())
  const [invoiceForm, setInvoiceForm] = useState({
    patient_id: "",
    dentist_id: "",
    treatments: [{ name: "", quantity: 1, price: 0 }],
    subtotal: 0,
    discount: 0,
    tax: 0,
    notes: "",
    due_date: "",
  })
  const [patients, setPatients] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchTerm(value)
      setCurrentPage(1) // Reset to first page when searching
    }, 300),
    []
  )

  // Get unique doctors for filter
  const getUniqueDoctors = useCallback(() => {
    const doctors = [...new Set(invoices.map(inv => inv.dentist_id).filter(Boolean))]
    return doctors.sort()
  }, [invoices])

  // Filtered and paginated invoices
  const filteredInvoices = useMemo(() => {
    let filtered = invoices.filter((invoice) => {
      const patientName = `${invoice.patient?.first_name || ''} ${invoice.patient?.last_name || ''}`.toLowerCase()
      const matchesSearch =
        patientName.includes(searchTerm.toLowerCase()) ||
        (invoice.invoice_number || "").toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
      const matchesDoctor = doctorFilter === "all" || invoice.dentist_id === doctorFilter
      
      // Date range filtering
      let matchesDate = true
      if (dateRangeFilter !== "all") {
        const invoiceDate = dayjs(invoice.date)
        const now = dayjs()
        switch (dateRangeFilter) {
          case "today":
            matchesDate = invoiceDate.isSame(now, 'day')
            break
          case "week":
            matchesDate = invoiceDate.isAfter(now.subtract(7, 'day'))
            break
          case "month":
            matchesDate = invoiceDate.isAfter(now.subtract(30, 'day'))
            break
          case "quarter":
            matchesDate = invoiceDate.isAfter(now.subtract(90, 'day'))
            break
        }
      }
      
      return matchesSearch && matchesStatus && matchesDoctor && matchesDate
    })
    
    return filtered
  }, [invoices, searchTerm, statusFilter, doctorFilter, dateRangeFilter])

  // Paginated invoices
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredInvoices.slice(startIndex, endIndex)
  }, [filteredInvoices, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm("")
    setStatusFilter("all")
    setDoctorFilter("all")
    setDateRangeFilter("all")
    setCurrentPage(1)
  }, [])

  // Batch actions
  const handleSelectAll = useCallback(() => {
    if (selectedInvoices.size === paginatedInvoices.length) {
      setSelectedInvoices(new Set())
    } else {
      setSelectedInvoices(new Set(paginatedInvoices.map(inv => inv.id)))
    }
  }, [selectedInvoices.size, paginatedInvoices])

  const handleSelectInvoice = useCallback((invoiceId: string) => {
    const newSelected = new Set(selectedInvoices)
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId)
    } else {
      newSelected.add(invoiceId)
    }
    setSelectedInvoices(newSelected)
  }, [selectedInvoices])

  const handleBulkExport = useCallback(() => {
    if (selectedInvoices.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select invoices to export.",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Export Started",
      description: `Exporting ${selectedInvoices.size} invoices...`,
    })
  }, [selectedInvoices.size, toast])

  const handleBulkPrint = useCallback(() => {
    if (selectedInvoices.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select invoices to print.",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Print Started",
      description: `Printing ${selectedInvoices.size} invoices...`,
    })
  }, [selectedInvoices.size, toast])

  useEffect(() => {
    const fetchPatients = async () => {
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
    }
    fetchPatients()
  }, [])

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true)
      try {
        const response = await api.get('/invoices', {
          params: { page: 1, pageSize: 1000 }
        })
        
        if (response.data.success) {
          setInvoices(response.data.invoices || [])
        } else {
          console.error('Error fetching invoices:', response.data.error)
          setInvoices([])
        }
      } catch (error) {
        console.error('Error fetching invoices:', error)
        setInvoices([])
      }
      setLoading(false)
    }
    fetchInvoices()
    
    // TODO: Implement real-time updates with WebSocket or polling if needed
  }, [])

  // After fetching invoices, add dynamic change calculations
  const now = dayjs();
  const startOfThisMonth = now.startOf('month');
  const startOfLastMonth = startOfThisMonth.subtract(1, 'month');
  const endOfLastMonth = startOfThisMonth.subtract(1, 'day');

  const invoicesThisMonth = invoices.filter(inv => dayjs(inv.date).isAfter(startOfThisMonth.subtract(1, 'day')));
  const invoicesLastMonth = invoices.filter(inv =>
    dayjs(inv.date).isAfter(startOfLastMonth.subtract(1, 'day')) &&
    dayjs(inv.date).isBefore(endOfLastMonth.add(1, 'day'))
  );

  // Calculate revenue changes - use a more meaningful comparison
  const revenueThisMonth = invoicesThisMonth.reduce((sum, inv) => sum + Number(inv.total), 0);
  const revenueLastMonth = invoicesLastMonth.reduce((sum, inv) => sum + Number(inv.total), 0);
  const revenueChange = revenueLastMonth === 0 ? (revenueThisMonth > 0 ? 100 : 0) : ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;

  const countThisMonth = invoicesThisMonth.length;
  const countLastMonth = invoicesLastMonth.length;
  const countChange = countLastMonth === 0 ? (countThisMonth > 0 ? 100 : 0) : ((countThisMonth - countLastMonth) / countLastMonth) * 100;

  const pendingThisMonth = invoicesThisMonth.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + Number(inv.total), 0);
  const pendingLastMonth = invoicesLastMonth.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + Number(inv.total), 0);
  const pendingChange = pendingLastMonth === 0 ? (pendingThisMonth > 0 ? 100 : 0) : ((pendingThisMonth - pendingLastMonth) / pendingLastMonth) * 100;

  const partialThisMonth = invoicesThisMonth.filter(inv => inv.status === 'partial').reduce((sum, inv) => sum + Number(inv.remainingAmount || 0), 0);
  const partialLastMonth = invoicesLastMonth.filter(inv => inv.status === 'partial').reduce((sum, inv) => sum + Number(inv.remainingAmount || 0), 0);
  const partialChange = partialLastMonth === 0 ? (partialThisMonth > 0 ? 100 : 0) : ((partialThisMonth - partialLastMonth) / partialLastMonth) * 100;

  const handleInvoiceFormChange = (field: string, value: any) => {
    setInvoiceForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddTreatmentItem = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      treatments: [...prev.treatments, { name: "", quantity: 1, price: 0 }],
    }))
  }

  const handleCreateInvoice = async () => {
    if (!invoiceForm.patient_id) {
      toast({
        title: "Validation Error",
        description: "Please select a patient.",
        variant: "destructive",
      })
      return
    }

    if (!invoiceForm.dentist_id) {
      toast({
        title: "Validation Error",
        description: "Please enter a dentist name.",
        variant: "destructive",
      })
      return
    }

    // Check if treatments have names
    const emptyTreatments = invoiceForm.treatments.filter(t => !t.name.trim())
    if (emptyTreatments.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please enter names for all treatment items.",
        variant: "destructive",
      })
      return
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Math.floor(Math.random() * 1000000)}`
    
    // Calculate subtotal, total, etc.
    const subtotal = invoiceForm.treatments.reduce((sum, t) => sum + (Number(t.price) * Number(t.quantity)), 0)
    const discount = Number(invoiceForm.discount) || 0
    const tax = Number(invoiceForm.tax) || 0
    const total = subtotal - discount + tax

    try {
      const response = await api.post('/invoices', {
        action: 'create',
        invoiceData: {
          invoice_number: invoiceNumber,
          date: new Date().toISOString().slice(0, 10),
          patient_id: invoiceForm.patient_id,
          dentist_id: invoiceForm.dentist_id,
          subtotal,
          discount,
          tax,
          total,
          status: 'pending',
          due_date: invoiceForm.due_date || null,
          notes: invoiceForm.notes,
        },
        treatments: invoiceForm.treatments
      })

      if (response.data.success) {
        // Add to local state immediately
        setInvoices(prevInvoices => [response.data.invoice, ...prevInvoices])

        // Reset form
        setInvoiceForm({
          patient_id: "",
          dentist_id: "",
          treatments: [{ name: "", quantity: 1, price: 0 }],
          subtotal: 0,
          discount: 0,
          tax: 0,
          notes: "",
          due_date: "",
        })

        setIsCreateInvoiceDialogOpen(false)
        toast({
          title: "Invoice Created",
          description: "Invoice has been created successfully.",
        })
      } else {
        toast({
          title: "Invoice Creation Failed",
          description: `Error: ${result.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast({
        title: "Invoice Creation Failed",
        description: "An unexpected error occurred while creating the invoice.",
        variant: "destructive",
      })
    }
  }

  const handleRecordPayment = async (invoice: any) => {
    setSelectedInvoice(invoice)
    setPaymentAmount("")
    setIsPaymentDialogOpen(true)
  }

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return

    const patientName = `${selectedInvoice.patient?.first_name || ''} ${selectedInvoice.patient?.last_name || ''}`
    const remainingAmount = selectedInvoice.remainingAmount || Number(selectedInvoice.total)
    
    if (!paymentAmount || isNaN(Number(paymentAmount))) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      })
      return
    }

    const amount = Number(paymentAmount)
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount must be greater than 0.",
        variant: "destructive",
      })
      return
    }

    if (amount > remainingAmount) {
      toast({
        title: "Amount Too High",
        description: `Payment amount cannot exceed remaining amount of KSH ${remainingAmount.toFixed(2)}.`,
        variant: "destructive",
      })
      return
    }

    setIsRecordingPayment(true)

    try {
      // Record the payment via Express backend
      // TODO: Implement invoice payment endpoint in backend
      // For now, update invoice with payment
      const newRemainingAmount = remainingAmount - amount
      let newStatus = selectedInvoice.status
      if (newRemainingAmount <= 0) {
        newStatus = 'paid'
      } else if (amount > 0) {
        newStatus = 'partial'
      }

      // Update invoice with payment
      const response = await api.put(`/invoices/${selectedInvoice.id}`, {
        action: 'update',
        invoiceData: {
          status: newStatus,
          paid_amount: (selectedInvoice.paid_amount || 0) + amount,
          balance: newRemainingAmount,
        }
      })

      if (!response.data.success) {
        toast({
          title: "Payment Recording Failed",
          description: `Error: ${response.data.error || 'Failed to record payment'}`,
          variant: "destructive",
        })
        return
      }

      // Update local state immediately
      setInvoices(prevInvoices => prevInvoices.map(inv => {
        if (inv.id === selectedInvoice.id) {
          const newPaidAmount = (inv.paidAmount || 0) + amount
          const newRemaining = Number(inv.total) - newPaidAmount
          return {
            ...inv,
            status: newStatus,
            paidAmount: newPaidAmount,
            remainingAmount: newRemaining,
            payments: [...(inv.payments || []), paymentData]
          }
        }
        return inv
      }))

      // Close dialogs
      setIsPaymentDialogOpen(false)
      setSelectedInvoice(null)
      setPaymentAmount("")

      toast({
        title: "Payment Recorded Successfully",
        description: `Payment of KSH ${amount.toFixed(2)} recorded for ${patientName}. ${
          newRemainingAmount > 0 
            ? `Remaining: KSH ${newRemainingAmount.toFixed(2)}` 
            : 'Invoice fully paid!'
        }`,
      })

    } catch (error) {
      console.error('Payment recording error:', error)
      toast({
        title: "Payment Recording Failed",
        description: "An unexpected error occurred while recording the payment.",
        variant: "destructive",
      })
    } finally {
      setIsRecordingPayment(false)
    }
  }

  const handleDownloadInvoice = (invoice: any) => {
    setDownloadingInvoice(invoice.id)
    
    // Generate PDF invoice
    const generatePDF = () => {
      // Import jsPDF dynamically to avoid SSR issues
      import('jspdf').then(({ default: jsPDF }) => {
        const doc = new jsPDF()
        
        // Set document properties
        doc.setProperties({
          title: `Invoice ${invoice.invoice_number}`,
          subject: 'Dental Treatment Invoice',
          author: 'Coco Dental Clinic',
          creator: 'Dental Clinic System'
        })
        
        // Define professional color palette
        const primaryColor = [30, 41, 59] // Slate-800 (navy)
        const secondaryColor = [71, 85, 105] // Slate-600 (medium gray)
        const accentColor = [20, 184, 166] // Teal-500 (clean accent)
        const lightGrayColor = [241, 245, 249] // Slate-100
        const borderColor = [226, 232, 240] // Slate-200
        const textColor = [51, 65, 85] // Slate-700
        const mutedTextColor = [100, 116, 139] // Slate-500
        
        // Helper function to draw rectangle
        const drawRect = (x: number, y: number, w: number, h: number, color: number[]) => {
          doc.setFillColor(color[0], color[1], color[2])
          doc.rect(x, y, w, h, 'F')
        }
        
        // Helper function to draw line
        const drawLine = (x1: number, y1: number, x2: number, y2: number, color: number[], width: number = 0.5) => {
          doc.setDrawColor(color[0], color[1], color[2])
          doc.setLineWidth(width)
          doc.line(x1, y1, x2, y2)
        }
        
        // Helper function to add text with styling
        const addText = (text: string, x: number, y: number, fontSize: number, fontStyle: string = 'normal', color: number[] = textColor, align: string = 'left') => {
          doc.setFontSize(fontSize)
          doc.setFont('helvetica', fontStyle)
          doc.setTextColor(color[0], color[1], color[2])
          if (align === 'center') {
            doc.text(text, x, y, { align: 'center' })
          } else if (align === 'right') {
            doc.text(text, x, y, { align: 'right' })
          } else {
            doc.text(text, x, y)
          }
        }
        
        // Page setup with optimized margins
        const margin = 15 // Reduced from 20
        const pageWidth = 210
        const pageHeight = 297
        const contentWidth = pageWidth - (margin * 2)
        const contentHeight = pageHeight - (margin * 2)
        
        // Header Section - positioned higher
        const headerY = 25 // Reduced from 30
        
        // Clinic name and tagline
        addText('COCO DENTAL CLINIC', margin, headerY, 22, 'bold', primaryColor) // Slightly smaller
        addText('Professional Dental Care & Treatment', margin, headerY + 7, 9, 'normal', mutedTextColor)
        
        // Invoice label (sleek rectangular design)
        const labelWidth = 55 // Slightly smaller
        const labelHeight = 22
        const labelX = pageWidth - margin - labelWidth
        const labelY = headerY - 3
        
        drawRect(labelX, labelY, labelWidth, labelHeight, accentColor)
        addText('INVOICE', labelX + (labelWidth / 2), labelY + 13, 11, 'bold', [255, 255, 255], 'center')
        
        // Invoice details section - reduced spacing
        const detailsStartY = headerY + 30 // Reduced from 35
        
        // Left column - Invoice details
        const leftColWidth = contentWidth * 0.48 // Increased slightly
        const rightColWidth = contentWidth * 0.48
        const colGap = contentWidth * 0.04 // Reduced gap
        
        // Invoice details box
        drawRect(margin, detailsStartY, leftColWidth, 45, lightGrayColor) // Reduced height
        drawLine(margin, detailsStartY, margin + leftColWidth, detailsStartY, borderColor, 1)
        
        addText('Invoice Details', margin + 8, detailsStartY + 7, 10, 'bold', primaryColor)
        addText(`Invoice #: ${invoice.invoice_number}`, margin + 8, detailsStartY + 16, 8, 'normal', textColor)
        addText(`Date: ${dayjs(invoice.date).format('MMMM DD, YYYY')}`, margin + 8, detailsStartY + 23, 8, 'normal', textColor)
        addText(`Status: ${invoice.status.toUpperCase()}`, margin + 8, detailsStartY + 30, 8, 'normal', textColor)
        addText(`Due Date: ${invoice.due_date ? dayjs(invoice.due_date).format('MMMM DD, YYYY') : 'Not specified'}`, margin + 8, detailsStartY + 37, 8, 'normal', textColor)
        
        // Patient details box
        const patientColX = margin + leftColWidth + colGap
        drawRect(patientColX, detailsStartY, rightColWidth, 45, lightGrayColor)
        drawLine(patientColX, detailsStartY, patientColX + rightColWidth, detailsStartY, borderColor, 1)
        
        addText('Patient Information', patientColX + 8, detailsStartY + 7, 10, 'bold', primaryColor)
        addText(`${invoice.patient?.first_name} ${invoice.patient?.last_name}`, patientColX + 8, detailsStartY + 16, 9, 'bold', textColor)
        addText(`Treated by: ${invoice.dentist_id}`, patientColX + 8, detailsStartY + 23, 8, 'normal', mutedTextColor)
        addText(`Treatment Date: ${dayjs(invoice.date).format('MMM DD, YYYY')}`, patientColX + 8, detailsStartY + 30, 8, 'normal', mutedTextColor)
        
        // Treatment Details Section - reduced spacing
        const treatmentStartY = detailsStartY + 55 // Reduced from 70
        
        // Section header
        addText('Treatment Details', margin, treatmentStartY, 13, 'bold', primaryColor)
        
        // Table header
        const tableStartY = treatmentStartY + 12 // Reduced from 15
        drawRect(margin, tableStartY, contentWidth, 11, primaryColor) // Reduced height
        
        addText('Treatment', margin + 8, tableStartY + 7, 9, 'bold', [255, 255, 255])
        addText('Qty', margin + 95, tableStartY + 7, 9, 'bold', [255, 255, 255])
        addText('Unit Price', margin + 125, tableStartY + 7, 9, 'bold', [255, 255, 255])
        addText('Total', margin + 165, tableStartY + 7, 9, 'bold', [255, 255, 255])
        
        // Table content
        let currentY = tableStartY + 18 // Reduced from 20
        if (invoice.treatments && invoice.treatments.length > 0) {
          invoice.treatments.forEach((treatment: any, index: number) => {
            const isEven = index % 2 === 0
            const bgColor = isEven ? [255, 255, 255] : lightGrayColor
            
            drawRect(margin, currentY, contentWidth, 13, bgColor) // Reduced height
            drawLine(margin, currentY, margin + contentWidth, currentY, borderColor, 0.5)
            
            addText(treatment.name, margin + 8, currentY + 8, 8, 'normal', textColor)
            addText(treatment.quantity.toString(), margin + 95, currentY + 8, 8, 'normal', textColor)
            addText(`KSH ${treatment.price.toFixed(2)}`, margin + 125, currentY + 8, 8, 'normal', textColor)
            addText(`KSH ${(treatment.price * treatment.quantity).toFixed(2)}`, margin + 165, currentY + 8, 8, 'bold', textColor)
            
            currentY += 15 // Reduced from 17
          })
        } else {
          // No treatments found
          drawRect(margin, currentY, contentWidth, 13, [255, 255, 255])
          drawLine(margin, currentY, margin + contentWidth, currentY, borderColor, 0.5)
          addText('No treatments found', margin + 8, currentY + 8, 8, 'normal', textColor)
          currentY += 15
        }
        
        // Summary section - reduced spacing
        const summaryStartY = currentY + 15 // Reduced from 20
        
        // Left side - Payment info
        drawRect(margin, summaryStartY, leftColWidth, 60, lightGrayColor) // Reduced height
        drawLine(margin, summaryStartY, margin + leftColWidth, summaryStartY, borderColor, 1)
        
        addText('Payment Information', margin + 8, summaryStartY + 7, 10, 'bold', primaryColor)
        addText(`Status: ${invoice.status}`, margin + 8, summaryStartY + 18, 8, 'normal', textColor)
        
        if (invoice.remainingAmount && invoice.remainingAmount > 0) {
          addText(`Remaining: KSH ${invoice.remainingAmount.toFixed(2)}`, margin + 8, summaryStartY + 25, 8, 'bold', accentColor)
        }
        
        if (invoice.payments && invoice.payments.length > 0) {
          addText('Payment History:', margin + 8, summaryStartY + 35, 8, 'bold', mutedTextColor)
          let paymentY = summaryStartY + 43
          invoice.payments.slice(0, 2).forEach((payment: any) => {
            addText(`${dayjs(payment.paid_at).format('MMM DD')}: KSH ${payment.amount}`, margin + 8, paymentY, 7, 'normal', mutedTextColor)
            paymentY += 5
          })
        }
        
        // Right side - Financial summary
        const summaryColX = margin + leftColWidth + colGap
        drawRect(summaryColX, summaryStartY, rightColWidth, 60, lightGrayColor)
        drawLine(summaryColX, summaryStartY, summaryColX + rightColWidth, summaryStartY, borderColor, 1)
        
        addText('Financial Summary', summaryColX + 8, summaryStartY + 7, 10, 'bold', primaryColor)
        
        const subtotalY = summaryStartY + 18
        addText('Subtotal:', summaryColX + 8, subtotalY, 8, 'normal', mutedTextColor)
        addText(`KSH ${invoice.subtotal.toFixed(2)}`, summaryColX + rightColWidth - 8, subtotalY, 8, 'normal', textColor, 'right')
        
        const discountY = subtotalY + 7
        addText('Discount:', summaryColX + 8, discountY, 8, 'normal', mutedTextColor)
        addText(`-KSH ${invoice.discount.toFixed(2)}`, summaryColX + rightColWidth - 8, discountY, 8, 'normal', textColor, 'right')
        
        const taxY = discountY + 7
        addText('Tax:', summaryColX + 8, taxY, 8, 'normal', mutedTextColor)
        addText(`KSH ${invoice.tax.toFixed(2)}`, summaryColX + rightColWidth - 8, taxY, 8, 'normal', textColor, 'right')
        
        // Total with emphasis
        const totalY = taxY + 10
        drawLine(summaryColX + 8, totalY - 2, summaryColX + rightColWidth - 8, totalY - 2, borderColor, 1)
        addText('TOTAL:', summaryColX + 8, totalY, 11, 'bold', primaryColor)
        addText(`KSH ${invoice.total.toFixed(2)}`, summaryColX + rightColWidth - 8, totalY, 11, 'bold', primaryColor, 'right')
        
        // Footer section - positioned better
        const footerY = pageHeight - 35 // Better positioned from bottom
        
        // Horizontal divider
        drawLine(margin, footerY - 8, pageWidth - margin, footerY - 8, borderColor, 1)
        
        // Footer content - better spacing
        addText('Thank you for choosing Coco Dental Clinic', (pageWidth / 2), footerY, 9, 'italic', mutedTextColor, 'center')
        
        // Contact information in smaller, muted font - better spacing
        addText('123 Dental Street, Nairobi, Kenya | Phone: (254) 123-456-789 | Email: info@cocodental.com', (pageWidth / 2), footerY + 6, 6, 'normal', mutedTextColor, 'center')
        addText('Website: www.cocodental.com | Hours: Mon-Fri 8AM-6PM, Sat 9AM-4PM', (pageWidth / 2), footerY + 11, 6, 'normal', mutedTextColor, 'center')
        
        // Save the PDF
        const fileName = `Invoice-${invoice.invoice_number}-${dayjs(invoice.date).format('YYYY-MM-DD')}.pdf`
        doc.save(fileName)
        
        setDownloadingInvoice(null)
        toast({
          title: "Invoice Downloaded",
          description: `Invoice ${invoice.invoice_number} has been downloaded successfully.`,
        })
      }).catch((error) => {
        console.error('PDF generation error:', error)
        setDownloadingInvoice(null)
        toast({
          title: "Download Failed",
          description: "Failed to generate PDF. Please try again.",
          variant: "destructive",
        })
      })
    }
    
    generatePDF()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200"
      case "partial":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "pending":
        return "bg-red-100 text-red-800 border-red-200"
      case "overdue":
        return "bg-red-200 text-red-900 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "partial":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "pending":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "overdue":
        return <XCircle className="h-4 w-4 text-red-700" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  // Dynamic stats
  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0) // Changed to include all invoices
  const pendingAmount = invoices
    .filter((inv) => inv.status === "pending" || inv.status === "partial")
    .reduce((sum, inv) => {
      if (inv.status === "pending") {
        return sum + Number(inv.total)
      } else if (inv.status === "partial") {
        return sum + Number(inv.remainingAmount || 0)
      }
      return sum
    }, 0)
  const partialAmount = invoices.filter((inv) => inv.status === "partial").reduce((sum, inv) => sum + Number(inv.remainingAmount || 0), 0)

  const handleDeleteInvoice = (invoice: any) => {
    setInvoiceToDelete(invoice)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return

    setIsDeleting(true)

    try {
      const response = await api.delete(`/invoices/${invoiceToDelete.id}`)

      if (response.data.success) {
        // Remove from local state immediately
        setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== invoiceToDelete.id))

        // Close dialog and reset state
        setIsDeleteDialogOpen(false)
        setInvoiceToDelete(null)

        toast({
          title: "Invoice Deleted",
          description: `Invoice ${invoiceToDelete.invoice_number} has been deleted successfully.`,
        })
      } else {
        toast({
          title: "Delete Failed",
          description: `Error: ${result.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Delete Failed",
        description: "An unexpected error occurred while deleting the invoice.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-6 space-y-8">
        {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
              Invoice Management
            </h1>
            <p className="text-gray-600 text-lg">Manage billing, payments, and financial records</p>
          </div>

          {/* Quick Stats */}
          <div className={`transition-all duration-300 ${isStatsCollapsed ? 'h-16 overflow-hidden' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Financial Overview</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}
                className="h-8 px-3 text-gray-600 hover:text-gray-800"
              >
                {isStatsCollapsed ? 'Expand' : 'Collapse'}
              </Button>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">KSH {totalRevenue.toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">+{revenueChange.toFixed(1)}%</span>
                    </div>
                  </div>
                    <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Pending Amount</p>
                      <p className="text-2xl font-bold text-gray-900">KSH {pendingAmount.toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-yellow-600 font-medium">+{pendingChange.toFixed(1)}%</span>
                    </div>
                  </div>
                    <div className="h-10 w-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Partial Payments</p>
                      <p className="text-2xl font-bold text-gray-900">KSH {partialAmount.toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-purple-600 font-medium">+{partialChange.toFixed(1)}%</span>
                    </div>
                  </div>
                    <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Invoices</p>
                      <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-blue-600 font-medium">+{countChange.toFixed(1)}%</span>
                    </div>
                  </div>
                    <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            {/* Search and Filters */}
            <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm flex-1">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by patient name or invoice ID..."
                      value={searchTerm}
                      onChange={(e) => debouncedSearch(e.target.value)}
                      className="pl-10 h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                    <SelectTrigger className="w-40 h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                      <SelectValue placeholder="Doctor" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      <SelectItem value="all">All Doctors</SelectItem>
                      {getUniqueDoctors().map(doctor => (
                        <SelectItem key={doctor} value={doctor}>{doctor}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                    <SelectTrigger className="w-40 h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                      <SelectItem value="quarter">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="h-12 px-4 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-xl"
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="h-12 px-6 border-2 border-gray-200 hover:border-purple-500 transition-colors duration-200 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white/90"
              >
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
          <Dialog open={isCreateInvoiceDialogOpen} onOpenChange={setIsCreateInvoiceDialogOpen}>
            <DialogTrigger asChild>
                  <Button className="h-12 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
              <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Create New Invoice
                    </DialogTitle>
              </DialogHeader>
                  <div className="space-y-6 py-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="patient" className="text-gray-700 font-medium">Patient</Label>
                    <Select value={invoiceForm.patient_id} onValueChange={(value) => handleInvoiceFormChange("patient_id", value)}>
                          <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                          <SelectContent className="rounded-xl border-2">
    {patients.map((p: any) => (
      <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
    ))}
                      </SelectContent>
                    </Select>
                  </div>
                      <div className="space-y-3">
                        <Label htmlFor="dentist" className="text-gray-700 font-medium">Dentist</Label>
                        <Input
                          id="dentist"
                          placeholder="Enter dentist name"
                          value={invoiceForm.dentist_id}
                          onChange={(e) => handleInvoiceFormChange("dentist_id", e.target.value)}
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl w-full"
                        />
                  </div>
                </div>

                <div>
                      <Label className="text-base font-medium text-gray-700">Treatment Items</Label>
                  <div className="space-y-3 mt-2">
                    <div className="grid grid-cols-4 gap-2 text-sm font-medium text-gray-700">
                      <span>Treatment</span>
                      <span>Quantity</span>
                      <span>Price</span>
                      <span>Total</span>
                    </div>
                    {invoiceForm.treatments.map((treatment, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2">
                        <Input
                          placeholder="Enter treatment name"
                          value={treatment.name}
                          onChange={(e) => {
                            const updatedTreatments = [...invoiceForm.treatments]
                            updatedTreatments[index].name = e.target.value
                            setInvoiceForm(prev => ({ ...prev, treatments: updatedTreatments }))
                          }}
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                        />
                            <Input 
                              type="number" 
                              placeholder="1" 
                              value={treatment.quantity}
                              onChange={(e) => {
                                const updatedTreatments = [...invoiceForm.treatments]
                                updatedTreatments[index].quantity = Number(e.target.value) || 1
                                setInvoiceForm(prev => ({ ...prev, treatments: updatedTreatments }))
                              }}
                              className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl" 
                            />
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              value={treatment.price}
                              onChange={(e) => {
                                const updatedTreatments = [...invoiceForm.treatments]
                                updatedTreatments[index].price = Number(e.target.value) || 0
                                setInvoiceForm(prev => ({ ...prev, treatments: updatedTreatments }))
                              }}
                              className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl" 
                            />
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              value={(treatment.quantity * treatment.price).toFixed(2)}
                              disabled 
                              className="h-12 border-2 border-gray-200 bg-gray-50 rounded-xl" 
                            />
                      </div>
                    ))}
                        <Button variant="outline" size="sm" onClick={handleAddTreatmentItem} className="h-10 px-4 border-2 border-gray-200 hover:border-blue-500 transition-colors duration-200 rounded-xl">
                      + Add Item
                    </Button>
                  </div>
                </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="subtotal" className="text-gray-700 font-medium">Subtotal</Label>
                    <Input
                      id="subtotal"
                      type="number"
                      placeholder="0.00"
                      value={invoiceForm.subtotal}
                      onChange={(e) => handleInvoiceFormChange("subtotal", Number.parseFloat(e.target.value) || 0)}
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                    />
                  </div>
                      <div className="space-y-3">
                        <Label htmlFor="discount" className="text-gray-700 font-medium">Discount (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      placeholder="0"
                      value={invoiceForm.discount}
                      onChange={(e) => handleInvoiceFormChange("discount", Number.parseFloat(e.target.value) || 0)}
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                    />
                  </div>
                      <div className="space-y-3">
                        <Label htmlFor="tax" className="text-gray-700 font-medium">Tax (%)</Label>
                    <Input
                      id="tax"
                      type="number"
                    placeholder="0"
                      value={invoiceForm.tax}
                    onChange={(e) => handleInvoiceFormChange("tax", Number.parseFloat(e.target.value) || 0)}
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                    />
                  </div>
                </div>

                    <div className="space-y-3">
                      <Label htmlFor="notes" className="text-gray-700 font-medium">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes or payment terms"
                    value={invoiceForm.notes}
                    onChange={(e) => handleInvoiceFormChange("notes", e.target.value)}
                        className="border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl min-h-[100px]"
                  />
                </div>

                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>
                      KSH
                      {(invoiceForm.subtotal * (1 - invoiceForm.discount / 100) * (1 + invoiceForm.tax / 100)).toFixed(
                        2,
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateInvoiceDialogOpen(false)}
                      className="h-12 px-6 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-xl"
                    >
                  Save as Draft
                </Button>
                    <Button 
                      onClick={handleCreateInvoice}
                      className="h-12 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      Create Invoice
                    </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        </div>

        {/* Invoices List */}
          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                <Receipt className="h-6 w-6 text-gray-700" />
                All Invoices ({filteredInvoices.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedInvoices.size > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkExport}
                      className="h-8 px-3 border-2 border-blue-200 hover:border-blue-400 text-blue-700 hover:text-blue-800 transition-colors duration-200 rounded-lg"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Export ({selectedInvoices.size})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkPrint}
                      className="h-8 px-3 border-2 border-green-200 hover:border-green-400 text-green-700 hover:text-green-800 transition-colors duration-200 rounded-lg"
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      Print ({selectedInvoices.size})
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="h-8 px-3 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-lg"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  Filters
                </Button>
                    </div>
                      </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50 hover:bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedInvoices.size === paginatedInvoices.length && paginatedInvoices.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-32">Invoice ID</TableHead>
                    <TableHead className="w-24">Date</TableHead>
                    <TableHead className="w-48">Patient</TableHead>
                    <TableHead className="w-40">Doctor</TableHead>
                    <TableHead className="w-48">Treatments</TableHead>
                    <TableHead className="w-24 text-right">Amount</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <TableCell>
                        <Checkbox
                          checked={selectedInvoices.has(invoice.id)}
                          onCheckedChange={() => handleSelectInvoice(invoice.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{invoice.invoice_number}</span>
                      </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {dayjs(invoice.date).format('MMM DD, YYYY')}
                    </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {invoice.patient?.first_name} {invoice.patient?.last_name}
                          </span>
                    </div>
                      </TableCell>
                      <TableCell>
                      <div className="text-sm text-gray-600">
                          {invoice.dentist_id}
                      </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 max-w-40 truncate" title={invoice.treatments?.map((t: any) => t.name).join(", ") || "No treatments"}>
                          {invoice.treatments?.map((t: any) => t.name).join(", ") || "No treatments"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold text-sm">
                          KSH {invoice.total.toFixed(2)}
                  </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(invoice.status)} border px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit`}>
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                    <Button 
                      size="sm" 
                            variant="ghost"
                      onClick={() => setSelectedInvoice(invoice)}
                            className="h-7 w-7 p-0 hover:bg-blue-100 text-blue-600"
                    >
                            <Eye className="h-3 w-3" />
                      </Button>
                    <Button 
                      size="sm" 
                            variant="ghost"
                      onClick={() => handleDownloadInvoice(invoice)}
                            disabled={downloadingInvoice === invoice.id}
                            className="h-7 w-7 p-0 hover:bg-green-100 text-green-600 disabled:opacity-50"
                          >
                            {downloadingInvoice === invoice.id ? (
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                      </Button>
                      {invoice.status !== "paid" && (
                      <Button 
                        size="sm" 
                              variant="ghost"
                        onClick={() => handleRecordPayment(invoice)}
                              className="h-7 w-7 p-0 hover:bg-purple-100 text-purple-600"
                      >
                              <DollarSign className="h-3 w-3" />
                        </Button>
                      )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteInvoice(invoice)}
                            className="h-7 w-7 p-0 hover:bg-red-100 text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                  </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-lg"
                  >
                    <ChevronsLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-lg"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="h-8 w-8 p-0 border-2 transition-colors duration-200 rounded-lg"
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
                    className="h-8 w-8 p-0 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-lg"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-lg"
                  >
                    <ChevronsRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Record Payment
              </DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-6 py-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">
                      {selectedInvoice.patient?.first_name} {selectedInvoice.patient?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Invoice: {selectedInvoice.invoice_number}
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold">KSH {Number(selectedInvoice.total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-semibold text-blue-600">
                        KSH {(selectedInvoice.remainingAmount || Number(selectedInvoice.total)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="paymentAmount" className="text-gray-700 font-medium">
                    Payment Amount (KSH)
                  </Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl text-lg font-medium"
                    disabled={isRecordingPayment}
                  />
                  <p className="text-xs text-gray-500">
                    Enter the amount being paid. Cannot exceed remaining amount.
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsPaymentDialogOpen(false)
                      setPaymentAmount("")
                    }}
                    disabled={isRecordingPayment}
                    className="h-12 px-6 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={!paymentAmount || isRecordingPayment}
                    className="h-12 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRecordingPayment ? "Recording..." : "Record Payment"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                Delete Invoice
              </DialogTitle>
            </DialogHeader>
            {invoiceToDelete && (
              <div className="space-y-6 py-4">
                <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-xl border border-red-200">
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">
                      Are you sure you want to delete this invoice?
                    </p>
                    <p className="text-sm text-gray-600">
                      Invoice: {invoiceToDelete.invoice_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      Patient: {invoiceToDelete.patient?.first_name} {invoiceToDelete.patient?.last_name}
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold">KSH {Number(invoiceToDelete.total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-semibold text-red-600">
                        {invoiceToDelete.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Warning:</p>
                      <p>This action cannot be undone. All related payment and treatment records will also be deleted.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteDialogOpen(false)
                      setInvoiceToDelete(null)
                    }}
                    disabled={isDeleting}
                    className="h-12 px-6 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="h-12 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? "Deleting..." : "Delete Invoice"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Invoice Details Modal */}
        {selectedInvoice && (
          <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
              <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Invoice Details - {selectedInvoice.invoice_number}
                  </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">Coco Dental Clinic</h2>
                    <p className="text-gray-600">Eastleigh, Nairobi</p>
                    <p className="text-gray-600">Phone: (254) 722 357 439</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-bold">{selectedInvoice.invoice_number}</h3>
                    <p className="text-gray-600">Date: {selectedInvoice.date}</p>
                      <Badge className={`${getStatusColor(selectedInvoice.status)} border px-3 py-1 rounded-full font-medium flex items-center gap-2`}>
                        {getStatusIcon(selectedInvoice.status)}
                      {selectedInvoice.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Patient Info */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200">
                  <h4 className="font-medium mb-2">Bill To:</h4>
                  <p className="font-medium">{selectedInvoice.patient?.first_name} {selectedInvoice.patient?.last_name}</p>
                  <p className="text-sm text-gray-600">Treated by: {selectedInvoice.dentist_id}</p>
                </div>

                {/* Treatment Items */}
                <div>
                  <h4 className="font-medium mb-3">Treatment Details:</h4>
                    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                          <tr>
                            <th className="text-left p-4 font-medium">Treatment</th>
                            <th className="text-center p-4 font-medium">Qty</th>
                            <th className="text-right p-4 font-medium">Price</th>
                            <th className="text-right p-4 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.treatments?.map((treatment: any, idx: number) => (
                            <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                              <td className="p-4">{treatment.name}</td>
                              <td className="text-center p-4">{treatment.quantity}</td>
                            <td className="text-right p-4">KSH {treatment.price}</td>
                            <td className="text-right p-4">KSH {treatment.price * treatment.quantity}</td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-gray-500">
                              No treatments found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200">
                    <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>KSH {selectedInvoice.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-KSH {selectedInvoice.discount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>KSH {selectedInvoice.tax.toFixed(2)}</span>
                    </div>
                      <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-3">
                      <span>Total:</span>
                      <span>KSH {selectedInvoice.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                    <h4 className="font-medium mb-3">Payment Information:</h4>
                    <div className="space-y-2">
                  <p>
                    <span className="font-medium">Status:</span> {selectedInvoice.status}
                  </p>
                  <p>
                    <span className="font-medium">Method:</span> {selectedInvoice.paymentMethod || "Not specified"}
                  </p>
                  {selectedInvoice.paidDate && (
                    <p>
                      <span className="font-medium">Paid Date:</span> {selectedInvoice.paidDate}
                    </p>
                  )}
                  {selectedInvoice.remainingAmount && (
                    <p>
                        <span className="font-medium">Remaining:</span> KSH {selectedInvoice.remainingAmount.toFixed(2)}
                    </p>
                  )}
                    </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline"
                  onClick={() => handleDownloadInvoice(selectedInvoice)}
                  disabled={downloadingInvoice === selectedInvoice.id}
                  className="h-12 px-6 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-xl disabled:opacity-50"
                  >
                  {downloadingInvoice === selectedInvoice.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent mr-2" />
                  ) : (
                  <Download className="h-4 w-4 mr-2" />
                  )}
                  Download PDF
                </Button>
                  <Button 
                    variant="outline"
                    className="h-12 px-6 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-xl"
                  >
                    Print
                  </Button>
                  {selectedInvoice.status !== "paid" && (
                    <Button 
                    onClick={() => handleRecordPayment(selectedInvoice)}
                      className="h-12 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      Record Payment
                    </Button>
                  )}
              </div>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>
    </MainLayout>
  )
}
