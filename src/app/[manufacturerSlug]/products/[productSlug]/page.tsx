import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductVariationViewer, type ProductDetail } from "@/components/product-variation-viewer";

type Product = ProductDetail & {
  manufacturer_name: string;
  manufacturer_slug: string;
  primary_color: string;
  logo_url: string | null;
  variations: ProductDetail[];
};

export default async function PublicProduct({ params }: { params: Promise<{ manufacturerSlug: string; productSlug: string }> }) {
  const { manufacturerSlug, productSlug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("get_public_product_v2", { manufacturer_slug: manufacturerSlug, product_slug: productSlug });
  if (!data) notFound();
  const product = data as Product;

  return <main className="min-h-screen bg-white">
    <header className="border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        {product.logo_url ? <Image src={product.logo_url} alt={product.manufacturer_name} width={180} height={48} className="max-h-12 w-auto" unoptimized /> : <b className="uppercase">{product.manufacturer_name}</b>}
        <Link href={`/m/${product.manufacturer_slug}`} className="text-sm font-bold uppercase">Training center</Link>
      </div>
    </header>
    <ProductVariationViewer parent={product} variations={product.variations ?? []} primary={product.primary_color} />
  </main>;
}
