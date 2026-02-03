"use client";

import dynamic from "next/dynamic";

const ProductPage = dynamic(() => import("./ProductPage"), {
  ssr: false,
});

export default function ClientOnlyProduct() {
  return <ProductPage />;
}
