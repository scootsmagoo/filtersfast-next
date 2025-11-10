"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CurrencyCode } from "@/lib/types/currency";
import { useCurrency, useGeoDetectCurrency, type CurrencyDetectionSource } from "@/lib/currency-context";
import { getCurrencyName, getCurrencySymbol } from "@/lib/currency-utils";
import { useStatusAnnouncement } from "@/components/ui/StatusAnnouncementProvider";

interface CurrencyDetectionNoticeProps {
  serverHint?: CurrencyCode | null;
  serverCountry?: string | null;
}

const NOTICE_SESSION_KEY = "ff_currency_notice_dismissed";

function getCountryDisplayName(countryCode: string | null): string | null {
  if (!countryCode) return null;

  try {
    if (typeof Intl !== "undefined" && typeof Intl.DisplayNames !== "undefined") {
      const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
      return regionNames.of(countryCode) ?? countryCode;
    }
  } catch {
    // Fallback to raw code
  }

  return countryCode;
}

export default function CurrencyDetectionNotice({
  serverHint = null,
  serverCountry = null,
}: CurrencyDetectionNoticeProps) {
  const { currency } = useCurrency();
  const { announceStatus } = useStatusAnnouncement();
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const friendlyCountryName = useMemo(
    () => getCountryDisplayName(serverCountry ?? null),
    [serverCountry]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadyDismissed = sessionStorage.getItem(NOTICE_SESSION_KEY);
    if (alreadyDismissed === "1") {
      setDismissed(true);
    }
  }, []);

  const handleDetected = useCallback(
    (detectedCurrency: CurrencyCode, source: CurrencyDetectionSource) => {
      if (dismissed) return;

      const currencyName = getCurrencyName(detectedCurrency);
      const currencySymbol = getCurrencySymbol(detectedCurrency);
      const locationSnippet =
        friendlyCountryName || serverCountry || detectedCurrency;

      const detectionMessage =
        source === "server"
          ? `We've detected you're browsing from ${locationSnippet}. Showing prices in ${currencyName} (${currencySymbol}).`
          : `We updated prices to ${currencyName} (${currencySymbol}) based on your location.`;

      setMessage(detectionMessage);
      setVisible(true);
      announceStatus(detectionMessage);
    },
    [announceStatus, dismissed, friendlyCountryName, serverCountry]
  );

  useGeoDetectCurrency({
    serverHint,
    onDetected: handleDetected,
  });

  const dismissNotice = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(NOTICE_SESSION_KEY, "1");
    }
  }, []);

  if (!visible || !message || dismissed || currency === "USD") {
    return null;
  }

  return (
    <div
      className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 text-sm flex items-start justify-between gap-4"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex-1">
        <p className="font-medium">{message}</p>
        <p className="text-xs text-blue-800/80 mt-1">
          Change currency anytime using the selector in the header.
        </p>
      </div>
      <button
        type="button"
        onClick={dismissNotice}
        className="text-blue-900 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 rounded px-2 py-1 text-xs font-semibold"
        aria-label="Dismiss currency notice"
      >
        Dismiss
      </button>
    </div>
  );
}


