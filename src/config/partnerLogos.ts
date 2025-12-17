// Partner logo mapping for courier selection
// Uses publicly available courier company logos

export const PARTNER_LOGOS: Record<string, string> = {
  'bluedart': 'https://logo.clearbit.com/bluedart.com',
  'delhivery': 'https://logo.clearbit.com/delhivery.com',
  'dtdc': 'https://logo.clearbit.com/dtdc.in',
  'ecom_express': 'https://logo.clearbit.com/ecomexpress.in',
  'xpressbees': 'https://logo.clearbit.com/xpressbees.com',
  'shadowfax': 'https://logo.clearbit.com/shadowfax.in',
  'ekart': 'https://logo.clearbit.com/ekartlogistics.com',
  'amazon_shipping': 'https://logo.clearbit.com/amazon.in',
  'fedex': 'https://logo.clearbit.com/fedex.com',
  'india_post': 'https://logo.clearbit.com/indiapost.gov.in',
  'professional_couriers': 'https://logo.clearbit.com/tpcindia.com',
  'gati': 'https://logo.clearbit.com/gati.com',
  'firstflight': 'https://logo.clearbit.com/firstflight.net',
  'spoton': 'https://logo.clearbit.com/spoton.co.in',
  'trackon': 'https://logo.clearbit.com/trackoncourier.com',
  'safexpress': 'https://logo.clearbit.com/safexpress.com',
  'rivigo': 'https://logo.clearbit.com/rivigo.com',
  'movin': 'https://logo.clearbit.com/movin.in',
  'wow_express': 'https://logo.clearbit.com/wowexpress.in',
  'shiprocket': 'https://logo.clearbit.com/shiprocket.in',
};

export const getPartnerLogo = (partnerCode: string): string | null => {
  if (!partnerCode) return null;
  
  // Normalize the partner code to match our mapping keys
  const normalizedCode = partnerCode.toLowerCase().replace(/[- ]/g, '_');
  
  return PARTNER_LOGOS[normalizedCode] || null;
};
