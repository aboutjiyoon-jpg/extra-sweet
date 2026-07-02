import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { rowToProduct, type GiftRow } from "../lib/giftMapper";
import type { Product } from "../utils/filter";

// 모듈 레벨 캐시 — 앱 생명주기 동안 한 번만 페치
let cache: Product[] | null = null;
let fetchPromise: Promise<void> | null = null;

export function useGifts() {
  const [products, setProducts] = useState<Product[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache !== null) return;

    if (!fetchPromise) {
      fetchPromise = (async () => {
        const { data, error } = await supabase.from("gifts").select("*");
        if (error) {
          fetchPromise = null;
          throw error;
        }
        cache = ((data ?? []) as GiftRow[]).map(rowToProduct);
      })();
    }

    let cancelled = false;
    fetchPromise
      .then(() => {
        if (!cancelled) {
          setProducts(cache!);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading, error };
}
