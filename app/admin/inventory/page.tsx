"use client"

import { useState, useEffect, useMemo } from "react"
import api from "@/lib/axiosConfig"
import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Filter, Package, AlertTriangle, TrendingDown, Edit, Eye, TrendingUp, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight, MoreHorizontal, Download, Upload, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

// Force dynamic rendering to avoid build-time environment variable issues
export const dynamic = 'force-dynamic'

import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { debounce } from 'lodash'

// Configure dayjs plugins
dayjs.extend(relativeTime)


export default function InventoryPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expiryFilter, setExpiryFilter] = useState("all")
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"inventory" | "requisitions">("inventory")
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  const [isRequisitionDialogOpen, setIsRequisitionDialogOpen] = useState(false)
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false)
  const [restockItem, setRestockItem] = useState<any>(null)
  const [restockQuantity, setRestockQuantity] = useState("")
  const [isDeleteItemDialogOpen, setIsDeleteItemDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any>(null)
  const [isDeleteRequisitionDialogOpen, setIsDeleteRequisitionDialogOpen] = useState(false)
  const [requisitionToDelete, setRequisitionToDelete] = useState<any>(null)
  
  const [itemForm, setItemForm] = useState({
    name: "",
    category: "",
    currentStock: "",
    minStock: "",
    maxStock: "",
    unitPrice: "",
    supplier: "",
    expiryDate: "",
  })
  const [requisitionForm, setRequisitionForm] = useState({
    requestedBy: "",
    priority: "",
    items: [{ item: "", quantity: "" }],
    notes: "",
  })
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [requisitions, setRequisitions] = useState<any[]>([])

  // Calculate item status
  const getItemStatus = (item: any) => {
    if (item.current_stock <= 0) return "out"
    if (item.current_stock <= item.min_stock) return "low"
    
    // Check if expiring soon
    if (item.expiry_date) {
      const today = new Date()
      const expiry = new Date(item.expiry_date)
      const diffTime = expiry.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays <= 90 && diffDays > 0) return "expiring"
      if (diffDays <= 0) return "expired"
    }
    
    return "good"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-100 text-green-800 border-green-200"
      case "low":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "out":
        return "bg-red-100 text-red-800 border-red-200"
      case "expiring":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "expired":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "low":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "out":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "expiring":
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case "expired":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: itemsPerPage.toString(),
          ...(searchTerm && { searchTerm }),
          ...(categoryFilter !== 'all' && { categoryFilter }),
          ...(statusFilter !== 'all' && { statusFilter }),
          ...(expiryFilter !== 'all' && { expiryFilter })
        })

        const response = await api.get('/inventory', {
          params: Object.fromEntries(params)
        })

        if (!response.data.success) {
          toast({
            title: "Error",
            description: response.data.error || "Failed to fetch inventory items",
            variant: "destructive",
          })
          return
        }

        setInventoryItems(response.data.inventory || [])
        setTotalItems(response.data.totalCount || 0)
      } catch (error) {
        console.error('Error fetching inventory:', error)
        toast({
          title: "Error",
          description: "Failed to fetch inventory items",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()
  }, [searchTerm, categoryFilter, statusFilter, expiryFilter, currentPage, itemsPerPage, toast])

  useEffect(() => {
    const fetchRequisitions = async () => {
      try {
        const response = await api.get('/requisitions')

        if (!response.data.success) {
          console.error('Error fetching requisitions:', response.data.error)
          setRequisitions([])
          return
        }

        setRequisitions(response.data.requisitions || [])
      } catch (error) {
        console.error('Error fetching requisitions:', error)
        setRequisitions([])
      }
    }
    
    fetchRequisitions()
  }, [])

  // Add/edit/restock/requisition handlers
  const handleItemFormChange = (field: string, value: string) => {
    setItemForm((prev) => ({ ...prev, [field]: value }))
  }
  const handleRequisitionFormChange = (field: string, value: any) => {
    setRequisitionForm((prev) => ({ ...prev, [field]: value }))
  }
  const handleAddItem = async () => {
    // Validate required fields
    if (!itemForm.name || !itemForm.category || !itemForm.currentStock || !itemForm.minStock || !itemForm.maxStock || !itemForm.unitPrice) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/inventory', {
        action: 'create',
        itemData: {
          name: itemForm.name,
          category: itemForm.category,
          currentStock: itemForm.currentStock,
          minStock: itemForm.minStock,
          maxStock: itemForm.maxStock,
          unitPrice: itemForm.unitPrice,
          supplier: itemForm.supplier,
          expiryDate: itemForm.expiryDate || null,
        }
      })

      if (!response.data.success) {
        toast({
          title: "Error",
          description: response.data.error || "Failed to add inventory item",
          variant: "destructive",
        })
        return
      }

      // Add to local state immediately
      setInventoryItems(prevItems => [response.data.item, ...prevItems])

      setIsAddItemDialogOpen(false)
      setItemForm({
        name: "",
        category: "",
        currentStock: "",
        minStock: "",
        maxStock: "",
        unitPrice: "",
        supplier: "",
        expiryDate: "",
      })
      
      toast({
        title: "Success",
        description: "Inventory item added successfully!",
      })
    } catch (error) {
      console.error('Error adding inventory item:', error)
      toast({
        title: "Error",
        description: "Failed to add inventory item",
        variant: "destructive",
      })
    }
    setLoading(false)
  }
  const handleRestockItem = async (item: any) => {
    setRestockItem(item)
    setRestockQuantity("")
    setIsRestockDialogOpen(true)
  }

  const handleConfirmRestock = async () => {
    if (!restockItem || !restockQuantity || isNaN(Number(restockQuantity))) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/inventory', {
        action: 'restock',
        itemData: {
          id: restockItem.id,
          currentStock: restockItem.current_stock,
          restockQuantity: restockQuantity
        }
      })

      if (!response.data.success) {
        toast({
          title: "Error",
          description: response.data.error || "Failed to restock item",
          variant: "destructive",
        })
        return
      }

      // Update local state immediately
      setInventoryItems(prevItems => prevItems.map(invItem =>
        invItem.id === restockItem.id ? response.data.item : invItem
      ))

      toast({
        title: "Success",
        description: `Successfully restocked ${restockItem.name} with ${restockQuantity} units!`,
      })

      setIsRestockDialogOpen(false)
      setRestockItem(null)
      setRestockQuantity("")
    } catch (error) {
      console.error('Error restocking item:', error)
      toast({
        title: "Error",
        description: "Failed to restock item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  const handleSubmitRequisition = async () => {
    // Validate required fields
    if (!requisitionForm.requestedBy || !requisitionForm.priority) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields for requisition.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/requisitions', {
        action: 'create',
        requisitionData: {
          requestedBy: requisitionForm.requestedBy,
          priority: requisitionForm.priority,
          notes: requisitionForm.notes,
          items: requisitionForm.items
        }
      })

      if (!response.data.success) {
        toast({
          title: "Error",
          description: response.data.error || "Failed to create requisition",
          variant: "destructive",
        })
        return
      }

      // Update local state immediately
      setRequisitions(prev => [{ ...response.data.requisition, items: requisitionForm.items }, ...prev])

      setIsRequisitionDialogOpen(false)
      setRequisitionForm({
        requestedBy: "",
        priority: "",
        items: [{ item: "", quantity: "" }],
        notes: "",
      })
      
      toast({
        title: "Success",
        description: "Requisition created successfully!",
      })
    } catch (error) {
      console.error('Error creating requisition:', error)
      toast({
        title: "Error",
        description: "Failed to create requisition",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  const handleApproveRequisition = async (req: any) => {
    try {
      const response = await api.post('/requisitions', {
        action: 'approve',
        requisitionData: {
          id: req.id
        }
      })

      if (!response.data.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to approve requisition",
          variant: "destructive",
        })
        return
      }

      // Update local state immediately
      setRequisitions(prev =>
        prev.map(r =>
          r.id === req.id ? { ...r, status: 'approved', approved_by: 'Admin' } : r
        )
      )

      toast({
        title: "Success",
        description: "Requisition approved successfully!",
      })
    } catch (error) {
      console.error('Error approving requisition:', error)
      toast({
        title: "Error",
        description: "Failed to approve requisition",
        variant: "destructive",
      })
    }
  }
  const handleRejectRequisition = async (req: any) => {
    try {
      const response = await api.post('/requisitions', {
        action: 'reject',
        requisitionData: {
          id: req.id
        }
      })

      if (!response.data.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to reject requisition",
          variant: "destructive",
        })
        return
      }

      // Update local state immediately
      setRequisitions(prev =>
        prev.map(r =>
          r.id === req.id ? { ...r, status: 'rejected' } : r
        )
      )

      toast({
        title: "Success",
        description: "Requisition rejected successfully!",
      })
    } catch (error) {
      console.error('Error rejecting requisition:', error)
      toast({
        title: "Error",
        description: "Failed to reject requisition",
        variant: "destructive",
      })
    }
  }

  // Dynamic stats and change calculations
  const now = dayjs()
  const startOfThisMonth = now.startOf('month')
  const startOfLastMonth = startOfThisMonth.subtract(1, 'month')
  const endOfLastMonth = startOfThisMonth.subtract(1, 'day')
  
  // Use created_at with fallback to inserted_at if created_at doesn't exist
  const itemsThisMonth = inventoryItems.filter(item => {
    const itemDate = item.created_at || item.inserted_at
    return itemDate && dayjs(itemDate).isAfter(startOfThisMonth.subtract(1, 'day'))
  })
  const itemsLastMonth = inventoryItems.filter(item => {
    const itemDate = item.created_at || item.inserted_at
    return itemDate && 
      dayjs(itemDate).isAfter(startOfLastMonth.subtract(1, 'day')) &&
      dayjs(itemDate).isBefore(endOfLastMonth.add(1, 'day'))
  })
  
  const totalItemsCount = totalItems
  const totalItemsLast = itemsLastMonth.length
  const totalItemsChange = totalItemsLast === 0 ? 0 : ((totalItemsCount - totalItemsLast) / totalItemsLast) * 100
  
  const lowStockItems = inventoryItems.filter((item) => getItemStatus(item) === 'low').length
  const lowStockLast = itemsLastMonth.filter((item) => getItemStatus(item) === 'low').length
  const lowStockChange = lowStockLast === 0 ? 0 : ((lowStockItems - lowStockLast) / lowStockLast) * 100
  
  const expiringItems = inventoryItems.filter((item) => getItemStatus(item) === 'expiring').length
  const expiringLast = itemsLastMonth.filter((item) => getItemStatus(item) === 'expiring').length
  const expiringChange = expiringLast === 0 ? 0 : ((expiringItems - expiringLast) / expiringLast) * 100
  
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.current_stock * item.unit_price), 0)
  const totalValueLast = itemsLastMonth.reduce((sum, item) => sum + (item.current_stock * item.unit_price), 0)
  const totalValueChange = totalValueLast === 0 ? 0 : ((totalValue - totalValueLast) / totalValueLast) * 100

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchTerm(value)
      setCurrentPage(1) // Reset to first page when searching
    }, 300),
    []
  )

  // Pagination helpers
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Bulk actions
  const handleBulkRestock = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select items to restock",
        variant: "destructive",
      })
      return
    }

    const quantity = prompt("Enter restock quantity for all selected items:")
    if (quantity && !isNaN(Number(quantity))) {
      setLoading(true)
      try {
        const selectedItemsData = Array.from(selectedItems).map(itemId => {
          const item = inventoryItems.find(i => i.id === itemId)
          return {
            id: itemId,
            currentStock: item?.current_stock || 0,
            restockQuantity: quantity
          }
        })

        const response = await api.post('/inventory', {
          action: 'bulkRestock',
          itemData: {
            items: selectedItemsData
          }
        })

        if (!response.data.success) {
          toast({
            title: "Error",
            description: response.data.error || "Failed to bulk restock items",
            variant: "destructive",
          })
          return
        }

        // Update local state
        setInventoryItems(prevItems => 
          prevItems.map(item => {
            const updatedItem = response.data.items?.find((i: any) => i.id === item.id)
            return updatedItem || item
          })
        )

        setSelectedItems(new Set())
        toast({
          title: "Success",
          description: `Restocked ${selectedItems.size} items with ${quantity} units each`,
        })
      } catch (error) {
        console.error('Error bulk restocking items:', error)
        toast({
          title: "Error",
          description: "Failed to restock some items",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSelectAll = () => {
    if (selectedItems.size === inventoryItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(inventoryItems.map(item => item.id)))
    }
  }

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleDeleteItem = (item: any) => {
    setItemToDelete(item)
    setIsDeleteItemDialogOpen(true)
  }

  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return

    setLoading(true)
    try {
      const response = await api.post('/inventory', {
        action: 'delete',
        itemData: {
          id: itemToDelete.id
        }
      })

      if (!response.data.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to delete inventory item",
          variant: "destructive",
        })
        return
      }

      // Remove from local state
      setInventoryItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id))

      toast({
        title: "Success",
        description: "Inventory item deleted successfully!",
      })

      setIsDeleteItemDialogOpen(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Error deleting inventory item:', error)
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRequisition = (req: any) => {
    setRequisitionToDelete(req)
    setIsDeleteRequisitionDialogOpen(true)
  }

  const handleConfirmDeleteRequisition = async () => {
    if (!requisitionToDelete) return

    setLoading(true)
    try {
      const response = await api.post('/requisitions', {
        action: 'delete',
        requisitionData: {
          id: requisitionToDelete.id
        }
      })

      if (!response.data.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to delete requisition",
          variant: "destructive",
        })
        return
      }

      // Remove from local state
      setRequisitions(prevReqs => prevReqs.filter(req => req.id !== requisitionToDelete.id))

      toast({
        title: "Success",
        description: "Requisition deleted successfully!",
      })

      setIsDeleteRequisitionDialogOpen(false)
      setRequisitionToDelete(null)
    } catch (error) {
      console.error('Error deleting requisition:', error)
      toast({
        title: "Error",
        description: "Failed to delete requisition",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-6 space-y-6">
        {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
              Inventory Management
            </h1>
            <p className="text-gray-600 text-lg">Track supplies, equipment, and manage stock levels</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}
                className="h-10 px-4"
              >
                {isStatsCollapsed ? "Show Stats" : "Hide Stats"}
              </Button>
              <Button className="h-10 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Quick Stats - Collapsible */}
          {!isStatsCollapsed && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total Items</p>
                      <p className="text-2xl font-bold text-gray-900">{totalItemsCount}</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        <span className="text-xs font-semibold px-2 py-1 rounded-full text-blue-600 bg-blue-50">
                        {totalItemsChange >= 0 ? `+${totalItemsChange.toFixed(0)}%` : `${totalItemsChange.toFixed(0)}%`}
                      </span>
                    </div>
                  </div>
                    <div className="p-2 rounded-2xl bg-blue-50 shadow-sm">
                      <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Low Stock</p>
                      <p className="text-2xl font-bold text-gray-900">{lowStockItems}</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-5 w-5 text-yellow-500" />
                        <span className="text-xs font-semibold px-2 py-1 rounded-full text-yellow-600 bg-yellow-50">
                        {lowStockChange >= 0 ? `+${lowStockChange.toFixed(0)}%` : `${lowStockChange.toFixed(0)}%`}
                      </span>
                    </div>
                  </div>
                    <div className="p-2 rounded-2xl bg-yellow-50 shadow-sm">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Expiring Soon</p>
                      <p className="text-2xl font-bold text-gray-900">{expiringItems}</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                        <span className="text-xs font-semibold px-2 py-1 rounded-full text-orange-600 bg-orange-50">
                        {expiringChange >= 0 ? `+${expiringChange.toFixed(0)}%` : `${expiringChange.toFixed(0)}%`}
                      </span>
                    </div>
                  </div>
                    <div className="p-2 rounded-2xl bg-orange-50 shadow-sm">
                      <TrendingDown className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total Value</p>
                      <p className="text-2xl font-bold text-gray-900">KSH {totalValue.toLocaleString()}</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <span className="text-xs font-semibold px-2 py-1 rounded-full text-green-600 bg-green-50">
                        {totalValueChange >= 0 ? `+${totalValueChange.toFixed(0)}%` : `${totalValueChange.toFixed(0)}%`}
                      </span>
                    </div>
                  </div>
                    <div className="p-2 rounded-2xl bg-green-50 shadow-sm">
                      <Package className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Controls Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            {/* Tabs */}
            <div className="flex space-x-1 bg-white/80 backdrop-blur-sm p-1 rounded-2xl shadow-lg">
              <button
                onClick={() => setActiveTab("inventory")}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === "inventory" 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                Inventory Items
              </button>
              <button
                onClick={() => setActiveTab("requisitions")}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === "requisitions" 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                Requisitions
              </button>
            </div>

            {/* Action Buttons */}
          <div className="flex gap-3">
            <Dialog open={isRequisitionDialogOpen} onOpenChange={setIsRequisitionDialogOpen}>
              <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="h-12 px-6 border-2 border-gray-200 hover:border-purple-500 transition-colors duration-200 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white/90"
                  >
                  <Plus className="h-4 w-4 mr-2" />
                  New Requisition
                </Button>
              </DialogTrigger>
            </Dialog>
            {/* Add Item Dialog */}
            <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
                <DialogContent className="max-w-2xl rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Add New Inventory Item
                    </DialogTitle>
                </DialogHeader>
                  <div className="grid grid-cols-2 gap-6 py-6">
                    <div className="space-y-3">
                      <Label htmlFor="itemName" className="text-gray-700 font-medium">Item Name</Label>
                    <Input
                      id="itemName"
                      placeholder="Enter item name"
                      value={itemForm.name}
                      onChange={(e) => handleItemFormChange("name", e.target.value)}
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                    />
                  </div>
                    <div className="space-y-3">
                      <Label htmlFor="category" className="text-gray-700 font-medium">Category</Label>
                    <Select
                      value={itemForm.category}
                      onValueChange={(value) => handleItemFormChange("category", value)}
                    >
                        <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                        <SelectContent className="rounded-xl border-2">
                        <SelectItem value="hygiene">Hygiene Supplies</SelectItem>
                        <SelectItem value="restorative">Restorative Materials</SelectItem>
                        <SelectItem value="safety">Safety Equipment</SelectItem>
                        <SelectItem value="medications">Medications</SelectItem>
                        <SelectItem value="instruments">Instruments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                    <div className="space-y-3">
                      <Label htmlFor="currentStock" className="text-gray-700 font-medium">Current Stock</Label>
                    <Input
                      id="currentStock"
                      type="number"
                      placeholder="0"
                      value={itemForm.currentStock}
                      onChange={(e) => handleItemFormChange("currentStock", e.target.value)}
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                    />
                  </div>
                    <div className="space-y-3">
                      <Label htmlFor="minStock" className="text-gray-700 font-medium">Minimum Stock</Label>
                    <Input
                      id="minStock"
                      type="number"
                      placeholder="0"
                      value={itemForm.minStock}
                      onChange={(e) => handleItemFormChange("minStock", e.target.value)}
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                    />
                  </div>
                    <div className="space-y-3">
                      <Label htmlFor="maxStock" className="text-gray-700 font-medium">Maximum Stock</Label>
                    <Input
                      id="maxStock"
                      type="number"
                      placeholder="0"
                      value={itemForm.maxStock}
                      onChange={(e) => handleItemFormChange("maxStock", e.target.value)}
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                    />
                  </div>
                    <div className="space-y-3">
                    <Label htmlFor="unitPrice" className="text-gray-700 font-medium">Unit Price (KSH)</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={itemForm.unitPrice}
                      onChange={(e) => handleItemFormChange("unitPrice", e.target.value)}
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                    />
                  </div>
                    <div className="space-y-3">
                      <Label htmlFor="supplier" className="text-gray-700 font-medium">Supplier</Label>
                    <Input
                      id="supplier"
                      placeholder="Supplier name"
                      value={itemForm.supplier}
                      onChange={(e) => handleItemFormChange("supplier", e.target.value)}
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                    />
                  </div>
                    <div className="space-y-3">
                      <Label htmlFor="expiryDate" className="text-gray-700 font-medium">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={itemForm.expiryDate}
                      onChange={(e) => handleItemFormChange("expiryDate", e.target.value)}
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddItemDialogOpen(false)}
                      className="h-12 px-6 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-xl"
                    >
                    Cancel
                  </Button>
                    <Button 
                      onClick={handleAddItem}
                    disabled={loading}
                      className="h-12 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                    {loading ? "Adding..." : "Add Item"}
                    </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {activeTab === "inventory" && (
          <>
            {/* Filters and Search */}
              <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search inventory items..."
                      onChange={(e) => debouncedSearch(e.target.value)}
                        className="pl-10 h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex gap-3">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-48 h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                      <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="hygiene">Hygiene Supplies</SelectItem>
                        <SelectItem value="restorative">Restorative Materials</SelectItem>
                        <SelectItem value="safety">Safety Equipment</SelectItem>
                        <SelectItem value="medications">Medications</SelectItem>
                        <SelectItem value="instruments">Instruments</SelectItem>
                    </SelectContent>
                  </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40 h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="low">Low Stock</SelectItem>
                        <SelectItem value="out">Out of Stock</SelectItem>
                        <SelectItem value="expiring">Expiring Soon</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={expiryFilter} onValueChange={setExpiryFilter}>
                      <SelectTrigger className="w-40 h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                        <SelectValue placeholder="Expiry" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                        <SelectItem value="all">All Items</SelectItem>
                        <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                      <SelectTrigger className="w-24 h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
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

            {/* Bulk Actions */}
          {selectedItems.size > 0 && (
            <Card className="rounded-2xl border-0 shadow-lg bg-blue-50/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-blue-800">
                      {selectedItems.size} item(s) selected
                    </span>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedItems(new Set())}
                      className="h-8 px-3 text-blue-700 border-blue-300 hover:bg-blue-100"
                    >
                      Clear Selection
                  </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleBulkRestock}
                      className="h-8 px-4 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Bulk Restock
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-4 border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      Export Selected
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table Header with Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Inventory Items</h2>
              <span className="text-sm text-gray-600">
                Showing {startItem}-{endItem} of {totalItems} items
              </span>
            </div>
            <div className="flex gap-3">
              <Dialog open={isRequisitionDialogOpen} onOpenChange={setIsRequisitionDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-10 px-4">
                    <Plus className="h-4 w-4 mr-2" />
                    New Requisition
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="h-10 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>

            {/* Inventory Table */}
              <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedItems.size === inventoryItems.length && inventoryItems.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="font-semibold">Item Name</TableHead>
                      <TableHead className="font-semibold">Supplier</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold text-right">Price (KSH)</TableHead>
                      <TableHead className="font-semibold text-right">Stock Level</TableHead>
                      <TableHead className="font-semibold">Expiry Date</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                            Loading inventory items...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : inventoryItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          No items found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      inventoryItems.map((item) => {
                        const status = getItemStatus(item)
                        return (
                          <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell>
                              <Checkbox
                                checked={selectedItems.has(item.id)}
                                onCheckedChange={() => handleSelectItem(item.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-500">ID: {item.id.slice(0, 8)}...</div>
                          </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-700">{item.supplier || 'N/A'}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium text-gray-900">
                                {item.unit_price.toLocaleString()}
                        </div>
                              <div className="text-sm text-gray-500">per unit</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium text-gray-900">
                                {item.current_stock.toLocaleString()}
                        </div>
                              <div className="text-sm text-gray-500">
                                Min: {item.min_stock} | Max: {item.max_stock}
                      </div>
                            </TableCell>
                            <TableCell>
                              {item.expiry_date ? (
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {dayjs(item.expiry_date).format('MMM DD, YYYY')}
                            </div>
                                  <div className="text-xs text-gray-500">
                                    {(() => {
                                      try {
                                        return dayjs(item.expiry_date).fromNow()
                                      } catch {
                                        const today = dayjs()
                                        const expiry = dayjs(item.expiry_date)
                                        const diffDays = expiry.diff(today, 'day')
                                        if (diffDays > 0) {
                                          return `in ${diffDays} days`
                                        } else if (diffDays < 0) {
                                          return `${Math.abs(diffDays)} days ago`
                                        } else {
                                          return 'today'
                                        }
                                      }
                                    })()}
                          </div>
                              </div>
                              ) : (
                                <span className="text-sm text-gray-500">No expiry</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(status)} border px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit`}>
                                {getStatusIcon(status)}
                                {status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setSelectedItem(item)}
                                  className="h-8 w-8 p-0"
                        >
                                  <Eye className="h-4 w-4" />
                          </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                                  className="h-8 w-8 p-0"
                        >
                                  <Edit className="h-4 w-4" />
                          </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleRestockItem(item)}
                                  className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                        >
                            Restock
                          </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleDeleteItem(item)}
                                  className="h-8 px-3 text-red-600 hover:text-red-700"
                        >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              </CardContent>
            </Card>
          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {startItem}-{endItem} of {totalItems} items
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 px-3"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="h-8 w-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 px-3"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          </>
        )}

        {activeTab === "requisitions" && (
            <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-base font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  <Package className="h-5 w-5 text-gray-700" />
                  Requisition Requests
                </CardTitle>
            </CardHeader>
              <CardContent className="space-y-2 pt-2 max-h-[60vh] overflow-y-auto">
                {loading ? (
                  <p className="text-center py-4 text-xs">Loading requisition requests...</p>
                ) : requisitions.length === 0 ? (
                  <p className="text-center py-4 text-gray-500 text-xs">No requisition requests found.</p>
                ) : (
                  requisitions.map((req) => (
                  <div
                    key={req.id}
                    className="p-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:from-gray-100 hover:to-blue-100 transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:shadow-lg mb-2"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-sm text-gray-900">{req.req_number}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded">
                            <Package className="h-3 w-3 text-blue-600" />
                            <span className="font-medium">{req.requested_by}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded">
                            <AlertTriangle className="h-3 w-3 text-green-600" />
                            <span className="font-medium">{dayjs(req.date).format('YYYY-MM-DD')}</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={
                          (req.status === "approved" 
                            ? "bg-green-100 text-green-800 border-green-200" 
                            : req.status === "rejected"
                              ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-yellow-100 text-yellow-800 border-yellow-200") +
                          " text-xs px-2 py-1 rounded"
                        }
                      >
                        {req.status}
                      </Badge>
                    </div>

                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Items:</p>
                      <div className="space-y-1">
                        {req.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs bg-white/60 px-2 py-1 rounded">
                            <span className="font-medium">{item.inventory_item?.name || item.item}</span>
                            <span className="text-gray-600">Qty: {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {req.notes && (
                      <div className="mb-2 bg-white/60 p-2 rounded">
                        <p className="text-xs font-medium text-gray-700 mb-1">Notes:</p>
                        <p className="text-xs text-gray-600">{req.notes}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      {req.status === "pending" && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleRejectRequisition(req)}
                            className="h-6 px-2 text-xs border border-red-200 hover:border-red-400 text-red-700 hover:text-red-800 transition-colors duration-200 rounded bg-white/80 backdrop-blur-sm"
                          >
                            Reject
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleApproveRequisition(req)}
                            className="h-6 px-2 text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium transition-all duration-200 rounded shadow-lg hover:shadow-xl"
                          >
                            Approve
                          </Button>
                        </>
                      )}
                      {req.status === "approved" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-6 px-2 text-xs border border-gray-200 hover:border-gray-400 text-gray-700 hover:text-gray-800 transition-colors duration-200 rounded bg-white/80 backdrop-blur-sm"
                        >
                          Mark as Ordered
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteRequisition(req)}
                        className="h-6 px-2 text-xs border border-red-200 hover:border-red-400 text-red-700 hover:text-red-800 transition-colors duration-200 rounded bg-white/80 backdrop-blur-sm"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
                )}
            </CardContent>
          </Card>
        )}

        {/* Item Details Modal */}
        {selectedItem && (
          <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
              <DialogContent className="max-w-2xl rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
              <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Item Details - {selectedItem.name}
                  </DialogTitle>
              </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                  <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Basic Information</p>
                      <div className="space-y-3 text-sm">
                      <p>
                        <span className="font-medium">Category:</span> {selectedItem.category}
                      </p>
                      <p>
                          <span className="font-medium">Supplier:</span> {selectedItem.supplier || 'N/A'}
                      </p>
                      <p>
                          <span className="font-medium">Unit Price:</span> KSH {selectedItem.unit_price.toLocaleString()}
                      </p>
                      <p>
                        <span className="font-medium">Last Restocked:</span> {selectedItem.last_restocked}
                      </p>
                      <p>
                        <span className="font-medium">Expiry Date:</span> {selectedItem.expiry_date ? dayjs(selectedItem.expiry_date).format('YYYY-MM-DD') : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Stock Information</p>
                      <div className="space-y-3 text-sm">
                      <p>
                          <span className="font-medium">Current Stock:</span> {selectedItem.current_stock.toLocaleString()} units
                      </p>
                      <p>
                          <span className="font-medium">Minimum Stock:</span> {selectedItem.min_stock.toLocaleString()} units
                      </p>
                      <p>
                          <span className="font-medium">Maximum Stock:</span> {selectedItem.max_stock.toLocaleString()} units
                      </p>
                      <p>
                          <span className="font-medium">Total Value:</span> KSH {(selectedItem.current_stock * selectedItem.unit_price).toLocaleString()}
                      </p>
                      <p>
                        <span className="font-medium">Status:</span>
                          <Badge className={`${getStatusColor(getItemStatus(selectedItem))} ml-2 border px-3 py-1 rounded-full font-medium flex items-center gap-2`}>
                            {getStatusIcon(getItemStatus(selectedItem))}
                            {getItemStatus(selectedItem)}
                          </Badge>
                      </p>
                    </div>
                  </div>
                </div>

                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200">
                    <h4 className="font-medium mb-3">Stock Level Visualization</h4>
                    <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                          className={`h-4 rounded-full transition-all duration-300 ${
                          selectedItem.current_stock <= selectedItem.min_stock
                            ? "bg-red-500"
                            : selectedItem.current_stock <= selectedItem.min_stock * 1.5
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min((selectedItem.current_stock / selectedItem.max_stock) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {selectedItem.current_stock.toLocaleString()}/{selectedItem.max_stock.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline"
                    className="h-12 px-6 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-xl"
                  >
                    Edit Item
                  </Button>
                  <Button 
                    onClick={() => handleRestockItem(selectedItem)}
                    className="h-12 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    Restock Item
                  </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Restock Dialog */}
        <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Restock Item
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {restockItem && (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-2">{restockItem.name}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Current Stock: {restockItem.current_stock.toLocaleString()} units</p>
                      <p>Unit Price: KSH {restockItem.unit_price.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="restockQuantity" className="text-gray-700 font-medium">
                      Restock Quantity
                    </Label>
                    <Input
                      id="restockQuantity"
                      type="number"
                      placeholder="Enter quantity to add"
                      value={restockQuantity}
                      onChange={(e) => setRestockQuantity(e.target.value)}
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsRestockDialogOpen(false)}
                className="h-12 px-6 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmRestock}
                className="h-12 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                Confirm Restock
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Item Dialog */}
        <Dialog open={isDeleteItemDialogOpen} onOpenChange={setIsDeleteItemDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Delete Inventory Item
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {itemToDelete && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    Are you sure you want to delete "{itemToDelete.name}"? This action cannot be undone.
                  </p>
                  <p className="text-sm text-gray-600">
                    This item will be removed from your inventory and cannot be recovered.
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteItemDialogOpen(false)}
                className="h-12 px-6 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmDeleteItem}
                className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                Delete Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Requisition Dialog */}
        <Dialog open={isDeleteRequisitionDialogOpen} onOpenChange={setIsDeleteRequisitionDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Delete Requisition
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {requisitionToDelete && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    Are you sure you want to delete requisition "{requisitionToDelete.req_number}"? This action cannot be undone.
                  </p>
                  <p className="text-sm text-gray-600">
                    This requisition will be removed and cannot be recovered.
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteRequisitionDialogOpen(false)}
                className="h-12 px-6 border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmDeleteRequisition}
                className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                Delete Requisition
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </MainLayout>
  )
}