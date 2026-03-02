/**
 * Census Geocoder — resolves district information for a given coordinate pair.
 */

const CENSUS_YEAR = 2024; // update as needed based on Census API availability and accuracy

export interface DistrictInfo {
  /** US House congressional district (e.g. "05") */
  congressional: string | null;
  /** State Senate / upper chamber district */
  stateSenate: string | null;
  /** State House / lower chamber district */
  stateHouse: string | null;
}

/**
 * Resolve all relevant district numbers for a given coordinate pair in a
 * single Census Geocoder request: congressional, state senate, state house.
 *
 * Note: if stateSenate/stateHouse come back null unexpectedly, log the raw
 * `data.result.geographies` object to verify the exact response key names.
 */
export async function fetchDistricts(
  longitude: number,
  latitude: number
): Promise<DistrictInfo> {
  const params = new URLSearchParams({
    x: longitude.toString(),
    y: latitude.toString(),
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    layers: [
      "Congressional Districts",
      "State Legislative Districts - Upper",
      "State Legislative Districts - Lower",
    ].join(","),
    format: "json",
  });

  const res = await fetch(
    `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?${params}`
  );
  const data = await res.json();
  const geo = data?.result?.geographies ?? {};
  console.log("[geocoder] Raw geographies response:", geo);

  return {
    congressional: geo["119th Congressional Districts"]?.[0]?.CD119 ?? null,
    stateSenate: geo[`${CENSUS_YEAR} State Legislative Districts - Upper`]?.[0]?.SLDU ?? null,
    stateHouse: geo[`${CENSUS_YEAR} State Legislative Districts - Lower`]?.[0]?.SLDL ?? null,
  };
}