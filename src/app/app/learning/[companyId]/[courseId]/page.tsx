import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { completeCourseBlock } from "./actions";
import { ImageLightbox, type GalleryImage } from "@/components/image-lightbox";
import { ProductReference } from "@/components/product-reference";

type Block = { id: string; type: "rich_text" | "product_card" | "video" | "quiz"; title: string; content: { product_id?: string; annotation?: string; body?: string; image_url?: string; images?: GalleryImage[]; url?: string; specs?: {label:string;value:string}[]; selling_points?: string[]; compatibility?: string; product_url?: string; download_url?: string }; quiz_id: string | null; required: boolean; completed: boolean };
type Course = { id: string; title: string; description: string | null; blocks: Block[] };

function embedUrl(url?: string) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) return parsed.searchParams.get("v") ? `https://www.youtube.com/embed/${parsed.searchParams.get("v")}` : null;
    if (parsed.hostname === "youtu.be") return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.hostname.includes("vimeo.com")) return `https://player.vimeo.com/video/${parsed.pathname.split("/").filter(Boolean).pop()}`;
  } catch {}
  return null;
}

export default async function CoursePlayerPage({ params }: { params: Promise<{ companyId: string; courseId: string }> }) {
  const { companyId, courseId } = await params;
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand, { data, error }] = await Promise.all([
    supabase.auth.getUser(),
    getActiveBrand(),
    supabase.rpc("get_assigned_course", { target_company_id: companyId, target_course_id: courseId }),
  ]);
  if (!auth.user) redirect("/login");
  if (error || !data || !brand) notFound();
  const course = data as Course;
  const completed = course.blocks.filter((block) => block.completed).length;
  const percent = course.blocks.length ? Math.round((completed / course.blocks.length) * 100) : 0;

  return <div className="min-h-screen bg-[#f4f4f2] text-black">
    <ManufacturerHeader brand={brand} email={auth.user.email} />
    <main className="mx-auto max-w-4xl px-5 py-10 lg:py-14">
      <Link href={`/m/${brand.slug}/app`} className="text-sm font-extrabold uppercase tracking-wide" style={{ color: brand.primary_color }}>← My training</Link>
      <div className="mt-6 border border-black/10 bg-white p-7 shadow-sm sm:p-10">
        <p className="text-xs font-extrabold uppercase tracking-[.2em]" style={{ color: brand.primary_color }}>Learning course</p>
        <h1 className="mt-3 text-4xl font-extrabold uppercase tracking-tight">{course.title}</h1>
        {course.description && <p className="mt-4 max-w-2xl leading-7 text-black/60">{course.description}</p>}
        <div className="mt-7 h-2 overflow-hidden bg-black/10"><div className="h-full transition-all" style={{ width: `${percent}%`, backgroundColor: brand.primary_color }} /></div>
        <p className="mt-2 text-sm font-bold">{completed} of {course.blocks.length} complete · {percent}%</p>
      </div>

      <div className="mt-6 space-y-5">{course.blocks.map((block, index) => {
        const embed = embedUrl(block.content?.url);
        return <section key={block.id} className={`border bg-white p-7 shadow-sm sm:p-9 ${block.completed ? "border-green-300" : "border-black/10"}`}>
          <div className="flex items-start justify-between gap-5"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-black/40">Lesson {index + 1} · {block.type.replace("_", " ")}</p><h2 className="mt-2 text-2xl font-extrabold uppercase">{block.title}</h2></div>{block.completed && <span className="bg-green-100 px-3 py-1 text-xs font-extrabold uppercase text-green-800">Complete</span>}</div>
          {block.type === "rich_text" && <p className="mt-5 whitespace-pre-wrap leading-7 text-black/70">{block.content?.body}</p>}
          {block.type === "product_card" && block.content.product_id && <ProductReference productId={block.content.product_id} manufacturerSlug={brand.slug} primary={brand.primary_color} annotation={block.content.annotation}/>}
          {block.type === "product_card" && <div className="mt-5 grid gap-7"><ImageLightbox images={block.content.images?.length?block.content.images:(block.content.image_url?[{url:block.content.image_url}]:[])} alt={block.title} className="grid grid-cols-2 gap-2 sm:grid-cols-3 [&_button]:aspect-[4/3]"/><p className="whitespace-pre-wrap leading-7 text-black/70">{block.content?.body}</p>{block.content.selling_points?.length?<div className="border-l-4 bg-black/5 p-5" style={{borderColor:brand.primary_color}}><h3 className="font-extrabold uppercase">Key selling points</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-black/70">{block.content.selling_points.map(point=><li key={point}>{point}</li>)}</ul></div>:null}{block.content.specs?.length?<div><h3 className="font-extrabold uppercase">Specifications</h3><dl className="mt-3 divide-y divide-black/10 border-y border-black/10">{block.content.specs.map(spec=><div key={`${spec.label}-${spec.value}`} className="grid grid-cols-2 gap-4 py-3 text-sm"><dt className="font-bold">{spec.label}</dt><dd className="text-black/65">{spec.value}</dd></div>)}</dl></div>:null}{block.content.compatibility&&<div><h3 className="font-extrabold uppercase">Compatibility & fitment</h3><p className="mt-2 whitespace-pre-wrap text-black/70">{block.content.compatibility}</p></div>}{(block.content.product_url||block.content.download_url)&&<div className="flex flex-wrap gap-3">{block.content.product_url&&<a href={block.content.product_url} target="_blank" rel="noreferrer" className="border-2 border-black px-4 py-3 text-sm font-extrabold uppercase">Product page ↗</a>}{block.content.download_url&&<a href={block.content.download_url} target="_blank" rel="noreferrer" className="border-2 border-black px-4 py-3 text-sm font-extrabold uppercase">Manual / spec sheet ↗</a>}</div>}</div>}
          {block.type === "video" && (embed ? <div className="mt-5 aspect-video overflow-hidden bg-black"><iframe src={embed} title={block.title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div> : <a href={block.content?.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center px-5 font-extrabold uppercase text-white" style={{ backgroundColor: brand.primary_color }}>Watch video ↗</a>)}
          {block.type === "quiz" && block.quiz_id && <Link href={`/m/${brand.slug}/app/training/${companyId}/${block.quiz_id}`} className="mt-5 inline-flex min-h-11 items-center px-5 font-extrabold uppercase text-white" style={{ backgroundColor: brand.primary_color }}>Take knowledge check</Link>}
          {!block.completed && <form action={completeCourseBlock} className="mt-6 border-t border-black/10 pt-5"><input type="hidden" name="companyId" value={companyId}/><input type="hidden" name="courseId" value={courseId}/><input type="hidden" name="blockId" value={block.id}/><button className="min-h-11 border-2 border-black px-5 text-sm font-extrabold uppercase hover:bg-black hover:text-white">{block.type === "quiz" ? "Verify quiz completion" : "Mark lesson complete"}</button></form>}
        </section>;
      })}</div>
    </main>
  </div>;
}
