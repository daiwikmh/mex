import { AppShell } from "@/components/app/AppShell";
import { AgentConsole } from "@/components/app/AgentConsole";

export const metadata = {
  title: "Agents — Omnis",
};

export default function AgentsPage() {
  return (
    <AppShell>
      <AgentConsole />
    </AppShell>
  );
}
