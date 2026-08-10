export type ClientReviewDestinationRow = {
  platform: string;
  reviewDestinationUrl?: string;
  reviewQrImageUrl?: string;
};

/**
 * Best-effort platform label for a review URL when the client only has legacy
 * `reviewDestinationUrl` and no `reviewDestinations` rows.
 */
export function inferPlatformFromReviewUrl(
  url: string | undefined | null,
): string {
  const u = (url ?? "").trim().toLowerCase();
  if (!u) return "Google";
  if (
    u.includes("facebook.com") ||
    u.includes("fb.com") ||
    u.includes("fb.me")
  ) {
    return "Facebook";
  }
  if (u.includes("justdial.com") || u.includes("justdial")) {
    return "Justdial";
  }
  if (
    u.includes("g.page") ||
    u.includes("google.com") ||
    u.includes("maps.app.goo.gl") ||
    u.includes("goo.gl")
  ) {
    return "Google";
  }
  return "Google";
}

/**
 * When the API returns only legacy `reviewDestinationUrl` / QR and an empty
 * `reviewDestinations` array, treat that link as belonging to one platform
 * (inferred from the URL) so other platforms do not incorrectly reuse it.
 */
export function resolveClientReviewDestinationsPayload(client: {
  reviewDestinationUrl?: string;
  reviewQrImageUrl?: string;
  reviewDestinations?: ClientReviewDestinationRow[];
}): {
  reviewDestinations: ClientReviewDestinationRow[];
  fallbackReviewDestinationUrl: string;
  fallbackReviewQrImageUrl: string;
} {
  const rawList = client.reviewDestinations ?? [];
  const legacyUrl = client.reviewDestinationUrl?.trim();
  const legacyQr = client.reviewQrImageUrl?.trim();
  if (rawList.length === 0 && (legacyUrl || legacyQr)) {
    return {
      reviewDestinations: [
        {
          platform: inferPlatformFromReviewUrl(legacyUrl),
          reviewDestinationUrl: legacyUrl || undefined,
          reviewQrImageUrl: legacyQr || undefined,
        },
      ],
      fallbackReviewDestinationUrl: "",
      fallbackReviewQrImageUrl: "",
    };
  }
  return {
    reviewDestinations: rawList,
    fallbackReviewDestinationUrl: client.reviewDestinationUrl ?? "",
    fallbackReviewQrImageUrl: client.reviewQrImageUrl ?? "",
  };
}
