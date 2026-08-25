const summary = [
  ["Assigned", "2"],
  ["In progress", "1"],
  ["Completed", "6"],
  ["Overdue", "0"],
];

export function MarketingTrainingPreview() {
  return <div className="marketing-preview relative rounded-lg border border-white/15 bg-white/5 p-3 shadow-2xl backdrop-blur sm:p-4">
    <div className="overflow-hidden rounded-md bg-[#f3f3f1] text-black">
      <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-3">
        <div><span className="block text-[8px] font-black uppercase tracking-[.18em] text-[#ff4f1f]">Gen-Y Hitch Learning</span><b className="text-[11px] uppercase">My Training</b></div>
        <span className="text-[8px] font-black uppercase tracking-[.14em] text-black/35">Learner dashboard</span>
      </div>
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">{summary.map(([label,value],index)=><div key={label} className={`border p-2.5 sm:p-3 ${index===3?"border-black bg-black text-white":"border-black/10 bg-white"}`}><span className={`block text-[7px] font-black uppercase ${index===3?"text-white/50":"text-black/40"}`}>{label}</span><b className="mt-1 block text-lg sm:text-xl">{value}</b></div>)}</div>
        <div className="mt-3 flex gap-1.5 text-[7px] font-black uppercase"><span className="bg-black px-3 py-2 text-white">All 9</span><span className="border border-black/10 bg-white px-3 py-2 text-black/45">Assigned 2</span><span className="hidden border border-black/10 bg-white px-3 py-2 text-black/45 sm:block">In progress 1</span></div>
        <div className="mt-3 border border-black/10 bg-white">
          <div className="grid grid-cols-[1.3fr_.55fr_.55fr] gap-2 border-b border-black/10 bg-black/[.03] px-3 py-2 text-[7px] font-black uppercase text-black/35"><span>Training</span><span>Status</span><span>Action</span></div>
          <div className="grid grid-cols-[1.3fr_.55fr_.55fr] items-center gap-2 px-3 py-3"><div><b className="block text-[9px] uppercase sm:text-[10px]">Bumper Towing Essentials</b><span className="text-[7px] text-black/40">GEN-Y Hitch team - Course</span><div className="mt-2 h-1.5 bg-black/10"><div className="h-full w-1/2 bg-[#ff4f1f]"/></div></div><span className="w-fit bg-blue-50 px-2 py-1 text-[7px] font-black uppercase text-blue-800">In progress</span><span className="bg-[#ff4f1f] px-2 py-2 text-center text-[7px] font-black uppercase text-white">Continue</span></div>
          <div className="grid grid-cols-[1.3fr_.55fr_.55fr] items-center gap-2 border-t border-black/10 px-3 py-3"><div><b className="block text-[9px] uppercase sm:text-[10px]">Product Knowledge Assessment</b><span className="text-[7px] text-black/40">Required - Quiz</span></div><span className="w-fit bg-black/5 px-2 py-1 text-[7px] font-black uppercase text-black/55">Assigned</span><span className="border border-black/15 px-2 py-2 text-center text-[7px] font-black uppercase">Start</span></div>
        </div>
      </div>
    </div>
  </div>;
}
