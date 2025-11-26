"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Plus,
  DollarSign,
  FileText,
  Calendar,
  User,
  Edit,
  Eye,
  Download,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Printer,
} from "lucide-react"

const invoices = [
  {
    id: "INV-001",
    patientId: "P001",
    patientName: "Sarah Johnson",
    patientPhone: "+1 (555) 123-4567",
    date: "2024-01-15",
    dueDate: "2024-02-14",
    treatments: [
      { name: "Routine Cleaning", code: "D1110", quantity: 1, unitPrice: 120.0 },
      { name: "Fluoride Treatment", code: "D1208", quantity: 1, unitPrice: 45.0 },
    ],
    subtotal: 165.0,
    tax: 13.2,
    total: 178.2,
    amountPaid: 178.2,
    balance: 0.0,
    status: "Paid",
    paymentMethod: "Credit Card",
    insuranceClaim: "BC123456789",
    notes: "Insurance covered 80%",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "INV-002",
    patientId: "P002",
    patientName: "Michael Chen",
    patientPhone: "+1 (555) 234-5678",
    date: "2024-01-18",
    dueDate: "2024-02-17",
    treatments: [
      { name: "Root Canal Therapy", code: "D3310", quantity: 1, unitPrice: 1200.0 },
      { name: "Crown Placement", code: "D2740", quantity: 1, unitPrice: 800.0 },
    ],
    subtotal: 2000.0,
    tax: 160.0,
    total: 2160.0,
    amountPaid: 1160.0,
    balance: 1000.0,
    status: "Partial",
    paymentMethod: "Insurance + Cash",
    insuranceClaim: "AE987654321",
    notes: "Payment plan arranged for remaining balance",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "INV-003",
    patientId: "P003",
    patientName: "Emily Rodriguez",
    patientPhone: "+1 (555) 345-6789",
    date: "2024-01-20",
    dueDate: "2024-02-19",
    treatments: [
      { name: "Consultation", code: "D0150", quantity: 1, unitPrice: 85.0 },
      { name: "X-Ray", code: "D0220", quantity: 2, unitPrice: 45.0 },
    ],
    subtotal: 175.0,
    tax: 14.0,
    total: 189.0,
    amountPaid: 0.0,
    balance: 189.0,
    status: "Pending",
    paymentMethod: null,
    insuranceClaim: "CG456789123",
    notes: "Waiting for insurance approval",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "INV-004",
    patientId: "P004",
    patientName: "David Thompson",
    patientPhone: "+1 (555) 456-7890",
    date: "2024-01-22",
    dueDate: "2024-01-22",
    treatments: [
      { name: "Tooth Extraction", code: "D7140", quantity: 1, unitPrice: 250.0 },
      { name: "Pain Management", code: "D9110", quantity: 1, unitPrice: 75.0 },
    ],
    subtotal: 325.0,
    tax: 26.0,
    total: 351.0,
    amountPaid: 0.0,
    balance: 351.0,
    status: "Overdue",
    paymentMethod: null,
    insuranceClaim: "ML789123456",
    notes: "Patient contacted for payment",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

export default function ReceptionistInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false)

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.patientPhone.includes(searchTerm)
    const matchesFilter = filterStatus === "all" || invoice.status.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <CheckCircle className="h-4 w-4" />
      case "partial":
        return <Clock className="h-4 w-4" />
      case "pending":
        return <AlertCircle className="h-4 w-4" />
      case "overdue":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0)
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0)
  const overdueCount = invoices.filter((inv) => inv.status === "Overdue").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-muted-foreground">Manage patient billing and payments</p>
        </div>
        <Dialog open={isCreateInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient">Patient</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P001">Sarah Johnson</SelectItem>
                      <SelectItem value="P002">Michael Chen</SelectItem>
                      <SelectItem value="P003">Emily Rodriguez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Invoice Date</Label>
                  <Input id="date" type="date" />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Treatments & Services</Label>
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-5 gap-2 text-sm font-medium text-muted-foreground">
                    <div>Treatment</div>
                    <div>Code</div>
                    <div>Qty</div>
                    <div>Unit Price</div>
                    <div>Total</div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select treatment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cleaning">Routine Cleaning</SelectItem>
                        <SelectItem value="filling">Filling</SelectItem>
                        <SelectItem value="crown">Crown</SelectItem>
                        <SelectItem value="extraction">Extraction</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="D1110" />
                    <Input type="number" placeholder="1" />
                    <Input type="number" placeholder="120.00" />
                    <Input placeholder="120.00" disabled />
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Treatment
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subtotal">Subtotal</Label>
                  <Input id="subtotal" placeholder="0.00" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax">Tax</Label>
                  <Input id="tax" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total</Label>
                  <Input id="total" placeholder="0.00" disabled className="font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Additional notes or payment instructions" />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateInvoiceOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateInvoiceOpen(false)}>Create Invoice</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Amount Paid</p>
                <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-orange-600">${totalOutstanding.toFixed(2)}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search invoices by patient name, invoice ID, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <div className="grid gap-4">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={invoice.avatar || "/placeholder.svg"} alt={invoice.patientName} />
                    <AvatarFallback>
                      {invoice.patientName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{invoice.patientName}</h3>
                      <Badge className={getStatusColor(invoice.status)}>
                        {getStatusIcon(invoice.status)}
                        <span className="ml-1">{invoice.status}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {invoice.id}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {invoice.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {invoice.patientPhone}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                    <div className="text-xl font-bold">${invoice.total.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Paid: ${invoice.amountPaid.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Balance</div>
                    <div className={`text-xl font-bold ${invoice.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                      ${invoice.balance.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Due: {invoice.dueDate}</div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Invoice Details - {invoice.id}</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="details" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="details">Invoice Details</TabsTrigger>
                            <TabsTrigger value="treatments">Treatments</TabsTrigger>
                            <TabsTrigger value="payments">Payment History</TabsTrigger>
                          </TabsList>
                          <TabsContent value="details" className="space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Patient Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div>
                                    <strong>Name:</strong> {invoice.patientName}
                                  </div>
                                  <div>
                                    <strong>Phone:</strong> {invoice.patientPhone}
                                  </div>
                                  <div>
                                    <strong>Patient ID:</strong> {invoice.patientId}
                                  </div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Invoice Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div>
                                    <strong>Invoice ID:</strong> {invoice.id}
                                  </div>
                                  <div>
                                    <strong>Date:</strong> {invoice.date}
                                  </div>
                                  <div>
                                    <strong>Due Date:</strong> {invoice.dueDate}
                                  </div>
                                  <div>
                                    <strong>Status:</strong>
                                    <Badge className={`ml-2 ${getStatusColor(invoice.status)}`}>{invoice.status}</Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">Financial Summary</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Subtotal:</span>
                                  <span>${invoice.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Tax:</span>
                                  <span>${invoice.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                  <span>Total:</span>
                                  <span>${invoice.total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                  <span>Amount Paid:</span>
                                  <span>${invoice.amountPaid.toFixed(2)}</span>
                                </div>
                                <div
                                  className={`flex justify-between font-bold ${invoice.balance > 0 ? "text-red-600" : "text-green-600"}`}
                                >
                                  <span>Balance:</span>
                                  <span>${invoice.balance.toFixed(2)}</span>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>
                          <TabsContent value="treatments" className="space-y-4">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">Treatment Details</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  {invoice.treatments.map((treatment, index) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                                    >
                                      <div>
                                        <div className="font-medium">{treatment.name}</div>
                                        <div className="text-sm text-muted-foreground">Code: {treatment.code}</div>
                                      </div>
                                      <div className="text-right">
                                        <div>Qty: {treatment.quantity}</div>
                                        <div className="font-medium">
                                          ${(treatment.quantity * treatment.unitPrice).toFixed(2)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>
                          <TabsContent value="payments" className="space-y-4">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">Payment Information</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div>
                                  <strong>Payment Method:</strong> {invoice.paymentMethod || "Not specified"}
                                </div>
                                <div>
                                  <strong>Insurance Claim:</strong> {invoice.insuranceClaim}
                                </div>
                                {invoice.notes && (
                                  <div>
                                    <strong>Notes:</strong> {invoice.notes}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-1" />
                      Print
                    </Button>
                    {invoice.balance > 0 && (
                      <Button size="sm">
                        <CreditCard className="h-4 w-4 mr-1" />
                        Payment
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInvoices.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
              <p>Try adjusting your search criteria or create a new invoice.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
