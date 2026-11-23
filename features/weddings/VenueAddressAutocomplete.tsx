"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api/client";

type Suggestion = { placeId: string; description: string; mainText: string; secondaryText: string };
type PlaceDetails = {
  address: string;
  mapUrl: string;
  directionsUrl: string;
  latitude: number | null;
  longitude: number | null;
};

export function VenueAddressAutocomplete({
  value,
  onChange,
}: {
  value: string;
  onChange: (details: PlaceDetails) => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");

  useEffect(() => {
    if (value.trim().length < 3) {
      setSuggestions([]);
      setLookupMessage("");
      return;
    }
    const timer = window.setTimeout(() => {
      setLoading(true);
      void apiRequest<{ suggestions: Suggestion[]; configured?: boolean }>(
        `/api/v1/maps/autocomplete?input=${encodeURIComponent(value)}`,
      )
        .then((result) => {
          setSuggestions(result.suggestions ?? []);
          setLookupMessage(
            result.configured === false
              ? "Address suggestions are not configured yet."
              : result.suggestions?.length
                ? ""
                : "No matching addresses found.",
          );
          setOpen(true);
        })
        .catch(() => {
          setSuggestions([]);
          setLookupMessage("Address suggestions are temporarily unavailable.");
          setOpen(true);
        })
        .finally(() => setLoading(false));
    }, 260);
    return () => window.clearTimeout(timer);
  }, [value]);

  async function select(suggestion: Suggestion) {
    setLoading(true);
    try {
      const details = await apiRequest<PlaceDetails>(
        `/api/v1/maps/place/${encodeURIComponent(suggestion.placeId)}`,
      );
      onChange(details);
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="venue-address-picker">
      <div className="venue-address-input-wrap">
        <input
          aria-label="Venue address"
          autoComplete="off"
          value={value}
          onChange={(event) =>
            onChange({
              address: event.target.value,
              mapUrl: "",
              directionsUrl: "",
              latitude: null,
              longitude: null,
            })
          }
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Start typing the full venue address"
        />
        {loading ? <span className="venue-address-loading">Searching…</span> : null}
      </div>
      {open && suggestions.length ? (
        <div className="venue-address-suggestions" role="listbox">
          {suggestions.map((suggestion) => (
            <button key={suggestion.placeId} onClick={() => void select(suggestion)} type="button">
              <strong>{suggestion.mainText}</strong>
              <small>{suggestion.secondaryText || suggestion.description}</small>
            </button>
          ))}
          <span className="google-attribution">Powered by Google</span>
        </div>
      ) : null}
      {open && !suggestions.length && lookupMessage ? (
        <div className="venue-address-empty" role="status">
          {lookupMessage}
        </div>
      ) : null}
    </div>
  );
}
