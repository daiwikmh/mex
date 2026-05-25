// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {StewardEscrow} from "../src/StewardEscrow.sol";

/// Deploy StewardEscrow. Configure via env:
///   MUSD_ADDRESS (default: Mezo testnet MUSD), FEE_SINK, GOVERNOR (default: deployer), FEE_BPS (default 1000 = 10%).
/// Run: forge script script/Deploy.s.sol --rpc-url mezo_testnet --private-key $PK --broadcast
contract Deploy is Script {
    function run() external returns (StewardEscrow escrow) {
        address musd = vm.envOr("MUSD_ADDRESS", address(0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503));
        address deployer = msg.sender;
        address feeSink = vm.envOr("FEE_SINK", deployer);
        address governor = vm.envOr("GOVERNOR", deployer);
        uint256 feeBps = vm.envOr("FEE_BPS", uint256(1000));

        vm.startBroadcast();
        escrow = new StewardEscrow(musd, feeSink, uint16(feeBps), governor);
        vm.stopBroadcast();

        console.log("StewardEscrow deployed:", address(escrow));
        console.log("  musd    :", musd);
        console.log("  feeSink :", feeSink);
        console.log("  governor:", governor);
        console.log("  feeBps  :", feeBps);
    }
}
