import type { KgNode, KgEdge } from "@/lib/kg/types";

interface GmailListResponse {
  messages?: { id: string }[];
}

interface GmailMessage {
  id: string;
  snippet?: string;
  payload?: {
    headers?: { name: string; value: string }[];
  };
}

function header(msg: GmailMessage, name: string): string {
  return (
    msg.payload?.headers?.find(
      (h) => h.name.toLowerCase() === name.toLowerCase(),
    )?.value ?? ""
  );
}

function extractEmail(from: string): string {
  const m = from.match(/<([^>]+)>/);
  return m ? m[1].trim() : from.trim();
}

function extractName(from: string): string {
  return from.replace(/<[^>]+>/, "").trim() || from.trim();
}

export async function fetchGmailNodes(
  token: string,
): Promise<{ nodes: KgNode[]; edges: KgEdge[] }> {
  const nodes: KgNode[] = [];
  const edges: KgEdge[] = [];
  const contactsSeen = new Map<string, string>();

  const listRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=subject%3Ainvoice+OR+subject%3Areceipt+OR+subject%3Apayment+OR+subject%3Arenewal+OR+subject%3Avendor",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!listRes.ok) {
    const text = await listRes.text();
    throw new Error(`Gmail list failed (${listRes.status}): ${text.slice(0, 120)}`);
  }

  const list = (await listRes.json()) as GmailListResponse;
  const ids = (list.messages ?? []).slice(0, 15).map((m) => m.id);

  await Promise.all(
    ids.map(async (id) => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From,To,Subject,Date`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return;
      const msg = (await res.json()) as GmailMessage;

      const subject = header(msg, "Subject") || "(no subject)";
      const from    = header(msg, "From");
      const date    = header(msg, "Date");

      const emailId = `gmail_${id}`;
      nodes.push({
        id: emailId,
        type: "Email",
        label: subject.slice(0, 60),
        attrs: { date: date.slice(0, 16), from: from.slice(0, 50) },
        source: "gmail",
      });

      const senderEmail = extractEmail(from);
      const senderName  = extractName(from).slice(0, 40) || senderEmail;
      if (senderEmail && !senderEmail.toLowerCase().includes("noreply") && !senderEmail.toLowerCase().includes("no-reply")) {
        let cId = contactsSeen.get(senderEmail);
        if (!cId) {
          cId = `contact_${senderEmail.replace(/[^a-z0-9]/gi, "_").slice(0, 28)}`;
          contactsSeen.set(senderEmail, cId);
          nodes.push({
            id: cId,
            type: "Contact",
            label: senderName,
            attrs: { org: senderEmail.split("@")[1] ?? "" },
          });
        }
        edges.push({ id: `se_${emailId}`, type: "sent_by", from: emailId, to: cId });
      }
    }),
  );

  return { nodes, edges };
}
