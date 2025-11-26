"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { superAdminApi } from "@/lib/api/super-admin";
import { ArrowLeft, RefreshCw, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

function generateRandomPassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export default function AssignAdminPage() {
  const router = useRouter();
  const params = useParams();
  const clinicId = params.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clinicLoading, setClinicLoading] = useState(true);
  const [clinicName, setClinicName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phone: "",
    password: "",
    autoGeneratePassword: true,
    sendWelcomeEmail: true,
  });

  useEffect(() => {
    // Fetch clinic name
    const fetchClinic = async () => {
      try {
        const clinics = await superAdminApi.getClinics({ page: 1, pageSize: 1000 });
        const clinic = clinics.clinics.find((c) => c.id === clinicId);
        if (clinic) {
          setClinicName(clinic.name);
        }
      } catch (error) {
        console.error("Error fetching clinic:", error);
      } finally {
        setClinicLoading(false);
      }
    };
    fetchClinic();
  }, [clinicId]);

  const handleAutoGeneratePassword = () => {
    const generatedPassword = generateRandomPassword(12);
    setFormData({ ...formData, password: generatedPassword, autoGeneratePassword: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const passwordToUse = formData.autoGeneratePassword ? undefined : formData.password;
      
      await superAdminApi.assignAdmin(clinicId, {
        email: formData.email,
        fullName: formData.fullName || undefined,
        phone: formData.phone || undefined,
        password: passwordToUse,
        sendWelcomeEmail: formData.sendWelcomeEmail,
      });

      toast({
        title: "Success",
        description: "Admin assigned successfully",
      });
      router.push("/super-admin/clinics");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to assign admin",
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
              Assign Admin
            </h1>
            {clinicLoading ? (
              <Skeleton className="h-6 w-96" />
            ) : (
              <p className="text-gray-600 text-lg font-medium">
                Assign an admin to {clinicName || "the clinic"}
              </p>
            )}
          </div>

          {/* Form Card */}
          <Card className="relative rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none rounded-2xl" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl font-bold text-gray-900">Admin Information</CardTitle>
              <CardDescription className="text-gray-600 font-medium">
                Fill in the admin details to assign them to the clinic
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-semibold">
                      Admin Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="admin@clinic.com"
                      className="h-11 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-gray-700 font-semibold">
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="John Doe"
                        className="h-11 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300"
                      />
                    </div>

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
                  </div>

                  {/* Password Section */}
                  <div className="pt-4 border-t-2 border-gray-200">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="autoGeneratePassword"
                          checked={formData.autoGeneratePassword}
                          onCheckedChange={(checked) => {
                            setFormData({
                              ...formData,
                              autoGeneratePassword: checked === true,
                              password: checked === true ? "" : formData.password,
                            });
                          }}
                        />
                        <Label htmlFor="autoGeneratePassword" className="text-sm font-medium text-gray-700 cursor-pointer">
                          Auto-generate password
                        </Label>
                      </div>

                      {!formData.autoGeneratePassword && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-gray-700 font-semibold">
                              Password *
                            </Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleAutoGeneratePassword}
                              className="h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Generate
                            </Button>
                          </div>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              required={!formData.autoGeneratePassword}
                              placeholder="Enter password"
                              className="h-11 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {formData.autoGeneratePassword && (
                        <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                          <p className="text-sm text-indigo-700 font-medium">
                            A secure password will be automatically generated and sent to the admin via email.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="sendWelcomeEmail"
                      checked={formData.sendWelcomeEmail}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, sendWelcomeEmail: checked === true })
                      }
                    />
                    <Label htmlFor="sendWelcomeEmail" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Send welcome email to admin
                    </Label>
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
                      Skip for Now
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-8 h-11"
                  >
                    {loading ? "Assigning..." : "Assign Admin"}
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

