// Shared environment configuration for edge functions
// The environment is passed from the frontend via request headers

export type Environment = 'sandbox' | 'production';

interface PrayogConfig {
  apiBaseUrl: string;
  tenantIdEnvVar: string;
  apiKeyEnvVar: string;
}

interface RazorpayConfig {
  keyIdEnvVar: string;
  keySecretEnvVar: string;
}

export const PRAYOG_CONFIG: Record<Environment, PrayogConfig> = {
  sandbox: {
    apiBaseUrl: 'https://sandbox-apis.prayog.io',
    tenantIdEnvVar: 'PRAYOG_TENANT_ID',
    apiKeyEnvVar: 'PRAYOG_API_KEY',
  },
  production: {
    apiBaseUrl: 'https://apis.prayog.io',
    tenantIdEnvVar: 'PRAYOG_PROD_TENANT_ID',
    apiKeyEnvVar: 'PRAYOG_PROD_API_KEY',
  },
};

export const RAZORPAY_CONFIG: Record<Environment, RazorpayConfig> = {
  sandbox: {
    keyIdEnvVar: 'RAZORPAY_KEY_ID',
    keySecretEnvVar: 'RAZORPAY_KEY_SECRET',
  },
  production: {
    keyIdEnvVar: 'RAZORPAY_PROD_KEY_ID',
    keySecretEnvVar: 'RAZORPAY_PROD_KEY_SECRET',
  },
};

export function getEnvironmentFromRequest(req: Request): Environment {
  const envHeader = req.headers.get('x-environment');
  if (envHeader === 'production') {
    return 'production';
  }
  return 'sandbox'; // Default to sandbox
}

export function getPrayogConfig(env: Environment) {
  const config = PRAYOG_CONFIG[env];
  return {
    apiBaseUrl: config.apiBaseUrl,
    tenantId: Deno.env.get(config.tenantIdEnvVar),
    apiKey: Deno.env.get(config.apiKeyEnvVar),
  };
}

export function getRazorpayConfig(env: Environment) {
  const config = RAZORPAY_CONFIG[env];
  return {
    keyId: Deno.env.get(config.keyIdEnvVar),
    keySecret: Deno.env.get(config.keySecretEnvVar),
  };
}
