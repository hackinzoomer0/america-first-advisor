export interface Issue {
  key: string;
  description: string;
  tags: string[];
  positions: string[]; // ordered: positions[0] = strongest support, positions[last] = strongest opposition
}

export const ISSUES: Issue[] = [
  // Foreign Policy
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
    key: "venezuela",
    description: "Candidate's position on U.S. military intervention in Venezuela",
    tags: ["foreign_policy"],
    positions: [
      "Supports aggressive military intervention and seizure of Venezuelan oil assets",
      "Supports military intervention to restore democracy and protect U.S. interests",
      "Supports covert pressure and sanctions short of military force",
      "Supports targeted sanctions but opposes any military presence",
      "Opposes military intervention; supports sanctions relief and dialogue",
      "Opposes all U.S. interference; supports recognizing Maduro's government",
    ],
  },
  {
    key: "nato",
    description: "Candidate's position on NATO and U.S. commitments to European allies",
    tags: ["foreign_policy"],
    positions: [
      "Supports NATO expansion and increased U.S. defense spending for allies",
      "Strongly supports NATO as cornerstone of U.S. and global security",
      "Supports NATO but wants major reform and equitable burden-sharing",
      "Supports dramatically reducing U.S. NATO commitments and troop presence",
      "Supports full U.S. withdrawal from NATO",
    ],
  },
  {
    key: "ukraine_russia",
    description: "Candidate's position on U.S. support for Ukraine and peace negotiations with Russia",
    tags: ["foreign_policy"],
    positions: [
      "Supports direct NATO involvement to expel Russian forces",
      "Strongly supports Ukraine's right to reclaim all occupied territory including Crimea",
      "Supports continued military and economic aid until Ukraine can negotiate from strength",
      "Supports limited military aid tied to strict conditions and a negotiated settlement",
      "Supports humanitarian aid only; opposes all military assistance to Ukraine",
      "Opposes all U.S. aid to Ukraine; supports immediate ceasefire accepting Russian territorial gains",
    ],
  },
  {
    key: "greenland",
    description: "Candidate's position on U.S. territorial ambitions toward Greenland",
    tags: ["foreign_policy"],
    positions: [
      "Supports annexing Greenland by any means necessary including economic coercion",
      "Supports U.S. acquisition of Greenland as a strategic national security priority",
      "Open to purchasing Greenland if Denmark agrees voluntarily",
      "Opposes acquisition; supports voluntary partnership and basing agreements",
      "Strongly opposes any U.S. territorial claim; supports Greenlandic self-determination",
    ],
  },

  // Immigration & Border
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
    key: "birthright_citizenship",
    description: "Candidate's position on ending or preserving birthright citizenship",
    tags: ["immigration"],
    positions: [
      "Strongly supports birthright citizenship as an inviolable constitutional right",
      "Supports birthright citizenship; opposes any legislative or executive limitation",
      "Open to narrow legislative reform while preserving citizenship for most U.S.-born children",
      "Supports ending birthright citizenship for children of undocumented immigrants via legislation",
      "Supports ending birthright citizenship via executive order",
      "Supports ending birthright citizenship and retroactively reviewing citizenship granted under current policy",
    ],
  },
  {
    key: "legal_immigration",
    description: "Candidate's position on legal immigration levels, skilled worker visas (H-1B), and unskilled labor programs",
    tags: ["immigration"],
    positions: [
      "Supports significantly expanding legal immigration across all categories including unskilled labor, family reunification, and asylum",
      "Supports increasing H-1B and skilled worker visas; opposes reducing family or humanitarian immigration",
      "Supports maintaining current legal immigration levels with modest reforms to processing and backlogs",
      "Supports prioritizing high-skilled immigration while reducing unskilled and family-based immigration",
      "Supports replacing family-based immigration with a merit-based points system; reducing overall legal immigration levels",
      "Supports sharply cutting total legal immigration including H-1B visas, opposing guest worker programs for both skilled and unskilled labor",
      "Supports a near-moratorium on all legal immigration until wages and housing stabilize for American workers",
    ],
  },

  // Economy & Trade
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
      "Opposes tariffs entirely; supports free trade agreements with strong labor and environmental standards",
    ],
  },
  {
    key: "cost_of_living",
    description: "Candidate's position on inflation and cost of living relief",
    tags: ["economy"],
    positions: [
      "Supports price controls, windfall profit taxes on corporations, and major expansion of government subsidies",
      "Supports corporate profit investigations, large-scale housing investment, and expanded benefits",
      "Supports targeted relief programs, antitrust enforcement, and housing supply reform",
      "Supports supply-side solutions: cutting regulations, permitting reform, and energy production",
      "Supports across-the-board tax cuts and major deregulation to reduce consumer costs",
      "Attributes inflation to immigration and government spending; supports radical cuts to federal programs",
    ],
  },
  {
    key: "obbba",
    description: "Candidate's position on the One Big Beautiful Bill Act — student loans, Medicaid, and SNAP changes",
    tags: ["economy", "healthcare"],
    positions: [
      "Supports the bill but wants even deeper cuts to entitlement programs and spending",
      "Strongly supports the OBBBA as necessary fiscal reform",
      "Supports the bill's fiscal discipline while concerned about the most vulnerable losing coverage",
      "Opposes cuts to safety net programs but open to limited student loan reform",
      "Opposes Medicaid and SNAP cuts; opposes student loan restrictions",
      "Strongly opposes; supports expanding Medicaid, SNAP, and full student loan forgiveness",
    ],
  },
  {
    key: "federal_reserve",
    description: "Candidate's position on Federal Reserve independence and interest rate policy",
    tags: ["economy"],
    positions: [
      "Strongly supports Fed independence; wants Fed to prioritize full employment over inflation targets",
      "Supports Fed independence with stronger democratic accountability and congressional oversight",
      "Supports Fed independence as an economic norm essential to market confidence",
      "Open to informal White House input on rate direction while preserving nominal independence",
      "Supports direct presidential authority to direct Fed rate policy",
      "Supports abolishing the Federal Reserve and returning to a gold standard or commodity-backed currency",
    ],
  },
  {
    key: "national_debt",
    description: "Candidate's position on the national debt and deficit reduction",
    tags: ["economy"],
    positions: [
      "Deprioritizes debt reduction; supports large deficit spending on social programs and infrastructure",
      "Supports reducing debt primarily through higher taxes on corporations and the wealthy",
      "Supports a balanced mix of targeted spending cuts and tax increases on high earners",
      "Supports deficit reduction primarily through spending caps and entitlement reform",
      "Supports dramatic spending cuts including to Medicare, Medicaid, and Social Security",
      "Supports default or debt restructuring to force a reset of the federal fiscal trajectory",
    ],
  },

  // Healthcare
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
    key: "drug_pricing",
    description: "Candidate's position on pharmaceutical pricing and most-favored-nation drug pricing",
    tags: ["healthcare"],
    positions: [
      "Supports government manufacturing of essential drugs and aggressive international reference pricing",
      "Supports strong Medicare negotiation authority and broad price caps",
      "Supports Medicare drug price negotiation for a wide range of medications",
      "Supports limited negotiation and transparency requirements while protecting innovation incentives",
      "Prefers market competition and generic drug promotion over government price-setting",
      "Opposes all drug price regulation as harmful to pharmaceutical innovation and investment",
    ],
  },
  {
    key: "rfk_vaccines",
    description: "Candidate's position on RFK Jr.'s health agenda, vaccine policy, and food dye regulation",
    tags: ["healthcare"],
    positions: [
      "Opposes vaccine programs as harmful; supports major restrictions or bans on existing vaccines",
      "Strongly supports RFK Jr.'s health freedom agenda including revised vaccine schedules and food dye bans",
      "Supports parental choice on vaccines and open to reviewing food additive regulations",
      "Supports vaccines while open to greater transparency in the approval process",
      "Supports established vaccine science and CDC recommendations; opposes changes to children's vaccine schedule",
      "Strongly supports vaccine mandates and fully opposes RFK Jr.'s agenda as dangerous misinformation",
    ],
  },

  // Legal & Constitutional
  {
    key: "scotus_presidential_power",
    description: "Candidate's position on Supreme Court rulings on presidential power over tariffs, federal workforce, and birthright citizenship",
    tags: ["legal_constitutional"],
    positions: [
      "Supports near-absolute executive authority; views the courts as an obstacle to democratic will",
      "Supports broad presidential authority on immigration and economic policy; trusts the Court to sort it out",
      "Supports judicial deference to the executive on national security and immigration, less so on tariffs",
      "Concerned about executive overreach; supports judicial independence and rule of law",
      "Supports strong congressional checks; wants Supreme Court to strike down all three overreaches",
      "Supports court expansion to check presidential power; strongly opposes all three executive actions",
    ],
  },
  {
    key: "doge",
    description: "Candidate's position on DOGE and mass federal workforce reductions",
    tags: ["legal_constitutional", "economy"],
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

  // Technology & AI
  {
    key: "ai_regulation",
    description: "Candidate's position on federal vs. state AI regulation",
    tags: ["technology"],
    positions: [
      "Supports strict federal AI regulation including mandatory safety audits, liability standards, and oversight boards",
      "Supports comprehensive federal AI safety standards with civil society input",
      "Supports federal baseline with flexibility for states to impose stricter rules",
      "Supports light-touch federal framework with industry-led guidance and voluntary standards",
      "Prefers industry self-regulation; opposes federal mandates that could stifle innovation",
      "Opposes all AI regulation as government overreach; supports preempting state AI laws",
    ],
  },
  {
    key: "social_media_speech",
    description: "Candidate's position on social media moderation and government influence over speech",
    tags: ["technology", "legal_constitutional"],
    positions: [
      "Supports robust platform content moderation and opposes government interference to force speech",
      "Supports platform autonomy to moderate harmful content including hate speech and disinformation",
      "Supports transparency and accountability requirements without mandating specific content decisions",
      "Supports Section 230 reform to reduce liability protections encouraging over-moderation",
      "Supports breaking up tech monopolies specifically for censoring conservative speech",
      "Supports government action to force platforms to carry all legal speech regardless of platform rules",
    ],
  },

  // Social & Cultural
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
  {
    key: "civil_rights_leadership",
    description: "Candidate's position on civil rights priorities and enforcement in a post-Jackson era",
    tags: ["social_cultural"],
    positions: [
      "Supports reparations, robust affirmative action, and transformative racial justice policy",
      "Supports strong civil rights enforcement, anti-discrimination law expansion, and voting rights protection",
      "Supports targeted civil rights remedies focused on documented discrimination",
      "Supports colorblind enforcement of existing civil rights law without race-based remedies",
      "Opposes race-based remedies as unconstitutional; supports strictly individual rights framework",
      "Opposes the current civil rights framework as itself discriminatory; supports dismantling race-conscious institutions",
    ],
  },
  {
    key: "social_security",
    description: "Candidate's position on Social Security solvency and reform",
    tags: ["social_cultural", "economy"],
    positions: [
      "Strongly opposes any cuts; supports expanding benefits and lifting the payroll tax cap entirely",
      "Opposes benefit cuts; supports raising or eliminating the payroll tax cap on high earners",
      "Opposes benefit cuts; open to modest reforms like gradual retirement age adjustments for younger workers",
      "Supports modest structural reforms including adjusting the retirement age and cost-of-living formula",
      "Supports significant reform including means-testing, higher retirement ages, and reduced COLA adjustments",
      "Supports transitioning Social Security to private retirement accounts or phasing out the program",
    ],
  },
];
