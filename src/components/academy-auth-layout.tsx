import Image from "next/image";
import Link from "next/link";
import type {ReactNode} from "react";

type AuthBrand={name:string;slug:string;logo_url:string|null;primary_color:string;secondary_color:string};

export default function AcademyAuthLayout({brand,backgroundImage,eyebrow,headline,description,children,homeHref,platform=false}:{brand?:AuthBrand|null;backgroundImage?:string|null;eyebrow:string;headline:ReactNode;description:string;children:ReactNode;homeHref?:string;platform?:boolean}){
  const primary=brand?.primary_color??"#ff4f1f";const secondary=brand?.secondary_color??"#101010";const home=homeHref??(brand?`/m/${brand.slug}`:"/");
  const mark=brand?.logo_url?<Image src={brand.logo_url} alt={`${brand.name} logo`} width={210} height={52} className="max-h-12 w-auto object-contain brightness-0 invert" priority unoptimized/>:<span className="text-2xl font-black uppercase tracking-[-.05em]">{platform?<>Jobber<span style={{color:primary}}>Train</span></>:brand?.name??"JobberTrain"}</span>;
  return <main className="grid min-h-screen bg-white text-[#171717] lg:grid-cols-2">
    <section className="relative hidden min-h-screen overflow-hidden bg-cover bg-center p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12" style={{backgroundColor:secondary,backgroundImage:backgroundImage?`linear-gradient(rgba(0,0,0,.62),rgba(0,0,0,.74)),url(${backgroundImage})`:undefined}}>
      {!backgroundImage&&<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:48px_48px]"/>}
      <Link href={home} className="relative z-10 w-fit">{mark}</Link>
      <div className="relative z-10 max-w-xl"><p className="text-sm font-extrabold uppercase italic tracking-[.22em]" style={{color:primary}}>{eyebrow}</p><h1 className="mt-5 text-5xl font-black uppercase leading-[.92] tracking-[-.045em] xl:text-6xl">{headline}</h1><p className="mt-6 max-w-lg text-lg leading-8 text-white/70">{description}</p></div>
      <p className="relative z-10 text-[11px] font-extrabold uppercase tracking-[.18em] text-white/40">{brand?`${brand.name} Academy · Powered by JobberTrain`:"Product knowledge for the last mile of the sale"}</p>
    </section>
    <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10 lg:px-14"><div className="w-full max-w-md"><Link href={home} className="mb-10 block w-fit lg:hidden">{brand?.logo_url?<Image src={brand.logo_url} alt={`${brand.name} logo`} width={190} height={48} className="max-h-11 w-auto object-contain" priority unoptimized/>:<span className="text-2xl font-black uppercase">{brand?.name??"JobberTrain"}</span>}</Link>{children}<p className="mt-10 border-t border-black/10 pt-5 text-[10px] font-extrabold uppercase tracking-[.16em] text-black/35 lg:hidden">{brand?`${brand.name} Academy · Powered by JobberTrain`:"Powered by JobberTrain"}</p></div></section>
  </main>;
}
