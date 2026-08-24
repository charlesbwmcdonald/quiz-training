"use client";

import { useEffect } from "react";
import { recordProgramView } from "./actions";

export function ProgramViewTracker({programId}:{programId:string}){
  useEffect(()=>{void recordProgramView(programId)},[programId]);
  return null;
}
