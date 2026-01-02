import { supabase } from "@/integrations/supabase/client";
import { CURRENT_ENV } from "@/config/environment";

// Helper to get headers with environment info
export const getEnvironmentHeaders = (): Record<string, string> => ({
  'x-environment': CURRENT_ENV,
});

// Helper to invoke edge functions with environment context
export const invokeWithEnvironment = async <T>(
  functionName: string,
  body: Record<string, unknown>,
  additionalHeaders?: Record<string, string>
): Promise<{ data: T | null; error: Error | null }> => {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
    headers: {
      ...getEnvironmentHeaders(),
      ...additionalHeaders,
    },
  });

  return { data: data as T, error: error as Error | null };
};
