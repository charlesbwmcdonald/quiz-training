"use client";

import { useState } from "react";
import { createCourse } from "./actions";
import { updateCourse } from "../[courseId]/edit/actions";

type Quiz = { quiz_id: string; title: string };
type Product = { product_id: string; name: string; category_name?: string; is_family: boolean; variation_count: number };
type Kind = "rich_text" | "product_card" | "video" | "quiz";
export type EditableCourseBlock = { id: string; type: Kind; title: string; body: string; url: string; quizId: string; productId: string; required: boolean };
export type EditableCourse = { id: string; title: string; description: string; status: "draft" | "published"; hasActivity: boolean; blocks: EditableCourseBlock[] };

const uid = () => `new-${Math.random().toString(36).slice(2)}`;
const blank = (type: Kind): EditableCourseBlock => ({ id: uid(), type, title: "", body: "", url: "", quizId: "", productId: "", required: true });

export default function CourseBuilder({ quizzes, products, primary, error, initialCourse }: { quizzes: Quiz[]; products: Product[]; primary: string; error?: string; initialCourse?: EditableCourse }) {
  const [blocks, setBlocks] = useState<EditableCourseBlock[]>(initialCourse?.blocks.length ? initialCourse.blocks : [blank("rich_text")]);
  const update = (id: string, patch: Partial<EditableCourseBlock>) => setBlocks((current) => current.map((block) => block.id === id ? { ...block, ...patch } : block));
  const payload = blocks.map((block) => ({
    id: block.id, type: block.type, title: block.title, required: block.required, quizId: block.quizId || null,
    content: block.type === "video" ? { url: block.url } : block.type === "product_card" && block.productId ? { product_id: block.productId, annotation: block.body } : { body: block.body },
  }));
  const editing = Boolean(initialCourse);

  return <form action={editing ? updateCourse : createCourse} className="mt-8 grid gap-6">
    {editing && <input type="hidden" name="courseId" value={initialCourse?.id} />}
    <input type="hidden" name="blocks" value={JSON.stringify(payload)} />
    {error && <div className="bg-red-50 p-4 text-red-900">{error}</div>}
    {editing && initialCourse?.status === "published" && <div className="border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-950"><b className="uppercase">Published course</b><p className="mt-1">Saved changes appear for everyone assigned to this course. Existing lesson completion is preserved unless you remove that lesson.</p></div>}
    {editing && initialCourse?.hasActivity && <div className="border-l-4 border-blue-600 bg-blue-50 p-4 text-sm text-blue-950"><b className="uppercase">Active training history</b><p className="mt-1">This course has assignments or learner activity. Its course link and retained lesson progress will remain intact.</p></div>}
    <section className="border bg-white p-6"><h2 className="text-xl font-extrabold uppercase">Course details</h2><label className="mt-5 grid gap-2 font-bold">Course title<input name="title" required defaultValue={initialCourse?.title} className="min-h-12 border px-4 font-normal" /></label><label className="mt-5 grid gap-2 font-bold">Description<textarea name="description" rows={3} defaultValue={initialCourse?.description} className="border p-4 font-normal" /></label></section>
    {blocks.map((block, index) => <section key={block.id} className="border bg-white p-6">
      <div className="flex justify-between gap-4"><div><span className="text-xs font-bold uppercase text-black/40">Block {index + 1}</span><select value={block.type} onChange={(event) => update(block.id, { type: event.target.value as Kind })} className="ml-3 border p-2 font-bold"><option value="rich_text">Text lesson</option><option value="product_card">Library product</option><option value="video">Video</option><option value="quiz">Quiz</option></select></div>{blocks.length > 1 && <button type="button" onClick={() => setBlocks((current) => current.filter((item) => item.id !== block.id))} className="font-bold text-red-700">Remove</button>}</div>
      <label className="mt-5 grid gap-2 font-bold">Lesson title<input value={block.title} onChange={(event) => update(block.id, { title: event.target.value })} className="min-h-11 border px-4 font-normal" /></label>
      {block.type === "product_card" ? <><label className="mt-4 grid gap-2 font-bold">Product<select value={block.productId} onChange={(event) => update(block.id, { productId: event.target.value })} required className="min-h-12 border bg-white px-4"><option value="">Choose a published product...</option>{products.map((product) => <option key={product.product_id} value={product.product_id}>{product.category_name ? `${product.category_name} - ` : ""}{product.name}{product.is_family ? ` - Family (${product.variation_count} variations)` : " - Product"}</option>)}</select></label><label className="mt-4 grid gap-2 font-bold">Course-specific coaching note <span className="text-xs font-normal text-black/45">Optional - does not change the master product</span><textarea value={block.body} onChange={(event) => update(block.id, { body: event.target.value })} rows={3} className="border p-4 font-normal" /></label></>
        : block.type === "quiz" ? <label className="mt-4 grid gap-2 font-bold">Published quiz<select value={block.quizId} onChange={(event) => update(block.id, { quizId: event.target.value })} required className="min-h-12 border bg-white px-4"><option value="">Choose quiz...</option>{quizzes.map((quiz) => <option key={quiz.quiz_id} value={quiz.quiz_id}>{quiz.title}</option>)}</select></label>
          : block.type === "video" ? <label className="mt-4 grid gap-2 font-bold">Video URL<input value={block.url} onChange={(event) => update(block.id, { url: event.target.value })} className="min-h-12 border px-4 font-normal" /></label>
            : <label className="mt-4 grid gap-2 font-bold">Lesson content<textarea value={block.body} onChange={(event) => update(block.id, { body: event.target.value })} rows={5} className="border p-4 font-normal" /></label>}
      <label className="mt-4 flex gap-3 font-bold"><input type="checkbox" checked={block.required} onChange={(event) => update(block.id, { required: event.target.checked })} /> Required for completion</label>
    </section>)}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{([["rich_text", "+ Text"], ["product_card", "+ Product"], ["video", "+ Video"], ["quiz", "+ Quiz"]] as const).map(([type, label]) => <button key={type} type="button" onClick={() => setBlocks((current) => [...current, blank(type)])} className="min-h-12 border-2 border-dashed bg-white font-bold uppercase">{label}</button>)}</div>
    <div className="flex flex-wrap justify-end gap-3"><button name="intent" value="draft" className="min-h-12 border-2 px-6 font-bold uppercase">{initialCourse?.status === "published" ? "Move to draft" : "Save draft"}</button><button name="intent" value="published" className="min-h-12 px-6 font-extrabold uppercase text-white" style={{ backgroundColor: primary }}>{initialCourse?.status === "published" ? "Save changes" : editing ? "Save & publish" : "Publish course"}</button></div>
  </form>;
}
