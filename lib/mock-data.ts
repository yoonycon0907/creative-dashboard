import { getDatabase } from './db';
import { ACCOUNTS } from '@/config/accounts';

const CATEGORIES = ['치킨', '김치', '기타'];
const FORMATS = ['video', 'image', 'carousel'];
const STATUSES = ['running', 'paused', 'ended'];
const GENDERS = ['M', 'F'];
const AGE_RANGES = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCreativeName(category: string, format: string): string {
  const names: Record<string, string[]> = {
    '치킨': ['소바바 시즈닝', '소바바 프리미엄', '소바바 신제품'],
    '김치': ['해남재 김치 추천', '해남재 신맛', '해남재 매운맛'],
    '기타': ['CJ 상품 1', 'CJ 상품 2', 'CJ 상품 3'],
  };
  const nameList = names[category] || names['기타'];
  return `${randomItem(nameList)} [${format}]`;
}

export function seedMockData(): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Insert accounts
  const accountIds: Record<string, number> = {};
  for (const account of Object.values(ACCOUNTS)) {
    const existing = db
      .prepare(`SELECT id FROM accounts WHERE meta_account_id = ?`)
      .get(account.metaAccountId);

    if (!existing) {
      const result = db
        .prepare(
          `INSERT INTO accounts (account_type, account_name, meta_account_id, country_code, currency, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(account.type, account.name, account.metaAccountId, account.countryCode, account.currency, now, now);
      accountIds[account.type] = result.lastInsertRowid as number;
    } else {
      accountIds[account.type] = existing.id;
    }
  }

  // Generate mock creatives and daily data
  const creativeIds: string[] = [];
  for (let i = 0; i < 100; i++) {
    const category = randomItem(CATEGORIES);
    const format = randomItem(FORMATS);
    const creativeKey = `MOCK:${i + 1}`;
    const creativeName = generateCreativeName(category, format);
    const accountType = randomItem(['cjdpm_self', 'cully_partner', 'naver_partner']);
    const accountId = accountIds[accountType];

    db.prepare(
      `INSERT OR IGNORE INTO creatives (account_id, creative_id, creative_key, format, creative_name, category, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(accountId, `ad_${i}`, creativeKey, format, creativeName, category, randomItem(STATUSES), now, now);

    creativeIds.push(`ad_${i}`);
  }

  // Generate daily data (last 6 months)
  const today = new Date();
  for (let i = 0; i < 180; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    for (const creativeId of creativeIds) {
      const accountId = Math.floor(Math.random() * 3) + 1;
      const spend = randomBetween(10000, 500000);
      const impressions = randomBetween(1000, 50000);
      const clicks = randomBetween(50, 5000);
      const purchases = randomBetween(10, 500);
      const purchaseValue = purchases * randomBetween(30000, 100000);

      db.prepare(
        `INSERT OR IGNORE INTO ad_daily (account_id, creative_id, date, spend, impressions, clicks, actions_omni_purchase, catalog_segment_actions, action_value, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        accountId,
        creativeId,
        dateStr,
        spend,
        impressions,
        clicks,
        accountId === 1 ? purchases : null,
        accountId !== 1 ? purchases : null,
        purchaseValue,
        now
      );

      // Generate demographic data (gender x age range)
      for (const gender of GENDERS) {
        for (const ageRange of AGE_RANGES) {
          const demoSpend = randomBetween(1000, 50000);
          const demoImpressions = randomBetween(100, 5000);
          const demoClicks = randomBetween(5, 500);
          const demoPurchases = randomBetween(1, 50);
          const demoPurchaseValue = demoPurchases * randomBetween(30000, 100000);

          db.prepare(
            `INSERT OR IGNORE INTO ad_demo_daily (account_id, creative_id, date, gender, age_range, spend, impressions, clicks, actions_omni_purchase, catalog_segment_actions, action_value, synced_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            accountId,
            creativeId,
            dateStr,
            gender,
            ageRange,
            demoSpend,
            demoImpressions,
            demoClicks,
            accountId === 1 ? demoPurchases : null,
            accountId !== 1 ? demoPurchases : null,
            demoPurchaseValue,
            now
          );
        }
      }
    }
  }

  console.log('✓ Mock data seeded successfully');
  console.log(`  - 100 creatives`);
  console.log(`  - 3 accounts`);
  console.log(`  - 180 days of data per creative`);
  console.log(`  - 14 demographic segments per day per creative`);
}
