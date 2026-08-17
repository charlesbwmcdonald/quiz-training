import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Academy = { id:string; name:string; slug:string; logo_url:string|null; primary_color:string; secondary_color:string; is_active:boolean; access_type:string };
export type AcademyInvitation = { invitation_id:string; id:string; name:string; slug:string; logo_url:string|null; primary_color:string; secondary_color:string; role:string; expires_at:string };
export type AcademyDirectory = { academies:Academy[]; invitations:AcademyInvitation[] };

export async function getAcademyDirectory(): Promise<AcademyDirectory> {
  const supabase=await createSupabaseServerClient();
  const {data,error}=await supabase.rpc("academy_directory");
  if(error||!data) return {academies:[],invitations:[]};
  const directory=data as unknown as Partial<AcademyDirectory>;
  return {academies:Array.isArray(directory.academies)?directory.academies:[],invitations:Array.isArray(directory.invitations)?directory.invitations:[]};
}
