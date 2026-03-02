"use client";

import { useState } from "react";
import { SearchBox } from "@mapbox/search-js-react";
import type { SearchBoxRetrieveResponse } from "@mapbox/search-js-core";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_API_KEY ?? "";

interface Location {
  lat: number;
  lon: number;
  stateCode: string | null;
}

interface Props {
  onSubmit: (location: Location) => void;
  loading?: boolean;
}

export function AddressSearch({ onSubmit, loading }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [location, setLocation] = useState<Location | null>(null);

  function handleRetrieve(res: SearchBoxRetrieveResponse) {
    const [lon, lat] = res.features[0].geometry.coordinates;
    const stateCode =
      res.features[0].properties.context?.region?.region_code ?? null;
    setLocation({ lat, lon, stateCode });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">
          Your address
        </label>
        <p className="text-xs text-ink-faint">
          Enter your address, city, or zip code to find candidates in your area.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <SearchBox
          accessToken={TOKEN}
          onRetrieve={handleRetrieve}
          value={inputValue}
          onChange={setInputValue}
          options={{ language: "en" }}
        />
        <button
          onClick={() => location && onSubmit(location)}
          disabled={!location || loading}
          className="flex h-12 items-center justify-center rounded-[var(--radius)] bg-accent px-6 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Looking up...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              Find Candidates
            </span>
          )}
        </button>
      </div>
    </section>
  );
}
