'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { CreativeWithMetrics } from '@/lib/queries';
import { FilterSidebar, FilterState } from './filter-sidebar';
import { KPISummary } from './kpi-summary';
import { CreativeGrid } from './creative-grid';
import { CreativeDetailModal, CreativeDetail, DailyPerformance, DemographicData } from './creative-detail-modal';

interface DashboardClientProps {
  initialCreatives: CreativeWithMetrics[];
  initialMetrics: any;
  categories: string[];
}

export function DashboardClient({ initialCreatives, initialMetrics, categories }: DashboardClientProps) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const [filters, setFilters] = useState<FilterState>({
    accountIds: [],
    dateStart: sixMonthsAgo.toISOString().split('T')[0],
    dateEnd: now.toISOString().split('T')[0],
    sortBy: 'spend',
    category: undefined,
    status: undefined,
  });

  const [selectedCreativeKey, setSelectedCreativeKey] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<CreativeDetail | null>(null);
  const [selectedDaily, setSelectedDaily] = useState<DailyPerformance[]>([]);
  const [selectedDemo, setSelectedDemo] = useState<DemographicData[]>([]);
  const [creatives, setCreatives] = useState<CreativeWithMetrics[]>(initialCreatives);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredCreatives = useMemo(() => {
    return creatives
      .filter((c) => {
        if (filters.category && c.category !== filters.category) return false;
        if (filters.status && c.status !== filters.status) return false;
        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'spend') return b.total_spend - a.total_spend;
        if (filters.sortBy === 'roas') return b.roas_percent - a.roas_percent;
        if (filters.sortBy === 'purchases') return b.total_purchases - a.total_purchases;
        return 0;
      });
  }, [creatives, filters]);

  const summaryMetrics = useMemo(() => {
    if (filteredCreatives.length === 0) {
      return {
        total_spend: 0,
        total_purchases: 0,
        total_purchase_value: 0,
        total_impressions: 0,
        total_clicks: 0,
        avg_ctr: 0,
        avg_cpc: 0,
        avg_cpm: 0,
        avg_roas_percent: 0,
      };
    }

    const totalSpend = filteredCreatives.reduce((sum, c) => sum + c.total_spend, 0);
    const totalPurchases = filteredCreatives.reduce((sum, c) => sum + c.total_purchases, 0);
    const totalPurchaseValue = filteredCreatives.reduce((sum, c) => sum + c.total_purchase_value, 0);
    const totalImpressions = filteredCreatives.reduce((sum, c) => sum + c.total_impressions, 0);
    const totalClicks = filteredCreatives.reduce((sum, c) => sum + c.total_clicks, 0);

    return {
      total_spend: totalSpend,
      total_purchases: totalPurchases,
      total_purchase_value: totalPurchaseValue,
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      avg_ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      avg_cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      avg_cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      avg_roas_percent: totalSpend > 0 ? (totalPurchaseValue / totalSpend) * 100 : 0,
    };
  }, [filteredCreatives]);

  useEffect(() => {
    if (!selectedCreativeKey) {
      setSelectedDetail(null);
      setSelectedDaily([]);
      setSelectedDemo([]);
      return;
    }

    // In a real app, this would fetch from an API endpoint
    // For now, we'll just use the filtered creative data
    const selected = filteredCreatives.find((c) => c.creative_key === selectedCreativeKey);
    if (selected) {
      const detail: CreativeDetail = {
        id: 0,
        creative_id: selected.creative_key,
        creative_name: selected.creative_name,
        category: selected.category,
        format: selected.format,
        account_id: selected.account_id,
        video_id: null,
        image_hash: null,
        asset_feed_id: null,
        product_set_id: null,
        thumb_url: null,
        is_winner: 0,
        notes: null,
        manual_tags: null,
        status: selected.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_spend: selected.total_spend,
        total_impressions: selected.total_impressions,
        total_clicks: selected.total_clicks,
        total_purchases: selected.total_purchases,
        total_purchase_value: selected.total_purchase_value,
        ctr: selected.ctr,
        cpc: selected.cpc,
        cpm: selected.cpm,
        cpp: selected.cpp,
        roas_percent: selected.roas_percent,
        ad_count: selected.ad_count,
        creative_key: selected.creative_key,
      };
      setSelectedDetail(detail);
      // TODO: Fetch actual daily and demographic data from API
      setSelectedDaily([]);
      setSelectedDemo([]);
    }
  }, [selectedCreativeKey, filteredCreatives]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleWinnerToggle = useCallback(async (creativeKey: string, isWinner: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('/api/creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggleWinner',
          creativeKey,
          isWinner,
        }),
      });

      const result = await response.json();
      if (result.success) {
        showNotification('success', result.message);
        // Update local state
        setSelectedDetail((prev) =>
          prev ? { ...prev, is_winner: isWinner ? 1 : 0 } : null
        );
      } else {
        showNotification('error', result.message);
      }
    } catch (error) {
      showNotification('error', '요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStatusChange = useCallback(async (creativeKey: string, status: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          creativeKey,
          status,
        }),
      });

      const result = await response.json();
      if (result.success) {
        showNotification('success', result.message);
        // Update local state
        setCreatives((prev) =>
          prev.map((c) => (c.creative_key === creativeKey ? { ...c, status } : c))
        );
        setSelectedDetail((prev) =>
          prev ? { ...prev, status } : null
        );
      } else {
        showNotification('error', result.message);
      }
    } catch (error) {
      showNotification('error', '요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMetadataUpdate = useCallback(async (creativeKey: string, notes: string, tags: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateMetadata',
          creativeKey,
          notes,
          tags,
        }),
      });

      const result = await response.json();
      if (result.success) {
        showNotification('success', result.message);
        // Update local state
        setSelectedDetail((prev) =>
          prev ? { ...prev, notes, manual_tags: tags } : null
        );
      } else {
        showNotification('error', result.message);
      }
    } catch (error) {
      showNotification('error', '요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectedCreative = filteredCreatives.find((c) => c.creative_key === selectedCreativeKey);

  return (
    <div>
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg text-white font-medium transition-all ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 z-[55] flex items-center justify-center">
          <div className="bg-white rounded-lg px-6 py-4">
            <p className="text-gray-700 font-medium">처리 중...</p>
          </div>
        </div>
      )}

      <KPISummary metrics={summaryMetrics} />

      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        <div className="lg:w-64 flex-shrink-0">
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            categories={categories}
          />
        </div>

        <div className="flex-1 min-w-0">
          <CreativeGrid
            creatives={filteredCreatives}
            onCreativeSelect={(creative) => setSelectedCreativeKey(creative.creative_key)}
          />
          <div className="mt-4 text-sm text-gray-600">
            {filteredCreatives.length} 개 소재 표시
          </div>
        </div>
      </div>

      {selectedDetail && (
        <CreativeDetailModal
          detail={selectedDetail}
          dailyData={selectedDaily}
          demoData={selectedDemo}
          onClose={() => setSelectedCreativeKey(null)}
          onWinnerToggle={handleWinnerToggle}
          onStatusChange={handleStatusChange}
          onMetadataUpdate={handleMetadataUpdate}
        />
      )}
    </div>
  );
}
