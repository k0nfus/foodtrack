const BASE_URL = 'https://world.openfoodfacts.org/api/v2';
const USER_AGENT = 'foodtrack-mvp/1.0';

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

export async function searchProducts(query: string): Promise<Product[]> {
  const url = `${BASE_URL}/search?general_search=${encodeURIComponent(query)}&fields=code,product_name,nutriments&page_size=10`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const json = await res.json();
  return (json.products || []).map((p: OFFProduct) => ({
    code: p.code,
    name: p.product_name,
    kcal100: kcalFromNutriments(p.nutriments) ?? 0,
  }));
}

export async function fetchProduct(barcode: string): Promise<Product | null> {
  const url = `${BASE_URL}/product/${barcode}?fields=code,product_name,nutriments`;
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
