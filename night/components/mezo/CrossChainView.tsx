"use client";

import { useVaultNetwork } from "@/components/mezo/network";
import { CrossChainPanel } from "@/components/mezo/CrossChainPanel";
import { BridgePanel } from "@/components/mezo/BridgePanel";

export function CrossChainView() {
  const { network } = useVaultNetwork();
  return network === "testnet" ? <BridgePanel /> : <CrossChainPanel />;
}
