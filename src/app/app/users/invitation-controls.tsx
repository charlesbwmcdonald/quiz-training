"use client";

import { manageInvitation } from "./actions";
import CopyLink from "./copy-link";

export default function InvitationControls({ invitationId, email, expired }: { invitationId:string; email:string; expired:boolean }) {
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
    <CopyLink token={invitationId}/>
    {!expired&&<form action={manageInvitation}><input type="hidden" name="invitationId" value={invitationId}/><button name="action" value="resend" className="font-bold hover:underline">Send email</button></form>}
    <form action={manageInvitation}><input type="hidden" name="invitationId" value={invitationId}/><button name="action" value="renew" className="font-bold hover:underline">Renew & send</button></form>
    <form action={manageInvitation} onSubmit={(event)=>{if(!window.confirm(`Revoke the invitation for ${email}? The link will stop working immediately.`))event.preventDefault()}}><input type="hidden" name="invitationId" value={invitationId}/><button name="action" value="cancel" className="font-bold text-red-700 hover:underline">Revoke</button></form>
  </div>;
}
