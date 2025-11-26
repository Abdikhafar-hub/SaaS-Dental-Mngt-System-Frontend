/**
 * Stats Card Component
 * Reusable card for displaying statistics
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
  iconColor?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className,
  iconColor = "text-blue-600",
}: StatsCardProps) {
  // Extract color from iconColor prop for gradient backgrounds
  const getGradientFromColor = (color: string) => {
    if (color.includes("indigo")) return "from-indigo-500/10 to-purple-500/10";
    if (color.includes("green")) return "from-emerald-500/10 to-teal-500/10";
    if (color.includes("blue")) return "from-blue-500/10 to-cyan-500/10";
    if (color.includes("emerald")) return "from-emerald-500/10 to-green-500/10";
    return "from-blue-500/10 to-indigo-500/10";
  };

  const getIconBgGradient = (color: string) => {
    if (color.includes("indigo")) return "bg-gradient-to-br from-indigo-500 to-purple-600";
    if (color.includes("green")) return "bg-gradient-to-br from-emerald-500 to-teal-600";
    if (color.includes("blue")) return "bg-gradient-to-br from-blue-500 to-cyan-600";
    if (color.includes("emerald")) return "bg-gradient-to-br from-emerald-500 to-green-600";
    return "bg-gradient-to-br from-blue-500 to-indigo-600";
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 hover:-translate-y-1",
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300", getGradientFromColor(iconColor))} />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={cn(
          "p-2.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300",
          getIconBgGradient(iconColor)
        )}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
          {value}
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 text-xs mt-2">
            <div className={cn(
              "flex items-center gap-0.5 px-2 py-1 rounded-full font-semibold",
              trend.isPositive 
                ? "text-emerald-700 bg-emerald-50" 
                : "text-red-700 bg-red-50"
            )}>
              {trend.isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span>{Math.abs(trend.value).toFixed(1)}%</span>
            </div>
            <span className="text-gray-500 font-medium">{trend.label}</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-gray-500 font-medium mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

