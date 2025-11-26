"use client"

import { useState, useEffect } from "react"
import api from "@/lib/axiosConfig"
import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Download, Calendar, DollarSign, Users, FileText, Filter, Eye, Printer, Clock, AlertCircle, ToggleLeft, ToggleRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

// Force dynamic rendering to avoid build-time environment variable issues
export const dynamic = 'force-dynamic'

import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
dayjs.extend(quarterOfYear)


export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("this-month")
  const [reportType, setReportType] = useState("overview")
  const [dataOnlyView, setDataOnlyView] = useState(true)
  const [quickStats, setQuickStats] = useState<any[]>([])
  const [reportData, setReportData] = useState<any>({ revenue: { daily: [], monthly: [] }, appointments: { byDentist: [], byTreatment: [] }, patients: { newPatients: [], demographics: [] } })
  const { toast } = useToast()

  // CSV Export function
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "No data to export",
        description: "There is no data available for the selected period.",
        variant: "destructive",
      })
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Handle special characters and wrap in quotes if needed
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "CSV Export Successful",
      description: `${filename} has been downloaded successfully.`,
    })
  }

  const handleExportCSV = () => {
    const now = dayjs().format('YYYY-MM-DD')
    let csvData: any[] = []
    let filename = ""

    switch (reportType) {
      case 'revenue':
        csvData = [
          ...reportData.revenue.daily.map((day: any) => ({
            Date: day.date,
            Revenue: `KSH ${day.amount}`,
            Amount: day.amount
          })),
          ...reportData.revenue.monthly.map((month: any) => ({
            Period: `${month.month} ${month.year}`,
            Revenue: `KSH ${month.amount.toLocaleString()}`,
            Amount: month.amount
          }))
        ]
        filename = `revenue-report-${now}`
        break
      case 'appointments':
        csvData = [
          ...reportData.appointments.byDentist.map((dentist: any) => ({
            Dentist: dentist.dentist,
            Appointments: dentist.count,
            Revenue: `KSH ${dentist.revenue.toLocaleString()}`,
            Amount: dentist.revenue
          })),
          ...reportData.appointments.byTreatment.map((treatment: any) => ({
            Treatment: treatment.treatment,
            Procedures: treatment.count,
            Revenue: `KSH ${treatment.revenue.toLocaleString()}`,
            Average: `KSH ${Math.round(treatment.revenue / treatment.count)}`,
            Amount: treatment.revenue
          }))
        ]
        filename = `appointments-report-${now}`
        break
      case 'patients':
        csvData = [
          ...reportData.patients.newPatients.map((month: any) => ({
            Period: `${month.month} ${month.year}`,
            'New Patients': month.count
          })),
          ...reportData.patients.demographics.map((demo: any) => ({
            'Age Group': demo.ageGroup,
            Patients: demo.count,
            Percentage: `${demo.percentage}%`
          }))
        ]
        filename = `patients-report-${now}`
        break
      default:
        // Overview - export all data
        csvData = [
          ...reportData.revenue.daily.map((day: any) => ({
            Type: 'Daily Revenue',
            Date: day.date,
            Revenue: `KSH ${day.amount}`,
            Amount: day.amount
          })),
          ...reportData.appointments.byDentist.map((dentist: any) => ({
            Type: 'Dentist Performance',
            Dentist: dentist.dentist,
            Appointments: dentist.count,
            Revenue: `KSH ${dentist.revenue.toLocaleString()}`,
            Amount: dentist.revenue
          })),
          ...reportData.patients.newPatients.map((month: any) => ({
            Type: 'New Patients',
            Period: `${month.month} ${month.year}`,
            'New Patients': month.count
          }))
        ]
        filename = `overview-report-${now}`
    }

    exportToCSV(csvData, filename)
  }

  useEffect(() => {
    const fetchData = async () => {
      // Date range logic
      const now = dayjs()
      let start, end
      switch (dateRange) {
        case 'today':
          start = now.startOf('day'); end = now.endOf('day'); break
        case 'this-week':
          start = now.startOf('week'); end = now.endOf('week'); break
        case 'this-month':
        default:
          start = now.startOf('month'); end = now.endOf('month'); break
        case 'last-month':
          start = now.subtract(1, 'month').startOf('month'); end = now.subtract(1, 'month').endOf('month'); break
        case 'this-quarter':
          start = now.startOf('quarter'); end = now.endOf('quarter'); break
        case 'this-year':
          start = now.startOf('year'); end = now.endOf('year'); break
      }
      
      // Quick Stats
      const invoicesResponse = await api.get('/invoices', {
        params: {
          startDate: start.format('YYYY-MM-DD'),
          endDate: end.format('YYYY-MM-DD'),
          page: 1,
          pageSize: 10000
        }
      })
      const invoices = invoicesResponse.data.success ? invoicesResponse.data.invoices : []
      
      const appointmentsResponse = await api.get('/appointments', {
        params: {
          startDate: start.format('YYYY-MM-DD'),
          endDate: end.format('YYYY-MM-DD'),
          page: 1,
          pageSize: 10000,
          viewAll: true
        }
      })
      const appointments = appointmentsResponse.data.success ? appointmentsResponse.data.appointments : []
      const appointmentCount = appointments.length
      
      // Fetch patients using API
      const patientsResponse = await api.get('/patients', {
        params: { page: 1, pageSize: 10000 }
      })
      const allPatients = patientsResponse.data.success ? patientsResponse.data.patients : []
      
      // Calculate new patients count for the date range
      const newPatients = allPatients.filter(patient => {
        const createdDate = dayjs(patient.created_at)
        return createdDate.isAfter(start) && createdDate.isBefore(end.add(1, 'day'))
      }).length
      
      const totalRevenue = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.total), 0) ?? 0
      const avgPerVisit = appointmentCount && appointmentCount > 0 ? totalRevenue / appointmentCount : 0
      setQuickStats([
        { label: "Total Revenue (MTD)", value: `KSH ${totalRevenue.toLocaleString()}`, change: "", icon: DollarSign, color: "text-green-600" },
        { label: "Total Appointments", value: appointmentCount?.toString() ?? '0', change: "", icon: Calendar, color: "text-blue-600" },
        { label: "New Patients", value: newPatients?.toString() ?? '0', change: "", icon: Users, color: "text-purple-600" },
        { label: "Average Per Visit", value: `KSH ${Math.round(avgPerVisit)}`, change: "", icon: TrendingUp, color: "text-orange-600" },
      ])
      
      // Revenue Charts
      // Daily - Only include days with data if dataOnlyView is true
      const days = []
      for (let d = start.clone(); d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
        const dayTotal = invoices?.filter(i => dayjs(i.date).isSame(d, 'day') && i.status === 'paid').reduce((sum, i) => sum + Number(i.total), 0) ?? 0
        if (dataOnlyView) {
          // Only include days with revenue > 0
          if (dayTotal > 0) {
            days.push({ date: d.format('MMM D'), amount: dayTotal })
          }
        } else {
          // Include all days
          days.push({ date: d.format('MMM D'), amount: dayTotal })
        }
      }
      
      // Monthly - Only include months with data if dataOnlyView is true
      const months = []
      for (let m = start.clone().startOf('year'); m.isBefore(end) || m.isSame(end, 'month'); m = m.add(1, 'month')) {
        const monthTotal = invoices?.filter(i => dayjs(i.date).isSame(m, 'month') && i.status === 'paid').reduce((sum, i) => sum + Number(i.total), 0) ?? 0
        if (dataOnlyView) {
          // Only include months with revenue > 0
          if (monthTotal > 0) {
            months.push({ month: m.format('MMM'), year: m.format('YYYY'), amount: monthTotal })
          }
        } else {
          // Include all months
          months.push({ month: m.format('MMM'), year: m.format('YYYY'), amount: monthTotal })
        }
      }
      
      // Appointments by Dentist - Only include dentists with appointments if dataOnlyView is true
      const dentistsResponse = await api.get('/profiles', {
        params: { role: 'dentist' }
      })
      const dentists = dentistsResponse.data.success ? dentistsResponse.data.profiles : []
      const dentistMap = Object.fromEntries((dentists || []).map((d: any) => [d.id, d.full_name]))
      const byDentist = (dentists || []).map((d: any) => {
        const appts = (appointments || []).filter((a: any) => a.dentist_id === d.id)
        const revenue = appts.reduce((sum: number, a: any) => {
          const inv = invoices?.find((i: any) => i.patient_id === a.patient_id && i.date === a.date)
          return sum + (inv ? Number(inv.total) : 0)
        }, 0)
        return { dentist: d.full_name, count: appts.length, revenue }
      }).filter(dentist => dataOnlyView ? dentist.count > 0 : true)
      
      // Appointments by Treatment - Only include treatments with appointments if dataOnlyView is true
      const treatments = Array.from(new Set((appointments || []).map((a: any) => a.treatment)))
      const byTreatment = treatments.map((treatment) => {
        const appts = (appointments || []).filter((a: any) => a.treatment === treatment)
        const revenue = appts.reduce((sum: number, a: any) => {
          const inv = invoices?.find((i: any) => i.patient_id === a.patient_id && i.date === a.date)
          return sum + (inv ? Number(inv.total) : 0)
        }, 0)
        return { treatment, count: appts.length, revenue }
      }).filter(treatment => dataOnlyView ? treatment.count > 0 : true)
      
      // New Patients by Month - Only include months with new patients if dataOnlyView is true
      const newPatientsByMonth = []
      for (let m = start.clone().startOf('year'); m.isBefore(end) || m.isSame(end, 'month'); m = m.add(1, 'month')) {
        const monthPatients = allPatients.filter(patient => {
          const createdDate = dayjs(patient.created_at)
          return createdDate.isSame(m, 'month')
        })
        const patientCount = monthPatients.length
        if (dataOnlyView) {
          // Only include months with new patients
          if (patientCount > 0) {
            newPatientsByMonth.push({ month: m.format('MMM'), year: m.format('YYYY'), count: patientCount })
          }
        } else {
          // Include all months
          newPatientsByMonth.push({ month: m.format('MMM'), year: m.format('YYYY'), count: patientCount })
        }
      }
      
      // Patient Demographics - Only include age groups with patients if dataOnlyView is true
      const ageGroups = [
        { label: '18-30', min: 18, max: 30 },
        { label: '31-45', min: 31, max: 45 },
        { label: '46-60', min: 46, max: 60 },
        { label: '60+', min: 61, max: 200 },
      ]
      const nowYear = now.year()
      const demographics = ageGroups.map((g) => {
        const count = allPatients.filter((p: any) => {
          if (!p.date_of_birth) return false
          const age = nowYear - dayjs(p.date_of_birth).year()
          return age >= g.min && age <= g.max
        }).length
        return { ageGroup: g.label, count }
      }).filter(d => dataOnlyView ? d.count > 0 : true)
      
      setReportData({
        revenue: { daily: days, monthly: months },
        appointments: { byDentist, byTreatment },
        patients: { newPatients: newPatientsByMonth, demographics },
      })
    }
    fetchData()
  }, [dateRange, dataOnlyView])

  const handleExportReport = () => {
    handleExportCSV()
  }

  const handleAdvancedFilters = () => {
    toast({
      title: "Advanced filters dialog would open here",
      description: "This feature is under development.",
    })
  }

  const handleExportPDF = () => {
    toast({
      title: "Exporting report as PDF...",
      description: "Your report is being exported to PDF.",
    })
  }

  const handleExportExcel = () => {
    toast({
      title: "Exporting report as Excel file...",
      description: "Your report is being exported to Excel.",
    })
  }

  const handlePrintCharts = () => {
    window.print()
  }

  const handleScheduleReport = () => {
    toast({
      title: "Schedule Report",
      description: "Report scheduling feature is under development. Please check back later.",
    })
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-4 space-y-6">
        {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
              Reports & Analytics
            </h1>
            <p className="text-gray-600">Comprehensive business insights and performance metrics</p>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            {/* View Toggle */}
            <div className="flex items-center gap-3">
              <Button 
                variant={dataOnlyView ? "default" : "outline"}
                size="sm"
                onClick={() => setDataOnlyView(true)}
                className="h-8 px-3 text-xs"
              >
                <ToggleRight className="h-3 w-3 mr-1" />
                Data Only
              </Button>
              <Button 
                variant={!dataOnlyView ? "default" : "outline"}
                size="sm"
                onClick={() => setDataOnlyView(false)}
                className="h-8 px-3 text-xs"
              >
                <ToggleLeft className="h-3 w-3 mr-1" />
                Full Calendar
              </Button>
            </div>

            {/* Action Buttons */}
          <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleAdvancedFilters}
                className="h-8 px-4 border-2 border-gray-200 hover:border-purple-500 transition-colors duration-200 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white/90 text-xs"
              >
              <Filter className="h-3 w-3 mr-1" />
              Filters
            </Button>
              <Button 
                onClick={handleExportReport}
                className="h-8 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-xs"
              >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
          <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-gray-200">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                <Filter className="h-4 w-4 text-gray-700" />
                Report Filters
              </CardTitle>
            </CardHeader>
          <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType" className="text-gray-700 font-medium text-xs">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="h-8 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-lg text-xs">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                    <SelectContent className="rounded-lg border-2">
                    <SelectItem value="overview">Business Overview</SelectItem>
                    <SelectItem value="revenue">Revenue Analysis</SelectItem>
                    <SelectItem value="appointments">Appointment Statistics</SelectItem>
                    <SelectItem value="patients">Patient Demographics</SelectItem>
                    <SelectItem value="inventory">Inventory Usage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                <div className="space-y-2">
                  <Label htmlFor="dateRange" className="text-gray-700 font-medium text-xs">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="h-8 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-lg text-xs">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                    <SelectContent className="rounded-lg border-2">
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="this-quarter">This Quarter</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-gray-700 font-medium text-xs">Start Date</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    className="h-8 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-lg text-xs"
                  />
              </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-gray-700 font-medium text-xs">End Date</Label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    className="h-8 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-lg text-xs"
                  />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {quickStats.map((stat) => {
            const Icon = stat.icon
            return (
                <Card key={stat.label} className="rounded-xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{stat.label}</p>
                        <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs font-semibold px-1 py-0.5 rounded-full text-green-600 bg-green-50">
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 shadow-sm">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Revenue Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  <BarChart3 className="h-4 w-4 text-gray-700" />
                Daily Revenue Trend
              </CardTitle>
            </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {reportData.revenue.daily.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      {dataOnlyView ? "No revenue data for selected period" : "No data available"}
                    </div>
                  ) : (
                    reportData.revenue.daily.map((day: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg hover:from-gray-100 hover:to-blue-100 transition-all duration-300 border border-gray-200 hover:border-blue-300">
                        <span className="text-xs font-semibold text-gray-900">{day.date}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full shadow-sm transition-all duration-300"
                              style={{ width: `${(day.amount / 2500) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold w-16 text-right text-gray-900">KSH {day.amount}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  <TrendingUp className="h-4 w-4 text-gray-700" />
                Monthly Revenue
              </CardTitle>
            </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {reportData.revenue.monthly.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      {dataOnlyView ? "No revenue data for selected period" : "No data available"}
                    </div>
                  ) : (
                    reportData.revenue.monthly.map((month: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg hover:from-gray-100 hover:to-green-100 transition-all duration-300 border border-gray-200 hover:border-green-300">
                        <span className="text-xs font-semibold text-gray-900">{month.month} {month.year}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full shadow-sm transition-all duration-300"
                              style={{ width: `${(month.amount / 40000) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold w-20 text-right text-gray-900">KSH {month.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Appointment Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  <Users className="h-4 w-4 text-gray-700" />
                  Performance by Dentist
                </CardTitle>
            </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                {reportData.appointments.byDentist.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      {dataOnlyView ? "No appointment data for selected period" : "No data available"}
                    </div>
                  ) : (
                    reportData.appointments.byDentist.map((dentist: any, index: number) => (
                      <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg hover:from-gray-100 hover:to-purple-100 transition-all duration-300 border border-gray-200 hover:border-purple-300 hover:shadow-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-sm text-gray-900">{dentist.dentist}</h3>
                          <Badge variant="outline" className="px-2 py-0.5 rounded-full font-medium bg-white/80 backdrop-blur-sm text-xs">
                            {dentist.count} appointments
                          </Badge>
                      </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-600 font-medium">Revenue Generated</span>
                          <span className="font-bold text-sm text-gray-900">KSH {dentist.revenue.toLocaleString()}</span>
                      </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full shadow-sm transition-all duration-300"
                          style={{ width: `${(dentist.revenue / 10000) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

            <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  <BarChart3 className="h-4 w-4 text-gray-700" />
                  Treatment Breakdown
                </CardTitle>
            </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                {reportData.appointments.byTreatment.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      {dataOnlyView ? "No treatment data for selected period" : "No data available"}
                    </div>
                  ) : (
                    reportData.appointments.byTreatment.map((treatment: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-lg hover:from-gray-100 hover:to-orange-100 transition-all duration-300 border border-gray-200 hover:border-orange-300 hover:shadow-lg">
                      <div>
                          <p className="font-semibold text-sm text-gray-900">{treatment.treatment}</p>
                          <p className="text-xs text-gray-600 font-medium">{treatment.count} procedures</p>
                      </div>
                      <div className="text-right">
                          <p className="font-bold text-sm text-gray-900">KSH {treatment.revenue.toLocaleString()}</p>
                          <p className="text-xs text-gray-600 font-medium">KSH {Math.round(treatment.revenue / treatment.count)} avg</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Demographics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  <Users className="h-4 w-4 text-gray-700" />
                  New Patient Acquisition
                </CardTitle>
            </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {reportData.patients.newPatients.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      {dataOnlyView ? "No new patient data for selected period" : "No data available"}
                    </div>
                  ) : (
                    reportData.patients.newPatients.map((month: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-lg hover:from-gray-100 hover:to-indigo-100 transition-all duration-300 border border-gray-200 hover:border-indigo-300">
                        <span className="text-xs font-semibold text-gray-900">{month.month} {month.year}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full shadow-sm transition-all duration-300"
                              style={{ width: `${(month.count / 40) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold w-8 text-right text-gray-900">{month.count}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  <Users className="h-4 w-4 text-gray-700" />
                  Patient Age Demographics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {reportData.patients.demographics.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      {dataOnlyView ? "No demographic data available" : "No data available"}
                    </div>
                  ) : (
                    reportData.patients.demographics.map((demo: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-teal-50 rounded-lg hover:from-gray-100 hover:to-teal-100 transition-all duration-300 border border-gray-200 hover:border-teal-300 hover:shadow-lg">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{demo.ageGroup} years</p>
                          <p className="text-xs text-gray-600 font-medium">{demo.count} patients</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-16 bg-gray-200 rounded-full h-2 shadow-inner">
                            <div 
                              className="bg-gradient-to-r from-teal-500 to-cyan-600 h-2 rounded-full shadow-sm transition-all duration-300" 
                              style={{ width: `${demo.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold w-8 text-right text-gray-900">{demo.percentage}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Export Options */}
          <Card className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-gray-200">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                <Download className="h-4 w-4 text-gray-700" />
                Export & Sharing
              </CardTitle>
          </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2 bg-gradient-to-r from-gray-50 to-blue-50 hover:from-gray-100 hover:to-blue-100 border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 rounded-lg hover:shadow-lg text-xs" 
                  onClick={handleExportPDF}
                >
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Export PDF</span>
              </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2 bg-gradient-to-r from-gray-50 to-green-50 hover:from-gray-100 hover:to-green-100 border-2 border-gray-200 hover:border-green-400 transition-all duration-300 rounded-lg hover:shadow-lg text-xs" 
                  onClick={handleExportExcel}
                >
                  <Download className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-gray-900">Export Excel</span>
              </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2 bg-gradient-to-r from-gray-50 to-purple-50 hover:from-gray-100 hover:to-purple-100 border-2 border-gray-200 hover:border-purple-400 transition-all duration-300 rounded-lg hover:shadow-lg text-xs" 
                  onClick={handleExportCSV}
                >
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">Export CSV</span>
              </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2 bg-gradient-to-r from-gray-50 to-orange-50 hover:from-gray-100 hover:to-orange-100 border-2 border-gray-200 hover:border-orange-400 transition-all duration-300 rounded-lg hover:shadow-lg text-xs" 
                  onClick={handlePrintCharts}
                >
                  <Printer className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold text-gray-900">Print Charts</span>
              </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2 bg-gradient-to-r from-gray-50 to-red-50 hover:from-gray-100 hover:to-red-100 border-2 border-gray-200 hover:border-red-400 transition-all duration-300 rounded-lg hover:shadow-lg text-xs" 
                  onClick={handleScheduleReport}
                >
                  <Clock className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-gray-900">Schedule Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </MainLayout>
  )
}
