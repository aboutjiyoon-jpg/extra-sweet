import type { Product } from "../utils/filter";

export interface GiftRow {
  id: string;
  name: string;
  brand: string;
  price: number;
  price_group: string;
  receiver: string[];
  tags: string[];
  category: string;
  occasion: string[];
  is_premium: boolean;
  sense_tag: string | null;
  images: string[];
  headline: string;
  review: string;
  brand_story: string | null;
  reason: string | null;
  sense_point: string | null;
  upgrade_of: string | null;
  related_to: string | null;
  links: Record<string, string> | null;
  created_at?: string;
}

export function rowToProduct(row: GiftRow): Product {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: row.price,
    priceGroup: row.price_group,
    receiver: row.receiver ?? [],
    tags: row.tags ?? [],
    category: row.category,
    occasion: row.occasion ?? [],
    isPremium: row.is_premium,
    senseTag: row.sense_tag ?? "",
    images: row.images ?? [],
    headline: row.headline,
    review: row.review,
    brandStory: row.brand_story,
    reason: row.reason ?? "",
    sensePoint: row.sense_point ?? "",
    upgradeOf: row.upgrade_of,
    relatedTo: row.related_to,
    links: {
      coupang: row.links?.coupang ?? "",
      "29cm": row.links?.["29cm"] ?? "",
      kakaoGift: row.links?.kakaoGift ?? "",
      brandSite: row.links?.brandSite ?? "",
    },
    createdAt: row.created_at,
  };
}

export function productToGiftPayload(product: Product) {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: product.price,
    priceGroup: product.priceGroup,
    receiver: product.receiver,
    tags: product.tags,
    category: product.category,
    occasion: product.occasion,
    isPremium: product.isPremium,
    senseTag: product.senseTag,
    images: product.images,
    headline: product.headline,
    review: product.review,
    brandStory: product.brandStory,
    reason: product.reason,
    sensePoint: product.sensePoint,
    upgradeOf: product.upgradeOf,
    relatedTo: product.relatedTo,
    links: product.links,
  };
}
