// Environment configuration for sandbox and production
export type Environment = "sandbox" | "production";

// Change this to switch between environments
export const CURRENT_ENV: Environment = "sandbox" as Environment;

interface EnvironmentConfig {
  prayog: {
    apiBaseUrl: string;
    // Tenant ID is stored in Supabase secrets
  };
  razorpay: {
    // Keys are stored in Supabase secrets with environment prefix
    keyIdSecret: string; // Secret name in Supabase
    keySecretName: string; // Secret name in Supabase
  };
  supabase: {
    url: string;
    anonKey: string;
  };
}

const configs: Record<Environment, EnvironmentConfig> = {
  sandbox: {
    prayog: {
      apiBaseUrl: "https://sandbox-apis.prayog.io",
    },
    razorpay: {
      keyIdSecret: "RAZORPAY_KEY_ID",
      keySecretName: "RAZORPAY_KEY_SECRET",
    },
    supabase: {
      url: "https://tksfdvnogzsweteetjjw.supabase.co",
      anonKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrc2Zkdm5vZ3pzd2V0ZWV0amp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2OTgwMDIsImV4cCI6MjA3MTI3NDAwMn0.OfnOhzWQIpLUS4dHzkfiTGPtYoN8rloUqQfTc_iWcxs",
    },
  },
  production: {
    prayog: {
      apiBaseUrl: "https://apis.prayog.io", // Production Prayog URL
    },
    razorpay: {
      keyIdSecret: "RAZORPAY_PROD_KEY_ID",
      keySecretName: "RAZORPAY_PROD_KEY_SECRET",
    },
    supabase: {
      url: "https://tksfdvnogzsweteetjjw.supabase.co",
      anonKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrc2Zkdm5vZ3pzd2V0ZWV0amp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2OTgwMDIsImV4cCI6MjA3MTI3NDAwMn0.OfnOhzWQIpLUS4dHzkfiTGPtYoN8rloUqQfTc_iWcxs",
    },
  },
};

export const getConfig = (): EnvironmentConfig => configs[CURRENT_ENV];

export const isProd = (): boolean => CURRENT_ENV === "production";
export const isSandbox = (): boolean => CURRENT_ENV === "sandbox";

// Environment-specific Prayog tenant IDs (for frontend API calls)
const TENANT_IDS: Record<Environment, string> = {
  sandbox: "6901d6e05021c666ba4bef43",
  production: "6955190688051e07be389dc5",
};

// Environment-specific Prayog API keys (for frontend API calls)
const API_KEYS: Record<Environment, string> = {
  sandbox: "prayog_live_zYRTOk3AEUTqFsfFTBb0lQ5p27RzCIBv_259a6dad",
  production: "prayog_live_dqflUSIZs7LcnyIKfF1pc9YAaEF5L9Y9_c265003d",
};

// Backward compatibility - PRAYOG_CONFIG for existing imports
export const PRAYOG_CONFIG = {
  API_BASE_URL: getConfig().prayog.apiBaseUrl,
  TENANT_ID: TENANT_IDS[CURRENT_ENV],
  API_KEY: API_KEYS[CURRENT_ENV],
};
