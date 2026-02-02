import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "./api";

export function useProducts(categoryUrl: string) {
  return useQuery({
    queryKey: ["products", categoryUrl],
    queryFn: () => fetchProducts(categoryUrl),
    staleTime: 1000 * 60 * 10, 
    retry: 2,
  });
}
