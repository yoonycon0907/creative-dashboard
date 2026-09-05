'use client';

import { CreativeWithMetrics } from '@/lib/queries';

interface CreativeListProps {
  creatives: CreativeWithMetrics[];
  onCreativeSelect?: (creative: CreativeWithMetrics) => void;
}

export function CreativeList({ creatives, onCreativeSelect }: CreativeListProps) {
  if (creatives.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">조회된 소재가 없습니다.</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      notation: 'standard',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'running':
        return 'st-active';
      case 'paused':
        return 'st-paused';
      case 'ended':
        return 'st-ended';
      default:
        return 'st-paused';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'running':
        return '운영중';
      case 'paused':
        return '중지';
      case 'ended':
        return '종료';
      default:
        return status;
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200 sticky top-0 z-10 text-xs font-semibold text-gray-600" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr' }}>
          <div>소재</div>
          <div className="text-right">ROAS</div>
          <div className="text-right">CTR</div>
          <div className="text-right">CVR</div>
          <div className="text-right">CPP</div>
          <div className="text-right">CPM</div>
          <div className="text-right">지출</div>
          <div className="text-right">구매</div>
          <div className="text-right">상태</div>
        </div>

        {/* Rows */}
        {creatives.map((creative) => {
          const cvr = creative.total_clicks > 0
            ? (creative.total_purchases / creative.total_clicks) * 100
            : 0;

          return (
          <div
            key={creative.creative_key}
            onClick={() => onCreativeSelect?.(creative)}
            className="grid gap-3 px-5 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors last:border-b-0"
            style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr' }}
          >
            {/* Name & Tags */}
            <div className="text-left">
              <div className="font-semibold text-gray-900 text-sm truncate">
                {creative.creative_name}
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {creative.category}
                </span>
                <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {creative.format}
                </span>
                <span className="inline-block text-xs border border-gray-300 text-gray-600 px-2 py-1 rounded">
                  {creative.ad_count}개 세팅
                </span>
              </div>
            </div>

            {/* ROAS - Highlighted */}
            <div className="text-right">
              <div className={`text-sm font-bold ${
                creative.roas_percent >= 300 ? 'text-green-700' : 'text-red-600'
              }`}>
                {creative.roas_percent.toFixed(1)}%
              </div>
              <div className="h-1 bg-gray-200 rounded mt-1 relative overflow-hidden">
                <div
                  className={`h-full rounded ${
                    creative.roas_percent >= 300 ? 'bg-green-600' : 'bg-red-600'
                  }`}
                  style={{
                    width: `${Math.min((creative.roas_percent / 10000) * 100, 100)}%`,
                    opacity: 0.6,
                  }}
                />
              </div>
            </div>

            {/* CTR */}
            <div className="text-right">
              <div className="text-sm text-gray-700">
                {creative.ctr.toFixed(2)}%
              </div>
            </div>

            {/* CVR */}
            <div className="text-right">
              <div className="text-sm text-gray-700">
                {cvr.toFixed(2)}%
              </div>
            </div>

            {/* CPP */}
            <div className="text-right">
              <div className="text-sm text-gray-700">
                ₩{formatCurrency(creative.cpp)}
              </div>
            </div>

            {/* CPM */}
            <div className="text-right">
              <div className="text-sm text-gray-700">
                ₩{formatCurrency(creative.cpm)}
              </div>
            </div>

            {/* Spend */}
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                ₩{formatCurrency(creative.total_spend)}
              </div>
            </div>

            {/* Purchases */}
            <div className="text-right">
              <div className="text-sm text-gray-700">
                {formatCurrency(creative.total_purchases)}
              </div>
            </div>

            {/* Status */}
            <div className="text-right">
              <div className={`text-xs inline-flex items-center gap-1.5 px-2 py-1 rounded ${
                getStatusClass(creative.status) === 'st-active'
                  ? 'text-green-700 font-semibold'
                  : 'text-gray-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                  getStatusClass(creative.status) === 'st-active'
                    ? 'bg-green-600'
                    : 'bg-gray-400'
                }`} />
                {getStatusLabel(creative.status)}
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 text-sm text-gray-600">
        소재 {creatives.length}개
      </div>
    </div>
  );
}
