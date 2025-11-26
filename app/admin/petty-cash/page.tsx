"use client"

import type React from "react"

import { useState } from "react"
import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Filter, DollarSign, Receipt, Calendar, Upload, Eye, Download } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const pettyCashEntries = [
  {
    id: 1,
    date: "2024-01-15",
    time: "10:30 AM",
    amount: 45.5,
    category: "Office Supplies",
    reason: "Printer paper and pens",
    recordedBy: "Reception Staff",
    receipt: "receipt_001.jpg",
    status: "approved",
  },
  {
    id: 2,
    date: "2024-01-14",
    time: "02:15 PM",
    amount: 25.0,
    category: "Refreshments",
    reason: "Coffee and snacks for waiting area",
    recordedBy: "Dr. Smith",
    receipt: null,
    status: "pending",
  },
  {
    id: 3,
    date: "2024-01-13",
    time: "11:45 AM",
    amount: 120.0,
    category: "Equipment Maintenance",
    reason: "Emergency repair for dental chair",
    recordedBy: "Admin",
    receipt: "repair_receipt.pdf",
    status: "approved",
  },
  {
    id: 4,
    date: "2024-01-12",
    time: "09:20 AM",
    amount: 15.75,
    category: "Cleaning Supplies",
    reason: "Disinfectant and cleaning cloths",
    recordedBy: "Reception Staff",
    receipt: "cleaning_receipt.jpg",
    status: "approved",
  },
  {
    id: 5,
    date: "2024-01-11",
    time: "03:30 PM",
    amount: 80.0,
    category: "Utilities",
    reason: "Emergency plumber call",
    recordedBy: "Admin",
    receipt: "plumber_bill.pdf",
    status: "rejected",
  },
]

const categories = [
  "Office Supplies",
  "Refreshments",
  "Equipment Maintenance",
  "Cleaning Supplies",
  "Utilities",
  "Transportation",
  "Miscellaneous",
]

export default function PettyCashPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedEntry, setSelectedEntry] = useState<any>(null)

  // Add these state variables:
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "",
    date: "",
    time: "",
    reason: "",
    recordedBy: "",
  })

  // Add form handlers:
  const handleExpenseFormChange = (field: string, value: string) => {
    setExpenseForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleRecordExpense = () => {
    console.log("Recording expense:", expenseForm)
    alert("Expense recorded successfully!")
    setIsAddExpenseDialogOpen(false)
    setExpenseForm({
      amount: "",
      category: "",
      date: "",
      time: "",
      reason: "",
      recordedBy: "",
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      alert(`${files.length} receipt(s) uploaded successfully`)
    }
  }

  const handleApproveExpense = (entry: any) => {
    if (confirm(`Approve expense of $${entry.amount} for ${entry.reason}?`)) {
      alert("Expense approved successfully!")
    }
  }

  const handleRejectExpense = (entry: any) => {
    if (confirm(`Reject expense of $${entry.amount} for ${entry.reason}?`)) {
      alert("Expense rejected")
    }
  }

  const handleExportReport = () => {
    alert("Exporting monthly petty cash report...")
  }

  const handleViewReceipts = () => {
    alert("Opening receipts gallery...")
  }

  const handleSetBudget = () => {
    const budget = prompt("Enter monthly budget limit:")
    if (budget) {
      alert(`Monthly budget set to $${budget}`)
    }
  }

  const filteredEntries = pettyCashEntries.filter((entry) => {
    const matchesSearch =
      entry.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const totalExpenses = pettyCashEntries
    .filter((e) => e.status === "approved")
    .reduce((sum, entry) => sum + entry.amount, 0)
  const pendingAmount = pettyCashEntries
    .filter((e) => e.status === "pending")
    .reduce((sum, entry) => sum + entry.amount, 0)
  const thisMonthExpenses = pettyCashEntries
    .filter((e) => e.date.startsWith("2024-01"))
    .reduce((sum, entry) => sum + entry.amount, 0)

  // Category breakdown
  const categoryTotals = categories
    .map((category) => {
      const total = pettyCashEntries
        .filter((entry) => entry.category === category && entry.status === "approved")
        .reduce((sum, entry) => sum + entry.amount, 0)
      return { category, total }
    })
    .filter((item) => item.total > 0)

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Petty Cash Management</h1>
            <p className="text-gray-600">Track and manage small expenses and petty cash usage</p>
          </div>
          <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record New Expense</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => handleExpenseFormChange("amount", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={expenseForm.category}
                    onValueChange={(value) => handleExpenseFormChange("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => handleExpenseFormChange("date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={expenseForm.time}
                    onChange={(e) => handleExpenseFormChange("time", e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="reason">Reason/Description</Label>
                  <Textarea
                    id="reason"
                    placeholder="Describe what the expense was for"
                    value={expenseForm.reason}
                    onChange={(e) => handleExpenseFormChange("reason", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recordedBy">Recorded By</Label>
                  <Input
                    id="recordedBy"
                    placeholder="Your name"
                    value={expenseForm.recordedBy}
                    onChange={(e) => handleExpenseFormChange("recordedBy", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receipt">Receipt (Optional)</Label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer"
                    onClick={() => document.getElementById("receiptInput")?.click()}
                  >
                    <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Upload receipt image or PDF</p>
                    <Input
                      id="receiptInput"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddExpenseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRecordExpense}>Record Expense</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Total Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Receipt className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{pettyCashEntries.length}</p>
                  <p className="text-sm text-gray-600">Total Entries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">${thisMonthExpenses.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">${pendingAmount.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Pending Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search expenses by reason or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expense Entries */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses ({filteredEntries.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredEntries.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="font-bold text-sm">{entry.date}</p>
                            <p className="text-xs text-gray-500">{entry.time}</p>
                          </div>
                          <div>
                            <h3 className="font-medium text-lg">${entry.amount.toFixed(2)}</h3>
                            <p className="text-sm text-gray-600">{entry.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(entry.status)}>{entry.status}</Badge>
                          {entry.receipt && (
                            <Badge variant="outline">
                              <Receipt className="h-3 w-3 mr-1" />
                              Receipt
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700">Reason:</p>
                        <p className="text-sm text-gray-600">{entry.reason}</p>
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Recorded by: {entry.recordedBy}</p>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedEntry(entry)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {entry.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleRejectExpense(entry)}>
                                Reject
                              </Button>
                              <Button size="sm" onClick={() => handleApproveExpense(entry)}>
                                Approve
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryTotals.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.category}</p>
                        <p className="text-xs text-gray-600">
                          {
                            pettyCashEntries.filter((e) => e.category === item.category && e.status === "approved")
                              .length
                          }{" "}
                          expenses
                        </p>
                      </div>
                      <p className="font-bold">${item.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" onClick={handleExportReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Monthly Report
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={handleViewReceipts}>
                  <Receipt className="h-4 w-4 mr-2" />
                  View All Receipts
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={handleSetBudget}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Set Budget Limits
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Entry Details Modal */}
        {selectedEntry && (
          <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Expense Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Amount</p>
                    <p className="text-lg font-bold">${selectedEntry.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <Badge className={getStatusColor(selectedEntry.status)}>{selectedEntry.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Date & Time</p>
                    <p className="text-sm">
                      {selectedEntry.date} at {selectedEntry.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Category</p>
                    <p className="text-sm">{selectedEntry.category}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Reason/Description</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedEntry.reason}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Recorded By</p>
                  <p className="text-sm">{selectedEntry.recordedBy}</p>
                </div>

                {selectedEntry.receipt && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Receipt</p>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Receipt className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">{selectedEntry.receipt}</span>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3">
                {selectedEntry.status === "pending" && (
                  <>
                    <Button variant="outline">Reject</Button>
                    <Button>Approve</Button>
                  </>
                )}
                <Button variant="outline">Edit</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MainLayout>
  )
}
