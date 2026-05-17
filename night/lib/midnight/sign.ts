"use client";

import type { ConnectedWallet } from "./wallet";

export type SignedPolicy = {
  payload: string;
  signature: string;
  verifyingKey: string;
  signedAt: number;
};

export async function signPolicyHash(
  wallet: ConnectedWallet,
  policyHashHex: string,
): Promise<SignedPolicy> {
  const payload = `Omnis:agent-policy:${policyHashHex}`;
  const sig = await wallet.api.signData(payload, {
    encoding: "text",
    keyType: "unshielded",
  });
  return {
    payload,
    signature: sig.signature,
    verifyingKey: sig.verifyingKey,
    signedAt: Date.now(),
  };
}
