"use client"

import type React from "react"

import { useState, useEffect } from "react"
import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Filter,
  Download,
  Upload,
  Receipt,
  PieChart,
  BarChart3,
  FileText,
  Paperclip,
  ImageIcon,
  Eye,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  X,
} from "lucide-react"
import api from "@/lib/axiosConfig"
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import { useToast } from "@/hooks/use-toast"

// Force dynamic rendering to avoid build-time environment variable issues
export const dynamic = 'force-dynamic'

export default function FinancesPage() {
  const [moneyInData, setMoneyInData] = useState<any[]>([])
  const [moneyOutData, setMoneyOutData] = useState<any[]>([])
  const [showAddIncomeDialog, setShowAddIncomeDialog] = useState(false)
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false)
  const [showDeleteIncomeDialog, setShowDeleteIncomeDialog] = useState(false)
  const [showDeleteExpenseDialog, setShowDeleteExpenseDialog] = useState(false)
  const [showEditIncomeDialog, setShowEditIncomeDialog] = useState(false)
  const [showEditExpenseDialog, setShowEditExpenseDialog] = useState(false)
  const [showViewIncomeDialog, setShowViewIncomeDialog] = useState(false)
  const [showViewExpenseDialog, setShowViewExpenseDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any>(null)
  const [itemToEdit, setItemToEdit] = useState<any>(null)
  const [itemToView, setItemToView] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  // Enhanced state for table view, pagination, and filtering
  const [currentView, setCurrentView] = useState<'cards' | 'table'>('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [sortField, setSortField] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRangeFilter, setDateRangeFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([])

  // Form states for income
  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    source: "",
    patient: "",
    method: "",
    notes: "",
    attachments: [] as File[],
  })

  // Form states for expense
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    spentOn: "",
    category: "",
    method: "",
    notes: "",
    attachments: [] as File[],
  })

  // Delete functions
  const handleDeleteIncome = async (incomeId: string) => {
    setItemToDelete(incomeId)
    setShowDeleteIncomeDialog(true)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    setItemToDelete(expenseId)
    setShowDeleteExpenseDialog(true)
  }

  // Edit functions
  const handleEditIncome = (incomeItem: any) => {
    setItemToEdit(incomeItem)
    setIncomeForm({
      date: incomeItem.date,
      amount: incomeItem.amount.toString(),
      source: incomeItem.source || '',
      patient: incomeItem.patient || '',
      method: incomeItem.method || '',
      notes: incomeItem.notes || '',
      attachments: [],
    })
    setShowEditIncomeDialog(true)
  }

  const handleEditExpense = (expenseItem: any) => {
    setItemToEdit(expenseItem)
    setExpenseForm({
      date: expenseItem.date,
      amount: expenseItem.amount.toString(),
      spentOn: expenseItem.spent_on || '',
      category: expenseItem.category || '',
      method: expenseItem.method || '',
      notes: expenseItem.notes || '',
      attachments: [],
    })
    setShowEditExpenseDialog(true)
  }

  // Helper functions for filtering, sorting, and pagination
  const getFilteredAndSortedData = () => {
    let allData = [
      ...moneyInData.map(item => ({ ...item, type: 'income', displayAmount: Number(item.amount) })),
      ...moneyOutData.map(item => ({ ...item, type: 'expense', displayAmount: -Number(item.amount) }))
    ]

    // Apply search filter
    if (searchTerm) {
      allData = allData.filter(item => 
        item.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.spent_on?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.patient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply date range filter
    if (dateRangeFilter !== 'all') {
      const now = dayjs()
      let startDate, endDate
      
      switch (dateRangeFilter) {
        case 'today':
          startDate = now.startOf('day')
          endDate = now.endOf('day')
          break
        case 'this-week':
          startDate = now.startOf('week')
          endDate = now.endOf('week')
          break
        case 'this-month':
          startDate = now.startOf('month')
          endDate = now.endOf('month')
          break
        case 'last-month':
          startDate = now.subtract(1, 'month').startOf('month')
          endDate = now.subtract(1, 'month').endOf('month')
          break
        case 'this-quarter':
          startDate = now.startOf('quarter')
          endDate = now.endOf('quarter')
          break
        case 'this-year':
          startDate = now.startOf('year')
          endDate = now.endOf('year')
          break
        default:
          startDate = null
          endDate = null
      }

      if (startDate && endDate) {
        allData = allData.filter(item => {
          const itemDate = dayjs(item.date)
          return itemDate.isAfter(startDate.subtract(1, 'day')) && itemDate.isBefore(endDate.add(1, 'day'))
        })
      }
    }

    // Apply method filter
    if (methodFilter !== 'all') {
      allData = allData.filter(item => item.method === methodFilter)
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      allData = allData.filter(item => item.type === typeFilter)
    }

    // Apply sorting
    allData.sort((a, b) => {
      let aValue, bValue
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case 'amount':
          aValue = Math.abs(a.displayAmount)
          bValue = Math.abs(b.displayAmount)
          break
        case 'source':
          aValue = a.source || a.spent_on || ''
          bValue = b.source || b.spent_on || ''
          break
        case 'method':
          aValue = a.method || ''
          bValue = b.method || ''
          break
        default:
          aValue = a[sortField] || ''
          bValue = b[sortField] || ''
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return allData
  }

  const getPaginatedData = () => {
    const filteredData = getFilteredAndSortedData()
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredData.slice(startIndex, endIndex)
  }

  const getTotalPages = () => {
    const filteredData = getFilteredAndSortedData()
    return Math.ceil(filteredData.length / itemsPerPage)
  }

  const generateMonthlyChartData = () => {
    const months = []
    const now = dayjs()
    
    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const month = now.subtract(i, 'month')
      const monthKey = month.format('YYYY-MM')
      const monthLabel = month.format('MMM YYYY')
      
      const monthIncome = moneyInData
        .filter(item => dayjs(item.date).format('YYYY-MM') === monthKey)
        .reduce((sum, item) => sum + Number(item.amount), 0)
      
      const monthExpenses = moneyOutData
        .filter(item => dayjs(item.date).format('YYYY-MM') === monthKey)
        .reduce((sum, item) => sum + Number(item.amount), 0)
      
      // Only include months that have actual data (income or expenses > 0)
      if (monthIncome > 0 || monthExpenses > 0) {
        months.push({
          month: monthLabel,
          income: monthIncome,
          expenses: monthExpenses,
          netBalance: monthIncome - monthExpenses
        })
      }
    }
    
    setMonthlyChartData(months)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  const handleExportFilteredData = (format: 'csv' | 'pdf') => {
    const filteredData = getFilteredAndSortedData()
    
    if (format === 'csv') {
      const headers = ['Date', 'Type', 'Description', 'Category', 'Amount (KES)', 'Method', 'Notes']
      const csvContent = [
        headers.join(','),
        ...filteredData.map(item => [
          new Date(item.date).toLocaleDateString(),
          item.type === 'income' ? 'Income' : 'Expense',
          item.source || item.spent_on || '',
          item.category || '',
          item.type === 'income' ? `+${Number(item.amount).toLocaleString()}` : `-${Number(item.amount).toLocaleString()}`,
          item.method || '',
          item.notes || ''
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `financial-transactions-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      
      toast({
        title: "Export Successful",
        description: "CSV file has been downloaded successfully.",
      })
    } else {
      // PDF export would require a PDF library like jsPDF
      toast({
        title: "PDF Export",
        description: "PDF export feature is under development.",
      })
    }
  }

  // Fetch data from Express backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // Fetch income transactions
        const incomeResponse = await api.get('/finances/income', {
          params: { page: 1, pageSize: 10000 }
        })
        if (incomeResponse.data.success) {
          setMoneyInData(incomeResponse.data.transactions || [])
        }

        // Fetch expense transactions
        const expenseResponse = await api.get('/finances/expenses', {
          params: { page: 1, pageSize: 10000 }
        })
        if (expenseResponse.data.success) {
          setMoneyOutData(expenseResponse.data.transactions || [])
        }
      } catch (error) {
        console.error('Error fetching finances data:', error)
        toast({
          title: "Error",
          description: "Failed to fetch financial data",
          variant: "destructive",
        })
      }

      setLoading(false)
    }

    fetchData()

    // TODO: Implement real-time updates with WebSocket or polling if needed
  }, [])

  // Generate chart data when data changes
  useEffect(() => {
    if (moneyInData.length > 0 || moneyOutData.length > 0) {
      generateMonthlyChartData()
    }
  }, [moneyInData, moneyOutData])

  // Calculate totals
  const totalIncome = moneyInData.reduce((sum, item) => sum + Number(item.amount), 0)
  const totalExpenses = moneyOutData.reduce((sum, item) => sum + Number(item.amount), 0)
  const netBalance = totalIncome - totalExpenses

  // Calculate percentage changes (this month vs last month)
  const now = dayjs()
  const startOfThisMonth = now.startOf('month')
  const startOfLastMonth = now.subtract(1, 'month').startOf('month')
  const endOfLastMonth = now.subtract(1, 'month').endOf('month')

  const incomeThisMonth = moneyInData.filter(item => dayjs(item.date).isAfter(startOfThisMonth.subtract(1, 'day')))
  const incomeLastMonth = moneyInData.filter(item => 
    dayjs(item.date).isAfter(startOfLastMonth.subtract(1, 'day')) && 
    dayjs(item.date).isBefore(endOfLastMonth.add(1, 'day'))
  )

  const expensesThisMonth = moneyOutData.filter(item => dayjs(item.date).isAfter(startOfThisMonth.subtract(1, 'day')))
  const expensesLastMonth = moneyOutData.filter(item => 
    dayjs(item.date).isAfter(startOfLastMonth.subtract(1, 'day')) && 
    dayjs(item.date).isBefore(endOfLastMonth.add(1, 'day'))
  )

  const totalIncomeThisMonth = incomeThisMonth.reduce((sum, item) => sum + Number(item.amount), 0)
  const totalIncomeLastMonth = incomeLastMonth.reduce((sum, item) => sum + Number(item.amount), 0)
  const totalExpensesThisMonth = expensesThisMonth.reduce((sum, item) => sum + Number(item.amount), 0)
  const totalExpensesLastMonth = expensesLastMonth.reduce((sum, item) => sum + Number(item.amount), 0)

  const incomeChange = totalIncomeLastMonth === 0 ? 0 : ((totalIncomeThisMonth - totalIncomeLastMonth) / totalIncomeLastMonth) * 100
  const expenseChange = totalExpensesLastMonth === 0 ? 0 : ((totalExpensesThisMonth - totalExpensesLastMonth) / totalExpensesLastMonth) * 100

  const handleAddIncomeClick = () => {
    setShowAddIncomeDialog(true)
  }

  const handleAddExpenseClick = () => {
    setShowAddExpenseDialog(true)
  }

  const handleIncomeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setIncomeForm({ ...incomeForm, attachments: [...incomeForm.attachments, ...files] })
  }

  const handleExpenseFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setExpenseForm({ ...expenseForm, attachments: [...expenseForm.attachments, ...files] })
  }

  const removeIncomeFile = (index: number) => {
    const newAttachments = incomeForm.attachments.filter((_, i) => i !== index)
    setIncomeForm({ ...incomeForm, attachments: newAttachments })
  }

  const removeExpenseFile = (index: number) => {
    const newAttachments = expenseForm.attachments.filter((_, i) => i !== index)
    setExpenseForm({ ...expenseForm, attachments: newAttachments })
  }

  const handleAddIncome = async () => {
    if (!incomeForm.amount || !incomeForm.source || !incomeForm.method) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields: Amount, Source, and Payment Method",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      // TODO: Handle file uploads through Express backend
      // For now, store file metadata
      const uploadedAttachments: any[] = []
      for (let i = 0; i < incomeForm.attachments.length; i++) {
        const file = incomeForm.attachments[i]
        // Convert file to base64 or handle via Express backend file upload endpoint
        uploadedAttachments.push({
          name: file.name,
          type: file.type,
          size: file.size,
          // url will be set by backend after upload
        })
      }

      // Create income transaction via Express backend
      const response = await api.post('/finances/income', {
        date: incomeForm.date,
        source: incomeForm.source,
        patient: incomeForm.patient,
        amount: Number.parseFloat(incomeForm.amount),
        method: incomeForm.method,
        notes: incomeForm.notes,
        attachments: uploadedAttachments,
      })

      if (response.data.success) {
        // Immediately update local state with the new income
        setMoneyInData(prev => [response.data.transaction, ...prev])
        
        setShowAddIncomeDialog(false)
        // Reset form
        setIncomeForm({
          date: new Date().toISOString().split("T")[0],
          amount: "",
          source: "",
          patient: "",
          method: "",
          notes: "",
          attachments: [],
        })
        toast({
          title: "Success",
          description: "Income transaction added successfully.",
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Error adding income transaction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.spentOn || !expenseForm.category || !expenseForm.method) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields: Amount, Spent On, Category, and Payment Method",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      // TODO: Handle file uploads through Express backend
      // For now, store file metadata
      const uploadedAttachments: any[] = []
      for (let i = 0; i < expenseForm.attachments.length; i++) {
        const file = expenseForm.attachments[i]
        // Convert file to base64 or handle via Express backend file upload endpoint
        uploadedAttachments.push({
          name: file.name,
          type: file.type,
          size: file.size,
          // url will be set by backend after upload
        })
      }

      // Create expense transaction via Express backend
      const response = await api.post('/finances/expenses', {
        date: expenseForm.date,
        spentOn: expenseForm.spentOn,
        category: expenseForm.category,
        amount: Number.parseFloat(expenseForm.amount),
        method: expenseForm.method,
        notes: expenseForm.notes,
        attachments: uploadedAttachments,
      })

      if (response.data.success) {
        // Immediately update local state with the new expense
        setMoneyOutData(prev => [response.data.transaction, ...prev])
        
        setShowAddExpenseDialog(false)
        // Reset form
        setExpenseForm({
          date: new Date().toISOString().split("T")[0],
          amount: "",
          spentOn: "",
          category: "",
          method: "",
          notes: "",
          attachments: [],
        })
        toast({
          title: "Success",
          description: "Expense transaction added successfully.",
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Error adding expense transaction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (type === "application/pdf") return <FileText className="h-4 w-4" />
    return <Paperclip className="h-4 w-4" />
  }

  // Report generation functions
  const generateIncomeReport = () => {
    const reportData = {
      totalIncome: totalIncome,
      transactionCount: moneyInData.length,
      averageIncome: moneyInData.length > 0 ? totalIncome / moneyInData.length : 0,
      bySource: moneyInData.reduce((acc: any, item) => {
        acc[item.source] = (acc[item.source] || 0) + Number(item.amount)
        return acc
      }, {}),
      byMethod: moneyInData.reduce((acc: any, item) => {
        acc[item.method] = (acc[item.method] || 0) + Number(item.amount)
        return acc
      }, {})
    }
    
    // Create downloadable report
    const reportContent = `
Income Report - ${new Date().toLocaleDateString()}
==========================================
Total Income: KES ${totalIncome.toLocaleString()}
Transaction Count: ${reportData.transactionCount}
Average Income: KES ${reportData.averageIncome.toLocaleString()}

By Source:
${Object.entries(reportData.bySource).map(([source, amount]) => `- ${source}: KES ${Number(amount).toLocaleString()}`).join('\n')}

By Payment Method:
${Object.entries(reportData.byMethod).map(([method, amount]) => `- ${method}: KES ${Number(amount).toLocaleString()}`).join('\n')}
    `
    
    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `income-report-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateExpenseReport = () => {
    const reportData = {
      totalExpenses: totalExpenses,
      transactionCount: moneyOutData.length,
      averageExpense: moneyOutData.length > 0 ? totalExpenses / moneyOutData.length : 0,
      byCategory: moneyOutData.reduce((acc: any, item) => {
        acc[item.category] = (acc[item.category] || 0) + Number(item.amount)
        return acc
      }, {}),
      byMethod: moneyOutData.reduce((acc: any, item) => {
        acc[item.method] = (acc[item.method] || 0) + Number(item.amount)
        return acc
      }, {})
    }
    
    const reportContent = `
Expense Report - ${new Date().toLocaleDateString()}
==========================================
Total Expenses: KES ${totalExpenses.toLocaleString()}
Transaction Count: ${reportData.transactionCount}
Average Expense: KES ${reportData.averageExpense.toLocaleString()}

By Category:
${Object.entries(reportData.byCategory).map(([category, amount]) => `- ${category}: KES ${Number(amount).toLocaleString()}`).join('\n')}

By Payment Method:
${Object.entries(reportData.byMethod).map(([method, amount]) => `- ${method}: KES ${Number(amount).toLocaleString()}`).join('\n')}
    `
    
    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expense-report-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateProfitLossReport = () => {
    const reportData = {
      totalIncome,
      totalExpenses,
      netProfit: netBalance,
      profitMargin: totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0,
      incomeTransactions: moneyInData.length,
      expenseTransactions: moneyOutData.length
    }
    
    const reportContent = `
Profit & Loss Report - ${new Date().toLocaleDateString()}
==========================================
Total Income: KES ${totalIncome.toLocaleString()}
Total Expenses: KES ${totalExpenses.toLocaleString()}
Net Profit/Loss: KES ${netBalance.toLocaleString()}
Profit Margin: ${reportData.profitMargin.toFixed(2)}%

Transaction Summary:
- Income Transactions: ${reportData.incomeTransactions}
- Expense Transactions: ${reportData.expenseTransactions}
- Total Transactions: ${reportData.incomeTransactions + reportData.expenseTransactions}
    `
    
    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `profit-loss-report-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAllData = () => {
    const allData = {
      income: moneyInData,
      expenses: moneyOutData,
      summary: {
        totalIncome,
        totalExpenses,
        netBalance,
        incomeTransactions: moneyInData.length,
        expenseTransactions: moneyOutData.length
      }
    }
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUpdateIncome = async () => {
    if (!incomeForm.amount || !incomeForm.source || !incomeForm.method) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields: Amount, Source, and Payment Method",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      // TODO: Handle file uploads through Express backend
      const uploadedAttachments: any[] = []
      for (let i = 0; i < incomeForm.attachments.length; i++) {
        const file = incomeForm.attachments[i]
        uploadedAttachments.push({
          name: file.name,
          type: file.type,
          size: file.size,
        })
      }

      // Combine existing attachments with new ones
      const existingAttachments = itemToEdit.attachments || []
      const allAttachments = [...existingAttachments, ...uploadedAttachments]

      // Update income transaction via Express backend
      const response = await api.put(`/finances/income/${itemToEdit.id}`, {
        date: incomeForm.date,
        source: incomeForm.source,
        patient: incomeForm.patient,
        amount: Number.parseFloat(incomeForm.amount),
        method: incomeForm.method,
        notes: incomeForm.notes,
        attachments: allAttachments,
      })

      if (response.data.success) {
        // Update local state immediately
        setMoneyInData(prev => prev.map(item => 
          item.id === itemToEdit.id ? response.data.transaction : item
        ))
        
        setShowEditIncomeDialog(false)
        setItemToEdit(null)
        // Reset form
        setIncomeForm({
          date: new Date().toISOString().split("T")[0],
          amount: "",
          source: "",
          patient: "",
          method: "",
          notes: "",
          attachments: [],
        })
        toast({
          title: "Success",
          description: "Income transaction updated successfully.",
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Error updating income transaction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleUpdateExpense = async () => {
    if (!expenseForm.amount || !expenseForm.spentOn || !expenseForm.category || !expenseForm.method) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields: Amount, Spent On, Category, and Payment Method",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      // TODO: Handle file uploads through Express backend
      const uploadedAttachments: any[] = []
      for (let i = 0; i < expenseForm.attachments.length; i++) {
        const file = expenseForm.attachments[i]
        uploadedAttachments.push({
          name: file.name,
          type: file.type,
          size: file.size,
        })
      }

      // Combine existing attachments with new ones
      const existingAttachments = itemToEdit.attachments || []
      const allAttachments = [...existingAttachments, ...uploadedAttachments]

      // Update expense transaction via Express backend
      const response = await api.put(`/finances/expenses/${itemToEdit.id}`, {
        date: expenseForm.date,
        spentOn: expenseForm.spentOn,
        category: expenseForm.category,
        amount: Number.parseFloat(expenseForm.amount),
        method: expenseForm.method,
        notes: expenseForm.notes,
        attachments: allAttachments,
      })

      if (response.data.success) {
        // Update local state immediately
        setMoneyOutData(prev => prev.map(item => 
          item.id === itemToEdit.id ? response.data.transaction : item
        ))
        
        setShowEditExpenseDialog(false)
        setItemToEdit(null)
        // Reset form
        setExpenseForm({
          date: new Date().toISOString().split("T")[0],
          amount: "",
          spentOn: "",
          category: "",
          method: "",
          notes: "",
          attachments: [],
        })
        toast({
          title: "Success",
          description: "Expense transaction updated successfully.",
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Error updating expense transaction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  // View functions
  const handleViewIncome = (incomeItem: any) => {
    setItemToView(incomeItem)
    setShowViewIncomeDialog(true)
  }

  const handleViewExpense = (expenseItem: any) => {
    setItemToView(expenseItem)
    setShowViewExpenseDialog(true)
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading financial data...</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">💰 Financial Management (KES)</h1>
              <p className="text-gray-600 mt-1">Track income, expenses, and financial performance</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="border-2 border-gray-200 hover:border-gray-300"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExportFilteredData('csv')}
                className="border-2 border-gray-200 hover:border-gray-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExportFilteredData('pdf')}
                className="border-2 border-gray-200 hover:border-gray-300"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Collapsible Stats Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Financial Summary</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}
                className="text-gray-600 hover:text-gray-900"
              >
                {isStatsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                {isStatsCollapsed ? 'Show' : 'Hide'} Summary
              </Button>
            </div>
            
            {!isStatsCollapsed && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Income</p>
                        <p className="text-3xl font-bold text-green-600">KES {totalIncome.toLocaleString()}</p>
                        <div className="flex items-center mt-2">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm text-green-600 font-medium">
                            {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}% from last month
                          </span>
                        </div>
                      </div>
                      <div className="bg-green-100 p-3 rounded-full">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                        <p className="text-3xl font-bold text-red-600">KES {totalExpenses.toLocaleString()}</p>
                        <div className="flex items-center mt-2">
                          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-sm text-red-600 font-medium">
                            {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}% from last month
                          </span>
                        </div>
                      </div>
                      <div className="bg-red-100 p-3 rounded-full">
                        <TrendingDown className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Net Balance</p>
                        <p className={`text-3xl font-bold ${netBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                          KES {netBalance.toLocaleString()}
                        </p>
                        <div className="flex items-center mt-2">
                          <DollarSign className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="text-sm text-blue-600 font-medium">Current balance</span>
                        </div>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-full">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Filters Section */}
          {showFilters && (
            <Card className="border-2 border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Filters & Search</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('')
                      setDateRangeFilter('all')
                      setMethodFilter('all')
                      setTypeFilter('all')
                      setCurrentPage(1)
                    }}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date Range</Label>
                    <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="this-week">This Week</SelectItem>
                        <SelectItem value="this-month">This Month</SelectItem>
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="this-quarter">This Quarter</SelectItem>
                        <SelectItem value="this-year">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Payment Method</Label>
                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                        <SelectItem value="Check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Transaction Type</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Items Per Page</Label>
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                      <SelectTrigger>
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
              </CardContent>
            </Card>
          )}

          {/* Main Content Tabs */}
          <Tabs defaultValue="transactions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white border-2 border-gray-200 rounded-2xl p-1">
              <TabsTrigger value="transactions" className="rounded-xl">
                💳 Transactions
              </TabsTrigger>
              <TabsTrigger value="balance" className="rounded-xl">
                📊 Balance Tracker
              </TabsTrigger>
              <TabsTrigger value="reports" className="rounded-xl">
                📈 Reports
              </TabsTrigger>
            </TabsList>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-6">
              {/* View Toggle and Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={currentView === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentView('table')}
                    >
                      Table View
                    </Button>
                    <Button
                      variant={currentView === 'cards' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentView('cards')}
                    >
                      Card View
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Showing {getPaginatedData().length} of {getFilteredAndSortedData().length} transactions
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleAddIncomeClick} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Income
                  </Button>
                  <Button onClick={handleAddExpenseClick} className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
              </div>

              {currentView === 'table' ? (
                /* Table View */
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleSort('date')}
                            >
                              <div className="flex items-center gap-1">
                                Date
                                {sortField === 'date' && (
                                  sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleSort('source')}
                            >
                              <div className="flex items-center gap-1">
                                Description
                                {sortField === 'source' && (
                                  sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleSort('amount')}
                            >
                              <div className="flex items-center gap-1">
                                Amount
                                {sortField === 'amount' && (
                                  sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleSort('method')}
                            >
                              <div className="flex items-center gap-1">
                                Method
                                {sortField === 'method' && (
                                  sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getPaginatedData().map((item) => (
                            <TableRow key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                              <TableCell className="font-medium">
                                {new Date(item.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{item.source || item.spent_on}</div>
                                  {item.patient && <div className="text-sm text-gray-500">{item.patient}</div>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={item.type === 'income' ? 'default' : 'secondary'}>
                                  {item.category || item.type === 'income' ? 'Income' : 'Expense'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className={`font-bold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                  {item.type === 'income' ? '+' : '-'}KES {Number(item.amount).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {item.method}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {item.notes}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                    title="View transaction details"
                                    onClick={() => item.type === 'income' ? handleViewIncome(item) : handleViewExpense(item)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    title="Edit transaction"
                                    onClick={() => item.type === 'income' ? handleEditIncome(item) : handleEditExpense(item)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                    onClick={() => item.type === 'income' ? handleDeleteIncome(item.id) : handleDeleteExpense(item.id)}
                                    title={`Delete ${item.type} record`}
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
                    
                    {/* Pagination */}
                    {getTotalPages() > 1 && (
                      <div className="flex items-center justify-between p-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          Page {currentPage} of {getTotalPages()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                              const page = Math.max(1, Math.min(getTotalPages() - 4, currentPage - 2)) + i
                              if (page > getTotalPages()) return null
                              return (
                                <Button
                                  key={page}
                                  variant={currentPage === page ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  className="w-8 h-8 p-0"
                                >
                                  {page}
                                </Button>
                              )
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(getTotalPages(), currentPage + 1))}
                            disabled={currentPage === getTotalPages()}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* Card View (Original) */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Money In Section */}
                  <Card className="border-2 border-gray-200">
                    <CardHeader className="border-b border-gray-200 pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold flex items-center">
                          <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                          Money In
                        </CardTitle>
                        <Button onClick={handleAddIncomeClick} className="bg-green-600 hover:bg-green-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Income
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {moneyInData.map((item) => (
                          <div
                            key={item.id}
                            className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{item.source}</p>
                                  <p className="text-sm text-gray-600">{item.patient}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <p className="font-bold text-green-600">+KES {Number(item.amount).toLocaleString()}</p>
                                  <Badge variant="outline" className="text-xs border-gray-200">
                                    {item.method}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                    onClick={() => handleViewIncome(item)}
                                    title="View income record"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                    onClick={() => handleEditIncome(item)}
                                    title="Edit income record"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                    onClick={() => handleDeleteIncome(item.id)}
                                    title="Delete income record"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                              <span>{new Date(item.date).toLocaleDateString()}</span>
                              <span>{item.notes}</span>
                            </div>
                            {/* Attachments */}
                            {item.attachments && item.attachments.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500 mb-2">Attachments:</p>
                                <div className="flex flex-wrap gap-2">
                                  {item.attachments.map((attachment: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded text-xs border"
                                    >
                                      {getFileIcon(attachment.type)}
                                      <span className="truncate max-w-20">{attachment.name}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-4 w-4 p-0 hover:bg-gray-200"
                                        onClick={() => window.open(attachment.url, "_blank")}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Money Out Section */}
                  <Card className="border-2 border-gray-200">
                    <CardHeader className="border-b border-gray-200 pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold flex items-center">
                          <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                          Money Out
                        </CardTitle>
                        <Button onClick={handleAddExpenseClick} className="bg-red-600 hover:bg-red-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Expense
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {moneyOutData.map((item) => (
                          <div
                            key={item.id}
                            className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="bg-red-100 p-2 rounded-lg">
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{item.spent_on}</p>
                                  <Badge variant="secondary" className="text-xs">
                                    {item.category}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <p className="font-bold text-red-600">-KES {Number(item.amount).toLocaleString()}</p>
                                  <Badge variant="outline" className="text-xs border-gray-200">
                                    {item.method}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                    onClick={() => handleViewExpense(item)}
                                    title="View expense record"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                    onClick={() => handleEditExpense(item)}
                                    title="Edit expense record"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                    onClick={() => handleDeleteExpense(item.id)}
                                    title="Delete expense record"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                              <span>{new Date(item.date).toLocaleDateString()}</span>
                              <span>{item.notes}</span>
                            </div>
                            {/* Attachments */}
                            {item.attachments && item.attachments.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500 mb-2">Attachments:</p>
                                <div className="flex flex-wrap gap-2">
                                  {item.attachments.map((attachment: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded text-xs border"
                                    >
                                      {getFileIcon(attachment.type)}
                                      <span className="truncate max-w-20">{attachment.name}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-4 w-4 p-0 hover:bg-gray-200"
                                        onClick={() => window.open(attachment.url, "_blank")}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Balance Tracker Tab */}
            <TabsContent value="balance" className="space-y-6">
              <Card className="border-2 border-gray-200">
                <CardHeader className="border-b border-gray-200 pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center">
                    <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                    Balance Tracker
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Monthly Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="text-green-700 font-medium">Total Income</span>
                          <span className="text-green-700 font-bold">KES {totalIncome.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                          <span className="text-red-700 font-medium">Total Expenses</span>
                          <span className="text-red-700 font-bold">KES {totalExpenses.toLocaleString()}</span>
                        </div>
                        <div
                          className={`flex justify-between items-center p-3 rounded-lg border-2 ${
                            netBalance >= 0 ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"
                          }`}
                        >
                          <span className={`font-medium ${netBalance >= 0 ? "text-blue-700" : "text-red-700"}`}>
                            Net Balance
                          </span>
                          <span className={`font-bold text-lg ${netBalance >= 0 ? "text-blue-700" : "text-red-700"}`}>
                            KES {netBalance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Quick Stats</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-2xl font-bold text-gray-900">{moneyInData.length}</p>
                          <p className="text-sm text-gray-600">Income Transactions</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-2xl font-bold text-gray-900">{moneyOutData.length}</p>
                          <p className="text-sm text-gray-600">Expense Transactions</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Trends Chart */}
              <Card className="border-2 border-gray-200">
                <CardHeader className="border-b border-gray-200 pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center">
                    <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                    Monthly Trends (Last 12 Months)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {monthlyChartData.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm font-medium text-green-700">Average Monthly Income</p>
                          <p className="text-2xl font-bold text-green-700">
                            KES {monthlyChartData.length > 0 ? Math.round(monthlyChartData.reduce((sum, item) => sum + item.income, 0) / monthlyChartData.length).toLocaleString() : '0'}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-sm font-medium text-red-700">Average Monthly Expenses</p>
                          <p className="text-2xl font-bold text-red-700">
                            KES {monthlyChartData.length > 0 ? Math.round(monthlyChartData.reduce((sum, item) => sum + item.expenses, 0) / monthlyChartData.length).toLocaleString() : '0'}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-700">Average Monthly Net</p>
                          <p className="text-2xl font-bold text-blue-700">
                            KES {monthlyChartData.length > 0 ? Math.round(monthlyChartData.reduce((sum, item) => sum + item.netBalance, 0) / monthlyChartData.length).toLocaleString() : '0'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {monthlyChartData.map((month, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">{month.month}</h4>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-green-600">Income: KES {month.income.toLocaleString()}</span>
                                <span className="text-red-600">Expenses: KES {month.expenses.toLocaleString()}</span>
                                <span className={`font-bold ${month.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                  Net: KES {month.netBalance.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-16 text-xs text-green-600">Income</div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ 
                                      width: `${monthlyChartData.length > 0 && Math.max(...monthlyChartData.map(m => m.income)) > 0 ? Math.max(1, (month.income / Math.max(...monthlyChartData.map(m => m.income))) * 100) : 0}%` 
                                    }}
                                  ></div>
                                </div>
                                <div className="w-16 text-xs text-green-600 text-right">{month.income.toLocaleString()}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-16 text-xs text-red-600">Expenses</div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-red-500 h-2 rounded-full" 
                                    style={{ 
                                      width: `${monthlyChartData.length > 0 && Math.max(...monthlyChartData.map(m => m.expenses)) > 0 ? Math.max(1, (month.expenses / Math.max(...monthlyChartData.map(m => m.expenses))) * 100) : 0}%` 
                                    }}
                                  ></div>
                                </div>
                                <div className="w-16 text-xs text-red-600 text-right">{month.expenses.toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No data available for monthly trends</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card className="border-2 border-gray-200">
                <CardHeader className="border-b border-gray-200 pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center">
                    <PieChart className="h-5 w-5 text-purple-600 mr-2" />
                    Financial Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button
                      variant="outline"
                      className="h-20 flex-col border-2 border-gray-200 hover:border-purple-300"
                      onClick={generateIncomeReport}
                    >
                      <FileText className="h-6 w-6 text-purple-600 mb-2" />
                      <span className="text-sm font-medium">Income Report</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col border-2 border-gray-200 hover:border-red-300" onClick={generateExpenseReport}>
                      <Receipt className="h-6 w-6 text-red-600 mb-2" />
                      <span className="text-sm font-medium">Expense Report</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col border-2 border-gray-200 hover:border-blue-300" onClick={generateProfitLossReport}>
                      <BarChart3 className="h-6 w-6 text-blue-600 mb-2" />
                      <span className="text-sm font-medium">Profit & Loss</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col border-2 border-gray-200 hover:border-green-300" onClick={exportAllData}>
                      <Download className="h-6 w-6 text-green-600 mb-2" />
                      <span className="text-sm font-medium">Export Data</span>
                    </Button>
                  </div>
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <Upload className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="text-yellow-800 font-medium">Upload Receipts</span>
                    </div>
                    <p className="text-yellow-700 text-sm mt-1">
                      Drag and drop receipt images here or click to browse files
                    </p>
                    <div className="mt-3">
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length === 0) return
                          
                          setUploading(true)
                          try {
                            for (let i = 0; i < files.length; i++) {
                              const file = files[i]
                              const fileExt = file.name.split('.').pop()
                              const filePath = `financial-documents/receipts/${uuidv4()}.${fileExt}`
                              
                              // TODO: Handle file uploads through Express backend
                              // For now, just show success message
                              toast({
                                title: "Success",
                                description: `Receipt "${file.name}" will be uploaded.`,
                              })
                            }
                          } catch (error) {
                            console.error('Error:', error)
                            toast({
                              title: "Error",
                              description: "Error uploading receipts. Please try again.",
                              variant: "destructive",
                            })
                          } finally {
                            setUploading(false)
                          }
                        }}
                        className="hidden"
                        id="receipt-upload"
                      />
                      <label 
                        htmlFor="receipt-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        {uploading ? 'Uploading...' : 'Browse Files'}
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Add Income Dialog */}
          <Dialog open={showAddIncomeDialog} onOpenChange={setShowAddIncomeDialog}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Income</DialogTitle>
                <DialogDescription>Record a new income transaction</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      type="date"
                      value={incomeForm.date}
                      onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (KES)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={incomeForm.amount}
                      onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="source">Source</Label>
                  <select
                    value={incomeForm.source}
                    onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select source</option>
                    <option value="Patient Payment">Patient Payment</option>
                    <option value="Insurance Claim">Insurance Claim</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="patient">Patient</Label>
                  <Input
                    value={incomeForm.patient}
                    onChange={(e) => setIncomeForm({ ...incomeForm, patient: e.target.value })}
                    placeholder="Patient name"
                  />
                </div>
                <div>
                  <Label htmlFor="method">Payment Method</Label>
                  <select
                    value={incomeForm.method}
                    onChange={(e) => setIncomeForm({ ...incomeForm, method: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select method</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check</option>
                    <option value="M-Pesa">M-Pesa</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    value={incomeForm.notes}
                    onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>

                {/* File Upload Section */}
                <div>
                  <Label htmlFor="attachments">Upload Documents</Label>
                  <div className="mt-2">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> receipts, cheques, or invoices
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, PDF (MAX. 10MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*,.pdf"
                          onChange={handleIncomeFileUpload}
                        />
                      </label>
                    </div>

                    {/* Display uploaded files */}
                    {incomeForm.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                        {incomeForm.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                            <div className="flex items-center gap-2">
                              {getFileIcon(file.type)}
                              <span className="text-sm truncate">{file.name}</span>
                              <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeIncomeFile(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={handleAddIncome} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={uploading}
                >
                  {uploading ? 'Adding...' : 'Add Income'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Expense Dialog */}
          <Dialog open={showAddExpenseDialog} onOpenChange={setShowAddExpenseDialog}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Record a new expense transaction</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (KES)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="spentOn">Spent On</Label>
                  <Input
                    value={expenseForm.spentOn}
                    onChange={(e) => setExpenseForm({ ...expenseForm, spentOn: e.target.value })}
                    placeholder="What was purchased"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select category</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Overhead">Overhead</option>
                    <option value="Payroll">Payroll</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="method">Payment Method</Label>
                  <select
                    value={expenseForm.method}
                    onChange={(e) => setExpenseForm({ ...expenseForm, method: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select method</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check</option>
                    <option value="M-Pesa">M-Pesa</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>

                {/* File Upload Section */}
                <div>
                  <Label htmlFor="attachments">Upload Documents</Label>
                  <div className="mt-2">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> receipts, invoices, or bills
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, PDF (MAX. 10MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*,.pdf"
                          onChange={handleExpenseFileUpload}
                        />
                      </label>
                    </div>

                    {/* Display uploaded files */}
                    {expenseForm.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                        {expenseForm.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                            <div className="flex items-center gap-2">
                              {getFileIcon(file.type)}
                              <span className="text-sm truncate">{file.name}</span>
                              <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExpenseFile(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={handleAddExpense} 
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={uploading}
                >
                  {uploading ? 'Adding...' : 'Add Expense'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Income Dialog */}
          <Dialog open={showDeleteIncomeDialog} onOpenChange={setShowDeleteIncomeDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this income record? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteIncomeDialog(false)}>Cancel</Button>
                <Button variant="destructive" onClick={async () => {
                  try {
                    const response = await api.delete(`/finances/income/${itemToDelete}`)

                    if (response.data.success) {
                      console.log('Income record deleted successfully')
                      // Update local state immediately
                      setMoneyInData(prev => prev.filter(item => item.id !== itemToDelete))
                      toast({
                        title: "Success",
                        description: "Income record deleted successfully.",
                      })
                      setShowDeleteIncomeDialog(false)
                      setItemToDelete(null)
                    }
                  } catch (error: any) {
                    console.error('Error deleting income:', error)
                    const errorMessage = error.response?.data?.error || error.message || "An unexpected error occurred. Please try again."
                    toast({
                      title: "Error",
                      description: errorMessage,
                      variant: "destructive",
                    })
                  }
                }}>Delete</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Expense Dialog */}
          <Dialog open={showDeleteExpenseDialog} onOpenChange={setShowDeleteExpenseDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this expense record? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteExpenseDialog(false)}>Cancel</Button>
                <Button variant="destructive" onClick={async () => {
                  try {
                    const response = await api.delete(`/finances/expenses/${itemToDelete}`)

                    if (response.data.success) {
                      // Update local state immediately
                      setMoneyOutData(prev => prev.filter(item => item.id !== itemToDelete))
                      toast({
                        title: "Success",
                        description: "Expense record deleted successfully.",
                      })
                      setShowDeleteExpenseDialog(false)
                      setItemToDelete(null)
                    }
                  } catch (error: any) {
                    console.error('Error deleting expense:', error)
                    const errorMessage = error.response?.data?.error || error.message || "An unexpected error occurred. Please try again."
                    toast({
                      title: "Error",
                      description: errorMessage,
                      variant: "destructive",
                    })
                  }
                }}>Delete</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Income Dialog */}
          <Dialog open={showEditIncomeDialog} onOpenChange={setShowEditIncomeDialog}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Income</DialogTitle>
                <DialogDescription>Edit an existing income transaction</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      type="date"
                      value={incomeForm.date}
                      onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (KES)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={incomeForm.amount}
                      onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="source">Source</Label>
                  <select
                    value={incomeForm.source}
                    onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select source</option>
                    <option value="Patient Payment">Patient Payment</option>
                    <option value="Insurance Claim">Insurance Claim</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="patient">Patient</Label>
                  <Input
                    value={incomeForm.patient}
                    onChange={(e) => setIncomeForm({ ...incomeForm, patient: e.target.value })}
                    placeholder="Patient name"
                  />
                </div>
                <div>
                  <Label htmlFor="method">Payment Method</Label>
                  <select
                    value={incomeForm.method}
                    onChange={(e) => setIncomeForm({ ...incomeForm, method: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select method</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check</option>
                    <option value="M-Pesa">M-Pesa</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    value={incomeForm.notes}
                    onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>

                {/* File Upload Section */}
                <div>
                  <Label htmlFor="attachments">Upload Documents</Label>
                  <div className="mt-2">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> receipts, cheques, or invoices
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, PDF (MAX. 10MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*,.pdf"
                          onChange={handleIncomeFileUpload}
                        />
                      </label>
                    </div>

                    {/* Display uploaded files */}
                    {incomeForm.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                        {incomeForm.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                            <div className="flex items-center gap-2">
                              {getFileIcon(file.type)}
                              <span className="text-sm truncate">{file.name}</span>
                              <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeIncomeFile(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={handleUpdateIncome} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={uploading}
                >
                  {uploading ? 'Updating...' : 'Update Income'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Expense Dialog */}
          <Dialog open={showEditExpenseDialog} onOpenChange={setShowEditExpenseDialog}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Expense</DialogTitle>
                <DialogDescription>Edit an existing expense transaction</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (KES)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="spentOn">Spent On</Label>
                  <Input
                    value={expenseForm.spentOn}
                    onChange={(e) => setExpenseForm({ ...expenseForm, spentOn: e.target.value })}
                    placeholder="What was purchased"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select category</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Overhead">Overhead</option>
                    <option value="Payroll">Payroll</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="method">Payment Method</Label>
                  <select
                    value={expenseForm.method}
                    onChange={(e) => setExpenseForm({ ...expenseForm, method: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select method</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check</option>
                    <option value="M-Pesa">M-Pesa</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>

                {/* File Upload Section */}
                <div>
                  <Label htmlFor="attachments">Upload Documents</Label>
                  <div className="mt-2">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> receipts, invoices, or bills
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, PDF (MAX. 10MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*,.pdf"
                          onChange={handleExpenseFileUpload}
                        />
                      </label>
                    </div>

                    {/* Display uploaded files */}
                    {expenseForm.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                        {expenseForm.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                            <div className="flex items-center gap-2">
                              {getFileIcon(file.type)}
                              <span className="text-sm truncate">{file.name}</span>
                              <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExpenseFile(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={handleUpdateExpense} 
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={uploading}
                >
                  {uploading ? 'Updating...' : 'Update Expense'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* View Income Dialog */}
          <Dialog open={showViewIncomeDialog} onOpenChange={setShowViewIncomeDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Income Transaction Details
                </DialogTitle>
                <DialogDescription>View complete details of this income transaction</DialogDescription>
              </DialogHeader>
              {itemToView && (
                <div className="space-y-6">
                  {/* Transaction Summary */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-green-800">{itemToView.source}</h3>
                        <p className="text-green-600">{itemToView.patient}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">+KES {Number(itemToView.amount).toLocaleString()}</p>
                        <Badge variant="outline" className="border-green-300 text-green-700">
                          {itemToView.method}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Date</Label>
                        <p className="text-gray-900">{new Date(itemToView.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Source</Label>
                        <p className="text-gray-900">{itemToView.source}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Patient</Label>
                        <p className="text-gray-900">{itemToView.patient || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Amount</Label>
                        <p className="text-lg font-bold text-green-600">KES {Number(itemToView.amount).toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Payment Method</Label>
                        <p className="text-gray-900">{itemToView.method}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Notes</Label>
                        <p className="text-gray-900">{itemToView.notes || 'No notes'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Attachments Section */}
                  {itemToView.attachments && itemToView.attachments.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Paperclip className="h-5 w-5" />
                        Attachments ({itemToView.attachments.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {itemToView.attachments.map((attachment: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {getFileIcon(attachment.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                                <p className="text-xs text-gray-500">{attachment.type}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(attachment.url, "_blank")}
                                className="flex-shrink-0"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowViewIncomeDialog(false)
                        handleEditIncome(itemToView)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowViewIncomeDialog(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* View Expense Dialog */}
          <Dialog open={showViewExpenseDialog} onOpenChange={setShowViewExpenseDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Expense Transaction Details
                </DialogTitle>
                <DialogDescription>View complete details of this expense transaction</DialogDescription>
              </DialogHeader>
              {itemToView && (
                <div className="space-y-6">
                  {/* Transaction Summary */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-red-800">{itemToView.spent_on}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {itemToView.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-600">-KES {Number(itemToView.amount).toLocaleString()}</p>
                        <Badge variant="outline" className="border-red-300 text-red-700">
                          {itemToView.method}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Date</Label>
                        <p className="text-gray-900">{new Date(itemToView.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Spent On</Label>
                        <p className="text-gray-900">{itemToView.spent_on}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Category</Label>
                        <p className="text-gray-900">{itemToView.category}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Amount</Label>
                        <p className="text-lg font-bold text-red-600">KES {Number(itemToView.amount).toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Payment Method</Label>
                        <p className="text-gray-900">{itemToView.method}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Notes</Label>
                        <p className="text-gray-900">{itemToView.notes || 'No notes'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Attachments Section */}
                  {itemToView.attachments && itemToView.attachments.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Paperclip className="h-5 w-5" />
                        Attachments ({itemToView.attachments.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {itemToView.attachments.map((attachment: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {getFileIcon(attachment.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                                <p className="text-xs text-gray-500">{attachment.type}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(attachment.url, "_blank")}
                                className="flex-shrink-0"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowViewExpenseDialog(false)
                        handleEditExpense(itemToView)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowViewExpenseDialog(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </MainLayout>
  )
}
