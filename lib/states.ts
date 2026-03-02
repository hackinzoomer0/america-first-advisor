/**
 * State elections scraper — fetches gubernatorial, state senate, and state
 * house candidates for a given state and year.
 */
import * as cheerio from "cheerio";

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New_Hampshire", NJ: "New_Jersey",
  NM: "New_Mexico", NY: "New_York", NC: "North_Carolina", ND: "North_Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode_Island", SC: "South_Carolina",
  SD: "South_Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West_Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "Washington,_D.C.",
};

/** Convert a two-letter state code to the slug used in Ballotpedia URLs. */
export function stateCodeToName(code: string): string | null {
  return STATE_NAMES[code.toUpperCase()] ?? null;
}

export interface StateCandidate {
  name: string;
  party: string;
  incumbent: boolean;
  url?: string;
}

export interface StateRace {
  type: "governor" | "state-senate" | "state-house";
  office: string;
  url: string;
  candidates: StateCandidate[];
}

export interface StateElectionsResult {
  state: string;
  year: number;
  races: StateRace[];
}

export interface StateDistricts {
  senate: string | null;
  house: string | null;
}

const BASE_URL = "https://ballotpedia.org";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en-US,en;q=0.9",
};

function toSlug(text: string): string {
  return text.replace(/\s+/g, "_");
}

async function fetchHtml(url: string): Promise<string | null> {
  const res = await fetch(url, { headers: FETCH_HEADERS, cache: "no-store" });
  if (!res.ok) return null;
  return res.text();
}

/**
 * Parse candidates from a Ballotpedia race page.
 *
 * Ballotpedia renders candidates inside `div.votebox` elements, each
 * corresponding to one primary or general election. The name is in a
 * `td.votebox-results-cell--text` cell; party comes from the
 * `race_header` CSS class (e.g. `race_header democratic`).
 *
 * @param url         - Page URL to fetch
 * @param requireYear - District pages cover multiple election cycles. When
 *                      set, only the section under the matching `<h3>` year
 *                      heading is processed; returns null if not found.
 */
async function scrapeRacePage(
  url: string,
  requireYear?: number
): Promise<{ office: string; candidates: StateCandidate[] } | null> {
  const html = await fetchHtml(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  const office = $("h1#firstHeading").text().trim();
  const candidates: StateCandidate[] = [];
  const seen = new Set<string>();

  // For district pages, scope to only the section for the requested year.
  // The year appears as the text of a `span.mw-headline` inside an h2/h3/h4.
  let $voteboxes: ReturnType<typeof $>;
  if (requireYear) {
    const $yearHeading = $("span.mw-headline")
      .filter((_, el) => $(el).text().trim() === requireYear.toString())
      .closest("h2, h3, h4");

    if ($yearHeading.length === 0) return null;

    // Collect all siblings between this heading and the next same-level heading
    const tag = ($yearHeading.prop("tagName") as string).toLowerCase();
    $voteboxes = $yearHeading.nextUntil(tag).find(".votebox");
  } else {
    $voteboxes = $(".votebox");
  }

  $voteboxes.each((_, votebox) => {
    const $votebox = $(votebox);

    // Party is encoded in the race_header CSS class
    const headerClass = ($votebox.find(".race_header").attr("class") ?? "").toLowerCase();
    let party = "Unknown";
    if (headerClass.includes("democratic")) party = "Democratic";
    else if (headerClass.includes("republican")) party = "Republican";
    else if (headerClass.includes("libertarian")) party = "Libertarian";
    else if (headerClass.includes("green")) party = "Green";

    $votebox.find("tr.results_row").each((_, row) => {
      const $nameCell = $(row).find("td.votebox-results-cell--text");
      if ($nameCell.length === 0) return;

      let name = "";
      let profileUrl: string | undefined;

      // Find the first text link in the name cell — skip links that only
      // wrap an image (e.g. the Candidate Connection survey logo link)
      $nameCell.find("a").each((_, link) => {
        const $link = $(link);
        if ($link.find("img").length > 0) return; // image-only link, skip
        const text = $link.text().trim();
        if (!text) return;
        name = text;
        const href = $link.attr("href") ?? "";
        profileUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
        return false; // stop at first valid text link
      });

      if (!name || seen.has(name)) return;
      seen.add(name);

      // Incumbents are wrapped in <b><u> inside the name cell
      const incumbent = $nameCell.find("b u, u b").length > 0;

      candidates.push({ name, party, incumbent, url: profileUrl });
    });
  });

  return { office, candidates };
}

/**
 * Scrape gubernatorial, state senate, and state house candidates for the
 * given state, year, and districts.
 *
 * - Gubernatorial: year is embedded in the URL, so a 404 means no election
 * - Senate/House: year is NOT in the URL — pages are skipped if the current
 *   year doesn't appear in the page content (no election this cycle)
 *
 * @param state     - Full state name as used in Ballotpedia slugs (e.g. "Colorado")
 * @param year      - Election year (defaults to current year)
 * @param districts - State senate and house district numbers for the user's location
 */
export async function scrapeStateElections(
  state: string,
  year: number = new Date().getFullYear(),
  districts?: StateDistricts
): Promise<StateElectionsResult> {
  const slug = toSlug(state);
  const races: StateRace[] = [];
  console.log(`[states] Scraping elections for ${state} (${year})`, { districts });

  const targets: Array<{ type: StateRace["type"]; url: string; requireYear?: number }> = [
    { type: "governor", url: `${BASE_URL}/${slug}_gubernatorial_election,_${year}` },
  ];

  if (districts?.senate) {
    const num = parseInt(districts.senate, 10);
    targets.push({
      type: "state-senate",
      url: `${BASE_URL}/${slug}_State_Senate_District_${num}`,
      requireYear: year,
    });
  }

  if (districts?.house) {
    const num = parseInt(districts.house, 10);
    targets.push({
      type: "state-house",
      url: `${BASE_URL}/${slug}_House_of_Representatives_District_${num}`,
      requireYear: year,
    });
  }

  for (const { type, url, requireYear } of targets) {
    try {
      const result = await scrapeRacePage(url, requireYear);
      if (result) races.push({ type, ...result, url });
    } catch (err) {
      console.warn(`[states] Skipping ${url}:`, err);
    }
  }

  return { state, year, races };
}