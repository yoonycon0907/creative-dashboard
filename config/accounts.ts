export interface AccountConfig {
  id: string;
  type: 'cjdpm_self' | 'cully_partner' | 'naver_partner';
  name: string;
  metaAccountId: string;
  businessAccountId?: string;
  countryCode: string;
  currency: string;
  insightsConfig: {
    purchaseField: string; // 'actions:omni_purchase' or 'catalog_segment_actions:purchase'
    valueField: string; // 'action_value:omni_purchase' or 'action_value'
    attributionWindows: string; // '1d_click' or '1d_view,1d_click'
  };
}

export const ACCOUNTS: Record<string, AccountConfig> = {
  cjdpm: {
    id: 'cjdpm_self',
    type: 'cjdpm_self',
    name: 'CJDPM 자사몰',
    metaAccountId: 'act_755429019968813',
    countryCode: 'KR',
    currency: 'KRW',
    insightsConfig: {
      purchaseField: 'actions:omni_purchase',
      valueField: 'action_value:omni_purchase',
      attributionWindows: '1d_click',
    },
  },
  cully: {
    id: 'cully_partner',
    type: 'cully_partner',
    name: '컬리 협력광고',
    metaAccountId: 'act_662564306201450',
    countryCode: 'KR',
    currency: 'KRW',
    insightsConfig: {
      purchaseField: 'catalog_segment_actions:purchase',
      valueField: 'action_value',
      attributionWindows: '1d_view,1d_click',
    },
  },
  naver: {
    id: 'naver_partner',
    type: 'naver_partner',
    name: '네이버 협력광고',
    metaAccountId: 'act_517752597868803',
    countryCode: 'KR',
    currency: 'KRW',
    insightsConfig: {
      purchaseField: 'catalog_segment_actions:purchase',
      valueField: 'action_value',
      attributionWindows: '1d_view,1d_click',
    },
  },
};

export function getAccountConfig(accountType: keyof typeof ACCOUNTS): AccountConfig {
  const config = ACCOUNTS[accountType];
  if (!config) {
    throw new Error(`Account ${accountType} not configured`);
  }
  return config;
}

export function getAllAccounts(): AccountConfig[] {
  return Object.values(ACCOUNTS);
}
