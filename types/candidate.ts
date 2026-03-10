export interface Candidate {
  candidate_id: string;
  name: string;
  party_full: string;
  party: string;
  office: "S" | "H" | "P";
  office_full: string;
  incumbent_challenge_full: string;
  state: string;
  district: string;
  has_raised_funds: boolean;
  election_years: number[];
  positions_last_updated: Date | null;
  summary: string | null;
  positions: Record<string, number | null>;
  match_score: number | null;
  blacklist: boolean;
}
