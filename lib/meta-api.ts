import { AccountConfig } from '@/config/accounts';
import { MetaAd, MetaAdCreative, MetaInsights } from './types';

const API_VERSION = 'v26.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 5
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (response.status === 429) {
        // Rate limit
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Rate limit hit. Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API error: ${response.status} - ${JSON.stringify(error)}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`Attempt ${attempt + 1} failed. Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

export async function fetchAds(account: AccountConfig, accessToken: string): Promise<MetaAd[]> {
  const url = `${BASE_URL}/${account.metaAccountId}/ads?fields=id,name,adset_id,campaign_id,creative,status&access_token=${accessToken}&limit=100`;

  const result: MetaAd[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const response = await fetchWithRetry(nextUrl);
    result.push(...(response.data || []));
    nextUrl = response.paging?.cursors?.after
      ? `${url}&after=${response.paging.cursors.after}`
      : null;
  }

  return result;
}

export async function fetchCreative(
  creativeId: string,
  accessToken: string
): Promise<MetaAdCreative> {
  const fields = 'id,video_id,image_hash,asset_feed,asset_feed_id,dynamic_product_ads,thumbnail_url,image_url';
  const url = `${BASE_URL}/${creativeId}?fields=${fields}&access_token=${accessToken}`;
  return fetchWithRetry(url);
}

export async function fetchInsights(
  adId: string,
  account: AccountConfig,
  accessToken: string,
  dateStart: string,
  dateEnd: string
): Promise<MetaInsights[]> {
  const purchaseField = account.insightsConfig.purchaseField;
  const valueField = account.insightsConfig.valueField;
  const attributionWindows = account.insightsConfig.attributionWindows;

  const fields = [
    'spend',
    'impressions',
    'clicks',
    purchaseField,
    valueField,
  ].join(',');

  const url = new URL(`${BASE_URL}/${adId}/insights`);
  url.searchParams.append('fields', fields);
  url.searchParams.append('level', 'ad');
  url.searchParams.append('time_increment', '1');
  url.searchParams.append('date_start', dateStart);
  url.searchParams.append('date_stop', dateEnd);
  url.searchParams.append('action_attribution_windows', attributionWindows);
  url.searchParams.append('access_token', accessToken);
  url.searchParams.append('limit', '1000');

  const result: MetaInsights[] = [];
  let nextUrl: string | null = url.toString();

  while (nextUrl) {
    const response = await fetchWithRetry(nextUrl);
    if (response.data) {
      result.push(...response.data);
    }
    nextUrl = response.paging?.cursors?.after
      ? `${url}&after=${response.paging.cursors.after}`
      : null;
  }

  return result;
}

export function calculateCreativeKey(creative: MetaAdCreative): string {
  if (creative.video_id) {
    return `VIDEO:${creative.video_id}`;
  }
  if (creative.image_hash) {
    return `IMAGE:${creative.image_hash}`;
  }
  if (creative.asset_feed_id) {
    const firstAsset = creative.asset_feed?.assets?.[0];
    if (firstAsset?.id) {
      return `ASSET:${firstAsset.id}`;
    }
  }
  if (creative.dynamic_product_ads?.product_set_id) {
    return `CATALOG:${creative.dynamic_product_ads.product_set_id}`;
  }
  return `CREATIVE:${creative.id}`;
}
