import { AccountConfig } from '@/config/accounts';
import { getDatabase } from './db';
import {
  fetchAds,
  fetchCreative,
  fetchInsights,
  calculateCreativeKey,
} from './meta-api';
import { MetaInsights } from './types';

interface SyncOptions {
  accountId: number;
  account: AccountConfig;
  accessToken: string;
  dateStart: string;
  dateEnd: string;
}

export async function syncAccount(options: SyncOptions): Promise<void> {
  const { accountId, account, accessToken, dateStart, dateEnd } = options;

  const db = getDatabase();
  const startedAt = new Date().toISOString();
  const logId = db
    .prepare(
      `INSERT INTO sync_log (account_id, sync_type, period_start, period_end, status, started_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(accountId, 'initial', dateStart, dateEnd, 'in_progress', startedAt).lastInsertRowid;

  try {
    console.log(`Starting sync for ${account.name} from ${dateStart} to ${dateEnd}...`);

    // Step 1: Fetch all ads
    console.log('Fetching ads...');
    const ads = await fetchAds(account, accessToken);
    console.log(`Fetched ${ads.length} ads`);

    // Step 2: Fetch creatives and upsert
    console.log('Fetching and upserting creatives...');
    const creativesSet = new Set<string>();
    const adToCreativeMap = new Map<string, string>();

    for (const ad of ads) {
      if (ad.creative?.id) {
        creativesSet.add(ad.creative.id);
        adToCreativeMap.set(ad.id, ad.creative.id);
      }
    }

    let creativesCreated = 0;
    let creativesUpdated = 0;

    for (const creativeId of creativesSet) {
      try {
        const creative = await fetchCreative(creativeId, accessToken);
        const creativeKey = calculateCreativeKey(creative);

        const existing = db
          .prepare(
            `SELECT id FROM creatives WHERE account_id = ? AND creative_key = ?`
          )
          .get(accountId, creativeKey);

        if (existing) {
          creativesUpdated++;
          db.prepare(
            `UPDATE creatives SET updated_at = ?, image_hash = ?, video_id = ?, asset_feed_id = ?, product_set_id = ?
             WHERE account_id = ? AND creative_key = ?`
          ).run(
            new Date().toISOString(),
            creative.image_hash || null,
            creative.video_id || null,
            creative.asset_feed_id || null,
            creative.dynamic_product_ads?.product_set_id || null,
            accountId,
            creativeKey
          );
        } else {
          creativesCreated++;
          db.prepare(
            `INSERT INTO creatives (account_id, creative_id, creative_key, video_id, image_hash, asset_feed_id, product_set_id, format, thumb_url, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            accountId,
            creativeId,
            creativeKey,
            creative.video_id || null,
            creative.image_hash || null,
            creative.asset_feed_id || null,
            creative.dynamic_product_ads?.product_set_id || null,
            determineFormat(creative),
            creative.image_url || creative.thumbnail_url || null,
            'running',
            new Date().toISOString(),
            new Date().toISOString()
          );
        }
      } catch (error) {
        console.error(`Error fetching creative ${creativeId}:`, error);
      }
    }

    console.log(`Creatives: ${creativesCreated} created, ${creativesUpdated} updated`);

    // Step 3: Fetch and upsert insights
    console.log('Fetching insights...');
    let rowsInserted = 0;
    let rowsUpdated = 0;

    for (const ad of ads) {
      const creativeId = adToCreativeMap.get(ad.id);
      if (!creativeId) continue;

      try {
        const insights = await fetchInsights(ad.id, account, accessToken, dateStart, dateEnd);

        for (const insight of insights) {
          const date = (insight as any).date_start || (insight as any).date;
          if (!date) continue;

          const spend = parseFloat(String(insight.spend || '0'));
          const impressions = parseInt(String(insight.impressions || '0'), 10);
          const clicks = parseInt(String(insight.clicks || '0'), 10);

          // Handle account-specific fields
          let actions = 0;
          let actionValue = 0;

          if (account.insightsConfig.purchaseField === 'actions:omni_purchase') {
            actions = parseInt((insight as any)['actions'] || '0', 10);
            actionValue = parseFloat((insight as any)['action_value'] || '0');
          } else {
            actions = parseInt((insight as any)['catalog_segment_actions'] || '0', 10);
            actionValue = parseFloat((insight as any)['action_value'] || '0');
          }

          const existing = db
            .prepare(
              `SELECT id FROM ad_daily WHERE account_id = ? AND creative_id = ? AND date = ?`
            )
            .get(accountId, creativeId, date);

          if (existing) {
            rowsUpdated++;
            db.prepare(
              `UPDATE ad_daily SET spend = ?, impressions = ?, clicks = ?, actions_omni_purchase = ?, catalog_segment_actions = ?, action_value = ?, synced_at = ?
               WHERE account_id = ? AND creative_id = ? AND date = ?`
            ).run(
              spend,
              impressions,
              clicks,
              account.insightsConfig.purchaseField === 'actions:omni_purchase' ? actions : null,
              account.insightsConfig.purchaseField === 'catalog_segment_actions:purchase' ? actions : null,
              actionValue,
              new Date().toISOString(),
              accountId,
              creativeId,
              date
            );
          } else {
            rowsInserted++;
            db.prepare(
              `INSERT INTO ad_daily (account_id, creative_id, date, spend, impressions, clicks, actions_omni_purchase, catalog_segment_actions, action_value, synced_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(
              accountId,
              creativeId,
              date,
              spend,
              impressions,
              clicks,
              account.insightsConfig.purchaseField === 'actions:omni_purchase' ? actions : null,
              account.insightsConfig.purchaseField === 'catalog_segment_actions:purchase' ? actions : null,
              actionValue,
              new Date().toISOString()
            );
          }
        }
      } catch (error) {
        console.error(`Error fetching insights for ad ${ad.id}:`, error);
      }
    }

    console.log(`Insights: ${rowsInserted} inserted, ${rowsUpdated} updated`);

    // Update sync log
    const finishedAt = new Date().toISOString();
    const duration = Math.round((new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000);

    db.prepare(
      `UPDATE sync_log SET status = ?, finished_at = ?, duration_seconds = ?, creatives_created = ?, creatives_updated = ?, rows_inserted = ?, rows_updated = ?
       WHERE id = ?`
    ).run('completed', finishedAt, duration, creativesCreated, creativesUpdated, rowsInserted, rowsUpdated, logId);

    console.log(`Sync completed in ${duration}s`);
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);

    db.prepare(
      `UPDATE sync_log SET status = ?, finished_at = ?, error_message = ?
       WHERE id = ?`
    ).run('failed', finishedAt, errorMessage, logId);

    throw error;
  }
}

function determineFormat(creative: any): string {
  if (creative.video_id) return 'video';
  if (creative.asset_feed_id) return 'carousel';
  if (creative.dynamic_product_ads) return 'catalog';
  return 'image';
}
