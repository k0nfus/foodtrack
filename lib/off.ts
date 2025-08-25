const USER_AGENT = 'foodtrack-mvp/1.0';

function getBaseUrl(category: 'Food' | 'Beauty' = 'Food'): string {
  return category === 'Food'
    ? 'https://world.openfoodfacts.net'
    : 'https://world.openbeautyfacts.net';
}

export interface Product {
  code: string;
  name: string;
  kcal100: number;
}

interface OFFProduct {
  code: string;
  product_name: string;
  nutriments: Record<string, any>;
}

function kcalFromNutriments(nutriments: Record<string, any>): number | null {
  if (typeof nutriments['energy-kcal_100g'] === 'number') {
    return nutriments['energy-kcal_100g'];
  }
  if (typeof nutriments['energy-kj_100g'] === 'number') {
    return nutriments['energy-kj_100g'] / 4.184;
  }
  return null;
}

export function calculateKcal(grams: number, kcalPer100g: number): number {
  return Math.round((grams * kcalPer100g) / 100);
}

export async function searchProducts(
  query: string,
  category: 'Food' | 'Beauty' = 'Food',
): Promise<Product[]> {
  const base = getBaseUrl(category);
  const url =
    `${base}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&json=1` +
    '&fields=code,product_name,nutriments&page_size=10&lc=de';
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const json = await res.json();
  return (json.products || []).map((p: OFFProduct) => ({
    code: p.code,
    name: p.product_name,
    kcal100: kcalFromNutriments(p.nutriments) ?? 0,
  }));
}

export async function fetchProduct(
  barcode: string,
  category: 'Food' | 'Beauty' = 'Food',
): Promise<Product | null> {
  const base = getBaseUrl(category);
  const url = `${base}/api/v0/product/${barcode}.json`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const json = await res.json();
  const p: OFFProduct | undefined = json.product;
  if (!p || !p.product_name) {
    return null;
  }
  return {
    code: p.code,
    name: p.product_name,
    kcal100: kcalFromNutriments(p.nutriments) ?? 0,
  };
}
