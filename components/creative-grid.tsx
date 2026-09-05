'use client';

import { CreativeWithMetrics } from '@/lib/queries';
import { CreativeCard } from './creative-card';

interface CreativeGridProps {
  creatives: CreativeWithMetrics[];
  onCreativeSelect?: (creative: CreativeWithMetrics) => void;
}

export function CreativeGrid({ creatives, onCreativeSelect }: CreativeGridProps) {
  if (creatives.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">조회된 소재가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {creatives.map((creative) => (
        <CreativeCard
          key={creative.creative_key}
          creative={creative}
          onClick={() => onCreativeSelect?.(creative)}
        />
      ))}
    </div>
  );
}
