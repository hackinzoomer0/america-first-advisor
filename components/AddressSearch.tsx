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
    <div className="flex flex-col gap-4 rounded-xl border border-edge bg-card p-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-ink">
          Your Address
        </label>
        <p className="text-xs text-ink-faint leading-relaxed">
          Enter your street address, city, or zip code to find candidates running in your district.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <SearchBox
            accessToken={TOKEN}
            onRetrieve={handleRetrieve}
            value={inputValue}
            onChange={setInputValue}
            options={{ language: "en" }}
          />
        </div>
        
        {location && (
          <div className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2">
            <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-success">
              Location selected - ready to search
            </span>
          </div>
        )}
        
        <button
          onClick={() => location && onSubmit(location)}
          disabled={!location || loading}
          className="group flex h-12 items-center justify-center gap-2.5 rounded-lg bg-accent px-6 text-sm font-semibold text-canvas transition-all hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Searching...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <span>Find My Candidates</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
