/**
 * Federal election data via the FEC API.
 */

/**
 * Fetch active federal candidates from the FEC API for a given state and
 * congressional district. Includes both the at-large district ("00") and
 * the provided district number.
 */
export async function fetchCandidatesInDistrict(
  state: string,
  district: string
) {
  const params = new URLSearchParams({
    page: "1",
    per_page: "50",
    is_active_candidate: "true",
    election_year: new Date().getFullYear().toString(),
    state,
    sort: "name",
    sort_hide_null: "false",
    sort_null_only: "false",
    sort_nulls_last: "false",
    api_key: process.env.FEC_API_KEY ?? "DEMO_KEY",
  });
  params.append("district", "00");
  params.append("district", district);
  params.append("candidate_status", "C");
  params.append("candidate_status", "F");

  const res = await fetch(`https://api.open.fec.gov/v1/candidates/search/?${params}`);
  return res.json();
}