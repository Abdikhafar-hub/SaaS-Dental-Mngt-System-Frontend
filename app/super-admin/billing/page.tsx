"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/super-admin/status-badge";
import { StatsCard } from "@/components/super-admin/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { superAdminApi } from "@/lib/api/super-admin";
import type { BillingWithClinic, CreateBillingData, BillingStats } from "@/types/super-admin";
import {
  Plus,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default function SuperAdminBillingPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<BillingWithClinic[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clinicFilter, setClinicFilter] = useState<string>("all");
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<BillingWithClinic | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");

  const [formData, setFormData] = useState<CreateBillingData>({
    clinicId: "",
    billingPeriod: "monthly",
    amount: 0,
    currency: "KES",
    dueDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    fetchBilling();
    fetchStats();
  }, [page, statusFilter, clinicFilter]);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const filters: any = {
        page,
        pageSize,
      };
      
      if (statusFilter !== "all") filters.status = statusFilter;
      if (clinicFilter !== "all") filters.clinicId = clinicFilter;
      
      const response = await superAdminApi.getBilling(filters);
      setBilling(response.billing);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      console.error("Error fetching billing:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load billing records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await superAdminApi.getBillingStats();
      setStats(data);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleCreate = async () => {
    try {
      await superAdminApi.createBilling(formData);
      toast({
        title: "Success",
        description: "Billing record created successfully",
      });
      fetchBilling();
      fetchStats();
      setCreateModalOpen(false);
      setFormData({
        clinicId: "",
        billingPeriod: "monthly",
        amount: 0,
        currency: "KES",
        dueDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create billing record",
        variant: "destructive",
      });
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedBilling || !paymentMethod) return;
    
    try {
      await superAdminApi.markBillingAsPaid(selectedBilling.id, paymentMethod);
      toast({
        title: "Success",
        description: "Billing marked as paid",
      });
      fetchBilling();
      fetchStats();
      setMarkPaidModalOpen(false);
      setSelectedBilling(null);
      setPaymentMethod("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to mark as paid",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing Management</h1>
            <p className="text-muted-foreground">
              Manage clinic billing and subscriptions
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Billing
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Revenue"
              value={`KES ${stats.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              iconColor="text-emerald-600"
            />
            <StatsCard
              title="Pending Amount"
              value={`KES ${stats.pendingAmount.toLocaleString()}`}
              icon={AlertCircle}
              iconColor="text-yellow-600"
            />
            <StatsCard
              title="Overdue Amount"
              value={`KES ${stats.overdueAmount.toLocaleString()}`}
              icon={AlertCircle}
              iconColor="text-red-600"
            />
            <StatsCard
              title="Total Bills"
              value={stats.totalBills.toString()}
              icon={TrendingUp}
              iconColor="text-blue-600"
              description={`${stats.paidBills} paid, ${stats.pendingBills} pending`}
            />
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground flex items-center">
                Total: {total} billing records
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Records</CardTitle>
            <CardDescription>
              Showing {billing.length} of {total} records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : billing.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No billing records found</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Clinic</TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billing.map((bill) => (
                        <TableRow key={bill.id}>
                          <TableCell className="font-medium">
                            {bill.clinic.name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {bill.invoiceNumber}
                          </TableCell>
                          <TableCell className="capitalize">
                            {bill.billingPeriod}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {bill.currency} {Number(bill.amount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {format(new Date(bill.dueDate), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={bill.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            {bill.status === "pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBilling(bill);
                                  setMarkPaidModalOpen(true);
                                }}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Paid
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Billing Record</DialogTitle>
              <DialogDescription>
                Create a new billing record for a clinic
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinicId">Clinic ID</Label>
                <Input
                  id="clinicId"
                  value={formData.clinicId}
                  onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                  placeholder="Enter clinic ID"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billingPeriod">Billing Period</Label>
                  <Select
                    value={formData.billingPeriod}
                    onValueChange={(value: "monthly" | "quarterly" | "yearly") =>
                      setFormData({ ...formData, billingPeriod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mark Paid Modal */}
        <Dialog open={markPaidModalOpen} onOpenChange={setMarkPaidModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark as Paid</DialogTitle>
              <DialogDescription>
                Record payment for this billing record
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedBilling && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Clinic: {selectedBilling.clinic.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Amount: {selectedBilling.currency} {Number(selectedBilling.amount).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Input
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="e.g., M-Pesa, Bank Transfer, Cash"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMarkPaidModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleMarkPaid} disabled={!paymentMethod}>
                Mark as Paid
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

