import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen overflow-hidden font-sans">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}