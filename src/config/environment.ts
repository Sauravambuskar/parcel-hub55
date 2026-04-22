// Environment configuration for sandbox and production
export type Environment = "sandbox" | "production";

// Default environment (can be overridden via localStorage)
const DEFAULT_ENV: Environment = "production" as Environment;

// Get current environment from localStorage or use default
export const getCurrentEnv = (): Environment => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('app_environment');
    if (stored === 'sandbox' || stored === 'production') {
      return stored;
    }
  }
  return DEFAULT_ENV;
};

// Set environment and reload page
export const setEnvironment = (env: Environment): void => {
  localStorage.setItem('app_environment', env);
  window.location.reload();
};

// For backward compatibility - this is now dynamic
export const CURRENT_ENV: Environment = getCurrentEnv();

interface EnvironmentConfig {
  razorpay: {
    keyIdSecret: string;
    keySecretName: string;
  };
  supabase: {
    url: string;
    anonKey: string;
  };
}

const configs: Record<Environment, EnvironmentConfig> = {
  sandbox: {
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

// Check if running on Lovable preview (not the published live app)
export const isLovablePreview = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname.includes('-preview--') || hostname === 'localhost' || hostname === '127.0.0.1';
};
