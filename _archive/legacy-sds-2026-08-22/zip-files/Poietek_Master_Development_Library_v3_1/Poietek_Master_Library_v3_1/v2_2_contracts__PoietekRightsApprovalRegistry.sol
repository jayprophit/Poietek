// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {AccessControlDefaultAdminRules} from "@openzeppelin/contracts/access/extensions/AccessControlDefaultAdminRules.sol";

/**
 * @notice Records cryptographically verifiable approvals of an off-chain Poietek Rights Manifest.
 * The full manifest and private Party data remain off-chain.
 */
contract PoietekRightsApprovalRegistry is
    EIP712,
    Nonces,
    Pausable,
    AccessControlDefaultAdminRules
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    bytes32 private constant RIGHTS_APPROVAL_TYPEHASH = keccak256(
        "RightsApproval(bytes32 manifestIdHash,bytes32 manifestContentHash,bytes32 partyIdHash,bytes32 approvalRoleHash,uint256 version,uint256 nonce,uint256 expiresAt)"
    );

    mapping(bytes32 => mapping(address => bool)) public approvedBySigner;

    event RightsApproved(
        bytes32 indexed manifestContentHash,
        bytes32 indexed partyIdHash,
        address indexed signer,
        bytes32 approvalRoleHash,
        uint256 version,
        uint256 nonce,
        uint256 expiresAt,
        uint256 blockNumber,
        uint256 blockTimestamp
    );

    constructor(address initialAdmin)
        EIP712("Poietek Rights Approval", "1")
        AccessControlDefaultAdminRules(2 days, initialAdmin)
    {
        _grantRole(PAUSER_ROLE, initialAdmin);
    }

    function approve(
        bytes32 manifestIdHash,
        bytes32 manifestContentHash,
        bytes32 partyIdHash,
        bytes32 approvalRoleHash,
        uint256 version,
        uint256 expiresAt,
        address signer,
        bytes calldata signature
    ) external whenNotPaused {
        require(block.timestamp <= expiresAt, "approval expired");

        uint256 nonce = nonces(signer);

        bytes32 structHash = keccak256(
            abi.encode(
                RIGHTS_APPROVAL_TYPEHASH,
                manifestIdHash,
                manifestContentHash,
                partyIdHash,
                approvalRoleHash,
                version,
                nonce,
                expiresAt
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        require(
            SignatureChecker.isValidSignatureNow(signer, digest, signature),
            "invalid signature"
        );

        _useNonce(signer);
        approvedBySigner[manifestContentHash][signer] = true;

        emit RightsApproved(
            manifestContentHash,
            partyIdHash,
            signer,
            approvalRoleHash,
            version,
            nonce,
            expiresAt,
            block.number,
            block.timestamp
        );
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
