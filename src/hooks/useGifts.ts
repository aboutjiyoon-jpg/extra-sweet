import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { rowToProduct, type GiftRow } from "../lib/giftMapper";
import type { Product } from "../utils/filter";

export function useGifts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase.from("gifts").select("*");
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setProducts([]);
      } else {
        setProducts(((data ?? []) as GiftRow[]).map(rowToProduct));
        setError(null);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading, error };
}
