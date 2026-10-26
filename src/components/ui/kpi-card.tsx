import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { ReactNode } from "react";

export type KpiColor = 'amber' | 'rose' | 'emerald' | 'blue' | 'indigo' | 'slate';

export interface KpiData {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: string;
  trendUp?: boolean;
  alert?: string;
  icon: ReactNode;
  color: KpiColor;
}

const colorConfig = {
  amber: { text: 'text-amber-700', border: 'border-l-amber-600', iconBg: 'bg-amber-100', iconText: 'text-amber-700' },
  rose: { text: 'text-rose-700', border: 'border-l-rose-600', iconBg: 'bg-rose-100', iconText: 'text-rose-700' },
  emerald: { text: 'text-emerald-700', border: 'border-l-emerald-600', iconBg: 'bg-emerald-100', iconText: 'text-emerald-700' },
  blue: { text: 'text-blue-700', border: 'border-l-blue-600', iconBg: 'bg-blue-100', iconText: 'text-blue-700' },
  indigo: { text: 'text-indigo-700', border: 'border-l-indigo-600', iconBg: 'bg-indigo-100', iconText: 'text-indigo-700' },
  slate: { text: 'text-slate-700', border: 'border-l-slate-600', iconBg: 'bg-slate-100', iconText: 'text-slate-700' },
};

export function KPICard({ data }: { data: KpiData }) {
  const colors = colorConfig[data.color] || colorConfig.slate;
  
  return (
    <Card className={`border-l-4 ${colors.border} border-slate-200 shadow-sm transition-shadow hover:shadow-md`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{data.label}</p>
            <p className={`text-3xl font-bold tracking-tight ${colors.text}`}>{data.value}</p>
            <div className="flex items-center gap-2">
              {data.trend && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  {data.trendUp && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                  {data.trend}
                </span>
              )}
              <span className="text-xs text-slate-400">{data.sublabel}</span>
            </div>
            {data.alert && (
              <Badge variant="outline" className="mt-1 border-rose-300 bg-rose-50 text-rose-700">
                {data.alert}
              </Badge>
            )}
          </div>
          <div className={`rounded-lg p-2.5 ${colors.iconBg}`}>
            <div className={colors.iconText}>{data.icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}