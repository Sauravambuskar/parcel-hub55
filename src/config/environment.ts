// Environment configuration for sandbox and production
export type Environment = "sandbox" | "production";

// Change this to switch between environments
export const CURRENT_ENV: Environment = "sandbox";

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

export const isProd = () => CURRENT_ENV === "production";
export const isSandbox = () => CURRENT_ENV === "sandbox";
