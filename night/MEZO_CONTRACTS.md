# Mezo / MUSD contract reference

Verified from the `mezo-org/musd` deployment artifacts
(`solidity/artifacts/deployments/<network>/<Contract>.json`), 2026-05-23.

## Networks

| Network | Chain ID | RPC | Explorer |
| --- | --- | --- | --- |
| Mezo Mainnet | 31612 | https://mezo.drpc.org | https://explorer.mezo.org |
| Mezo Testnet (matsnet) | 31611 | https://rpc.test.mezo.org | https://explorer.test.mezo.org |

Native gas token is BTC (18 decimals) on both.

## Addresses

| Contract | Mainnet (31612) | Testnet / matsnet (31611) |
| --- | --- | --- |
| BorrowerOperations | `0x44b1bac67dDA612a41a58AAf779143B181dEe031` | `0xCdF7028ceAB81fA0C6971208e83fa7872994beE5` |
| HintHelpers | `0xD267b3bE2514375A075fd03C3D9CBa6b95317DC3` | `0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6` |
| SortedTroves | `0x8C5DB4C62BF29c1C4564390d10c20a47E0b2749f` | `0x722E4D24FD6Ff8b0AC679450F3D91294607268fA` |
| TroveManager | `0x94AfB503dBca74aC3E4929BACEeDfCe19B93c193` | `0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0` |
| PriceFeed | `0xc5aC5A8892230E0A3e1c473881A2de7353fFcA88` | `0x86bCF0841622a5dAC14A313a15f96A95421b9366` |
| MUSD | `0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186` | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` |

MEZO token: mainnet `0x7B7c000000000000000000000000000000000001` (testnet address not published).

## Key function signatures

```solidity
// BorrowerOperations - collateral is sent as msg.value (BTC)
function openTrove(uint256 _debtAmount, address _upperHint, address _lowerHint) payable;

// HintHelpers - approximate insert position for a given nominal ICR
function getApproxHint(uint256 _CR, uint256 _numTrials, uint256 _inputRandomSeed)
  view returns (address hintAddress, uint256 diff, uint256 latestRandomSeed);

// SortedTroves - exact insert hints; getSize used to scale numTrials
function findInsertPosition(uint256 _NICR, address _prevId, address _nextId)
  view returns (address upperHint, address lowerHint);
function getSize() view returns (uint256);

// TroveManager - ratios
function getNominalICR(address _borrower) view returns (uint256);
function getCurrentICR(address _borrower, uint256 _price) view returns (uint256);
function getTCR(uint256 _price) view returns (uint256);
function MCR() view returns (uint256);   // min collateral ratio
function CCR() view returns (uint256);   // critical collateral ratio
```

## Hint flow for openTrove

1. NICR = collateral * 1e20 / debt (nominal, price-independent).
2. numTrials ~= 15 * sqrt(SortedTroves.getSize()).
3. HintHelpers.getApproxHint(NICR, numTrials, seed) -> approx hint.
4. SortedTroves.findInsertPosition(NICR, approxHint, approxHint) -> upper/lower hints.
5. BorrowerOperations.openTrove(debt, upperHint, lowerHint) with value = collateral.

Passing zeroAddress for both hints works but traverses the full list on chain (gas-heavy).

Source: https://github.com/mezo-org/musd/tree/main/solidity/artifacts/deployments
