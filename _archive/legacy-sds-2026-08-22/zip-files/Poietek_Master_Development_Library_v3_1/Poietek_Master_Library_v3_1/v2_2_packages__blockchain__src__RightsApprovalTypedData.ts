export interface RightsApprovalMessage {
  manifestIdHash: `0x${string}`;
  manifestContentHash: `0x${string}`;
  partyIdHash: `0x${string}`;
  approvalRoleHash: `0x${string}`;
  version: bigint;
  nonce: bigint;
  expiresAt: bigint;
}

export function rightsApprovalTypedData(input: {
  chainId: bigint;
  verifyingContract: `0x${string}`;
  message: RightsApprovalMessage;
}) {
  return {
    domain: {
      name: "Poietek Rights Approval",
      version: "1",
      chainId: input.chainId,
      verifyingContract: input.verifyingContract,
    },
    primaryType: "RightsApproval",
    types: {
      RightsApproval: [
        { name: "manifestIdHash", type: "bytes32" },
        { name: "manifestContentHash", type: "bytes32" },
        { name: "partyIdHash", type: "bytes32" },
        { name: "approvalRoleHash", type: "bytes32" },
        { name: "version", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "expiresAt", type: "uint256" },
      ],
    },
    message: input.message,
  } as const;
}
