"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/super-admin/stats-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { superAdminApi } from "@/lib/api/super-admin";
import type { AnalyticsData } from "@/types/super-admin";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default function SuperAdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await superAdminApi.getAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      console.error("Error fetching analytics:", err);
      setError(err.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
          <div className="space-y-8 p-8">
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-96" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="rounded-2xl border-0 bg-white/80 shadow-lg">
                  <CardHeader>
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchAnalytics}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!analytics) {
    return null;
  }

  const { overview, revenue, growth, topClinics } = analytics;

  // Calculate growth percentages (mock for now - can be calculated from growth data)
  const clinicsGrowth = growth.clinics.length > 1
    ? ((growth.clinics[growth.clinics.length - 1].count || 0) - (growth.clinics[0].count || 0)) / (growth.clinics[0].count || 1) * 100
    : 0;

  const patientsGrowth = growth.patients.length > 1
    ? ((growth.patients[growth.patients.length - 1].count || 0) - (growth.patients[0].count || 0)) / (growth.patients[0].count || 1) * 100
    : 0;

  const revenueGrowth = growth.revenue.length > 1
    ? ((growth.revenue[growth.revenue.length - 1].amount || 0) - (growth.revenue[0].amount || 0)) / (growth.revenue[0].amount || 1) * 100
    : 0;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        <div className="space-y-8 p-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 text-lg font-medium">
              Overview of all clinics and platform analytics
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Clinics"
            value={overview.totalClinics}
            icon={Building2}
            iconColor="text-indigo-600"
            trend={{
              value: Math.abs(clinicsGrowth),
              label: "vs last period",
              isPositive: clinicsGrowth >= 0,
            }}
          />
          <StatsCard
            title="Active Clinics"
            value={overview.activeClinics}
            icon={Activity}
            iconColor="text-green-600"
            description={`${overview.suspendedClinics} suspended`}
          />
          <StatsCard
            title="Total Users"
            value={overview.totalUsers.toLocaleString()}
            icon={Users}
            iconColor="text-blue-600"
            trend={{
              value: Math.abs(patientsGrowth),
              label: "vs last period",
              isPositive: patientsGrowth >= 0,
            }}
          />
          <StatsCard
            title="Total Revenue"
            value={`KES ${overview.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            iconColor="text-emerald-600"
            trend={{
              value: Math.abs(revenueGrowth),
              label: "vs last period",
              isPositive: revenueGrowth >= 0,
            }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Revenue Chart */}
          <Card className="rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 pointer-events-none" />
            <CardHeader className="relative z-10 pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Revenue Trend</CardTitle>
              <CardDescription className="text-gray-600 font-medium">Monthly revenue over time</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-4 border-2 border-gray-200">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis
                      dataKey="period"
                      tickFormatter={(value) => format(new Date(value + "-01"), "MMM yyyy")}
                      stroke="#6b7280"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `KES ${value / 1000}k`}
                      stroke="#6b7280"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <Tooltip
                      formatter={(value: number) => `KES ${value.toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Growth Chart */}
          <Card className="rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 pointer-events-none" />
            <CardHeader className="relative z-10 pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Growth Metrics</CardTitle>
              <CardDescription className="text-gray-600 font-medium">Clinics, patients, and revenue growth</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-4 border-2 border-gray-200">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={growth.clinics.map((item, index) => ({
                    period: item.period,
                    clinics: item.count || 0,
                    patients: growth.patients[index]?.count || 0,
                    revenue: growth.revenue[index]?.amount || 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis
                      dataKey="period"
                      tickFormatter={(value) => format(new Date(value + "-01"), "MMM")}
                      stroke="#6b7280"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />
                    <Line
                      type="monotone"
                      dataKey="clinics"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Clinics"
                    />
                    <Line
                      type="monotone"
                      dataKey="patients"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Patients"
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Clinics */}
        <Card className="rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 pointer-events-none" />
          <CardHeader className="relative z-10 pb-4">
            <CardTitle className="text-xl font-bold text-gray-900">Top Clinics by Revenue</CardTitle>
            <CardDescription className="text-gray-600 font-medium">Highest performing clinics</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {topClinics.length > 0 ? (
              <div className="space-y-3">
                {topClinics.map((clinic, index) => (
                  <div
                    key={clinic.id}
                    className="group flex items-center justify-between p-5 rounded-xl border-2 border-gray-200 bg-gradient-to-r from-white to-gray-50/50 hover:from-gray-50 hover:to-white hover:border-indigo-300 hover:shadow-md transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-xl font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
                        index === 0 && "bg-gradient-to-br from-amber-400 to-orange-500",
                        index === 1 && "bg-gradient-to-br from-gray-400 to-gray-500",
                        index === 2 && "bg-gradient-to-br from-amber-600 to-amber-700",
                        index > 2 && "bg-gradient-to-br from-indigo-500 to-purple-600"
                      )}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-base">{clinic.name}</p>
                        <p className="text-sm text-gray-600 font-medium mt-0.5">
                          {clinic.patients} patients • {clinic.users} users
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl text-gray-900">
                        KES {clinic.revenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No clinic data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </MainLayout>
  );
}

