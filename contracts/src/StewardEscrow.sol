// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @title StewardEscrow
/// @notice Funds scoped agents with MUSD under a budget, per-action cap and expiry,
///         meters on-chain settlement (routing a fee cut to a staking pool), and lets
///         the owner revoke and reclaim the remainder. This is the core of the Mex
///         flywheel: payments fund staking, staking discounts payments.
contract StewardEscrow {
    IERC20 public immutable musd;

    address public governor; // can update fee config
    address public feeSink; // accrues the staker fee cut (the Earn pool)
    uint16 public feeBps; // fee in basis points, capped at 20%
    uint256 public totalFees; // lifetime fees routed to the pool

    struct Agent {
        address owner; // who funded and can revoke
        address operator; // the agent key allowed to settle
        bytes32 name; // label only
        uint256 budget; // remaining MUSD
        uint256 spent; // cumulative amount settled (incl. fees)
        uint256 perActionCap; // max MUSD per settle
        uint64 expiry; // settles rejected after this timestamp
        uint32 actions; // settle count
        bool revoked;
    }

    Agent[] private agents;

    uint256 private _lock = 1;

    modifier nonReentrant() {
        require(_lock == 1, "reentrant");
        _lock = 2;
        _;
        _lock = 1;
    }

    event AgentOpened(
        uint256 indexed id,
        address indexed owner,
        address indexed operator,
        bytes32 name,
        uint256 budget,
        uint256 perActionCap,
        uint64 expiry
    );
    event Settled(
        uint256 indexed id, address indexed operator, address indexed payee, uint256 amount, uint256 fee, bytes32 actionRef
    );
    event ToppedUp(uint256 indexed id, uint256 amount, uint256 newBudget);
    event Revoked(uint256 indexed id, address indexed owner, uint256 refunded);
    event FeeConfig(address feeSink, uint16 feeBps);

    constructor(address musd_, address feeSink_, uint16 feeBps_, address governor_) {
        require(musd_ != address(0) && feeSink_ != address(0) && governor_ != address(0), "zero addr");
        require(feeBps_ <= 2000, "fee too high");
        musd = IERC20(musd_);
        feeSink = feeSink_;
        feeBps = feeBps_;
        governor = governor_;
        emit FeeConfig(feeSink_, feeBps_);
    }

    /// @notice Fund a new agent. Pulls `budget` MUSD from the caller into escrow.
    function openAgent(address operator, bytes32 name, uint256 budget, uint256 perActionCap, uint64 expiry)
        external
        nonReentrant
        returns (uint256 id)
    {
        require(operator != address(0), "operator zero");
        require(budget > 0, "budget zero");
        require(perActionCap > 0 && perActionCap <= budget, "bad cap");
        require(expiry > block.timestamp, "expiry past");
        _pull(msg.sender, budget);
        agents.push(
            Agent({
                owner: msg.sender,
                operator: operator,
                name: name,
                budget: budget,
                spent: 0,
                perActionCap: perActionCap,
                expiry: expiry,
                actions: 0,
                revoked: false
            })
        );
        id = agents.length - 1;
        emit AgentOpened(id, msg.sender, operator, name, budget, perActionCap, expiry);
    }

    /// @notice The agent operator settles one metered action: fee to the pool, rest to the payee.
    function settle(uint256 id, address payee, uint256 amount, bytes32 actionRef) external nonReentrant {
        Agent storage a = agents[id];
        require(msg.sender == a.operator, "not operator");
        require(!a.revoked, "revoked");
        require(block.timestamp <= a.expiry, "expired");
        require(payee != address(0), "payee zero");
        require(amount > 0 && amount <= a.perActionCap, "over cap");
        require(amount <= a.budget, "over budget");

        a.budget -= amount;
        a.spent += amount;
        a.actions += 1;

        uint256 fee = (amount * feeBps) / 10000;
        if (fee > 0) {
            totalFees += fee;
            _push(feeSink, fee);
        }
        _push(payee, amount - fee);
        emit Settled(id, msg.sender, payee, amount, fee, actionRef);
    }

    /// @notice Add more MUSD to an existing agent's budget.
    function topUp(uint256 id, uint256 amount) external nonReentrant {
        Agent storage a = agents[id];
        require(msg.sender == a.owner, "not owner");
        require(!a.revoked, "revoked");
        require(amount > 0, "zero");
        _pull(msg.sender, amount);
        a.budget += amount;
        emit ToppedUp(id, amount, a.budget);
    }

    /// @notice Owner terminates the agent; remaining budget is refunded immediately.
    function revoke(uint256 id) external nonReentrant {
        Agent storage a = agents[id];
        require(msg.sender == a.owner, "not owner");
        require(!a.revoked, "already revoked");
        a.revoked = true;
        uint256 refund = a.budget;
        a.budget = 0;
        if (refund > 0) _push(a.owner, refund);
        emit Revoked(id, a.owner, refund);
    }

    function setFeeConfig(address feeSink_, uint16 feeBps_) external {
        require(msg.sender == governor, "not governor");
        require(feeSink_ != address(0), "zero");
        require(feeBps_ <= 2000, "fee too high");
        feeSink = feeSink_;
        feeBps = feeBps_;
        emit FeeConfig(feeSink_, feeBps_);
    }

    function agentCount() external view returns (uint256) {
        return agents.length;
    }

    function getAgent(uint256 id) external view returns (Agent memory) {
        return agents[id];
    }

    function _pull(address from, uint256 amount) private {
        require(musd.transferFrom(from, address(this), amount), "transferFrom failed");
    }

    function _push(address to, uint256 amount) private {
        require(musd.transfer(to, amount), "transfer failed");
    }
}
