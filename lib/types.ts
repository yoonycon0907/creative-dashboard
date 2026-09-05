export interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  campaign_id: string;
  creative: { id: string };
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED';
}

export interface MetaAdCreative {
  id: string;
  video_id?: string;
  image_hash?: string;
  asset_feed_id?: string;
  asset_feed?: {
    id: string;
    assets?: Array<{ id: string; image?: { url: string } }>;
  };
  dynamic_product_ads?: {
    product_set_id: string;
  };
  thumbnail_url?: string;
  image_url?: string;
}

export interface MetaInsights {
  spend: number;
  impressions: number;
  clicks: number;
  [key: string]: any;
}

export interface AdDaily {
  id: number;
  account_id: number;
  creative_id: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  actions_omni_purchase?: number;
  catalog_segment_actions?: number;
  action_value?: number;
  synced_at: string;
}

export interface Creative {
  id: number;
  account_id: number;
  creative_id: string;
  creative_key: string;
  video_id?: string;
  image_hash?: string;
  asset_feed_id?: string;
  product_set_id?: string;
  creative_name?: string;
  category?: string;
  format?: string;
  thumb_url?: string;
  thumb_local_path?: string;
  is_winner: number;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: number;
  account_id: number;
  sync_type: 'initial' | 'incremental' | 'full_refresh';
  period_start?: string;
  period_end?: string;
  creatives_fetched: number;
  creatives_created: number;
  creatives_updated: number;
  days_fetched: number;
  rows_inserted: number;
  rows_updated: number;
  status: 'in_progress' | 'completed' | 'failed';
  error_message?: string;
  api_calls_made: number;
  started_at: string;
  finished_at?: string;
  duration_seconds?: number;
}
