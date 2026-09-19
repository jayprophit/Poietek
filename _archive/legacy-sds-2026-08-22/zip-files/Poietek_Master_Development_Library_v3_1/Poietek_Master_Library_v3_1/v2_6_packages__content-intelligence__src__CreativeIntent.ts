export interface CreativeIntent {
  contentId: string;
  goals: string[];
  preserve: string[];
  avoid: string[];
  references: Array<{
    assetId?: string;
    externalRef?: string;
    purpose: string;
  }>;
  deliveryTargets: string[];
  notes?: string;
}

/**
 * AI recommendations must respect the Creative Intent object.
 * A deliberate lo-fi, clipped, narrow-band or low-dynamic-range aesthetic
 * should not be automatically "corrected" simply for differing from a genre
 * reference distribution.
 */
