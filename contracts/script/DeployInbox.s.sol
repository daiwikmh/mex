// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {BridgeInbox} from "../src/BridgeInbox.sol";

/// Deploy BridgeInbox on the DESTINATION chain (Base Sepolia).
/// RELAYER defaults to the deployer (so the same key relays in a demo).
/// Run: forge script script/DeployInbox.s.sol --rpc-url base_sepolia --private-key $PK --broadcast
contract DeployInbox is Script {
    function run() external returns (BridgeInbox inbox) {
        address relayer = vm.envOr("RELAYER", msg.sender);
        vm.startBroadcast();
        inbox = new BridgeInbox(relayer);
        vm.stopBroadcast();
        console.log("BridgeInbox (bMUSD):", address(inbox));
        console.log("  relayer:", relayer);
    }
}
