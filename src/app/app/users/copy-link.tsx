"use client";
import { useState } from "react";
export default function CopyLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  return <button type="button" onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`); setCopied(true); setTimeout(() => setCopied(false), 1800); }} className="font-bold hover:underline">{copied ? "Copied!" : "Copy link"}</button>;
}
