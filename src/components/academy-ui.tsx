import type {ReactNode} from "react";

function cx(...values:(string|undefined|false)[]){return values.filter(Boolean).join(" ")}

export function AcademyPageHeader({eyebrow,title,description,accent,actions}:{eyebrow:string;title:string;description:string;accent:string;actions?:ReactNode}){
  return <header className="border-b border-black/10 pb-7">
    <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.2em]" style={{color:accent}}>{eyebrow}</p><h1 className="mt-2 text-4xl font-black uppercase leading-[.95] tracking-[-.035em] sm:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-[15px] leading-7 text-black/55 sm:min-h-14">{description}</p></div>
    {actions&&<div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
  </header>
}

export function AcademySurface({children,className}:{children:ReactNode;className?:string}){
  return <section className={cx("rounded-lg border border-black/10 bg-white shadow-[0_1px_2px_rgba(16,16,16,.05)]",className)}>{children}</section>
}

export const academyButton = {
  primary:"inline-flex min-h-11 items-center justify-center rounded-md px-5 text-xs font-black uppercase tracking-[.08em] text-white transition duration-150 hover:-translate-y-px hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2",
  secondary:"inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-5 text-xs font-black uppercase tracking-[.08em] text-black transition duration-150 hover:border-black/45 hover:bg-black/[.03] focus-visible:outline-2 focus-visible:outline-offset-2",
  tertiary:"inline-flex min-h-10 items-center justify-center rounded-md px-3 text-xs font-black uppercase tracking-[.08em] text-black/55 transition hover:bg-black/[.04] hover:text-black",
};

export const academyInput="min-h-11 w-full rounded-md border border-black/15 bg-white px-3 text-sm font-normal text-black outline-none transition focus:border-black/45 focus:ring-2 focus:ring-black/5";

export function StepLabel({number,children,accent}:{number:string;children:ReactNode;accent:string}){
  return <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-md text-xs font-black text-white" style={{backgroundColor:accent}}>{number}</span><p className="text-xs font-black uppercase tracking-[.16em] text-black/45">{children}</p></div>
}
