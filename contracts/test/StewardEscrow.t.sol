// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StewardEscrow} from "../src/StewardEscrow.sol";

// Minimal ERC20 for tests (18dp like MUSD).
contract MockMUSD {
    string public name = "Mock MUSD";
    string public symbol = "MUSD";
    uint8 public decimals = 18;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract StewardEscrowTest is Test {
    MockMUSD musd;
    StewardEscrow escrow;

    address governor;
    address feeSink;
    address owner;
    address operator;
    address payee;

    uint16 constant FEE_BPS = 1000; // 10%

    function setUp() public {
        governor = makeAddr("governor");
        feeSink = makeAddr("feeSink");
        owner = makeAddr("owner");
        operator = makeAddr("operator");
        payee = makeAddr("payee");
        musd = new MockMUSD();
        escrow = new StewardEscrow(address(musd), feeSink, FEE_BPS, governor);
        musd.mint(owner, 1_000 ether);
        vm.prank(owner);
        musd.approve(address(escrow), type(uint256).max);
    }

    function _open(uint256 budget, uint256 cap) internal returns (uint256 id) {
        vm.prank(owner);
        id = escrow.openAgent(operator, "treasury-bot", budget, cap, uint64(block.timestamp + 7 days));
    }

    function test_OpenAgent_PullsFundsAndStoresPolicy() public {
        uint256 id = _open(500 ether, 2 ether);
        assertEq(escrow.agentCount(), 1);
        assertEq(musd.balanceOf(address(escrow)), 500 ether);
        assertEq(musd.balanceOf(owner), 500 ether);
        StewardEscrow.Agent memory a = escrow.getAgent(id);
        assertEq(a.owner, owner);
        assertEq(a.operator, operator);
        assertEq(a.budget, 500 ether);
        assertEq(a.perActionCap, 2 ether);
    }

    function test_Settle_DebitsBudgetSplitsFee() public {
        uint256 id = _open(500 ether, 2 ether);
        vm.prank(operator);
        escrow.settle(id, payee, 2 ether, "action-1");

        StewardEscrow.Agent memory a = escrow.getAgent(id);
        assertEq(a.budget, 498 ether);
        assertEq(a.spent, 2 ether);
        assertEq(a.actions, 1);
        assertEq(musd.balanceOf(feeSink), 0.2 ether); // 10% fee
        assertEq(musd.balanceOf(payee), 1.8 ether);
        assertEq(escrow.totalFees(), 0.2 ether);
    }

    function test_Settle_RevertsOverCap() public {
        uint256 id = _open(500 ether, 2 ether);
        vm.prank(operator);
        vm.expectRevert("over cap");
        escrow.settle(id, payee, 2.5 ether, "x");
    }

    function test_Settle_RevertsNotOperator() public {
        uint256 id = _open(500 ether, 2 ether);
        vm.prank(owner);
        vm.expectRevert("not operator");
        escrow.settle(id, payee, 1 ether, "x");
    }

    function test_Settle_RevertsAfterExpiry() public {
        uint256 id = _open(500 ether, 2 ether);
        vm.warp(block.timestamp + 8 days);
        vm.prank(operator);
        vm.expectRevert("expired");
        escrow.settle(id, payee, 1 ether, "x");
    }

    function test_Settle_RevertsOverBudget() public {
        uint256 id = _open(3 ether, 2 ether);
        vm.prank(operator);
        escrow.settle(id, payee, 2 ether, "a");
        vm.prank(operator);
        vm.expectRevert("over budget");
        escrow.settle(id, payee, 2 ether, "b");
    }

    function test_Revoke_RefundsRemainderAndBlocksSettle() public {
        uint256 id = _open(500 ether, 2 ether);
        vm.prank(operator);
        escrow.settle(id, payee, 2 ether, "a");

        vm.prank(owner);
        escrow.revoke(id);
        assertEq(musd.balanceOf(owner), 998 ether); // 1000 - 2 spent
        assertEq(musd.balanceOf(address(escrow)), 0);

        vm.prank(operator);
        vm.expectRevert("revoked");
        escrow.settle(id, payee, 1 ether, "b");
    }

    function test_Revoke_OnlyOwner() public {
        uint256 id = _open(500 ether, 2 ether);
        vm.prank(operator);
        vm.expectRevert("not owner");
        escrow.revoke(id);
    }

    function test_TopUp_IncreasesBudget() public {
        uint256 id = _open(100 ether, 2 ether);
        vm.prank(owner);
        escrow.topUp(id, 50 ether);
        assertEq(escrow.getAgent(id).budget, 150 ether);
        assertEq(musd.balanceOf(address(escrow)), 150 ether);
    }

    function test_FeeConfig_OnlyGovernor() public {
        vm.prank(owner);
        vm.expectRevert("not governor");
        escrow.setFeeConfig(feeSink, 500);

        vm.prank(governor);
        escrow.setFeeConfig(address(0xBEEF), 500);
        assertEq(escrow.feeBps(), 500);
        assertEq(escrow.feeSink(), address(0xBEEF));
    }

    function test_Constructor_RejectsHighFee() public {
        vm.expectRevert("fee too high");
        new StewardEscrow(address(musd), feeSink, 2001, governor);
    }
}
