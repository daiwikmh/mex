import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Agent = { registered: boolean;
                      owner_commitment: Uint8Array;
                      scope_hash: Uint8Array;
                      policy_hash: Uint8Array;
                      expiry: bigint;
                      max_queries: bigint;
                      queries_used: bigint;
                      revoked: boolean
                    };

export type QueryReceipt = { agent_id: Uint8Array;
                             query_hash: Uint8Array;
                             result_commitment: Uint8Array;
                             ts: bigint
                           };

export type Witnesses<PS> = {
}

export type ImpureCircuits<PS> = {
  register_agent(context: __compactRuntime.CircuitContext<PS>,
                 agent_id_0: Uint8Array,
                 owner_commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  set_policy(context: __compactRuntime.CircuitContext<PS>,
             agent_id_0: Uint8Array,
             scope_hash_0: Uint8Array,
             policy_hash_0: Uint8Array,
             expiry_0: bigint,
             max_queries_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  log_query(context: __compactRuntime.CircuitContext<PS>,
            agent_id_0: Uint8Array,
            query_hash_0: Uint8Array,
            result_commitment_0: Uint8Array,
            ts_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  revoke_agent(context: __compactRuntime.CircuitContext<PS>,
               agent_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  register_agent(context: __compactRuntime.CircuitContext<PS>,
                 agent_id_0: Uint8Array,
                 owner_commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  set_policy(context: __compactRuntime.CircuitContext<PS>,
             agent_id_0: Uint8Array,
             scope_hash_0: Uint8Array,
             policy_hash_0: Uint8Array,
             expiry_0: bigint,
             max_queries_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  log_query(context: __compactRuntime.CircuitContext<PS>,
            agent_id_0: Uint8Array,
            query_hash_0: Uint8Array,
            result_commitment_0: Uint8Array,
            ts_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  revoke_agent(context: __compactRuntime.CircuitContext<PS>,
               agent_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  register_agent(context: __compactRuntime.CircuitContext<PS>,
                 agent_id_0: Uint8Array,
                 owner_commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  set_policy(context: __compactRuntime.CircuitContext<PS>,
             agent_id_0: Uint8Array,
             scope_hash_0: Uint8Array,
             policy_hash_0: Uint8Array,
             expiry_0: bigint,
             max_queries_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  log_query(context: __compactRuntime.CircuitContext<PS>,
            agent_id_0: Uint8Array,
            query_hash_0: Uint8Array,
            result_commitment_0: Uint8Array,
            ts_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  revoke_agent(context: __compactRuntime.CircuitContext<PS>,
               agent_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  agents: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Agent;
    [Symbol.iterator](): Iterator<[Uint8Array, Agent]>
  };
  receipts: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): QueryReceipt;
    [Symbol.iterator](): Iterator<[Uint8Array, QueryReceipt]>
  };
  readonly total_queries: bigint;
  readonly total_registered: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
