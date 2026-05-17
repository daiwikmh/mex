import type { KgNode, KgEdge } from "@/lib/kg/types";

interface CalEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  attendees?: { email: string; displayName?: string; self?: boolean }[];
  status?: string;
}

interface CalListResponse {
  items?: CalEvent[];
}

export async function fetchCalendarNodes(
  token: string,
): Promise<{ nodes: KgNode[]; edges: KgEdge[] }> {
  const nodes: KgNode[] = [];
  const edges: KgEdge[] = [];
  const contactsSeen = new Map<string, string>();

  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=20&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendar API failed (${res.status}): ${text.slice(0, 120)}`);
  }

  const data = (await res.json()) as CalListResponse;
  const events = (data.items ?? []).filter(
    (ev) => ev.summary && ev.status !== "cancelled",
  );

  for (const ev of events.slice(0, 15)) {
    const meetingId = `cal_${ev.id}`;
    const start = (ev.start?.dateTime ?? ev.start?.date ?? "").slice(0, 16);
    const attendees = (ev.attendees ?? []).filter((a) => !a.self);
    const isPrivate = !ev.attendees || ev.attendees.length <= 1;

    nodes.push({
      id: meetingId,
      type: "Meeting",
      label: ev.summary!.slice(0, 60),
      attrs: { start, attendees: attendees.length },
      source: "calendar",
      private: isPrivate,
    });

    for (const att of attendees.slice(0, 5)) {
      let cId = contactsSeen.get(att.email);
      if (!cId) {
        cId = `contact_${att.email.replace(/[^a-z0-9]/gi, "_").slice(0, 28)}`;
        contactsSeen.set(att.email, cId);
        nodes.push({
          id: cId,
          type: "Contact",
          label: (att.displayName ?? att.email).slice(0, 40),
          attrs: { org: att.email.split("@")[1] ?? "" },
        });
      }
      edges.push({
        id: `ab_${meetingId}_${cId}`,
        type: "attended_by",
        from: meetingId,
        to: cId,
      });
    }
  }

  return { nodes, edges };
}
