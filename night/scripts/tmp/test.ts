import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { ContractMaintenanceAuthority, ContractState, sampleSigningKey, signatureVerifyingKey } from '@midnight-ntwrk/compact-runtime';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';

const contractDistPath = '/home/daiwi/mid/night/contracts/agent-registry/dist';
const contractUrl = pathToFileURL(path.join(contractDistPath, 'contract', 'index.js')).href;
const AgentRegistry = await import(contractUrl);

const compiled = CompiledContract.make("AgentRegistry", AgentRegistry.Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(contractDistPath),
);
console.log('compiled.tag:', compiled.tag);

// Test if classes are same
const { ContractMaintenanceAuthority: CMA_rt } = await import('@midnight-ntwrk/onchain-runtime-v3' as any);
console.log('CMA === rt3 CMA?', ContractMaintenanceAuthority === CMA_rt);

const sk = sampleSigningKey();
const cma = new ContractMaintenanceAuthority([signatureVerifyingKey(sk)], 1, 0n);
const state = new ContractState();
try {
  state.maintenanceAuthority = cma;
  console.log('Direct SET OK');
} catch(e: any) {
  console.log('Direct SET FAIL:', e.message);
}
