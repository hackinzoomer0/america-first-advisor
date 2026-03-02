export interface Candidate {
  candidate_id: string;
  name: string;
  party_full: string;
  party: string;
  /** S=US Senate, H=US House, E=Executive (President/Governor), SS=State Senate, SH=State House */
  office: "S" | "H" | "E" | "SS" | "SH";
  office_full: string;
  level: "federal" | "state";
  incumbent_challenge_full: string;
  state: string;
  district: string;
  has_raised_funds: boolean;
  election_years: number[];
  last_updated: Date | null;
  summary: string | null;
  immigration_position: string | null;
  immigration_score: number | null;
  foreign_policy_position: string | null;
  foreign_policy_score: number | null;
  social_policy_position: string | null;
  social_policy_score: number | null;
  religion_position: string | null;
  religion_score: number | null;
  total_score: number | null;
  blacklist: boolean;
}
