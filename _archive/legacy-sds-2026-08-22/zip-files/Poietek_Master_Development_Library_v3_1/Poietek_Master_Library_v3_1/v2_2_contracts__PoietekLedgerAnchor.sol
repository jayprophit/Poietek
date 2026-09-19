// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControlDefaultAdminRules} from "@openzeppelin/contracts/access/extensions/AccessControlDefaultAdminRules.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PoietekLedgerAnchor
 * @notice Optional public tamper-evident anchor for Poietek rights/provenance/settlement snapshots.
 *
 * IMPORTANT:
 * - This contract does NOT determine copyright ownership.
 * - This contract does NOT register works with collecting societies.
 * - This contract does NOT hold or distribute fiat royalties.
 * - Private contributor/payment data MUST remain off-chain.
 *
 * The contract stores cryptographic hashes and emits public audit events.
 */
contract PoietekLedgerAnchor is AccessControlDefaultAdminRules, Pausable {
    bytes32 public constant ANCHOR_ROLE = keccak256("ANCHOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    enum AnchorKind {
        RightsManifest,
        ContributorApprovalBatch,
        RegistrationReceiptBatch,
        MarketplaceSettlementBatch,
        ExternalRoyaltyStatementBatch,
        ReleaseSnapshot,
        ProvenanceSnapshot
    }

    struct Anchor {
        bytes32 objectIdHash;
        bytes32 contentHash;
        bytes32 metadataRoot;
        uint64 version;
        uint64 blockNumber;
        uint64 blockTimestamp;
        address submittedBy;
        AnchorKind kind;
        bool exists;
    }

    mapping(bytes32 => Anchor) private _anchors;

    event AnchorRecorded(
        bytes32 indexed anchorId,
        bytes32 indexed objectIdHash,
        bytes32 indexed contentHash,
        bytes32 metadataRoot,
        uint64 version,
        AnchorKind kind,
        address submittedBy,
        uint64 blockNumber,
        uint64 blockTimestamp
    );

    event AnchorSuperseded(
        bytes32 indexed previousAnchorId,
        bytes32 indexed newAnchorId
    );

    constructor(address initialAdmin)
        AccessControlDefaultAdminRules(2 days, initialAdmin)
    {
        _grantRole(ANCHOR_ROLE, initialAdmin);
        _grantRole(PAUSER_ROLE, initialAdmin);
    }

    function recordAnchor(
        bytes32 anchorId,
        bytes32 objectIdHash,
        bytes32 contentHash,
        bytes32 metadataRoot,
        uint64 version,
        AnchorKind kind
    ) external onlyRole(ANCHOR_ROLE) whenNotPaused {
        require(!_anchors[anchorId].exists, "anchor exists");
        require(contentHash != bytes32(0), "content hash required");

        Anchor memory anchor = Anchor({
            objectIdHash: objectIdHash,
            contentHash: contentHash,
            metadataRoot: metadataRoot,
            version: version,
            blockNumber: uint64(block.number),
            blockTimestamp: uint64(block.timestamp),
            submittedBy: msg.sender,
            kind: kind,
            exists: true
        });

        _anchors[anchorId] = anchor;

        emit AnchorRecorded(
            anchorId,
            objectIdHash,
            contentHash,
            metadataRoot,
            version,
            kind,
            msg.sender,
            uint64(block.number),
            uint64(block.timestamp)
        );
    }

    function supersede(
        bytes32 previousAnchorId,
        bytes32 newAnchorId
    ) external onlyRole(ANCHOR_ROLE) whenNotPaused {
        require(_anchors[previousAnchorId].exists, "previous missing");
        require(_anchors[newAnchorId].exists, "new missing");
        emit AnchorSuperseded(previousAnchorId, newAnchorId);
    }

    function getAnchor(bytes32 anchorId) external view returns (Anchor memory) {
        require(_anchors[anchorId].exists, "anchor missing");
        return _anchors[anchorId];
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
