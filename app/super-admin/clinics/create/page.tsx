"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { superAdminApi } from "@/lib/api/super-admin";
import type { CreateClinicData } from "@/types/super-admin";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CreateClinicPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateClinicData>({
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const clinic = await superAdminApi.createClinic(formData);
      toast({
        title: "Success",
        description: "Clinic created successfully. Now assign an admin.",
      });
      router.push(`/super-admin/clinics/${clinic.id}/assign-admin`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create clinic",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        <div className="space-y-8 p-8">
          {/* Header */}
          <div className="space-y-2">
            <Link
              href="/super-admin/clinics"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Clinics
            </Link>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Create New Clinic
            </h1>
            <p className="text-gray-600 text-lg font-medium">
              Add a new clinic to the platform. You'll assign an admin in the next step.
            </p>
          </div>

          {/* Form Card */}
          <Card className="relative rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 pointer-events-none rounded-2xl" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl font-bold text-gray-900">Clinic Information</CardTitle>
              <CardDescription className="text-gray-600 font-medium">
                Fill in the details to create a new clinic
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-gray-700 font-semibold">
                            Clinic Name *
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="Downtown Dental Clinic"
                            className="h-11 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="slug" className="text-gray-700 font-semibold">
                            Slug
                          </Label>
                          <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="downtown-dental"
                            className="h-11 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300"
                          />
                          <p className="text-xs text-gray-500 font-medium">Auto-generated if left empty</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subdomain" className="text-gray-700 font-semibold">
                          Subdomain
                        </Label>
                        <Input
                          id="subdomain"
                          value={formData.subdomain}
                          onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                          placeholder="downtown"
                          className="h-11 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-gray-700 font-semibold">
                          Address
                        </Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="123 Main Street, City, Country"
                          rows={2}
                          className="rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-gray-700 font-semibold">
                            Phone
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+254712345678"
                            className="h-11 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-gray-700 font-semibold">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="info@clinic.com"
                            className="h-11 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="logoUrl" className="text-gray-700 font-semibold">
                          Logo URL
                        </Label>
                        <Input
                          id="logoUrl"
                          type="url"
                          value={formData.logoUrl}
                          onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                          placeholder="https://example.com/logo.png"
                          className="h-11 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subscription Settings */}
                  <div className="pt-6 border-t-2 border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Subscription Settings</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="subscriptionTier" className="text-gray-700 font-semibold">
                          Subscription Tier
                        </Label>
                        <Select
                          value={formData.subscriptionTier}
                          onValueChange={(value) => setFormData({ ...formData, subscriptionTier: value })}
                        >
                          <SelectTrigger 
                            id="subscriptionTier"
                            className="h-11 rounded-xl border-2 border-gray-200 focus:border-indigo-500"
                          >
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
                        <Label htmlFor="maxUsers" className="text-gray-700 font-semibold">
                          Max Users
                        </Label>
                        <Input
                          id="maxUsers"
                          type="number"
                          min="1"
                          value={formData.maxUsers}
                          onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 10 })}
                          className="h-11 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxPatients" className="text-gray-700 font-semibold">
                          Max Patients
                        </Label>
                        <Input
                          id="maxPatients"
                          type="number"
                          min="1"
                          value={formData.maxPatients}
                          onChange={(e) => setFormData({ ...formData, maxPatients: parseInt(e.target.value) || 1000 })}
                          className="h-11 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t-2 border-gray-200">
                  <Link href="/super-admin/clinics">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading}
                      className="rounded-xl border-2 border-gray-200 hover:border-gray-300 px-6 h-11"
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-8 h-11"
                  >
                    {loading ? "Creating..." : "Create Clinic"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

