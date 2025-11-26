/**
 * Clinic Form Component
 * Create/Edit clinic form with admin assignment
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { CreateClinicData, UpdateClinicData, ClinicWithStats } from "@/types/super-admin";

interface ClinicFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateClinicData | UpdateClinicData) => Promise<void>;
  clinic?: ClinicWithStats | null;
  mode: "create" | "edit";
}

export function ClinicForm({ open, onOpenChange, onSubmit, clinic, mode }: ClinicFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateClinicData>({
    name: clinic?.name || "",
    slug: clinic?.slug || "",
    subdomain: clinic?.subdomain || "",
    address: clinic?.address || "",
    phone: clinic?.phone || "",
    email: clinic?.email || "",
    logoUrl: clinic?.logoUrl || "",
    subscriptionTier: clinic?.subscriptionTier || "basic",
    maxUsers: clinic?.maxUsers || 10,
    maxPatients: clinic?.maxPatients || 1000,
    adminEmail: clinic?.admin?.email || "",
    adminFullName: clinic?.admin?.fullName || "",
    adminPhone: clinic?.admin?.phone || "",
    sendWelcomeEmail: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      // Reset form
      if (mode === "create") {
        setFormData({
          name: "",
          slug: "",
          subdomain: "",
          address: "",
          phone: "",
          email: "",
          logoUrl: "",
          subscriptionTier: "basic",
          maxUsers: 10,
          maxPatients: 1000,
          adminEmail: "",
          adminFullName: "",
          adminPhone: "",
          sendWelcomeEmail: true,
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New Clinic" : "Edit Clinic"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new clinic to the platform. You can assign an admin during creation."
              : "Update clinic information and settings."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Clinic Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Downtown Dental Clinic"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="downtown-dental"
                />
                <p className="text-xs text-muted-foreground">Auto-generated if left empty</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              <Input
                id="subdomain"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                placeholder="downtown"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street, City, Country"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+254712345678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@clinic.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          {/* Subscription Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Subscription Settings</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subscriptionTier">Subscription Tier</Label>
                <Select
                  value={formData.subscriptionTier}
                  onValueChange={(value) => setFormData({ ...formData, subscriptionTier: value })}
                >
                  <SelectTrigger id="subscriptionTier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsers">Max Users</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  min="1"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 10 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPatients">Max Patients</Label>
                <Input
                  id="maxPatients"
                  type="number"
                  min="1"
                  value={formData.maxPatients}
                  onChange={(e) => setFormData({ ...formData, maxPatients: parseInt(e.target.value) || 1000 })}
                />
              </div>
            </div>
          </div>

          {/* Admin Assignment (only for create mode) */}
          {mode === "create" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Assign Admin (Optional)</h3>
              
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="admin@clinic.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminFullName">Admin Full Name</Label>
                  <Input
                    id="adminFullName"
                    value={formData.adminFullName}
                    onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPhone">Admin Phone</Label>
                  <Input
                    id="adminPhone"
                    type="tel"
                    value={formData.adminPhone}
                    onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                    placeholder="+254712345678"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendWelcomeEmail"
                  checked={formData.sendWelcomeEmail}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sendWelcomeEmail: checked === true })
                  }
                />
                <Label htmlFor="sendWelcomeEmail" className="text-sm font-normal cursor-pointer">
                  Send welcome email to admin
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "create" ? "Create Clinic" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

