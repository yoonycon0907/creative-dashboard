'use client';

import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export interface CreativeDetail {
  id: number;
  creative_key: string;
  creative_id: string;
  creative_name: string;
  category: string;
  format: string;
  account_id: number;
  video_id: string | null;
  image_hash: string | null;
  asset_feed_id: string | null;
  product_set_id: string | null;
  thumb_url: string | null;
  is_winner: number;
  notes: string | null;
  manual_tags: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_purchases: number;
  total_purchase_value: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpp: number;
  roas_percent: number;
  ad_count: number;
}

export interface DailyPerformance {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  purchases: number;
  purchase_value: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas_percent: number;
}

export interface DemographicData {
  gender: string;
  age_range: string;
  spend: number;
  impressions: number;
  clicks: number;
  purchases: number;
  purchase_value: number;
  ctr: number;
  cpc: number;
}

interface CreativeDetailModalProps {
  detail: CreativeDetail | null;
  dailyData: DailyPerformance[];
  demoData: DemographicData[];
  onClose: () => void;
  onWinnerToggle: (creativeKey: string, isWinner: boolean) => void;
  onStatusChange: (creativeKey: string, status: string) => void;
  onMetadataUpdate: (creativeKey: string, notes: string, tags: string) => void;
}

const AGE_COLORS: Record<string, string> = {
  '13-17': '#8b5cf6',
  '18-24': '#ec4899',
  '25-34': '#f59e0b',
  '35-44': '#10b981',
  '45-54': '#06b6d4',
  '55-64': '#3b82f6',
  '65+': '#6366f1',
};

export function CreativeDetailModal({
  detail,
  dailyData,
  demoData,
  onClose,
  onWinnerToggle,
  onStatusChange,
  onMetadataUpdate,
}: CreativeDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState(detail?.notes || '');
  const [editTags, setEditTags] = useState(detail?.manual_tags || '');

  if (!detail) return null;

  const handleSaveMetadata = () => {
    if (detail) {
      onMetadataUpdate(detail.creative_key, editNotes, editTags);
      setIsEditing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{detail.creative_name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {detail.category} • {detail.format}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">지출</p>
                <p className="text-2xl font-bold text-gray-900">₩{Math.round(detail.total_spend).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">구매</p>
                <p className="text-2xl font-bold text-gray-900">{detail.total_purchases.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">ROAS</p>
                <p className="text-2xl font-bold text-blue-900">{detail.roas_percent.toLocaleString()}%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600">CTR</p>
                <p className="text-2xl font-bold text-purple-900">{detail.ctr.toFixed(2)}%</p>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">노출</p>
                <p className="text-lg font-semibold">{detail.total_impressions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">클릭</p>
                <p className="text-lg font-semibold">{detail.total_clicks.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">CPC</p>
                <p className="text-lg font-semibold">₩{Math.round(detail.cpc).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">CPM</p>
                <p className="text-lg font-semibold">₩{Math.round(detail.cpm).toLocaleString()}</p>
              </div>
            </div>

            {/* Performance Trend */}
            {dailyData.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">일일 성과 트렌드 (최근 30일)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      interval={Math.floor(dailyData.length / 6)}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                      formatter={(value: any) => [
                        typeof value === 'number' ? value.toLocaleString() : value,
                      ]}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="spend"
                      stroke="#f59e0b"
                      dot={false}
                      name="지출"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="roas_percent"
                      stroke="#10b981"
                      dot={false}
                      name="ROAS %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Demographics */}
            {demoData.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">성별/연령 분석</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Gender Split */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">성별 지출</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={[
                          ...demoData
                            .filter((d) => d.gender === 'M')
                            .reduce(
                              (acc, d) => {
                                const found = acc.find((a) => a.gender === 'M');
                                if (found) {
                                  found.spend += d.spend;
                                } else {
                                  acc.push({ gender: '남성', spend: d.spend });
                                }
                                return acc;
                              },
                              [] as any[]
                            ),
                          ...demoData
                            .filter((d) => d.gender === 'F')
                            .reduce(
                              (acc, d) => {
                                const found = acc.find((a) => a.gender === 'F');
                                if (found) {
                                  found.spend += d.spend;
                                } else {
                                  acc.push({ gender: '여성', spend: d.spend });
                                }
                                return acc;
                              },
                              [] as any[]
                            ),
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="gender" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="spend" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Age Range Split */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">연령대별 지출</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {demoData
                        .reduce(
                          (acc, d) => {
                            const found = acc.find((a) => a.age_range === d.age_range);
                            if (found) {
                              found.spend += d.spend;
                            } else {
                              acc.push({ age_range: d.age_range, spend: d.spend });
                            }
                            return acc;
                          },
                          [] as any[]
                        )
                        .sort((a, b) => b.spend - a.spend)
                        .map((row) => (
                          <div key={row.age_range} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: AGE_COLORS[row.age_range] || '#999' }}
                            />
                            <span className="text-sm text-gray-600 flex-1">{row.age_range}</span>
                            <span className="text-sm font-medium">₩{Math.round(row.spend).toLocaleString()}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata & Actions */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <select
                  value={detail.status}
                  onChange={(e) => onStatusChange(detail.creative_key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="running">운영중</option>
                  <option value="paused">중지</option>
                  <option value="ended">종료</option>
                </select>
              </div>

              <div>
                <button
                  onClick={() => onWinnerToggle(detail.creative_key, !detail.is_winner)}
                  className={`w-full py-2 px-3 rounded-md text-sm font-medium transition ${
                    detail.is_winner
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {detail.is_winner ? '⭐ 위너 선택됨' : '☆ 위너로 선택'}
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">태그 (쉼표로 구분)</label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveMetadata}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                {detail.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">메모</p>
                    <p className="text-sm text-gray-600">{detail.notes}</p>
                  </div>
                )}
                {detail.manual_tags && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">태그</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {detail.manual_tags.split(',').map((tag) => (
                        <span
                          key={tag}
                          className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full mt-4 bg-gray-300 text-gray-800 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                >
                  편집
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
