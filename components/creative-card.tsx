'use client';

import { CreativeWithMetrics } from '@/lib/queries';

interface CreativeCardProps {
  creative: CreativeWithMetrics;
  onClick?: () => void;
}

export function CreativeCard({ creative, onClick }: CreativeCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRoasColor = (roas: number) => {
    if (roas < 100) return 'bg-red-50 border-red-200';
    if (roas < 300) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow ${getRoasColor(creative.roas_percent)}`}
    >
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {creative.creative_name}
            </p>
            <div className="flex gap-2 mt-1">
              <span className="inline-block px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded">
                {creative.category}
              </span>
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {creative.format}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-1 bg-white text-gray-700 text-xs rounded font-semibold">
              {creative.ad_count} 세팅
            </span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-300">
        <MetricCell label="지출" value={formatCurrency(creative.total_spend)} />
        <MetricCell label="ROAS" value={`${creative.roas_percent.toFixed(1)}%`} highlight />
        <MetricCell label="CPP" value={formatCurrency(creative.cpp)} />
      </div>

      {/* Sub metrics */}
      <div className="mt-3 pt-3 border-t border-gray-300 text-xs text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>CTR: {creative.ctr.toFixed(2)}%</span>
          <span>CPC: {formatCurrency(creative.cpc)}</span>
        </div>
        <div>
          구매: {creative.total_purchases.toLocaleString()} | 노출: {creative.total_impressions.toLocaleString()}
        </div>
      </div>

      {/* Status */}
      <div className="mt-3 text-xs text-gray-500">
        상태: <span className="font-semibold">{creative.status}</span>
      </div>
    </div>
  );
}

function MetricCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? 'bg-white p-2 rounded' : ''}>
      <p className="text-xs text-gray-600">{label}</p>
      <p className={`font-bold ${highlight ? 'text-lg text-green-700' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}
