import type { Metadata } from "next";
import { getPublicBrand } from "@/lib/branding";

export async function generateMetadata({ params }: { params: Promise<{ manufacturerSlug: string }> }): Promise<Metadata> {
  const { manufacturerSlug } = await params;
  const brand = await getPublicBrand(manufacturerSlug);
  return {
    title: brand ? `${brand.name} Training Center` : "Training Center",
    description: brand?.landing_description || "Product training and knowledge resources.",
  };
}

export default function ManufacturerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
