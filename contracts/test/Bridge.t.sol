// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BridgeOutbox} from "../src/BridgeOutbox.sol";
import {BridgeInbox} from "../src/BridgeInbox.sol";

contract MockToken {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 a) external {
        balanceOf[to] += a;
    }

    function approve(address s, uint256 a) external returns (bool) {
        allowance[msg.sender][s] = a;
        return true;
    }

    function transfer(address to, uint256 a) external returns (bool) {
        balanceOf[msg.sender] -= a;
        balanceOf[to] += a;
        return true;
    }

    function transferFrom(address f, address t, uint256 a) external returns (bool) {
        allowance[f][msg.sender] -= a;
        balanceOf[f] -= a;
        balanceOf[t] += a;
        return true;
    }
}

contract BridgeTest is Test {
    MockToken musd;
    BridgeOutbox outbox;
    BridgeInbox inbox;

    address user = makeAddr("user");
    address relayer = makeAddr("relayer");
    address recipient = makeAddr("recipient");

    function setUp() public {
        musd = new MockToken();
        outbox = new BridgeOutbox(address(musd));
        inbox = new BridgeInbox(relayer);
        musd.mint(user, 1000 ether);
        vm.prank(user);
        musd.approve(address(outbox), type(uint256).max);
    }

    function test_Lock_PullsFundsAndAssignsNonce() public {
        vm.prank(user);
        uint256 id = outbox.lock(100 ether, 84532, recipient);
        assertEq(id, 0);
        assertEq(outbox.nextNonce(), 1);
        assertEq(musd.balanceOf(address(outbox)), 100 ether);
        (address sender,, uint256 amount, uint64 dest,) = outbox.locks(0);
        assertEq(sender, user);
        assertEq(amount, 100 ether);
        assertEq(dest, 84532);
    }

    function test_Refund_OnlyOwnerReturnsFunds() public {
        vm.prank(user);
        outbox.lock(100 ether, 84532, recipient);
        // not owner
        vm.prank(user);
        vm.expectRevert("not owner");
        outbox.refund(0);
        // owner refunds
        outbox.refund(0);
        assertEq(musd.balanceOf(user), 1000 ether);
        // double refund blocked
        vm.expectRevert("nothing to refund");
        outbox.refund(0);
    }

    function test_Release_RelayerMintsBridgedToken() public {
        vm.prank(relayer);
        inbox.release(0, recipient, 100 ether);
        assertEq(inbox.balanceOf(recipient), 100 ether);
        assertEq(inbox.totalSupply(), 100 ether);
        assertTrue(inbox.processed(0));
    }

    function test_Release_RevertsReplay() public {
        vm.prank(relayer);
        inbox.release(0, recipient, 100 ether);
        vm.prank(relayer);
        vm.expectRevert("already processed");
        inbox.release(0, recipient, 100 ether);
    }

    function test_Release_RevertsNotRelayer() public {
        vm.prank(user);
        vm.expectRevert("not relayer");
        inbox.release(0, recipient, 100 ether);
    }

    function test_SetRelayer_OnlyOwner() public {
        vm.prank(user);
        vm.expectRevert("not owner");
        inbox.setRelayer(user);
        inbox.setRelayer(user);
        assertEq(inbox.relayer(), user);
    }

    function test_EndToEnd_LockThenRelease() public {
        // source: user locks
        vm.prank(user);
        uint256 id = outbox.lock(250 ether, 84532, recipient);
        (,, uint256 amount,,) = outbox.locks(id);
        // relayer observes Locked and releases on destination
        vm.prank(relayer);
        inbox.release(id, recipient, amount);
        assertEq(inbox.balanceOf(recipient), 250 ether);
        assertEq(musd.balanceOf(address(outbox)), 250 ether);
    }
}
