import { getDatabase } from './db';

export interface CreativeWithMetrics {
  creative_key: string;
  creative_name: string;
  category: string;
  format: string;
  account_id: number;
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
  status: string;
  ad_count: number;
}

export interface SummaryMetrics {
  total_spend: number;
  total_purchases: number;
  total_purchase_value: number;
  total_impressions: number;
  total_clicks: number;
  avg_ctr: number;
  avg_cpc: number;
  avg_cpm: number;
  avg_roas_percent: number;
}

export function getCreativesByFilter(
  accountIds?: number[],
  dateStart?: string,
  dateEnd?: string,
  category?: string,
  status?: string,
  sortBy: 'spend' | 'roas' | 'purchases' = 'spend'
): CreativeWithMetrics[] {
  const db = getDatabase();

  let query = `
    SELECT
      c.creative_key,
      c.creative_name,
      c.category,
      c.format,
      c.account_id,
      SUM(ad.spend) as total_spend,
      SUM(ad.impressions) as total_impressions,
      SUM(ad.clicks) as total_clicks,
      COALESCE(SUM(ad.actions_omni_purchase), 0) + COALESCE(SUM(ad.catalog_segment_actions), 0) as total_purchases,
      SUM(ad.action_value) as total_purchase_value,
      ROUND(CAST(SUM(ad.clicks) AS REAL) / NULLIF(SUM(ad.impressions), 0) * 100, 2) as ctr,
      ROUND(SUM(ad.spend) / NULLIF(SUM(ad.clicks), 0), 0) as cpc,
      ROUND(SUM(ad.spend) / NULLIF(SUM(ad.impressions), 0) * 1000, 0) as cpm,
      ROUND(SUM(ad.spend) / NULLIF(COALESCE(SUM(ad.actions_omni_purchase), 0) + COALESCE(SUM(ad.catalog_segment_actions), 0), 0), 0) as cpp,
      ROUND(SUM(ad.action_value) / NULLIF(SUM(ad.spend), 0) * 100, 2) as roas_percent,
      c.status,
      COUNT(DISTINCT ad.creative_id) as ad_count
    FROM creatives c
    LEFT JOIN ad_daily ad ON c.account_id = ad.account_id AND c.creative_id = ad.creative_id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (accountIds && accountIds.length > 0) {
    const placeholders = accountIds.map(() => '?').join(',');
    query += ` AND c.account_id IN (${placeholders})`;
    params.push(...accountIds);
  }

  if (dateStart) {
    query += ` AND ad.date >= ?`;
    params.push(dateStart);
  }

  if (dateEnd) {
    query += ` AND ad.date <= ?`;
    params.push(dateEnd);
  }

  if (category) {
    query += ` AND c.category = ?`;
    params.push(category);
  }

  if (status) {
    query += ` AND c.status = ?`;
    params.push(status);
  }

  query += ` GROUP BY c.creative_key`;

  if (sortBy === 'spend') {
    query += ` ORDER BY total_spend DESC`;
  } else if (sortBy === 'roas') {
    query += ` ORDER BY roas_percent DESC`;
  } else if (sortBy === 'purchases') {
    query += ` ORDER BY total_purchases DESC`;
  }

  return db.prepare(query).all(...params) as CreativeWithMetrics[];
}

export function getSummaryMetrics(
  accountIds?: number[],
  dateStart?: string,
  dateEnd?: string,
  category?: string
): SummaryMetrics {
  const db = getDatabase();

  let query = `
    SELECT
      SUM(ad.spend) as total_spend,
      COALESCE(SUM(ad.actions_omni_purchase), 0) + COALESCE(SUM(ad.catalog_segment_actions), 0) as total_purchases,
      SUM(ad.action_value) as total_purchase_value,
      SUM(ad.impressions) as total_impressions,
      SUM(ad.clicks) as total_clicks
    FROM creatives c
    LEFT JOIN ad_daily ad ON c.account_id = ad.account_id AND c.creative_id = ad.creative_id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (accountIds && accountIds.length > 0) {
    const placeholders = accountIds.map(() => '?').join(',');
    query += ` AND c.account_id IN (${placeholders})`;
    params.push(...accountIds);
  }

  if (dateStart) {
    query += ` AND ad.date >= ?`;
    params.push(dateStart);
  }

  if (dateEnd) {
    query += ` AND ad.date <= ?`;
    params.push(dateEnd);
  }

  if (category) {
    query += ` AND c.category = ?`;
    params.push(category);
  }

  const result = db.prepare(query).get(...params) as any;

  const total_spend = result.total_spend || 0;
  const total_purchases = result.total_purchases || 0;
  const total_impressions = result.total_impressions || 0;
  const total_clicks = result.total_clicks || 0;
  const total_purchase_value = result.total_purchase_value || 0;

  return {
    total_spend,
    total_purchases,
    total_purchase_value,
    total_impressions,
    total_clicks,
    avg_ctr: total_impressions > 0 ? (total_clicks / total_impressions) * 100 : 0,
    avg_cpc: total_clicks > 0 ? total_spend / total_clicks : 0,
    avg_cpm: total_impressions > 0 ? (total_spend / total_impressions) * 1000 : 0,
    avg_roas_percent: total_spend > 0 ? (total_purchase_value / total_spend) * 100 : 0,
  };
}

export function getCategories(): string[] {
  const db = getDatabase();
  const result = db.prepare(`SELECT DISTINCT category FROM creatives WHERE category IS NOT NULL ORDER BY category`).all() as any[];
  return result.map((r) => r.category);
}

export interface CreativeDetail extends CreativeWithMetrics {
  id: number;
  creative_id: string;
  video_id: string | null;
  image_hash: string | null;
  asset_feed_id: string | null;
  product_set_id: string | null;
  thumb_url: string | null;
  is_winner: number;
  notes: string | null;
  manual_tags: string | null;
  created_at: string;
  updated_at: string;
}

export function getCreativeDetail(creativeKey: string): CreativeDetail | null {
  const db = getDatabase();
  const query = `
    SELECT
      c.id,
      c.creative_id,
      c.creative_key,
      c.creative_name,
      c.category,
      c.format,
      c.account_id,
      c.video_id,
      c.image_hash,
      c.asset_feed_id,
      c.product_set_id,
      c.thumb_url,
      c.is_winner,
      c.notes,
      c.manual_tags,
      c.status,
      c.created_at,
      c.updated_at,
      SUM(ad.spend) as total_spend,
      SUM(ad.impressions) as total_impressions,
      SUM(ad.clicks) as total_clicks,
      COALESCE(SUM(ad.actions_omni_purchase), 0) + COALESCE(SUM(ad.catalog_segment_actions), 0) as total_purchases,
      SUM(ad.action_value) as total_purchase_value,
      ROUND(CAST(SUM(ad.clicks) AS REAL) / NULLIF(SUM(ad.impressions), 0) * 100, 2) as ctr,
      ROUND(SUM(ad.spend) / NULLIF(SUM(ad.clicks), 0), 0) as cpc,
      ROUND(SUM(ad.spend) / NULLIF(SUM(ad.impressions), 0) * 1000, 0) as cpm,
      ROUND(SUM(ad.spend) / NULLIF(COALESCE(SUM(ad.actions_omni_purchase), 0) + COALESCE(SUM(ad.catalog_segment_actions), 0), 0), 0) as cpp,
      ROUND(SUM(ad.action_value) / NULLIF(SUM(ad.spend), 0) * 100, 2) as roas_percent,
      COUNT(DISTINCT ad.creative_id) as ad_count
    FROM creatives c
    LEFT JOIN ad_daily ad ON c.account_id = ad.account_id AND c.creative_id = ad.creative_id
    WHERE c.creative_key = ?
    GROUP BY c.creative_key
  `;

  const result = db.prepare(query).get(creativeKey) as CreativeDetail | undefined;
  return result || null;
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

export function getCreativeDailyPerformance(creativeKey: string, dateStart?: string, dateEnd?: string): DailyPerformance[] {
  const db = getDatabase();

  let query = `
    SELECT
      ad.date,
      SUM(ad.spend) as spend,
      SUM(ad.impressions) as impressions,
      SUM(ad.clicks) as clicks,
      COALESCE(SUM(ad.actions_omni_purchase), 0) + COALESCE(SUM(ad.catalog_segment_actions), 0) as purchases,
      SUM(ad.action_value) as purchase_value,
      ROUND(CAST(SUM(ad.clicks) AS REAL) / NULLIF(SUM(ad.impressions), 0) * 100, 2) as ctr,
      ROUND(SUM(ad.spend) / NULLIF(SUM(ad.clicks), 0), 0) as cpc,
      ROUND(SUM(ad.spend) / NULLIF(SUM(ad.impressions), 0) * 1000, 0) as cpm,
      ROUND(SUM(ad.action_value) / NULLIF(SUM(ad.spend), 0) * 100, 2) as roas_percent
    FROM ad_daily ad
    JOIN creatives c ON ad.account_id = c.account_id AND ad.creative_id = c.creative_id
    WHERE c.creative_key = ?
  `;

  const params: any[] = [creativeKey];

  if (dateStart) {
    query += ` AND ad.date >= ?`;
    params.push(dateStart);
  }

  if (dateEnd) {
    query += ` AND ad.date <= ?`;
    params.push(dateEnd);
  }

  query += ` GROUP BY ad.date ORDER BY ad.date DESC`;

  return db.prepare(query).all(...params) as DailyPerformance[];
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

export function getCreativeDemographics(creativeKey: string, dateStart?: string, dateEnd?: string): DemographicData[] {
  const db = getDatabase();

  let query = `
    SELECT
      demo.gender,
      demo.age_range,
      SUM(demo.spend) as spend,
      SUM(demo.impressions) as impressions,
      SUM(demo.clicks) as clicks,
      COALESCE(SUM(demo.actions_omni_purchase), 0) + COALESCE(SUM(demo.catalog_segment_actions), 0) as purchases,
      SUM(demo.action_value) as purchase_value,
      ROUND(CAST(SUM(demo.clicks) AS REAL) / NULLIF(SUM(demo.impressions), 0) * 100, 2) as ctr,
      ROUND(SUM(demo.spend) / NULLIF(SUM(demo.clicks), 0), 0) as cpc
    FROM ad_demo_daily demo
    JOIN creatives c ON demo.account_id = c.account_id AND demo.creative_id = c.creative_id
    WHERE c.creative_key = ?
  `;

  const params: any[] = [creativeKey];

  if (dateStart) {
    query += ` AND demo.date >= ?`;
    params.push(dateStart);
  }

  if (dateEnd) {
    query += ` AND demo.date <= ?`;
    params.push(dateEnd);
  }

  query += ` GROUP BY demo.gender, demo.age_range ORDER BY demo.gender, demo.age_range`;

  return db.prepare(query).all(...params) as DemographicData[];
}
