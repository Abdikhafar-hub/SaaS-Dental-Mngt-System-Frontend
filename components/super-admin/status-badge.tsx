/**
 * Status Badge Component
 * Reusable badge for displaying statuses
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  // Clinic statuses
  active: { label: "Active", variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  suspended: { label: "Suspended", variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  inactive: { label: "Inactive", variant: "secondary", className: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
  
  // Billing statuses
  paid: { label: "Paid", variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  pending: { label: "Pending", variant: "secondary", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  overdue: { label: "Overdue", variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  cancelled: { label: "Cancelled", variant: "outline", className: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
  
  // Notification priorities
  urgent: { label: "Urgent", variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  high: { label: "High", variant: "destructive", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
  normal: { label: "Normal", variant: "default", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  low: { label: "Low", variant: "secondary", className: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
  
  // Message statuses
  sent: { label: "Sent", variant: "default", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  read: { label: "Read", variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  
  // Subscription tiers
  basic: { label: "Basic", variant: "outline", className: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
  premium: { label: "Premium", variant: "default", className: "bg-purple-100 text-purple-800 hover:bg-purple-100" },
  enterprise: { label: "Enterprise", variant: "default", className: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || {
    label: status,
    variant: "outline" as const,
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

