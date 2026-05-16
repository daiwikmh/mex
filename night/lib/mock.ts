export function shortHash(seed: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  const hex = h.toString(16).padStart(8, "0");
  return `0x${hex}${hex}`.slice(0, 18);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export type UnderwritingResult = {
  score: number;
  monthlyIncomeBucket: string;
  debtServiceRatio: number;
  reasoningHash: string;
  cohortSize: number;
  attestation: string;
  cohortPubkeys: string[];
};

export function mockUnderwriting(seed: string): UnderwritingResult {
  const base = shortHash(seed);
  const score = 660 + ((parseInt(base.slice(2, 6), 16) % 180) | 0);
  const dsr = 0.18 + ((parseInt(base.slice(6, 10), 16) % 28) / 100);
  return {
    score,
    monthlyIncomeBucket: ["$3–5k", "$5–8k", "$8–12k", "$12–20k"][
      parseInt(base.slice(10, 14), 16) % 4
    ],
    debtServiceRatio: Math.round(dsr * 100) / 100,
    reasoningHash: shortHash(`${seed}:reasoning`),
    cohortSize: 50,
    attestation: shortHash(`${seed}:attestation`).replace("0x", "att_"),
    cohortPubkeys: Array.from({ length: 5 }, (_, i) =>
      shortHash(`${seed}:cohort:${i}`),
    ),
  };
}
