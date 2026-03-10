export interface Issue {
  key: string;
  description: string;
  tags: string[];
  positions: string[]; // ordered: positions[0] = strongest support, positions[last] = strongest opposition
}

export const ISSUES: Issue[] = [
  {
    key: "deportations",
    description: "Candidate's position on deportations and ICE enforcement operations",
    tags: ["immigration"],
    positions: [
      "Supports immediate large-scale deportation of all undocumented immigrants regardless of family ties or time in country",
      "Supports mass deportation operations targeting all undocumented immigrants",
      "Supports deporting anyone who entered illegally regardless of criminal record",
      "Supports deporting individuals with serious criminal records only",
      "Supports deportations only for those convicted of violent crimes",
      "Opposes deportations entirely; supports abolishing ICE and open borders",
    ],
  },
  {
    key: "social_security",
    description: "Candidate's position on Social Security solvency and benefit reform",
    tags: ["economy"],
    positions: [
      "Strongly opposes any cuts; supports expanding benefits and lifting the payroll tax cap entirely",
      "Opposes benefit cuts; supports raising or eliminating the payroll tax cap on high earners",
      "Opposes benefit cuts; open to modest reforms like gradual retirement age adjustments for younger workers",
      "Supports modest structural reforms including adjusting the retirement age and cost-of-living formula",
      "Supports significant reform including means-testing, higher retirement ages, and reduced COLA adjustments",
      "Supports transitioning Social Security to private retirement accounts or phasing out the program",
    ],
  },
  {
    key: "tariffs",
    description: "Candidate's position on tariffs and their impact on consumer prices",
    tags: ["economy"],
    positions: [
      "Supports extreme tariffs and near-total economic decoupling from China and geopolitical rivals",
      "Strongly supports across-the-board tariffs as core economic and industrial policy",
      "Supports broad tariffs on China and adversaries while maintaining alliances",
      "Supports selective tariffs as a negotiating tool but opposes broad tariff walls",
      "Supports only narrowly targeted tariffs on national security goods",
      "Opposes tariffs entirely; supports free trade agreements",
    ],
  },
  {
    key: "doge",
    description: "Candidate's position on DOGE and mass federal workforce reductions",
    tags: ["economy", "legal_constitutional"],
    positions: [
      "Strongly supports DOGE and wants to dissolve or merge most federal agencies entirely",
      "Supports DOGE's mission and workforce reductions as overdue fiscal reform",
      "Supports reducing federal workforce size through attrition and reform rather than mass terminations",
      "Supports legitimate efficiency reviews but opposes mass firings and Musk's unaccountable role",
      "Opposes DOGE and all mass federal workforce reductions as unlawful",
      "Strongly opposes DOGE; supports restoring all fired workers and investigating Musk's conflicts of interest",
    ],
  },
  {
    key: "executive_overreach",
    description: "Candidate's position on the scope of presidential executive authority",
    tags: ["legal_constitutional"],
    positions: [
      "Supports the unitary executive theory with minimal checks from Congress or the courts",
      "Supports broad executive power to implement the elected agenda without bureaucratic obstruction",
      "Supports balanced executive and legislative authority with flexibility in emergencies",
      "Concerned about specific executive overreaches; supports case-by-case judicial review",
      "Opposes expanded presidential power; supports restoring congressional authority and agency independence",
      "Strongly opposes executive overreach across all domains; supports strict separation of powers",
    ],
  },
  {
    key: "medicaid_cuts",
    description: "Candidate's position on Medicaid cuts and coverage for low-income Americans",
    tags: ["healthcare"],
    positions: [
      "Supports eliminating the federal Medicaid program in favor of state-run or private alternatives",
      "Supports block grants, work requirements, and significant reduction in federal Medicaid spending",
      "Open to administrative efficiency reforms but opposes any reduction in covered populations",
      "Opposes cuts; supports preserving existing coverage levels while improving efficiency",
      "Opposes all Medicaid cuts; supports increased federal Medicaid funding",
      "Strongly opposes any cuts; supports expanding Medicaid to cover all uninsured Americans",
    ],
  },
  {
    key: "iran_war",
    description: "Candidate's position on U.S. military action / war with Iran",
    tags: ["foreign_policy"],
    positions: [
      "Supports full-scale war with Iran including regime change",
      "Supports sustained military campaign to destroy Iranian military and nuclear capability",
      "Supports limited strikes on Iranian nuclear facilities to prevent weapons development",
      "Supports targeted military action only as an absolute last resort after all diplomacy fails",
      "Strongly prefers diplomacy and sanctions; opposes strikes under any circumstances",
      "Opposes all military action against Iran and supports full diplomatic normalization",
    ],
  },
  {
    key: "aca_subsidies",
    description: "Candidate's position on ACA marketplace subsidies and health insurance affordability",
    tags: ["healthcare"],
    positions: [
      "Supports making enhanced subsidies permanent and expanding toward Medicare for All",
      "Supports permanently extending all enhanced ACA subsidies",
      "Supports extending subsidies and making incremental ACA improvements",
      "Open to extending subsidies with structural ACA reforms and cost controls",
      "Opposes extending subsidies; prefers market-based competition and health savings accounts",
      "Supports repealing the ACA entirely and eliminating all federal health insurance subsidies",
    ],
  },
  {
    key: "trans_rights",
    description: "Candidate's position on transgender healthcare, sports participation, and legal identification",
    tags: ["social_cultural"],
    positions: [
      "Strongly supports full transgender rights including gender-affirming care for minors with parental consent",
      "Supports transgender rights for adults and minors; opposes government restrictions on healthcare",
      "Supports adult transgender rights; open to age-specific restrictions on irreversible youth procedures",
      "Supports parental choice; opposes government mandates in either direction on gender medicine",
      "Supports banning gender-affirming care for minors, trans women in women's sports, and binary-only ID documents",
      "Supports comprehensive bans on gender transition at any age and removing legal recognition of gender change",
    ],
  },
  {
    key: "dei_rollbacks",
    description: "Candidate's position on dismantling DEI programs in federal agencies and government contractors",
    tags: ["social_cultural"],
    positions: [
      "Supports banning DEI programs and pursuing legal and administrative action against practitioners",
      "Supports eliminating all DEI mandates and requirements across federal agencies and contractors",
      "Supports merit-based hiring with voluntary diversity outreach but opposes mandated DEI programs",
      "Supports DEI with reforms; opposes a full federal rollback",
      "Supports DEI programs in federal agencies and contractor requirements",
      "Strongly opposes DEI rollbacks; supports expanding affirmative action and diversity mandates",
    ],
  },
];
