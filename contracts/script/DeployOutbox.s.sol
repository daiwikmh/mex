// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {BridgeOutbox} from "../src/BridgeOutbox.sol";

/// Deploy BridgeOutbox on the SOURCE chain (Mezo testnet).
/// MUSD_ADDRESS defaults to Mezo testnet MUSD.
/// Run: forge script script/DeployOutbox.s.sol --rpc-url mezo_testnet --private-key $PK --broadcast
contract DeployOutbox is Script {
    function run() external returns (BridgeOutbox outbox) {
        address musd = vm.envOr("MUSD_ADDRESS", address(0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503));
        vm.startBroadcast();
        outbox = new BridgeOutbox(musd);
        vm.stopBroadcast();
        console.log("BridgeOutbox:", address(outbox));
        console.log("  token (MUSD):", musd);
    }
}
