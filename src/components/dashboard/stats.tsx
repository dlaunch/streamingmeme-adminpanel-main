"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, XCircle, Brain, Megaphone, Activity } from "lucide-react";

interface DashboardStatsProps {
  waitingApprovalCount: number;
  approvedCount: number;
  declinedCount: number;
  avgAiScore: number;
  activeSponsorsCount: number;
  todayActions: number;
}

export function DashboardStats({
  waitingApprovalCount,
  approvedCount,
  declinedCount,
  avgAiScore,
  activeSponsorsCount,
  todayActions,
}: DashboardStatsProps) {
  const stats = [
    {
      title: "Waiting Approval",
      value: waitingApprovalCount,
      icon: FileText,
      description: "Articles awaiting approval",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100/80 dark:bg-amber-900/30",
      href: "/articles?status=waiting_approval",
    },
    {
      title: "Approved",
      value: approvedCount,
      icon: CheckCircle,
      description: "Articles approved for publishing",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100/80 dark:bg-emerald-900/30",
      href: "/articles?status=approved_for_publishing",
    },
    {
      title: "Declined",
      value: declinedCount,
      icon: XCircle,
      description: "Articles rejected in the last 3 days",
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-100/80 dark:bg-rose-900/30",
      href: "/articles?status=filtered_out",
    },
    {
      title: "Avg AI Score",
      value: avgAiScore ? Number(avgAiScore).toFixed(1) : "N/A",
      icon: Brain,
      description: "Average pending article score",
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-100/80 dark:bg-violet-900/30",
    },
    {
      title: "Active Sponsors",
      value: activeSponsorsCount,
      icon: Megaphone,
      description: "Currently active sponsors",
      color: "text-sky-600 dark:text-sky-400",
      bgColor: "bg-sky-100/80 dark:bg-sky-900/30",
      href: "/sponsors",
    },
    {
      title: "Today's Actions",
      value: todayActions,
      icon: Activity,
      description: "Admin actions today",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100/80 dark:bg-indigo-900/30",
      href: "/admin-history",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => {
        const cardContent = (
          <Card className={`h-full ${stat.href ? "transition-colors hover:bg-muted/50 cursor-pointer" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );

        return stat.href ? (
          <Link key={stat.title} href={stat.href} className="h-full">
            {cardContent}
          </Link>
        ) : (
          <div key={stat.title} className="h-full">{cardContent}</div>
        );
      })}
    </div>
  );
}
