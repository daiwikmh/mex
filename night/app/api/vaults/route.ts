import { VAULTS, type VaultApy } from "@/lib/mezo/vaults";

// Live APY/TVL per vault from DeFiLlama, fetched server-side and cached 10 min (avoids CORS + huge payloads).
export async function GET() {
  const vaults: VaultApy[] = await Promise.all(
    VAULTS.map(async (v) => {
      try {
        const res = await fetch(`https://yields.llama.fi/chart/${v.llamaPool}`, {
          next: { revalidate: 600 },
        });
        const json = (await res.json()) as { data?: Array<{ apy: number | null; tvlUsd: number | null }> };
        const last = json.data?.[json.data.length - 1];
        return { id: v.id, apy: last?.apy ?? null, tvlUsd: last?.tvlUsd ?? null };
      } catch {
        return { id: v.id, apy: null, tvlUsd: null };
      }
    }),
  );
  return Response.json({ vaults });
}
