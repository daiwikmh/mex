"use client";

import { CompiledContract } from "@midnight-ntwrk/compact-js";
import * as AgentRegistry from "@/contracts/agent-registry/dist/contract/index.js";

export const TAG = "AgentRegistry";

export type AgentRegistryContract = InstanceType<typeof AgentRegistry.Contract>;

export const compiledAgentRegistry = CompiledContract.make(
  TAG,
  AgentRegistry.Contract,
).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets("."),
);

export { AgentRegistry };

