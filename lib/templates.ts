export interface DocTemplate {
  id: string;
  name: string;
  category: "Business" | "Legal" | "Academic" | "HR & Career" | "Product & Marketing";
  blurb: string;
  accent: string; // category accent for the card (the palette's primary)
  html: string;
}

/** ── Professional palettes (exact hex from the design spec) ──
 *  a = primary ink/accent · s = secondary/muted · bg = soft surface tint */
interface Pal { a: string; s: string; bg: string }
const PAL = {
  execNavy: { a: "#1E3A8A", s: "#64748B", bg: "#F8FAFC" }, // Executive Navy
  emerald:  { a: "#064E3B", s: "#3F6B53", bg: "#ECFDF5" }, // Emerald Corporate
  charcoal: { a: "#1F2937", s: "#6B7280", bg: "#F3F4F6" }, // Charcoal Minimalist
  legal:    { a: "#111827", s: "#374151", bg: "#F9FAFB" }, // Legal Charcoal
  deepNavy: { a: "#0F172A", s: "#475569", bg: "#F8FAFC" }, // Deep Navy
  oxbridge: { a: "#722F37", s: "#2D2D2D", bg: "#FAF6F2" }, // Oxbridge Burgundy
  ivy:      { a: "#1E293B", s: "#64748B", bg: "#F8FAFC" }, // Ivy League Navy
  mono:     { a: "#111111", s: "#4B5563", bg: "#F4F4F5" }, // Monochrome Draft
} as const;

// ── HTML builders. Colours ride on textStyle spans (FontColor extension) so they
//    survive TipTap's schema; structure uses headings, tables, blockquote, hr, lists. ──
const c = (P: Pal, t: string) => `<span style="color:${P.a}">${t}</span>`;
const cs = (P: Pal, t: string) => `<span style="color:${P.s}">${t}</span>`;
const H1 = (P: Pal, t: string) => `<h1>${c(P, t)}</h1>`;
const H2 = (P: Pal, t: string) => `<h2>${c(P, t)}</h2>`;
const H3 = (P: Pal, t: string) => `<h3>${c(P, t)}</h3>`;
const P_ = (t: string) => `<p>${t}</p>`;
const SUB = (P: Pal, t: string) => `<p><em>${cs(P, t)}</em></p>`;
const FONTS = (P: Pal, f: string) => `<p><em>${cs(P, "Type pairing — " + f)}</em></p>`;
const HR = "<hr>";
const LI = (...x: string[]) => `<ul>${x.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const OL = (...x: string[]) => `<ol>${x.map((i) => `<li>${i}</li>`).join("")}</ol>`;
const CHK = (...x: string[]) => `<ul data-type="taskList">${x.map((i) => `<li data-type="taskItem" data-checked="false">${i}</li>`).join("")}</ul>`;
const META = (...pairs: [string, string][]) =>
  `<p>${pairs.map(([k, v]) => `<strong>${k}:</strong> ${v || "&nbsp;&nbsp;&nbsp;&nbsp;"}`).join(" &nbsp;&nbsp;·&nbsp;&nbsp; ")}</p>`;
const CALL = (P: Pal, label: string, body: string) =>
  `<blockquote><p><strong>${c(P, label)}</strong> — ${body}</p></blockquote>`;
const TABLE = (P: Pal, headers: string[], rows: string[][]) => {
  const head = `<tr>${headers.map((hh) => `<th style="background-color:${P.bg}"><strong>${c(P, hh)}</strong></th>`).join("")}</tr>`;
  const body = rows.map((r) => `<tr>${r.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");
  return `<table><tbody>${head}${body}</tbody></table>`;
};
const SIGN = (P: Pal, ...parties: string[]) =>
  TABLE(P, parties.map((pn) => pn), [parties.map(() => `<br>______________________<br>Name:<br>Title:<br>Date:<br>&nbsp;`)]);

function t(id: string, name: string, category: DocTemplate["category"], blurb: string, P: Pal, html: string): DocTemplate {
  return { id, name, category, blurb, accent: P.a, html };
}

export const TEMPLATES: DocTemplate[] = [
  // ─────────────────────────── Business ───────────────────────────
  t("biz-plan", "Business Plan", "Business", "One-page canvas: problem, model, 3-year financials.", PAL.execNavy,
    H1(PAL.execNavy, "[Company Name]") + SUB(PAL.execNavy, "[Tagline] · [Date]") + FONTS(PAL.execNavy, "Inter + Roboto") + HR +
    H2(PAL.execNavy, "Problem & Solution") +
    TABLE(PAL.execNavy, ["The Problem", "Our Solution"], [["The market pain point we address.", "The product that resolves it."]]) +
    H2(PAL.execNavy, "Market & Competition") + P_("<strong>Target demographic:</strong> who we serve.") + P_("<strong>Competitive advantage:</strong> why we win.") +
    H2(PAL.execNavy, "Business Model") + P_("<strong>Revenue streams:</strong> how we make money.") + P_("<strong>Pricing strategy:</strong> packaging and price points.") +
    H2(PAL.execNavy, "Financial Projections") +
    TABLE(PAL.execNavy, ["", "Year 1", "Year 2", "Year 3"], [["Revenue", "$—", "$—", "$—"], ["Expenses", "$—", "$—", "$—"], ["Net Profit", "$—", "$—", "$—"]])),

  t("exec-summary", "Executive Summary", "Business", "Editorial one-pager: hook, findings, impact, ask.", PAL.charcoal,
    H1(PAL.charcoal, "Executive Summary") + META(["Project", ""], ["Author", ""], ["Date", ""]) + FONTS(PAL.charcoal, "Merriweather + Source Sans Pro") + HR +
    P_("<strong>" + c(PAL.charcoal, "A bold, two-line statement of the core objective — what this document sets out to achieve and why it matters now.") + "</strong>") +
    H2(PAL.charcoal, "Key Findings") +
    LI("<strong>Finding one:</strong> the supporting detail.", "<strong>Finding two:</strong> the supporting detail.", "<strong>Finding three:</strong> the supporting detail.") +
    CALL(PAL.charcoal, "Resource impact", "Required budget, projected ROI, or headcount needed to deliver.") +
    H2(PAL.charcoal, "Recommendation & Next Steps") + P_("A concluding paragraph stating the explicit call to action and the decision being requested.")),

  t("meeting-agenda", "Meeting Agenda", "Business", "Timed 4-column agenda with owners and prep.", PAL.emerald,
    H1(PAL.emerald, "Meeting Agenda") + META(["Title", ""], ["Date / Time", ""], ["Location / Link", ""]) + P_("<strong>Attendees:</strong> ") + FONTS(PAL.emerald, "Lato + Open Sans") + HR +
    CALL(PAL.emerald, "Objective", "A single sentence stating the goal of this meeting.") +
    H2(PAL.emerald, "Agenda") +
    TABLE(PAL.emerald, ["Time", "Topic", "Owner", "Preparation"], [
      ["10:00 – 10:15", "Welcome & context", "—", "—"],
      ["10:15 – 10:40", "Q3 budget review", "—", "Read attached PDF"],
      ["10:40 – 10:55", "Discussion", "—", "—"],
      ["10:55 – 11:00", "Action items & close", "—", "—"],
    ])),

  t("meeting-minutes", "Meeting Minutes", "Business", "Clean record: decisions and action-item table.", PAL.charcoal,
    H1(PAL.charcoal, "Meeting Minutes") + META(["Meeting", ""], ["Date", ""], ["Recorded by", ""]) + FONTS(PAL.charcoal, "Inter + Roboto") + HR +
    TABLE(PAL.charcoal, ["Present", "Absent"], [["—", "—"]]) +
    H2(PAL.charcoal, "Key Decisions Made") + LI("Finalized agreement one.", "Finalized agreement two.") +
    H2(PAL.charcoal, "Action Items") +
    TABLE(PAL.charcoal, ["Task", "Owner", "Deadline"], [["—", "—", "—"], ["—", "—", "—"]]) +
    H2(PAL.charcoal, "Next Meeting") + P_("Date, time, and tentative focus for the follow-up session.")),

  t("proposal", "Business Proposal", "Business", "Authoritative client proposal with investment grid.", PAL.execNavy,
    H1(PAL.execNavy, "Business Proposal") + META(["Client", ""], ["Prepared by", ""], ["Project", ""], ["Date", ""]) + FONTS(PAL.execNavy, "Inter + Roboto") + HR +
    H2(PAL.execNavy, "Executive Statement") + P_("A brief acknowledgment of the client's current needs and situation.") +
    H2(PAL.execNavy, "Proposed Solution") + P_("A structured summary of the services and products we will deliver.") +
    H2(PAL.execNavy, "Why Us") + LI("Reason one we are the best fit.", "Reason two.", "Reason three.") +
    H2(PAL.execNavy, "Investment Summary") +
    TABLE(PAL.execNavy, ["Item", "Description", "Amount"], [["—", "—", "$—"], ["—", "—", "$—"], ["<strong>Total Investment</strong>", "", "<strong>$—</strong>"]]) +
    H2(PAL.execNavy, "Sign-off") + SIGN(PAL.execNavy, "Provider", "Client")),

  t("sow", "Statement of Work", "Business", "High-contrast scope, milestones, acceptance.", PAL.charcoal,
    H1(PAL.charcoal, "Statement of Work") + META(["Project", ""], ["Effective date", ""], ["Client / Provider", ""]) + FONTS(PAL.charcoal, "Merriweather + Source Sans Pro") + HR +
    H2(PAL.charcoal, "Scope of Work") + P_("A concise paragraph detailing what is explicitly <strong>in scope</strong>.") + P_("<em>Out of scope:</em> a brief note on exclusions.") +
    H2(PAL.charcoal, "Milestones & Deliverables") +
    TABLE(PAL.charcoal, ["Phase", "Deliverable"], [["Phase 1", "—"], ["Phase 2", "—"], ["Phase 3", "—"]]) +
    H2(PAL.charcoal, "Timeline") + TABLE(PAL.charcoal, ["Milestone", "Target week"], [["Kickoff", "W1"], ["Draft", "W4"], ["Delivery", "W8"]]) +
    H2(PAL.charcoal, "Acceptance Criteria") + CHK("Deliverables meet the agreed specification.", "Client review completed.", "Sign-off received.")),

  t("project-charter", "Project Charter", "Business", "Authorize a project with a RACI matrix.", PAL.execNavy,
    H1(PAL.execNavy, "Project Charter") + META(["Project", ""], ["Sponsor", ""], ["Project manager", ""]) + FONTS(PAL.execNavy, "Lato + Open Sans") + HR +
    H2(PAL.execNavy, "Business Case & Goals") + P_("Why this project exists and its measurable success metrics.") +
    H2(PAL.execNavy, "High-Level Scope") + P_("The boundaries of the project — what is in and out.") +
    H2(PAL.execNavy, "Stakeholders & RACI") +
    TABLE(PAL.execNavy, ["Activity", "Responsible", "Accountable", "Consulted", "Informed"], [["—", "—", "—", "—", "—"], ["—", "—", "—", "—", "—"]]) +
    H2(PAL.execNavy, "Budget & Assumptions") + P_("<strong>Authorized spend:</strong> $—") + LI("Critical dependency one.", "Key assumption one.")),

  t("status-report", "Status Report", "Business", "RAG-status project update with native indicators.", PAL.emerald,
    H1(PAL.emerald, "Status Report") + META(["Project", ""], ["PM", ""], ["Date", ""], ["Period", ""]) + FONTS(PAL.emerald, "Inter + Roboto") + HR +
    CALL(PAL.emerald, "Overall health", "🟢 On track &nbsp;|&nbsp; 🟡 At risk &nbsp;|&nbsp; 🔴 Off track") +
    H2(PAL.emerald, "Key Achievements") + LI("Completed this period.", "Completed this period.") +
    H2(PAL.emerald, "Upcoming Milestones") + LI("Focus for next period.") +
    H2(PAL.emerald, "Risks & Roadblocks") +
    TABLE(PAL.emerald, ["Blocker", "Impact", "Mitigation"], [["—", "—", "—"]])),

  t("memo", "Business Memo", "Business", "Traditional memorandum with routing block.", PAL.charcoal,
    H1(PAL.charcoal, "MEMORANDUM") + FONTS(PAL.charcoal, "Merriweather + Source Sans Pro") +
    META(["TO", ""], ["FROM", ""]) + META(["DATE", ""], ["SUBJECT", ""]) + HR +
    P_("A two-sentence introductory paragraph stating the exact purpose of this memo.") +
    H3(PAL.charcoal, "Background") + P_("Context the reader needs.") +
    H3(PAL.charcoal, "Details") + P_("Structured body broken up by subtle subheadings.") +
    H3(PAL.charcoal, "Action Required") + P_("Exactly what the reader needs to do next.")),

  t("press-release", "Press Release", "Business", "Wire-ready release with dateline and end mark.", PAL.execNavy,
    H1(PAL.execNavy, "FOR IMMEDIATE RELEASE") + FONTS(PAL.execNavy, "Lato + Open Sans") +
    P_("<strong>Media contact:</strong> Name · email · phone") + HR +
    `<h1 style="text-align:center">${c(PAL.execNavy, "Compelling Headline Goes Here")}</h1>` +
    `<p style="text-align:center"><em>A smaller italicized sub-headline that adds context.</em></p>` +
    P_("<strong>SINGAPORE — June 22, 2026 —</strong> The opening paragraph delivering the core news: what, who, why, and when.") +
    P_("Supporting detail that expands on the announcement.") +
    `<blockquote><p>"An executive statement adding a human voice to the news."</p><p>— Name, Title</p></blockquote>` +
    H3(PAL.execNavy, "About [Company]") + P_("A short, generic boilerplate paragraph describing the company.") +
    `<p style="text-align:center"><strong>###</strong></p>`),

  // ─────────────────────────── Legal ───────────────────────────
  t("nda", "Non-Disclosure Agreement", "Legal", "Mutual NDA with parallel signature blocks.", PAL.legal,
    H1(PAL.legal, "Non-Disclosure Agreement") + FONTS(PAL.legal, "Merriweather + Source Sans Pro") + HR +
    H2(PAL.legal, "1. The Parties") + P_("This Agreement is entered into as of [Date] between the <strong>Disclosing Party</strong>, [Name & address], and the <strong>Receiving Party</strong>, [Name & address].") +
    H2(PAL.legal, "2. Confidential Information") + P_("All non-public business, technical, and financial information disclosed by either party, in any form, is deemed Confidential Information protected under this Agreement.") +
    H2(PAL.legal, "3. Obligations & Term") + P_("The Receiving Party shall not use or disclose Confidential Information for any purpose outside this engagement. This Agreement remains valid for <strong>two (2) years</strong> from signing.") +
    H2(PAL.legal, "4. Remedies") + P_("The parties agree that a breach authorizes injunctive relief and recovery of reasonable legal fees.") +
    H2(PAL.legal, "5. Signatures") + SIGN(PAL.legal, "Disclosing Party", "Receiving Party")),

  t("service-agreement", "Service Agreement", "Legal", "Ongoing-services contract with liability cap.", PAL.deepNavy,
    H1(PAL.deepNavy, "Service Agreement") + FONTS(PAL.deepNavy, "Helvetica + Inter") + HR +
    H2(PAL.deepNavy, "1. Engagement") + P_("[Client] engages [Provider] to perform the following specific services: —.") +
    H2(PAL.deepNavy, "2. Payment Terms") + LI("Invoicing: Net-30.", "Late fee: 1.5% per month on overdue balances.", "Retainer: $— due on signing.") +
    H2(PAL.deepNavy, "3. Term & Termination") + P_("Either party may terminate with <strong>thirty (30) days' written notice</strong>.") +
    H2(PAL.deepNavy, "4. Liability Cap") + P_("Total liability under this Agreement shall not exceed the total amount paid hereunder.") +
    H2(PAL.deepNavy, "5. Signatures") + SIGN(PAL.deepNavy, "Provider", "Client")),

  t("consulting", "Consulting Agreement", "Legal", "Independent-contractor terms with IP ownership.", PAL.deepNavy,
    H1(PAL.deepNavy, "Consulting Agreement") + FONTS(PAL.deepNavy, "Helvetica + Inter") + HR +
    H2(PAL.deepNavy, "1. Independent Contractor Status") + P_("The Consultant is an independent contractor, not an employee, and is solely responsible for their own taxes and benefits.") +
    H2(PAL.deepNavy, "2. Services & Compensation") + P_("Services: —. Compensation: $— per hour, capped at $— per month.") +
    H2(PAL.deepNavy, "3. Intellectual Property") + P_("All work product created under this Agreement is a <strong>Work for Hire</strong> and belongs entirely to the Client.") +
    H2(PAL.deepNavy, "4. Confidentiality") + P_("The Consultant shall hold all Client information in strict confidence during and after the engagement.") +
    H2(PAL.deepNavy, "5. Signatures") + SIGN(PAL.deepNavy, "Client", "Consultant")),

  t("privacy-policy", "Privacy Policy", "Legal", "One-page summary with a data-collection grid.", PAL.legal,
    H1(PAL.legal, "Privacy Policy") + SUB(PAL.legal, "Effective date: [Date]") + FONTS(PAL.legal, "Merriweather + Source Sans Pro") + HR +
    H2(PAL.legal, "Data We Collect") +
    TABLE(PAL.legal, ["Data type", "How we use it", "Shared with"], [["Account info", "Provide the service", "None"], ["Usage data", "Improve the product", "Analytics provider"]]) +
    H2(PAL.legal, "Your Rights") + LI("Access your data.", "Delete your data.", "Opt out of processing.") +
    H2(PAL.legal, "Security & Cookies") + P_("We encrypt data in transit and at rest and use cookies for essential functionality.") +
    H2(PAL.legal, "Contact") + P_("Privacy inquiries: privacy@[company].com")),

  t("tos", "Terms of Service", "Legal", "Binding terms with conspicuous warranty notice.", PAL.legal,
    H1(PAL.legal, "Terms of Service") + FONTS(PAL.legal, "Helvetica + Inter") + HR +
    H2(PAL.legal, "1. Acceptance of Terms") + P_("By using this app or site, you agree to be bound by these Terms.") +
    H2(PAL.legal, "2. User Accounts") + P_("You are responsible for account security and must meet the minimum age requirement.") +
    H2(PAL.legal, "3. Prohibited Conduct") + LI("Reverse engineering the service.", "Automated scraping.", "Harassment of other users.") +
    H2(PAL.legal, "4. Disclaimer of Warranties") + P_("<strong>THE SERVICE IS PROVIDED \"AS IS\" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.</strong>") +
    H2(PAL.legal, "5. Governing Law") + P_("These Terms are governed by the laws of [State / Country].")),

  t("demand-letter", "Demand Letter", "Legal", "Formal black-and-white demand to resolve a dispute.", PAL.legal,
    H1(PAL.legal, "Demand Letter") + SUB(PAL.legal, "[Sender name · address · date]") + FONTS(PAL.legal, "Times New Roman + Garamond") + HR +
    P_("[Recipient name · address]") + P_("<strong>RE: Unpaid Invoice #102</strong>") + P_("Dear [Recipient],") +
    H3(PAL.legal, "Background") + P_("A chronological breakdown of the events leading to this dispute.") +
    H3(PAL.legal, "The Demand") + P_("Payment of <strong>$5,000 via wire transfer within fourteen (14) business days</strong> of the date of this letter.") +
    H3(PAL.legal, "Consequence") + P_("Failure to comply will result in immediate legal action without further notice.") +
    P_("Sincerely,<br>[Name]")),

  t("poa", "Power of Attorney", "Legal", "Grant of powers with a notary block.", PAL.legal,
    H1(PAL.legal, "Power of Attorney") + FONTS(PAL.legal, "Times New Roman + Garamond") + HR +
    P_("I, <strong>[Principal]</strong>, hereby appoint <strong>[Agent]</strong> as my attorney-in-fact to act on my behalf.") +
    H2(PAL.legal, "Grant of Powers") + CHK("Real estate transactions", "Banking & finances", "Business operations") +
    H2(PAL.legal, "Durability Clause") + P_("This power <strong>shall / shall not</strong> remain in effect if the Principal becomes incapacitated.") +
    H2(PAL.legal, "Notarization") +
    TABLE(PAL.legal, ["Principal signature", "Notary Public"], [["______________________<br>Date:", "______________________<br>Seal / commission expiry:"]])),

  t("employment", "Employment Contract", "Legal", "Offer terms with an at-will clause.", PAL.deepNavy,
    H1(PAL.deepNavy, "Employment Agreement") + FONTS(PAL.deepNavy, "Merriweather + Source Sans Pro") + HR +
    H2(PAL.deepNavy, "1. Position") + META(["Title", ""], ["Department", ""], ["Start date", ""], ["Reports to", ""]) +
    H2(PAL.deepNavy, "2. Compensation & Benefits") + P_("Base salary of $— per year, plus eligibility for healthcare and PTO per company policy.") +
    H2(PAL.deepNavy, "3. At-Will Employment") + P_("Employment is at-will and may be terminated by either party at any time, with or without cause, where permitted by law.") +
    H2(PAL.deepNavy, "4. Company Policies") + P_("The employee agrees to adhere to the employee handbook and all IP-protection policies.") +
    H2(PAL.deepNavy, "5. Signatures") + SIGN(PAL.deepNavy, "Company", "Employee")),

  t("lease", "Lease Agreement", "Legal", "One-page rider with a key-financials grid.", PAL.legal,
    H1(PAL.legal, "Lease Agreement") + FONTS(PAL.legal, "Times New Roman + Garamond") + HR +
    H2(PAL.legal, "Premises & Parties") + P_("<strong>Landlord:</strong> — &nbsp; <strong>Tenant:</strong> —") + P_("<strong>Property:</strong> full address, unit #") +
    H2(PAL.legal, "Key Financials") +
    TABLE(PAL.legal, ["Monthly rent", "Due date", "Security deposit", "Late fee"], [["$—", "1st", "$—", "$—"]]) +
    H2(PAL.legal, "Term") + P_("Start date: — &nbsp;·&nbsp; End date: —") +
    H2(PAL.legal, "Rules & Restrictions") + LI("Pets: —", "Subletting: —", "Smoking: —") +
    H2(PAL.legal, "Signatures") + SIGN(PAL.legal, "Landlord", "Tenant")),

  t("cease-desist", "Cease & Desist", "Legal", "Formal notice to halt an infringing activity.", PAL.legal,
    `<h1 style="text-align:center">${c(PAL.legal, "NOTICE TO CEASE AND DESIST")}</h1>` + FONTS(PAL.legal, "Merriweather + Source Sans Pro") + SUB(PAL.legal, "[Date]") + HR +
    P_("Dear [Recipient],") +
    H3(PAL.legal, "Infringement Details") + P_("Precise description of the illegal activity — e.g., unauthorized use of trademark X at URL Y.") +
    H3(PAL.legal, "Legal Basis") + P_("Citation of the intellectual-property or harassment laws breached.") +
    H3(PAL.legal, "The Directive") + P_("You are directed to immediately halt the described conduct and destroy all infringing materials.") +
    H3(PAL.legal, "Deadline") + P_("Written confirmation of compliance must be received by <strong>[Date]</strong>, before litigation begins.")),

  // ─────────────────────────── Academic ───────────────────────────
  t("research-paper", "Research Paper", "Academic", "IMRaD one-page overview with justified abstract.", PAL.mono,
    `<h1 style="text-align:center">${c(PAL.mono, "Title of the Paper")}</h1>` +
    `<p style="text-align:center">${cs(PAL.mono, "Author(s) · Institutional Affiliation · contact@email")}</p>` + FONTS(PAL.mono, "Times New Roman + Garamond") + HR +
    H2(PAL.mono, "Abstract") + `<p style="text-align:justify"><em>A 150-word justified summary of the entire study — its purpose, method, principal results, and conclusion.</em></p>` +
    H3(PAL.mono, "Introduction") + P_("Background and hypothesis.") +
    H3(PAL.mono, "Methods") + P_("Participants, materials, and procedure.") +
    H3(PAL.mono, "Results") + TABLE(PAL.mono, ["Measure", "Group A", "Group B", "p"], [["—", "—", "—", "—"]]) +
    H3(PAL.mono, "Discussion") + P_("Implications and limitations.") +
    H3(PAL.mono, "References") + P_("Author, A. (Year). <em>Title</em>. Source.")),

  t("lit-review", "Literature Review", "Academic", "Synthesis matrix across the reviewed sources.", PAL.ivy,
    H1(PAL.ivy, "Literature Review") + META(["Topic", ""], ["Author", ""], ["Date", ""]) + FONTS(PAL.ivy, "Merriweather + Source Sans Pro") + HR +
    H2(PAL.ivy, "Scope") + P_("A brief paragraph defining the overarching scope of the reviewed literature.") +
    H2(PAL.ivy, "Synthesis Matrix") +
    TABLE(PAL.ivy, ["Source (Author, Year)", "Methodology", "Key findings", "Themes / overlaps"], [["—", "—", "—", "—"], ["—", "—", "—", "—"], ["—", "—", "—", "—"]]) +
    H2(PAL.ivy, "Gaps & Conclusion") + P_("A summary identifying the gaps in current research that your work addresses.")),

  t("lab-report", "Lab Report", "Academic", "Scientific report with a data grid.", PAL.ivy,
    H1(PAL.ivy, "Lab Report") + META(["Title", ""], ["Course", ""], ["Date", ""]) + P_("<strong>Partners:</strong> — &nbsp; <strong>Instructor:</strong> —") + FONTS(PAL.ivy, "Inter + Roboto") + HR +
    H2(PAL.ivy, "Objective / Hypothesis") + P_("The scientific question and expected outcome.") +
    H2(PAL.ivy, "Materials & Methods") + TABLE(PAL.ivy, ["Apparatus", "Procedure"], [["—", "—"]]) +
    H2(PAL.ivy, "Data & Calculations") + TABLE(PAL.ivy, ["Trial", "Measurement", "Result"], [["1", "—", "—"], ["2", "—", "—"], ["3", "—", "—"]]) +
    H2(PAL.ivy, "Analysis & Conclusion") + P_("Interpretation of the data and a statement on whether the hypothesis was supported or rejected.")),

  t("essay-outline", "Essay Outline", "Academic", "Thesis-driven alphanumeric outline.", PAL.mono,
    H1(PAL.mono, "Essay Outline") + META(["Working title", ""], ["Course", ""], ["Date", ""]) + FONTS(PAL.mono, "Times New Roman + Garamond") + HR +
    H2(PAL.mono, "Introduction") + P_("<em>Hook line.</em>") + P_("<strong>Thesis statement:</strong> your central argument in one sentence.") +
    H2(PAL.mono, "Body") +
    OL("<strong>Topic sentence one</strong>" + LI("Evidence / quote", "Analysis"),
       "<strong>Topic sentence two</strong>" + LI("Evidence / quote", "Analysis"),
       "<strong>Topic sentence three</strong>" + LI("Evidence / quote", "Analysis")) +
    H2(PAL.mono, "Conclusion") + P_("Restated thesis and a closing note on global significance.")),

  t("thesis-proposal", "Thesis Proposal", "Academic", "Institutional one-page prospectus.", PAL.oxbridge,
    H1(PAL.oxbridge, "Thesis Proposal") + META(["Title", ""], ["Candidate", ""], ["Advisor", ""], ["Department", ""]) + FONTS(PAL.oxbridge, "Merriweather + Source Sans Pro") + HR +
    H2(PAL.oxbridge, "Statement of the Problem") + P_("The critical research question and why it matters.") +
    H2(PAL.oxbridge, "Methodological Framework") + P_("Quantitative, qualitative, or mixed-methods approach.") +
    H2(PAL.oxbridge, "Significance") + P_("How this work advances the field or fills a knowledge gap.") +
    H2(PAL.oxbridge, "Timeline") +
    TABLE(PAL.oxbridge, ["Phase", "Expected output", "Completion"], [["Literature review", "—", "—"], ["Data collection", "—", "—"], ["Writing", "—", "—"]])),

  t("annotated-bib", "Annotated Bibliography", "Academic", "Citations with summary, evaluation, reflection.", PAL.mono,
    H1(PAL.mono, "Annotated Bibliography") + META(["Course", ""], ["Student", ""], ["Topic", ""]) + FONTS(PAL.mono, "Times New Roman + Garamond") + HR +
    P_("<strong>Author, A. (Year). <em>Title of work</em>. Source.</strong>") +
    P_("<strong>Summary:</strong> what the source argues.") + P_("<strong>Evaluation:</strong> is it reliable and authoritative?") + P_("<strong>Reflection:</strong> how it fits into your research.") + HR +
    P_("<strong>Author, B. (Year). <em>Title of work</em>. Source.</strong>") +
    P_("<strong>Summary:</strong> …") + P_("<strong>Evaluation:</strong> …") + P_("<strong>Reflection:</strong> …")),

  t("case-study", "Case Study", "Academic", "In-depth case with a comparative column.", PAL.ivy,
    H1(PAL.ivy, "Case Study") + META(["Title", ""], ["Subject", ""], ["Date", ""]) + FONTS(PAL.ivy, "Inter + Roboto") + HR +
    H2(PAL.ivy, "Background") + P_("A brief introduction to the entity and the core challenge it faced.") +
    CALL(PAL.ivy, "Root causes", "The contributing factors behind the central problem.") +
    H2(PAL.ivy, "Solutions Considered") +
    TABLE(PAL.ivy, ["Alternatives considered", "Action taken"], [["—", "—"]]) +
    H2(PAL.ivy, "Key Takeaways") + LI("Lesson one.", "Lesson two.")),

  t("syllabus", "Course Syllabus", "Academic", "Syllabus-at-a-glance with weekly grid.", PAL.oxbridge,
    H1(PAL.oxbridge, "Course Syllabus") + META(["Course", ""], ["Semester", ""], ["Professor", ""]) + P_("<strong>Office hours:</strong> — &nbsp; <strong>Email:</strong> —") + FONTS(PAL.oxbridge, "Merriweather + Source Sans Pro") + HR +
    H2(PAL.oxbridge, "Description & Materials") + P_("A brief overview and the required textbooks or tools.") +
    H2(PAL.oxbridge, "Grading Breakdown") +
    TABLE(PAL.oxbridge, ["Component", "Weight"], [["Participation", "10%"], ["Assignments", "40%"], ["Midterm", "20%"], ["Final", "30%"]]) +
    H2(PAL.oxbridge, "Weekly Schedule") +
    TABLE(PAL.oxbridge, ["Week", "Topic / Lecture", "Readings & deliverables"], [["1", "—", "—"], ["2", "—", "—"], ["3", "—", "—"]])),

  t("study-notes", "Study Notes", "Academic", "Cornell-style asymmetric cue/notes grid.", PAL.ivy,
    H1(PAL.ivy, "Study Notes") + META(["Topic", ""], ["Subject", ""], ["Date", ""], ["Source", ""]) + FONTS(PAL.ivy, "Inter + Roboto") + HR +
    TABLE(PAL.ivy, ["Cues", "Notes"], [["<strong>Key terms</strong><br>Review questions<br>Concepts", "Detailed lecture bullet points, formulas, and sketches."]]) +
    CALL(PAL.ivy, "Summary", "A three-sentence wrap-up of this page's contents in your own words.")),

  t("abstract", "Conference Abstract", "Academic", "Single-block abstract with keyword tags.", PAL.mono,
    H1(PAL.mono, "Conference Abstract") + META(["Conference", ""], ["Track", ""], ["Date", ""]) + FONTS(PAL.mono, "Times New Roman + Garamond") + HR +
    `<h2 style="text-align:center">${c(PAL.mono, "Title in Title Case")}</h2>` +
    `<p style="text-align:center">${cs(PAL.mono, "Author¹ · Author² · contact@email")}</p>` +
    `<p style="text-align:justify">A single unbroken block (250–300 words) stating the <strong>Background</strong>, <strong>Methods</strong>, <strong>Results</strong>, and <strong>Conclusions</strong> of the study.</p>` +
    P_("<strong>Keywords:</strong> tag, tag, tag, tag")),

  // ─────────────────────────── HR & Career ───────────────────────────
  t("resume", "Résumé", "HR & Career", "Clean, ATS-friendly professional résumé.", PAL.charcoal,
    `<h1 style="text-align:center">${c(PAL.charcoal, "Your Name")}</h1>` +
    `<p style="text-align:center">${cs(PAL.charcoal, "City, State · email · phone · linkedin.com/in/you")}</p>` + FONTS(PAL.charcoal, "Inter + Roboto") + HR +
    H2(PAL.charcoal, "Professional Summary") + P_("A dense three-line statement of core expertise and years of experience.") +
    H2(PAL.charcoal, "Experience") + P_("<strong>Job Title</strong> — Company &nbsp;·&nbsp; <em>Dates</em>") +
    LI("Action-oriented impact bullet with a metric.", "Action-oriented impact bullet with a metric.") +
    H2(PAL.charcoal, "Education") + P_("<strong>Degree, Major</strong> — University, Year") +
    H2(PAL.charcoal, "Skills") + P_("Category: skill, skill, skill &nbsp;·&nbsp; Category: tool, tool")),

  t("cover-letter", "Cover Letter", "HR & Career", "Tailored cover letter aligned to the role.", PAL.execNavy,
    H1(PAL.execNavy, "Cover Letter") + SUB(PAL.execNavy, "[Your info · date · recipient & company]") + FONTS(PAL.execNavy, "Merriweather + Source Sans Pro") + HR +
    P_("Dear [Hiring Manager],") +
    P_("<strong>Opening:</strong> the role you're applying for and an attention-grabbing reason why.") +
    P_("<strong>Body:</strong> direct alignment between your achievements and the company's current needs.") +
    P_("<strong>Close:</strong> a polite request for an interview and a thank-you.") +
    P_("Sincerely,<br>[Name]")),

  t("job-description", "Job Description", "HR & Career", "Role, responsibilities, requirements, perks.", PAL.charcoal,
    H1(PAL.charcoal, "[Job Title]") + META(["Department", ""], ["Type", "Full-time / Remote"], ["Location", ""]) + FONTS(PAL.charcoal, "Lato + Open Sans") + HR +
    H2(PAL.charcoal, "Role Overview") + P_("How this position impacts the company's mission.") +
    H2(PAL.charcoal, "Core Responsibilities") + LI("Daily duty / ownership area.", "Daily duty / ownership area.") +
    H2(PAL.charcoal, "Requirements") + LI("Technical stack requirement.", "Years of experience.", "Degree / certification.") +
    H2(PAL.charcoal, "Benefits & Perks") + LI("Health & wellness.", "Equity.", "Flexibility.")),

  t("offer-letter", "Offer Letter", "HR & Career", "Formal employment offer with acceptance line.", PAL.legal,
    H1(PAL.legal, "Offer of Employment") + SUB(PAL.legal, "[Date]") + FONTS(PAL.legal, "Times New Roman + Garamond") + HR +
    P_("Dear [Candidate],") + P_("We are delighted to offer you the position below and look forward to your contribution.") +
    H2(PAL.legal, "Position Specifics") + META(["Title", ""], ["Start date", ""], ["Status", "Exempt / Non-exempt"], ["Reports to", ""]) +
    H2(PAL.legal, "Compensation") +
    TABLE(PAL.legal, ["Component", "Detail"], [["Base salary", "$—"], ["Pay frequency", "—"], ["Sign-on bonus", "$—"], ["Equity", "—"]]) +
    H2(PAL.legal, "Contingencies") + P_("This offer is contingent on successful background and reference checks.") +
    H2(PAL.legal, "Acceptance") + P_("Please sign and return by <strong>[Date]</strong>.") + SIGN(PAL.legal, "Company", "Candidate")),

  t("perf-review", "Performance Review", "HR & Career", "Competency scores and SMART goals.", PAL.emerald,
    H1(PAL.emerald, "Performance Review") + META(["Employee", ""], ["Reviewer", ""], ["Period", ""], ["Date", ""]) + FONTS(PAL.emerald, "Inter + Roboto") + HR +
    H2(PAL.emerald, "Competency Evaluation") +
    TABLE(PAL.emerald, ["Competency", "Score (1–5)", "Feedback"], [["Core skills", "—", "—"], ["Quality of work", "—", "—"], ["Collaboration", "—", "—"]]) +
    H2(PAL.emerald, "Achievements & Growth") +
    TABLE(PAL.emerald, ["Recent wins", "Areas to improve"], [["—", "—"]]) +
    H2(PAL.emerald, "Goals for Next Cycle") + OL("SMART goal one.", "SMART goal two.", "SMART goal three.") +
    H2(PAL.emerald, "Signatures") + SIGN(PAL.emerald, "Employee", "Manager")),

  t("onboarding", "Onboarding Checklist", "HR & Career", "30-60-90 new-hire checklist.", PAL.emerald,
    H1(PAL.emerald, "Onboarding Checklist") + P_("Welcome aboard! &nbsp; <strong>Employee:</strong> — &nbsp; <strong>Role:</strong> — &nbsp; <strong>Guide:</strong> —") + FONTS(PAL.emerald, "Lato + Open Sans") + HR +
    H2(PAL.emerald, "Pre-Arrival & Day 1") + CHK("IT setup & hardware", "Compliance paperwork", "Team lunch") +
    H2(PAL.emerald, "Week 1") + CHK("1-on-1 schedule set", "Baseline product training", "Shadow sessions") +
    H2(PAL.emerald, "30 / 60 / 90 Days") + CHK("30-day: independent on core tasks", "60-day: owns a workstream", "90-day: fully ramped") +
    H2(PAL.emerald, "Resources") + LI("HR contact", "IT helpdesk", "Company wiki")),

  t("resignation", "Resignation Letter", "HR & Career", "Professional two-week notice.", PAL.legal,
    H1(PAL.legal, "Letter of Resignation") + SUB(PAL.legal, "[Date · recipient · company address]") + FONTS(PAL.legal, "Times New Roman + Garamond") + HR +
    P_("Dear [Manager],") +
    P_("I am writing to formally announce my resignation from my position as [Title], with my final working day being <strong>[Date]</strong>.") +
    P_("I am sincerely grateful for the mentorship, growth, and opportunities I have been given here.") +
    P_("I am committed to a smooth transition and will do everything possible to hand off my open projects during the notice period.") +
    P_("Sincerely,<br>[Name]")),

  t("reference", "Reference Letter", "HR & Career", "Enthusiastic recommendation for a colleague.", PAL.execNavy,
    H1(PAL.execNavy, "Letter of Recommendation") + SUB(PAL.execNavy, "[Date]") + FONTS(PAL.execNavy, "Merriweather + Source Sans Pro") + HR +
    P_("To Whom It May Concern,") +
    P_("I am pleased to recommend [Name], whom I worked with as [relationship] for [duration].") +
    P_("<strong>Capabilities:</strong> specific descriptions of their technical proficiency, leadership, and work ethic.") +
    P_("<strong>Evidence:</strong> a brief account of a major project or problem they solved successfully.") +
    P_("I give [Name] my enthusiastic recommendation. Please contact me at [email] with any questions.") +
    P_("Sincerely,<br>[Name, Title]")),

  t("interview-scorecard", "Interview Scorecard", "HR & Career", "Structured 1–5 candidate evaluation.", PAL.charcoal,
    H1(PAL.charcoal, "Interview Scorecard") + META(["Candidate", ""], ["Role", ""], ["Interviewer", ""], ["Stage", ""]) + FONTS(PAL.charcoal, "Inter + Roboto") + HR +
    SUB(PAL.charcoal, "Scale: 1 = poor · 2 = below bar · 3 = at bar · 4 = strong · 5 = exceptional") +
    TABLE(PAL.charcoal, ["Attribute", "Score (1–5)"], [["Role competency", "—"], ["Communication", "—"], ["Problem solving", "—"], ["Culture add", "—"]]) +
    H2(PAL.charcoal, "Interviewer Notes") + P_("Qualitative feedback and behavioral observations…") +
    CALL(PAL.charcoal, "Recommendation", "Definite Hire &nbsp;·&nbsp; Hire &nbsp;·&nbsp; Hold &nbsp;·&nbsp; No Hire")),

  t("pto-policy", "PTO Policy", "HR & Career", "Paid time-off policy with approvals workflow.", PAL.execNavy,
    H1(PAL.execNavy, "Paid Time-Off Policy") + FONTS(PAL.execNavy, "Lato + Open Sans") + HR +
    H2(PAL.execNavy, "Policy Framework") + P_("Eligibility criteria and accrual rate (or a statement confirming an Unlimited PTO framework).") +
    H2(PAL.execNavy, "Request Procedure") + P_("How far in advance requests must be submitted and through which platform.") +
    H2(PAL.execNavy, "Rollover & Payout") + P_("Year-end rollover caps and compensation upon separation.") +
    H2(PAL.execNavy, "Blackout Dates") + P_("High-volume operational periods where time off is restricted.") +
    H2(PAL.execNavy, "Approvals Workflow") + OL("Employee submits request.", "Manager reviews.", "Manager sign-off & calendar update.")),

  // ─────────────────────── Product & Marketing ───────────────────────
  t("prd", "Product Requirements (PRD)", "Product & Marketing", "Problem, scope, user stories, success metrics.", PAL.execNavy,
    H1(PAL.execNavy, "Product Requirements Document") + META(["Product", ""], ["Version", ""], ["Date", ""], ["PM", ""]) + FONTS(PAL.execNavy, "Inter + Roboto") + HR +
    H2(PAL.execNavy, "Problem & Goals") + P_("The user friction we're addressing and the high-level business objectives.") +
    H2(PAL.execNavy, "Scope & User Stories") +
    TABLE(PAL.execNavy, ["In MVP", "Future phase"], [["As a user, I can …", "As a user, I will be able to …"]]) +
    H2(PAL.execNavy, "Success Metrics") + TABLE(PAL.execNavy, ["Tracking event", "Target KPI"], [["—", "—"], ["—", "—"]]) +
    H2(PAL.execNavy, "Open Questions") + LI("Decision still pending.")),

  t("marketing-plan", "Marketing Plan", "Product & Marketing", "Audience, channel/budget matrix, KPIs.", PAL.execNavy,
    H1(PAL.execNavy, "Marketing Plan") + META(["Brand / Product", ""], ["Campaign period", ""], ["Lead", ""]) + FONTS(PAL.execNavy, "Lato + Open Sans") + HR +
    H2(PAL.execNavy, "Target Audience") + P_("Demographic, psychographic, and behavioral characteristics of the focus segment.") +
    H2(PAL.execNavy, "Channels & Budget") +
    TABLE(PAL.execNavy, ["Channel", "Strategy", "Spend"], [["—", "—", "$—"], ["—", "—", "$—"], ["—", "—", "$—"]]) +
    H2(PAL.execNavy, "Key Performance Indicators") + LI("Conversion target per milestone.", "Traffic / engagement target.")),

  t("content-calendar", "Content Calendar", "Product & Marketing", "Publish grid by date, channel, owner.", PAL.emerald,
    H1(PAL.emerald, "Content Calendar") + META(["Month", ""], ["Year", ""], ["Goal", ""]) + FONTS(PAL.emerald, "Inter + Roboto") + HR +
    H2(PAL.emerald, "Schedule") +
    TABLE(PAL.emerald, ["Publish date", "Channel", "Asset / copy status", "Owner"], [["—", "—", "Draft", "—"], ["—", "—", "Scheduled", "—"], ["—", "—", "Published", "—"]]) +
    H2(PAL.emerald, "Content Pillars") + LI("Pillar one.", "Pillar two.", "Pillar three.")),

  t("style-guide", "Brand Style Guide", "Product & Marketing", "Identity, color tokens, type, usage rules.", PAL.charcoal,
    H1(PAL.charcoal, "Brand Style Guide") + FONTS(PAL.charcoal, "Merriweather + Source Sans Pro") + HR +
    H2(PAL.charcoal, "Identity") + P_("Core values, voice attributes, and brand personality adjectives.") +
    H2(PAL.charcoal, "Color Tokens") +
    TABLE(PAL.charcoal, ["Token", "HEX", "RGB", "CMYK"], [["Primary", "#—", "—", "—"], ["Secondary", "#—", "—", "—"], ["Accent", "#—", "—", "—"]]) +
    H2(PAL.charcoal, "Typography Scale") + TABLE(PAL.charcoal, ["Level", "Font", "Size"], [["Display", "—", "—"], ["Body", "—", "—"]]) +
    H2(PAL.charcoal, "Usage") + TABLE(PAL.charcoal, ["✓ Correct", "✗ Forbidden"], [["—", "—"]])),

  t("campaign-brief", "Campaign Brief", "Product & Marketing", "Insight, big idea, deliverables matrix.", PAL.emerald,
    H1(PAL.emerald, "Campaign Brief") + META(["Campaign", ""], ["Timeline", ""], ["Creative director", ""]) + FONTS(PAL.emerald, "Lato + Open Sans") + HR +
    H2(PAL.emerald, "Challenge & Insight") + P_("The core customer truth or operational reason driving this push.") +
    CALL(PAL.emerald, "The Big Idea", "One clear, central messaging pillar holding the entire campaign together.") +
    H2(PAL.emerald, "Deliverables") +
    TABLE(PAL.emerald, ["Format", "Specification"], [["Video", "—"], ["Print", "—"], ["Static web", "—"], ["Email", "—"]])),

  t("competitive-analysis", "Competitive Analysis", "Product & Marketing", "Feature matrix and positioning landscape.", PAL.charcoal,
    H1(PAL.charcoal, "Competitive Analysis") + META(["Industry", ""], ["Date updated", ""]) + FONTS(PAL.charcoal, "Inter + Roboto") + HR +
    H2(PAL.charcoal, "Feature Matrix") +
    TABLE(PAL.charcoal, ["", "Us", "Competitor A", "Competitor B", "Competitor C"], [["Pricing", "—", "—", "—", "—"], ["Speed", "—", "—", "—", "—"], ["Design depth", "—", "—", "—", "—"]]) +
    H2(PAL.charcoal, "Positioning") + P_("Market gaps, pricing extremes, and underserved segments.") +
    H2(PAL.charcoal, "Strategic Edge") + LI("Area to double down on.", "Area to double down on.")),

  t("user-persona", "User Persona", "Product & Marketing", "Profile, goals, motivations, pain points.", PAL.execNavy,
    H1(PAL.execNavy, "User Persona — [Name]") + META(["Age", ""], ["Job title", ""], ["Location", ""]) + FONTS(PAL.execNavy, "Lato + Open Sans") + HR +
    H2(PAL.execNavy, "Archetype") + P_("A quick backstory tracking their professional role and daily flow.") +
    TABLE(PAL.execNavy, ["Goals & motivations", "Pain points & frustrations"], [["What they're trying to achieve.", "Bottlenecks causing friction."]]) +
    H2(PAL.execNavy, "How We Help") + P_("Our value to this persona.")),

  t("release-notes", "Release Notes", "Product & Marketing", "What's new, improved, and fixed.", PAL.emerald,
    H1(PAL.emerald, "Release Notes — v1.0") + META(["Product", ""], ["Launch date", ""], ["Engineer lead", ""]) + FONTS(PAL.emerald, "Inter + Roboto") + HR +
    P_("A warm opening paragraph celebrating the focus of this iteration.") +
    H2(PAL.emerald, "✨ New Additions") + LI("Headline feature one.", "Headline feature two.") +
    H2(PAL.emerald, "Improvements") + LI("Refinement one.", "Refinement two.") +
    H2(PAL.emerald, "Bug Fixes") + LI("Fixed an issue where …", "Fixed an issue where …") +
    P_("<em>Thanks to the beta testers and feedback groups who reported these.</em>")),

  t("blog-post", "Blog Post", "Product & Marketing", "SEO-friendly article skeleton with CTA.", PAL.charcoal,
    H1(PAL.charcoal, "Proposed H1 Title") + META(["Primary keyword", ""], ["Category", ""], ["Author", ""]) + FONTS(PAL.charcoal, "Merriweather + Source Sans Pro") + HR +
    P_("An empathetic hook that frames the problem, followed by the thesis paragraph.") +
    H2(PAL.charcoal, "H2 with semantic keyword") + P_("Body…") +
    H3(PAL.charcoal, "H3 supporting point") + P_("Body…") +
    H2(PAL.charcoal, "H2 with semantic keyword") + P_("Body…") +
    CALL(PAL.charcoal, "Call to action", "A distinct block driving newsletter or product sign-ups.")),

  t("newsletter", "Newsletter", "Product & Marketing", "Featured story, curated links, footer block.", PAL.execNavy,
    H1(PAL.execNavy, "[Newsletter Name] — Issue #1") + SUB(PAL.execNavy, "[Date]") + FONTS(PAL.execNavy, "Lato + Open Sans") + HR +
    H2(PAL.execNavy, "Featured") + P_("A high-impact snippet or announcement with a <strong>bolded call-to-action link</strong>.") +
    H2(PAL.execNavy, "Curated Links") +
    TABLE(PAL.execNavy, ["Resource", "Why it matters"], [["Link one", "—"], ["Link two", "—"], ["Link three", "—"]]) +
    HR + `<p style="text-align:center">${cs(PAL.execNavy, "Unsubscribe · [Mailing address] · Social channels")}</p>`),
];

export const TEMPLATE_CATEGORIES = ["Business", "Legal", "Academic", "HR & Career", "Product & Marketing"] as const;
