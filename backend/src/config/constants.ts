// Token quota constants by plan
export const TOKEN_QUOTAS = {
  free: 100000,      // 100K tokens per month
  basic: 1000000,    // 1M tokens per month
  pro: 10000000,     // 10M tokens per month
  enterprise: null,  // Unlimited
} as const;

// Quota reset period in milliseconds (30 days)
export const QUOTA_RESET_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

// Default plan for new users
export const DEFAULT_USER_PLAN = 'free';
