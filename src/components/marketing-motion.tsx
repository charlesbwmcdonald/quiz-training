"use client";

import {useEffect} from "react";

export function MarketingMotion(){
  useEffect(()=>{
    const root=document.querySelector<HTMLElement>(".marketing-home");
    if(!root||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;

    const sections=[...root.querySelectorAll<HTMLElement>("section:not(.marketing-hero)")];
    const elements:HTMLElement[]=[];
    sections.forEach(section=>{
      const sectionContent=section.firstElementChild as HTMLElement|null;
      if(sectionContent){sectionContent.classList.add("jt-reveal");elements.push(sectionContent)}
      section.querySelectorAll<HTMLElement>("article").forEach((card,index)=>{
        card.classList.add("jt-reveal-card");
        card.style.setProperty("--jt-delay",`${Math.min(index,5)*85}ms`);
        elements.push(card);
      });
    });

    root.classList.add("jt-motion-ready");
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          (entry.target as HTMLElement).classList.add("jt-visible");
          observer.unobserve(entry.target);
        }
      });
    },{threshold:.12,rootMargin:"0px 0px -8% 0px"});
    elements.forEach(element=>observer.observe(element));
    return()=>observer.disconnect();
  },[]);
  return null;
}
