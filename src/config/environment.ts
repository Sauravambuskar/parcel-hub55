// Environment configuration for sandbox and production
export type Environment = 'sandbox' | 'production';

// Change this to switch between environments
// Set to 'sandbox' for testing, 'production' for live
export const CURRENT_ENV: Environment = 'sandbox' as Environment;

interface PrayogEnvConfig {
  API_BASE_URL: string;
  TENANT_ID_SECRET: string; // Secret name in Supabase for edge functions
}

interface RazorpayEnvConfig {
  KEY_ID_SECRET: string;
  KEY_SECRET_NAME: string;
}

interface SupabaseEnvConfig {
  URL: string;
  ANON_KEY: string;
}

interface EnvironmentConfig {
  prayog: PrayogEnvConfig;
  razorpay: RazorpayEnvConfig;
  supabase: SupabaseEnvConfig;
}

const configs: Record<Environment, EnvironmentConfig> = {
  sandbox: {
    prayog: {
      API_BASE_URL: 'https://sandbox-apis.prayog.io',
      TENANT_ID_SECRET: 'PRAYOG_TENANT_ID',
    },
    razorpay: {
      KEY_ID_SECRET: 'RAZORPAY_KEY_ID',
      KEY_SECRET_NAME: 'RAZORPAY_KEY_SECRET',
    },
    supabase: {
      URL: 'https://tksfdvnogzsweteetjjw.supabase.co',
      ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrc2Zkdm5vZ3pzd2V0ZWV0amp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2OTgwMDIsImV4cCI6MjA3MTI3NDAwMn0.OfnOhzWQIpLUS4dHzkfiTGPtYoN8rloUqQfTc_iWcxs',
    },
  },
  production: {
    prayog: {
      API_BASE_URL: 'https://apis.prayog.io',
      TENANT_ID_SECRET: 'PRAYOG_PROD_TENANT_ID',
    },
    razorpay: {
      KEY_ID_SECRET: 'RAZORPAY_PROD_KEY_ID',
      KEY_SECRET_NAME: 'RAZORPAY_PROD_KEY_SECRET',
    },
    supabase: {
      // Update these when you have a production Supabase project
      URL: 'https://YOUR_PROD_PROJECT.supabase.co',
      ANON_KEY: 'YOUR_PROD_ANON_KEY',
    },
  },
};

// Tenant IDs for each environment (these are public identifiers, not secrets)
const TENANT_IDS: Record<Environment, string> = {
  sandbox: '6901d6e05021c666ba4bef43',
  production: '', // Add your production tenant ID here
};

// API Keys for each environment (these are used for auth, consider moving to edge functions)
const API_KEYS: Record<Environment, string> = {
  sandbox: 'prayog_live_zYRTOk3AEUTqFsfFTBb0lQ5p27RzCIBv_259a6dad',
  production: '', // Add your production API key here (or use edge functions)
};

export const getConfig = (): EnvironmentConfig => configs[CURRENT_ENV];

export const isProd = (): boolean => CURRENT_ENV === 'production';
export const isSandbox = (): boolean => CURRENT_ENV === 'sandbox';

// For backward compatibility - exports matching the old PRAYOG_CONFIG format
export const PRAYOG_CONFIG = {
  API_BASE_URL: configs[CURRENT_ENV].prayog.API_BASE_URL,
  TENANT_ID: TENANT_IDS[CURRENT_ENV],
  API_KEY: API_KEYS[CURRENT_ENV],
};
