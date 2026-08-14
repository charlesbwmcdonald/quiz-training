"use client";

import { useState } from "react";
import { deleteProduct } from "./actions";

export default function ProductDeleteButton({
  productId,
  productName,
  variationCount = 0,
}: {
  productId: string;
  productName: string;
  variationCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const close = () => {
    setOpen(false);
    setConfirmation("");
  };

  return <>
    <button type="button" onClick={() => setOpen(true)} className="text-red-700">Delete</button>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5" role="dialog" aria-modal="true" aria-labelledby={`delete-${productId}`}>
      <div className="w-full max-w-lg border-2 border-black bg-white p-6 text-left shadow-2xl sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-red-700">Permanent action</p>
        <h2 id={`delete-${productId}`} className="mt-2 text-3xl font-extrabold uppercase">Delete {productName}?</h2>
        <p className="mt-4 leading-7 text-black/60">
          This permanently removes the product{variationCount > 0 ? ` and all ${variationCount} variations` : ""}. This cannot be undone.
        </p>
        <p className="mt-3 text-sm font-bold text-black/70">Products used in courses must be removed from those courses first.</p>
        <label className="mt-6 grid gap-2 font-bold">
          Type <span className="font-black text-red-700">DELETE</span> to confirm
          <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoFocus autoComplete="off" className="min-h-12 border-2 border-black px-4 font-normal" />
        </label>
        <form action={deleteProduct} className="mt-6 flex justify-end gap-3">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="confirmation" value={confirmation} />
          <button type="button" onClick={close} className="min-h-12 border-2 border-black px-5 font-extrabold uppercase">Cancel</button>
          <button disabled={confirmation !== "DELETE"} className="min-h-12 bg-red-700 px-5 font-extrabold uppercase text-white disabled:cursor-not-allowed disabled:opacity-35">Delete permanently</button>
        </form>
      </div>
    </div>}
  </>;
}
