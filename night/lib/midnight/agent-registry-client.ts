"use client";

import { deployContract, findDeployedContract, type FoundContract } from "@midnight-ntwrk/midnight-js-contracts";
import {
  AGENT_REGISTRY_PRIVATE_STATE_ID,
  type AgentRegistryProviders,
} from "./providers";
import { compiledAgentRegistry, AgentRegistry } from "./compiled-contract";

export type DeployedAgentRegistry = FoundContract<typeof compiledAgentRegistry extends { tag: string } ? any : never>;

const REGISTRY_KEY = "Omnis:agent-registry:contract-address";

export function readRegistryAddress(): string | null {
  const env = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
  if (env) return env;
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REGISTRY_KEY);
}

export function writeRegistryAddress(address: string | null): void {
  if (typeof window === "undefined") return;
  if (address === null) localStorage.removeItem(REGISTRY_KEY);
  else localStorage.setItem(REGISTRY_KEY, address);
}

export async function deployRegistry(
  providers: AgentRegistryProviders,
): Promise<{ address: string; deployed: any }> {
  const deployed = await deployContract(providers, {
    compiledContract: compiledAgentRegistry,
    privateStateId: AGENT_REGISTRY_PRIVATE_STATE_ID,
    initialPrivateState: {},
  } as any);
  const address = deployed.deployTxData.public.contractAddress;
  return { address, deployed };
}

export async function findRegistry(
  providers: AgentRegistryProviders,
  address: string,
): Promise<any> {
  return findDeployedContract(providers, {
    compiledContract: compiledAgentRegistry,
    contractAddress: address,
    privateStateId: AGENT_REGISTRY_PRIVATE_STATE_ID,
    initialPrivateState: {},
  } as any);
}

export async function ensureRegistry(
  providers: AgentRegistryProviders,
): Promise<{ address: string; contract: any; freshlyDeployed: boolean }> {
  const existing = readRegistryAddress();
  if (existing) {
    try {
      const contract = await findRegistry(providers, existing);
      return { address: existing, contract, freshlyDeployed: false };
    } catch (e) {
      console.warn("findRegistry failed, redeploying", e);
    }
  }
  const { address, deployed } = await deployRegistry(providers);
  writeRegistryAddress(address);
  return { address, contract: deployed, freshlyDeployed: true };
}

export type RegistryLedger = ReturnType<typeof AgentRegistry.ledger>;

export async function readRegistryLedger(
  providers: AgentRegistryProviders,
  address: string,
): Promise<RegistryLedger | null> {
  const state = await providers.publicDataProvider.queryContractState(address);
  if (!state) return null;
  return AgentRegistry.ledger(state.data);
}

export function bytes32(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const padded = clean.padStart(64, "0").slice(0, 64);
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(padded.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
