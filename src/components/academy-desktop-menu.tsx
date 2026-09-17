"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type MenuName = "learn" | "manage" | null;
type Props = {
  portal: string;
  primary: string;
  canManageTraining: boolean;
  canViewReports: boolean;
  canManageBrand: boolean;
};

export function AcademyDesktopMenu({ portal, primary, canManageTraining, canViewReports, canManageBrand }: Props) {
  const [open, setOpen] = useState<MenuName>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(null);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", closeOutside);
    window.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      window.removeEventListener("keydown", closeEscape);
    };
  }, []);

  const item = "flex min-h-11 items-center rounded-md px-4 text-xs font-black uppercase tracking-[.06em] text-black/65 transition hover:bg-black/[.055] hover:text-black focus-visible:outline-2 focus-visible:outline-black";
  const accentItem = `${item} font-black`;
  const button = (name: Exclude<MenuName, null>, label: string) => (
    <button
      type="button"
      aria-expanded={open === name}
      aria-controls={`academy-${name}-menu`}
      onClick={() => setOpen(current => current === name ? null : name)}
      className={`flex min-h-10 items-center gap-2 rounded-md px-4 text-xs font-black uppercase tracking-[.06em] transition focus-visible:outline-2 focus-visible:outline-black ${open === name ? "bg-black text-white" : "text-black hover:bg-black/5"}`}
    >
      {label}
      <span aria-hidden="true" className={`text-[9px] transition-transform ${open === name ? "rotate-180" : ""}`}>▼</span>
    </button>
  );

  return <div ref={root} className="relative hidden items-center gap-1 lg:flex">
    {button("learn", "Learn")}
    {(canManageTraining || canViewReports || canManageBrand) && button("manage", "Manage")}
    {open && <div aria-hidden="true" className="fixed inset-x-0 top-[72px] z-40 h-1 bg-white" />}
    {open === "learn" && <div id="academy-learn-menu" className="absolute right-24 top-[calc(100%+18px)] z-50 w-72 overflow-hidden rounded-b-xl border border-t-0 border-black/10 bg-white p-2 shadow-[0_22px_55px_rgba(16,16,16,.16)]">
      <p className="px-4 pb-2 pt-3 text-[10px] font-black uppercase tracking-[.18em] text-black/35">Learn</p>
      {canManageTraining && <Link onClick={() => setOpen(null)} href={`${portal}/products`} className={item}>Products</Link>}
      {canManageTraining && <Link onClick={() => setOpen(null)} href={portal} className={item}>Quizzes</Link>}
      {canManageTraining && <Link onClick={() => setOpen(null)} href={`${portal}/courses`} className={item}>Courses</Link>}
      <Link onClick={() => setOpen(null)} href={`${portal}/dealer-programs`} className={item}>Dealer Offers</Link>
      <div className="my-2 border-t border-black/10" />
      <Link onClick={() => setOpen(null)} href={`${portal}/my-training`} className={accentItem} style={{ color: primary }}>My Training</Link>
      <Link onClick={() => setOpen(null)} href="/academies" className={accentItem} style={{ color: primary }}>My Academies</Link>
      <Link onClick={() => setOpen(null)} href={`${portal}/certificates`} className={accentItem} style={{ color: primary }}>My Certificates</Link>
      <Link onClick={() => setOpen(null)} href={`${portal}/rewards`} className={accentItem} style={{ color: primary }}>My Rewards</Link>
    </div>}
    {open === "manage" && <div id="academy-manage-menu" className="absolute right-0 top-[calc(100%+18px)] z-50 w-72 overflow-hidden rounded-b-xl border border-t-0 border-black/10 bg-white p-2 shadow-[0_22px_55px_rgba(16,16,16,.16)]">
      <p className="px-4 pb-2 pt-3 text-[10px] font-black uppercase tracking-[.18em] text-black/35">Manage Academy</p>
      {canManageTraining && <Link onClick={() => setOpen(null)} href={`${portal}/retailers`} className={item}>Retailers</Link>}
      {canManageTraining && <Link onClick={() => setOpen(null)} href={`${portal}/assignments`} className={item}>Assignments</Link>}
      {canManageTraining && <Link onClick={() => setOpen(null)} href={`${portal}/certifications`} className={item}>Certifications</Link>}
      {canManageTraining && <Link onClick={() => setOpen(null)} href={`${portal}/programs`} className={item}>Manage Offers</Link>}
      {canManageTraining && <Link onClick={() => setOpen(null)} href={`${portal}/notifications`} className={item}>Notifications</Link>}
      {canManageTraining && <Link onClick={() => setOpen(null)} href={`${portal}/rewards/manage`} className={item}>Rewards</Link>}
      {canViewReports && <Link onClick={() => setOpen(null)} href={`${portal}/reports`} className={item}>Reports</Link>}
      {canManageBrand && <Link onClick={() => setOpen(null)} href={`${portal}/users`} className={item}>Users</Link>}
      {canManageBrand && <div className="mt-2 border-t border-black/10 pt-2"><Link onClick={() => setOpen(null)} href={`${portal}/settings/branding`} className={accentItem} style={{ color: primary }}>Brand Studio</Link></div>}
    </div>}
  </div>;
}
