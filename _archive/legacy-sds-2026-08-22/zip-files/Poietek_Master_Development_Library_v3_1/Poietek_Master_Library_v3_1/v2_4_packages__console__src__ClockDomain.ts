export type ClockProtocol =
  | "internal"
  | "word_clock"
  | "dante_ptp"
  | "aes67_ptpv2"
  | "madi_embedded"
  | "adat_embedded"
  | "aes3_embedded"
  | "aes50_embedded"
  | "usb_async"
  | "external_house"
  | "other";

export interface ClockEndpoint {
  deviceId: string;
  protocol: ClockProtocol;
  canLead: boolean;
  canFollow: boolean;
  sampleRates: number[];
  currentSampleRate?: number;
  locked?: boolean;
}

export interface ClockDomainPlan {
  domainId: string;
  sampleRate: number;
  leaderDeviceId: string;
  endpoints: ClockEndpoint[];
  sampleRateConversionBridges: string[];
  warnings: string[];
}

/**
 * This planner deliberately does not switch hardware itself.
 * Hardware adapters must validate the plan and request user confirmation.
 */
export function validateClockPlan(plan: ClockDomainPlan): string[] {
  const issues: string[] = [];

  const leader = plan.endpoints.find((e) => e.deviceId === plan.leaderDeviceId);
  if (!leader) issues.push("Clock leader is missing from the domain.");
  else if (!leader.canLead) issues.push("Selected clock leader cannot lead.");

  for (const endpoint of plan.endpoints) {
    if (!endpoint.sampleRates.includes(plan.sampleRate)) {
      if (!plan.sampleRateConversionBridges.includes(endpoint.deviceId)) {
        issues.push(
          `${endpoint.deviceId} does not support ${plan.sampleRate} Hz and no SRC bridge is declared.`,
        );
      }
    }

    if (endpoint.deviceId !== plan.leaderDeviceId && !endpoint.canFollow) {
      issues.push(`${endpoint.deviceId} cannot follow the selected domain clock.`);
    }
  }

  return issues;
}
