'use client';

import { useCallback } from 'react';

export interface FilterState {
  accountIds: number[];
  dateStart: string;
  dateEnd: string;
  category?: string;
  status?: string;
  sortBy: 'spend' | 'roas' | 'purchases';
}

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categories: string[];
}

const STATUSES = [
  { value: '', label: '모든 상태' },
  { value: 'running', label: '운영중' },
  { value: 'paused', label: '중지' },
  { value: 'ended', label: '종료' },
];

const SORT_OPTIONS = [
  { value: 'spend' as const, label: '지출순' },
  { value: 'roas' as const, label: 'ROAS순' },
  { value: 'purchases' as const, label: '구매순' },
];

export function FilterSidebar({ filters, onFilterChange, categories }: FilterSidebarProps) {
  const handleDateStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange({ ...filters, dateStart: e.target.value });
    },
    [filters, onFilterChange]
  );

  const handleDateEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange({ ...filters, dateEnd: e.target.value });
    },
    [filters, onFilterChange]
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFilterChange({ ...filters, category: e.target.value || undefined });
    },
    [filters, onFilterChange]
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFilterChange({ ...filters, status: e.target.value || undefined });
    },
    [filters, onFilterChange]
  );

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFilterChange({ ...filters, sortBy: e.target.value as any });
    },
    [filters, onFilterChange]
  );

  return (
    <aside className="w-full lg:w-64 bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6 lg:mb-0">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">필터</h2>

      <div className="space-y-6">
        {/* 기간 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            기간 시작
          </label>
          <input
            type="date"
            value={filters.dateStart}
            onChange={handleDateStartChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            기간 종료
          </label>
          <input
            type="date"
            value={filters.dateEnd}
            onChange={handleDateEndChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            카테고리
          </label>
          <select
            value={filters.category || ''}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">모든 카테고리</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* 상태 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            상태
          </label>
          <select
            value={filters.status || ''}
            onChange={handleStatusChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* 정렬 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            정렬
          </label>
          <select
            value={filters.sortBy}
            onChange={handleSortChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
}
