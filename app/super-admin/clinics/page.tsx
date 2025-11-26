"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/super-admin/status-badge";
import { ClinicForm } from "@/components/super-admin/clinic-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { superAdminApi } from "@/lib/api/super-admin";
import type { ClinicWithStats, UpdateClinicData } from "@/types/super-admin";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Eye,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const dynamic = "force-dynamic";

export default function SuperAdminClinicsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState<ClinicWithStats[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  
  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<ClinicWithStats | null>(null);

  useEffect(() => {
    fetchClinics();
  }, [page, search, statusFilter, tierFilter]);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const filters: any = {
        page,
        pageSize,
      };
      
      if (search) filters.search = search;
      if (statusFilter !== "all") filters.status = statusFilter;
      if (tierFilter !== "all") filters.subscriptionTier = tierFilter;
      
      const response = await superAdminApi.getClinics(filters);
      setClinics(response.clinics);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      console.error("Error fetching clinics:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load clinics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleUpdate = async (data: UpdateClinicData) => {
    if (!selectedClinic) return;
    
    try {
      await superAdminApi.updateClinic(selectedClinic.id, data);
      toast({
        title: "Success",
        description: "Clinic updated successfully",
      });
      fetchClinics();
      setEditModalOpen(false);
      setSelectedClinic(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update clinic",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!selectedClinic) {
      toast({
        title: "Error",
        description: "No clinic selected",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log("Deleting clinic:", selectedClinic.id);
      await superAdminApi.deleteClinic(selectedClinic.id);
      toast({
        title: "Success",
        description: "Clinic deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedClinic(null);
      // Refresh the clinics list
      await fetchClinics();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to delete clinic",
        variant: "destructive",
      });
    }
  };

  const handleSuspend = async (clinic: ClinicWithStats) => {
    try {
      await superAdminApi.suspendClinic(clinic.id);
      toast({
        title: "Success",
        description: "Clinic suspended successfully",
      });
      fetchClinics();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to suspend clinic",
        variant: "destructive",
      });
    }
  };

  const handleActivate = async (clinic: ClinicWithStats) => {
    try {
      await superAdminApi.activateClinic(clinic.id);
      toast({
        title: "Success",
        description: "Clinic activated successfully",
      });
      fetchClinics();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to activate clinic",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        <div className="space-y-8 p-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Clinics Management
              </h1>
              <p className="text-gray-600 text-lg font-medium">
                Manage all clinics on the platform
              </p>
            </div>
            <Button 
              onClick={() => router.push("/super-admin/clinics/create")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-6 h-auto"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Clinic
            </Button>
          </div>

        {/* Filters */}
        <Card className="relative rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 pointer-events-none rounded-2xl" />
          <CardContent className="pt-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search clinics..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 h-11 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}>
                <SelectTrigger className="h-11 rounded-xl border-2 border-gray-200 focus:border-indigo-500">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tierFilter} onValueChange={(value) => {
                setTierFilter(value);
                setPage(1);
              }}>
                <SelectTrigger className="h-11 rounded-xl border-2 border-gray-200 focus:border-indigo-500">
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-gray-700 font-semibold flex items-center justify-center md:justify-start bg-gray-50 rounded-xl px-4 border-2 border-gray-200">
                Total: <span className="text-indigo-600 ml-1">{total}</span> clinics
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 pointer-events-none rounded-2xl" />
          <CardHeader className="relative z-10 pb-4">
            <CardTitle className="text-xl font-bold text-gray-900">Clinics</CardTitle>
            <CardDescription className="text-gray-600 font-medium">
              Showing {clinics.length} of {total} clinics
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : clinics.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-lg">No clinics found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border-2 border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50">
                        <TableHead className="font-bold text-gray-900">Name</TableHead>
                        <TableHead className="font-bold text-gray-900">Status</TableHead>
                        <TableHead className="font-bold text-gray-900">Tier</TableHead>
                        <TableHead className="font-bold text-gray-900">Admin</TableHead>
                        <TableHead className="font-bold text-gray-900">Stats</TableHead>
                        <TableHead className="font-bold text-gray-900">Created</TableHead>
                        <TableHead className="text-right font-bold text-gray-900">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clinics.map((clinic) => (
                        <TableRow 
                          key={clinic.id}
                          className="hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/30 transition-all duration-200 border-b border-gray-100"
                        >
                          <TableCell className="font-semibold">
                            <div>
                              <div className="text-gray-900">{clinic.name}</div>
                              {clinic.email && (
                                <div className="text-sm text-gray-500 font-medium">
                                  {clinic.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={clinic.status} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={clinic.subscriptionTier} />
                          </TableCell>
                          <TableCell>
                            {clinic.admin ? (
                              <div>
                                <div className="font-semibold text-gray-900">{clinic.admin.fullName || clinic.admin.email}</div>
                                <div className="text-sm text-gray-500 font-medium">
                                  {clinic.admin.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 font-medium">No admin</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-semibold text-gray-900">{clinic.stats.totalUsers} users</div>
                              <div className="text-gray-500 font-medium">
                                {clinic.stats.totalPatients} patients
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-gray-700 font-medium">
                              {new Date(clinic.createdAt).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-9 w-9 rounded-lg hover:bg-indigo-100 hover:text-indigo-600 transition-all duration-200"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl border-2 border-gray-200 shadow-xl">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedClinic(clinic);
                                    setViewModalOpen(true);
                                  }}
                                  className="rounded-lg"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedClinic(clinic);
                                    setEditModalOpen(true);
                                  }}
                                  className="rounded-lg"
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                {clinic.status === "active" ? (
                                  <DropdownMenuItem
                                    onClick={() => handleSuspend(clinic)}
                                    className="rounded-lg"
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Suspend
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleActivate(clinic)}
                                    className="rounded-lg"
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedClinic(clinic);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600 rounded-lg focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-gray-200">
                    <div className="text-sm text-gray-600 font-semibold">
                      Page <span className="text-indigo-600">{page}</span> of <span className="text-indigo-600">{totalPages}</span>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 disabled:opacity-50"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 disabled:opacity-50"
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

        {/* Edit Modal */}
        {selectedClinic && (
          <ClinicForm
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            onSubmit={handleUpdate}
            clinic={selectedClinic}
            mode="edit"
          />
        )}

        {/* View Details Modal */}
        {selectedClinic && (
          <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedClinic.name}</DialogTitle>
                <DialogDescription>Clinic details and statistics</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <div className="font-medium">{selectedClinic.name}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Slug:</span>
                      <div className="font-medium">{selectedClinic.slug}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div>
                        <StatusBadge status={selectedClinic.status} />
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tier:</span>
                      <div>
                        <StatusBadge status={selectedClinic.subscriptionTier} />
                      </div>
                    </div>
                    {selectedClinic.email && (
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <div className="font-medium">{selectedClinic.email}</div>
                      </div>
                    )}
                    {selectedClinic.phone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <div className="font-medium">{selectedClinic.phone}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Users:</span>
                      <div className="font-medium">{selectedClinic.stats.totalUsers}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Patients:</span>
                      <div className="font-medium">{selectedClinic.stats.totalPatients}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Appointments:</span>
                      <div className="font-medium">{selectedClinic.stats.totalAppointments}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Revenue:</span>
                      <div className="font-medium">
                        KES {selectedClinic.stats.totalRevenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedClinic.admin && (
                  <div>
                    <h3 className="font-semibold mb-2">Admin</h3>
                    <div className="text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <div className="font-medium">
                          {selectedClinic.admin.fullName || "N/A"}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <div className="font-medium">{selectedClinic.admin.email}</div>
                      </div>
                      {selectedClinic.admin.phone && (
                        <div>
                          <span className="text-muted-foreground">Phone:</span>
                          <div className="font-medium">{selectedClinic.admin.phone}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the clinic "{selectedClinic?.name}". This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>
    </MainLayout>
  );
}

