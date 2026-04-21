// Shared environment configuration for edge functions
// The environment is passed from the frontend via request headers

export type Environment = 'sandbox' | 'production';

interface PrayogConfig {
  apiBaseUrl: string;
  serviceabilityBaseUrl?: string;
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
    serviceabilityBaseUrl: 'https://prod-apis.prayog.io',
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
    serviceabilityBaseUrl: config.apiBaseUrl, // Now uses gateway on main API URL
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

interface ShadowfaxConfig {
  apiBaseUrl: string;
  tokenEnvVar: string;
}

export const SHADOWFAX_CONFIG: Record<Environment, ShadowfaxConfig> = {
  sandbox: {
    apiBaseUrl: 'https://dale.staging.shadowfax.in',
    tokenEnvVar: 'SHADOWFAX_STAGING_TOKEN',
  },
  production: {
    apiBaseUrl: 'https://dale.shadowfax.in',
    tokenEnvVar: 'SHADOWFAX_PROD_TOKEN',
  },
};

export function getShadowfaxConfig(env: Environment) {
  const config = SHADOWFAX_CONFIG[env];
  return {
    apiBaseUrl: config.apiBaseUrl,
    token: Deno.env.get(config.tokenEnvVar),
  };
}

interface DelhiveryConfig {
  apiBaseUrl: string;
  tokenEnvVar: string;
}

// Note: user has only a live token. We point sandbox at the staging URL but
// fall back to the prod token if the staging secret is not set, so the function
// works in both environments without two separate credentials.
export const DELHIVERY_CONFIG: Record<Environment, DelhiveryConfig> = {
  sandbox: {
    apiBaseUrl: 'https://staging-express.delhivery.com',
    tokenEnvVar: 'DELHIVERY_STAGING_TOKEN',
  },
  production: {
    apiBaseUrl: 'https://track.delhivery.com',
    tokenEnvVar: 'DELHIVERY_PROD_TOKEN',
  },
};

export function getDelhiveryConfig(env: Environment) {
  const config = DELHIVERY_CONFIG[env];
  const primary = Deno.env.get(config.tokenEnvVar);
  // Fallback to prod token in sandbox if staging token not configured
  const token = primary || Deno.env.get('DELHIVERY_PROD_TOKEN');
  return {
    apiBaseUrl: config.apiBaseUrl,
    token,
  };
}
