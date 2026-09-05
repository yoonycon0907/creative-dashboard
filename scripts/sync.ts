import * as dotenv from 'dotenv';
import { initDatabase, closeDatabase, getDatabase } from '@/lib/db';
import { getAllAccounts, ACCOUNTS } from '@/config/accounts';
import { syncAccount } from '@/lib/sync';
import { addMonths, format } from 'date-fns';

dotenv.config({ path: '.env.local' });

interface SyncArgs {
  type?: 'initial' | 'incremental';
  startDate?: string;
  endDate?: string;
}

function parseArgs(): SyncArgs {
  const args: SyncArgs = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg === '--initial') args.type = 'initial';
    if (arg === '--incremental') args.type = 'incremental';
    if (arg.startsWith('--start=')) args.startDate = arg.split('=')[1];
    if (arg.startsWith('--end=')) args.endDate = arg.split('=')[1];
  });
  return args;
}

async function initializeAccounts() {
  const db = getDatabase();
  const now = new Date().toISOString();

  for (const account of getAllAccounts()) {
    const existing = db
      .prepare(`SELECT id FROM accounts WHERE meta_account_id = ?`)
      .get(account.metaAccountId);

    if (!existing) {
      db.prepare(
        `INSERT INTO accounts (account_type, account_name, meta_account_id, country_code, currency, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(account.type, account.name, account.metaAccountId, account.countryCode, account.currency, now, now);
    }
  }
}

async function main() {
  try {
    initDatabase();

    const args = parseArgs();
    const syncType = args.type || 'incremental';

    console.log(`Starting ${syncType} sync...`);

    // Initialize accounts
    await initializeAccounts();

    // Determine date range
    let dateStart = args.startDate;
    let dateEnd = args.endDate || format(new Date(), 'yyyy-MM-dd');

    if (syncType === 'initial' && !dateStart) {
      dateStart = format(addMonths(new Date(), -12), 'yyyy-MM-dd');
    } else if (syncType === 'incremental' && !dateStart) {
      dateStart = format(addMonths(new Date(), -7), 'yyyy-MM-dd');
    }

    if (!dateStart) {
      throw new Error('Start date not specified');
    }

    console.log(`Sync period: ${dateStart} to ${dateEnd}`);

    // Get access tokens from environment
    const tokens = {
      cjdpm: process.env.META_ACCESS_TOKEN_CJDPM,
      cully: process.env.META_ACCESS_TOKEN_CULLY,
      naver: process.env.META_ACCESS_TOKEN_NAVER,
    };

    // Check tokens
    for (const [key, token] of Object.entries(tokens)) {
      if (!token) {
        throw new Error(`Missing token for ${key}: META_ACCESS_TOKEN_${key.toUpperCase()}`);
      }
    }

    const db = getDatabase();

    // Sync initial: month by month
    if (syncType === 'initial') {
      const startDateObj = new Date(dateStart);
      const endDateObj = new Date(dateEnd);
      let currentDate = startDateObj;

      while (currentDate <= endDateObj) {
        const monthStart = format(currentDate, 'yyyy-MM-dd');
        const monthEnd = format(addMonths(currentDate, 1), 'yyyy-MM-dd');

        console.log(`\n--- Syncing period: ${monthStart} to ${monthEnd} ---`);

        for (const [key, account] of Object.entries(ACCOUNTS)) {
          const accountDb = db
            .prepare(`SELECT id FROM accounts WHERE meta_account_id = ?`)
            .get(account.metaAccountId);

          if (!accountDb) {
            console.error(`Account ${account.name} not found in DB`);
            continue;
          }

          const token = tokens[key as keyof typeof tokens];
          if (!token) {
            console.error(`No token for ${key}`);
            continue;
          }

          try {
            await syncAccount({
              accountId: accountDb.id,
              account,
              accessToken: token,
              dateStart: monthStart,
              dateEnd: monthEnd,
            });
          } catch (error) {
            console.error(`Error syncing ${account.name}:`, error);
          }
        }

        currentDate = addMonths(currentDate, 1);
      }
    } else {
      // Incremental sync
      for (const [key, account] of Object.entries(ACCOUNTS)) {
        const accountDb = db
          .prepare(`SELECT id FROM accounts WHERE meta_account_id = ?`)
          .get(account.metaAccountId);

        if (!accountDb) {
          console.error(`Account ${account.name} not found in DB`);
          continue;
        }

        const token = tokens[key as keyof typeof tokens];
        if (!token) {
          console.error(`No token for ${key}`);
          continue;
        }

        try {
          await syncAccount({
            accountId: accountDb.id,
            account,
            accessToken: token,
            dateStart,
            dateEnd,
          });
        } catch (error) {
          console.error(`Error syncing ${account.name}:`, error);
        }
      }
    }

    // Print summary
    console.log('\n--- Sync Summary ---');
    printSummary();
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

function printSummary() {
  const db = getDatabase();

  const accounts = getAllAccounts();
  for (const account of accounts) {
    const stats = db
      .prepare(
        `SELECT
          SUM(spend) as total_spend,
          SUM(actions_omni_purchase) as total_purchases_self,
          SUM(catalog_segment_actions) as total_purchases_partner,
          SUM(action_value) as total_value
         FROM ad_daily WHERE account_id = (SELECT id FROM accounts WHERE meta_account_id = ?)`
      )
      .get(account.metaAccountId) as any;

    const totalPurchases = (stats.total_purchases_self || 0) + (stats.total_purchases_partner || 0);
    const roas =
      stats.total_spend > 0
        ? ((stats.total_value / stats.total_spend) * 100).toFixed(2)
        : '0.00';

    console.log(`${account.name}:`);
    console.log(`  Total Spend: ${(stats.total_spend || 0).toLocaleString()} ${account.currency}`);
    console.log(`  Total Purchases: ${totalPurchases}`);
    console.log(`  Total Value: ${(stats.total_value || 0).toLocaleString()} ${account.currency}`);
    console.log(`  ROAS: ${roas}%`);
  }
}

main();
