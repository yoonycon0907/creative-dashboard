'use client';

import { SummaryMetrics } from '@/lib/queries';

interface KPISummaryProps {
  metrics: SummaryMetrics;
}

export function KPISummary({ metrics }: KPISummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <KPICard
        label="총 지출"
        value={formatCurrency(metrics.total_spend)}
        subtext={`${metrics.total_impressions.toLocaleString()} 노출`}
      />
      <KPICard
        label="총 구매수"
        value={metrics.total_purchases.toLocaleString()}
        subtext={`CPP: ${formatCurrency(metrics.total_spend / Math.max(metrics.total_purchases, 1))}`}
      />
      <KPICard
        label="ROAS"
        value={`${metrics.avg_roas_percent.toFixed(1)}%`}
        subtext={`구매액: ${formatCurrency(metrics.total_purchase_value)}`}
      />
      <KPICard
        label="CTR"
        value={`${metrics.avg_ctr.toFixed(2)}%`}
        subtext={`CPC: ${formatCurrency(metrics.avg_cpc)}`}
      />
    </div>
  );
}

interface KPICardProps {
  label: string;
  value: string;
  subtext: string;
}

function KPICard({ label, value, subtext }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-xs text-gray-500 mt-2">{subtext}</p>
    </div>
  );
}
