"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Mail, X } from "lucide-react";
import { toast } from "sonner";
import { userAuthStore } from "@/store/Auth";
import { withFreshJWT } from "@/lib/client/auth-request";
import { client } from "@/lib/client/config";
import { invitationsId } from "@/models/name";

export default function InvitationInbox() {
  const user = userAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadInvitations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await withFreshJWT(
        (token) => axios.get("/api/invitations", { headers: { Authorization: `Bearer ${token}` } }),
        () => {},
      );
      setInvitations(response.data.invitations);
    } catch (error) {
      toast.error(error.response?.data?.error ?? "Unable to load invitations.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) void loadInvitations();
  }, [user, loadInvitations]);

  useEffect(() => {
    if (!user) return;
    return client.subscribe(`collections.${invitationsId}.documents`, (event) => {
      if (event.payload?.recipientId === user.$id) void loadInvitations();
    });
  }, [user, loadInvitations]);

  async function respond(invitationId, action) {
    try {
      await withFreshJWT(
        (token) => axios.patch(`/api/invitations/${invitationId}`, { action }, { headers: { Authorization: `Bearer ${token}` } }),
        () => {},
      );
      setInvitations((items) => items.filter((item) => item.$id !== invitationId));
      toast.success(action === "accept" ? "Invitation accepted." : "Invitation declined.");
      if (action === "accept") {
        setOpen(false);
        window.dispatchEvent(new Event("flowboard:boards-refresh"));
      }
    } catch (error) {
      toast.error(error.response?.data?.error ?? "Unable to respond to invitation.");
    }
  }

  if (!user) return null;

  return (
    <div className="fixed right-5 bottom-5 z-50">
      {open && (
        <section className="mb-3 w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 text-zinc-100 shadow-2xl" aria-label="Board invitations">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <h2 className="font-semibold">Invitations</h2>
            <button type="button" aria-label="Close invitations" onClick={() => setOpen(false)} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"><X className="size-4" /></button>
          </div>
          <div className="max-h-96 space-y-3 overflow-y-auto p-4">
            {loading ? <p className="text-sm text-zinc-400">Loading…</p> : invitations.length === 0 ? <p className="text-sm text-zinc-400">No pending invitations.</p> : invitations.map((invitation) => (
              <article key={invitation.$id} className="rounded-xl border border-zinc-800 p-3">
                <p className="text-sm"><span className="font-medium">{invitation.senderName}</span> invited you to <span className="font-medium">{invitation.boardTitle}</span>.</p>
                <Link href={`/boards/${invitation.boardId}`} onClick={() => setOpen(false)} className="mt-1 inline-block text-xs text-indigo-300 hover:text-indigo-200">View board</Link>
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => void respond(invitation.$id, "decline")} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800">Decline</button>
                  <button type="button" onClick={() => void respond(invitation.$id, "accept")} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500">Accept</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Open invitations" className="relative ml-auto flex size-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-500">
        <Mail className="size-6" />
        {invitations.length > 0 && <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold">{invitations.length > 9 ? "9+" : invitations.length}</span>}
      </button>
    </div>
  );
}
