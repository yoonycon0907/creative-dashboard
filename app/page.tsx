import { initDatabase } from '@/lib/db';
import { seedMockData } from '@/lib/mock-data';
import { getCreativesByFilter, getSummaryMetrics, getCategories } from '@/lib/queries';
import { DashboardClient } from '@/components/dashboard-client';

export default function Home() {
  // Initialize database and seed mock data
  const db = initDatabase();
  const hasMockData = db.prepare(`SELECT COUNT(*) as count FROM creatives`).get() as any;

  if (hasMockData.count === 0) {
    seedMockData();
  }

  // Get initial data
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const dateStart = sixMonthsAgo.toISOString().split('T')[0];
  const dateEnd = now.toISOString().split('T')[0];

  const creatives = getCreativesByFilter(undefined, dateStart, dateEnd, undefined, undefined, 'spend');
  const metrics = getSummaryMetrics(undefined, dateStart, dateEnd);
  const categories = getCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Meta 광고 소재별 성과 대시보드</h1>
          <p className="text-sm text-gray-600 mt-1">소재 단위로 성과를 집계하여 한눈에 비교하세요</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <DashboardClient
          initialCreatives={creatives}
          initialMetrics={metrics}
          categories={categories}
        />
      </main>
    </div>
  );
}
