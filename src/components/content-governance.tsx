export type ContentGovernanceRecord = {
  content_type: "product" | "quiz" | "course";
  content_id: string;
  owner_email: string | null;
  updated_at: string;
  review_requested_at: string | null;
  published_at: string | null;
  assignment_count: number;
};

export type ContentVersion = { version_id:string; version_number:number; version_status:string; actor_email:string|null; created_at:string };
export type ContentReviewEvent = { decision:string; note:string|null; reviewer_email:string|null; created_at:string };
export type ContentSchedule = { schedule_id:string; content_type:"product"|"quiz"|"course"; content_id:string; schedule_action:"publish"|"archive"; execute_at:string; schedule_status:"pending"|"completed"|"cancelled"|"failed"; created_by_email:string|null; created_at:string; error:string|null };

export function ContentScheduleDetails({schedule}:{schedule?:ContentSchedule}) {
  if(!schedule||schedule.schedule_status!=="pending") return null;
  return <p className="mt-1 text-[10px] font-bold uppercase text-blue-700">{schedule.schedule_action} {new Date(schedule.execute_at).toLocaleString()}</p>;
}

export function ContentGovernanceDetails({ record }: { record?: ContentGovernanceRecord }) {
  if (!record) return <p className="mt-1 text-xs text-black/35">Owner unassigned · Update history begins after the next save</p>;
  return <p className="mt-1 truncate text-xs text-black/40" title={record.owner_email ?? "Owner unassigned"}>
    {record.owner_email ? `Owner: ${record.owner_email}` : "Owner unassigned"} · Updated {new Date(record.updated_at).toLocaleDateString()}
  </p>;
}

export function ContentEditWarnings({ status, assignmentCount, noun }: { status: string; assignmentCount: number; noun: string }) {
  if (status !== "published" && assignmentCount === 0) return null;
  return <div className="mt-6 grid gap-3">
    {status === "published" && <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-950"><b className="uppercase">Published {noun}</b><p className="mt-1">Saved changes can immediately affect the live learner experience. Move it to Review or Draft first when changes need approval.</p></div>}
    {assignmentCount > 0 && <div className="rounded-md border-l-4 border-blue-600 bg-blue-50 p-4 text-sm text-blue-950"><b className="uppercase">Currently in use</b><p className="mt-1">This {noun} has {assignmentCount} active assignment or content reference{assignmentCount === 1 ? "" : "s"}. Existing learner access and history will be preserved.</p></div>}
  </div>;
}

export function governanceStatusClass(status: string) {
  if (status === "published") return "bg-green-50 text-green-800";
  if (status === "review") return "bg-blue-50 text-blue-800";
  if (status === "archived") return "bg-amber-50 text-amber-800";
  return "bg-black/5 text-black/55";
}

export function governanceStatusLabel(status: string) {
  return status === "published" ? "Published" : status === "review" ? "In review" : status;
}
