import type { Sql } from "@/lib/db";
import { getSql } from "@/lib/db";

function nid() {
  return crypto.randomUUID();
}

async function wipe(sql: Sql, userId: string) {
  const tables = [
    "drafts",
    "notifications",
    "audit_events",
    "legal_holds",
    "hearings",
    "approvals",
    "tasks",
    "templates",
    "clauses",
    "contracts",
    "document_comments",
    "document_versions",
    "documents",
    "matters",
    "clients",
    "team_members",
  ];
  for (const t of tables) {
    await sql.query(`delete from ${t} where user_id = $1`, [userId]);
  }
}

const seeding = new Map<string, Promise<void>>();

export async function ensureSeeded(userId: string, displayName?: string | null) {
  const existing = seeding.get(userId);
  if (existing) return existing;
  const run = (async () => {
    const sql = await getSql();
    const [profile] = await sql<{ seeded: boolean }>`
      select seeded from workspace_profiles where user_id = ${userId}
    `;
    if (profile?.seeded) return;
    const [hasClients] = await sql<{ n: number }>`
      select count(*) as n from clients where user_id = ${userId}
    `;
    if ((hasClients?.n ?? 0) > 0) {
      await sql`
        insert into workspace_profiles (user_id, firm_name, display_name, role, seeded)
        values (${userId}, ${"Ashoka & Meridian LLP"}, ${displayName ?? "Counsel"}, ${"Partner"}, ${true})
        on conflict (user_id) do update set seeded = ${true}
      `;
      return;
    }
    if (profile) await wipe(sql, userId);
    await seedWorkspace(sql, userId, displayName ?? "Counsel");
  })();
  seeding.set(userId, run);
  try {
    await run;
  } finally {
    seeding.delete(userId);
  }
}

async function seedWorkspace(sql: Sql, userId: string, displayName: string) {
  const c = {
    veda: nid(),
    harbor: nid(),
    ananya: nid(),
    green: nid(),
    grid: nid(),
    sable: nid(),
    trust: nid(),
    pune: nid(),
  };
  const m = {
    vedaShare: nid(),
    vedaEmp: nid(),
    harborArb: nid(),
    ananyaProp: nid(),
    greenLease: nid(),
    gridComp: nid(),
    sableLit: nid(),
    trustGov: nid(),
    puneProc: nid(),
    vedaIP: nid(),
  };

  const docs: Record<string, string> = {};
  const mk = () => {
    const id = nid();
    return id;
  };

  await sql`
    insert into workspace_profiles (user_id, firm_name, display_name, role, seeded)
    values (${userId}, ${"Ashoka & Meridian LLP"}, ${displayName}, ${"Partner"}, ${false})
    on conflict (user_id) do update set display_name = excluded.display_name
  `;

  const team = [
    ["Priya Mehta", "priya.mehta@ashokameridian.law", "Managing Partner", "Corporate"],
    ["Rohan Desai", "rohan.desai@ashokameridian.law", "Partner", "Corporate"],
    ["Amelia Hart", "amelia.hart@ashokameridian.law", "Partner", "Litigation"],
    ["Kabir Sharma", "kabir.sharma@ashokameridian.law", "Senior Associate", "Contracts"],
    ["Leila Nassar", "leila.nassar@ashokameridian.law", "Legal Associate", "Employment"],
    ["James Okonkwo", "james.okonkwo@ashokameridian.law", "Paralegal", "Litigation"],
    ["Sofia Alvarez", "sofia.alvarez@ashokameridian.law", "Compliance Officer", "Compliance"],
    [displayName, null, "Partner", "Corporate"],
  ] as const;
  for (const [name, email, role, practice] of team) {
    await sql`
      insert into team_members (id, user_id, name, email, role, practice_area, status)
      values (${nid()}, ${userId}, ${name}, ${email}, ${role}, ${practice}, ${"Active"})
    `;
  }

  const clients: Array<Record<string, string | null>> = [
    {
      id: c.veda,
      code: "CL-001",
      name: "VedaTech Solutions Pvt Ltd",
      type: "Company",
      industry: "Information Technology",
      jurisdiction: "Maharashtra, India",
      reg: "U72900MH2018PTC312441",
      pan: "A****K3124Q",
      email: "legal@vedatech.in",
      phone: "+91 22 4055 1900",
      address: "14th Floor, One BKC, Bandra Kurla Complex",
      city: "Mumbai",
      country: "India",
      partner: "Rohan Desai",
      risk: "Medium",
      notes: "Strategic technology client. Master services + ESOP work.",
    },
    {
      id: c.harbor,
      code: "CL-002",
      name: "Harborline Shipping Ltd",
      type: "Company",
      industry: "Logistics",
      jurisdiction: "Singapore / India",
      reg: "201403384K",
      pan: "A****H8841C",
      email: "gc@harborline.com",
      phone: "+65 6518 2200",
      address: "8 Marina View, Asia Square Tower 1",
      city: "Singapore",
      country: "Singapore",
      partner: "Amelia Hart",
      risk: "High",
      notes: "Charter-party disputes and slot-sharing arbitration.",
    },
    {
      id: c.ananya,
      code: "CL-003",
      name: "Ananya Krishnan",
      type: "Individual",
      industry: "Private client",
      jurisdiction: "Karnataka, India",
      reg: null,
      pan: "A****K2291P",
      email: "ananya.krishnan@pm.me",
      phone: "+91 80 4120 7788",
      address: "42 Lavelle Road",
      city: "Bengaluru",
      country: "India",
      partner: "Priya Mehta",
      risk: "Low",
      notes: "HNWI. Property, wills, and family office structuring.",
    },
    {
      id: c.green,
      code: "CL-004",
      name: "Greenfield Residences LLP",
      type: "LLP",
      industry: "Real Estate",
      jurisdiction: "Maharashtra, India",
      reg: "AAZ-4419",
      pan: "A****G4419L",
      email: "partners@greenfieldres.in",
      phone: "+91 20 6767 1100",
      address: "Koregaon Park Annex",
      city: "Pune",
      country: "India",
      partner: "Rohan Desai",
      risk: "Medium",
      notes: "Residential development. RERA, joint development, leases.",
    },
    {
      id: c.grid,
      code: "CL-005",
      name: "Northern Grid Power Corp",
      type: "Company",
      industry: "Energy",
      jurisdiction: "Delhi, India",
      reg: "U40100DL2009GOI188201",
      pan: "A****N1882D",
      email: "legal.ngpc@grid.in",
      phone: "+91 11 2345 0900",
      address: "Scope Complex, Lodhi Road",
      city: "New Delhi",
      country: "India",
      partner: "Priya Mehta",
      risk: "High",
      notes: "PSU offtake and regulatory compliance.",
    },
    {
      id: c.sable,
      code: "CL-006",
      name: "Sable & Co. Holdings",
      type: "Counterparty",
      industry: "Private equity",
      jurisdiction: "England and Wales",
      reg: "09881221",
      pan: null,
      email: "notices@sableholdings.com",
      phone: "+44 20 7947 3300",
      address: "1 Finsbury Circus",
      city: "London",
      country: "United Kingdom",
      partner: "Amelia Hart",
      risk: "High",
      notes: "Adverse party on the Harborline slot-sharing claim.",
    },
    {
      id: c.trust,
      code: "CL-007",
      name: "Meridian Family Trust",
      type: "Trust",
      industry: "Private client",
      jurisdiction: "Maharashtra, India",
      reg: "MFT/2016/088",
      pan: "A****T0881T",
      email: "trustees@meridiantrust.in",
      phone: "+91 22 2284 0101",
      address: "Nariman Point",
      city: "Mumbai",
      country: "India",
      partner: "Priya Mehta",
      risk: "Low",
      notes: "Discretionary family trust. Investment and governance.",
    },
    {
      id: c.pune,
      code: "CL-008",
      name: "Pune Municipal Corporation",
      type: "Government",
      jurisdiction: "Maharashtra, India",
      industry: "Public sector",
      reg: null,
      pan: "A****P0001G",
      email: "legal@pmc.gov.in",
      phone: "+91 20 2550 1000",
      address: "PMC Main Building, Shivajinagar",
      city: "Pune",
      country: "India",
      partner: "Rohan Desai",
      risk: "Medium",
      notes: "Public procurement advisory. Strict ethical wall on Greenfield.",
    },
  ];

  for (const cl of clients) {
    await sql`
      insert into clients (
        id, user_id, client_code, name, type, industry, jurisdiction,
        registration_number, pan_masked, email, phone, address, city, country,
        responsible_partner, status, risk_level, notes
      ) values (
        ${cl.id}, ${userId}, ${cl.code}, ${cl.name}, ${cl.type}, ${cl.industry},
        ${cl.jurisdiction}, ${cl.reg}, ${cl.pan}, ${cl.email}, ${cl.phone},
        ${cl.address}, ${cl.city}, ${cl.country}, ${cl.partner}, ${"Active"},
        ${cl.risk}, ${cl.notes}
      )
    `;
  }

  const matters = [
    {
      id: m.vedaShare,
      client: c.veda,
      code: "MAT-24018",
      name: "Series C investment — SHA and SSA",
      practice: "Corporate",
      type: "Corporate",
      jur: "India",
      partner: "Rohan Desai",
      conf: "Highly Confidential",
      open: "2026-03-12",
      wall: false,
      desc: "Lead counsel on the Series C round. SHA, SSA, ESOP restatement, and closing opinions.",
    },
    {
      id: m.vedaEmp,
      client: c.veda,
      code: "MAT-24031",
      name: "Executive employment suite",
      practice: "Employment",
      type: "Employment",
      jur: "Maharashtra",
      partner: "Leila Nassar",
      conf: "Confidential",
      open: "2026-05-02",
      wall: false,
      desc: "CXO contracts, garden leave, and invention assignment.",
    },
    {
      id: m.harborArb,
      client: c.harbor,
      code: "MAT-23091",
      name: "SIAC slot-sharing arbitration",
      practice: "Arbitration",
      type: "Arbitration",
      jur: "Singapore",
      partner: "Amelia Hart",
      conf: "Attorney-Client Privileged",
      open: "2025-11-08",
      wall: true,
      desc: "SIAC arbitration against Sable & Co. Ethical wall in force.",
    },
    {
      id: m.ananyaProp,
      client: c.ananya,
      code: "MAT-25004",
      name: "Lavelle Road conveyance",
      practice: "Real Estate",
      type: "Real Estate",
      jur: "Karnataka",
      partner: "Priya Mehta",
      conf: "Confidential",
      open: "2026-01-20",
      wall: false,
      desc: "Title diligence and sale deed for residential property.",
    },
    {
      id: m.greenLease,
      client: c.green,
      code: "MAT-24055",
      name: "Koregaon commercial leases",
      practice: "Real Estate",
      type: "Contracts",
      jur: "Maharashtra",
      partner: "Rohan Desai",
      conf: "Internal",
      open: "2026-04-15",
      wall: false,
      desc: "Portfolio of 11 commercial leases and RERA filings.",
    },
    {
      id: m.gridComp,
      client: c.grid,
      code: "MAT-25011",
      name: "CERC tariff petition support",
      practice: "Compliance",
      type: "Compliance",
      jur: "India",
      partner: "Priya Mehta",
      conf: "Confidential",
      open: "2026-02-03",
      wall: false,
      desc: "Regulatory submissions and offtake contract review.",
    },
    {
      id: m.sableLit,
      client: c.sable,
      code: "MAT-23092",
      name: "Conflict register — Sable (adverse)",
      practice: "Litigation",
      type: "Litigation",
      jur: "England and Wales",
      partner: "Amelia Hart",
      conf: "Attorney Work Product",
      open: "2025-11-08",
      wall: true,
      desc: "Adverse-party file. Access restricted by ethical wall.",
    },
    {
      id: m.trustGov,
      client: c.trust,
      code: "MAT-21014",
      name: "Trust deed restatement 2026",
      practice: "Corporate",
      type: "Corporate",
      jur: "Maharashtra",
      partner: "Priya Mehta",
      conf: "Highly Confidential",
      open: "2026-06-01",
      wall: false,
      desc: "Restatement of the discretionary trust and investment mandate.",
    },
    {
      id: m.puneProc,
      client: c.pune,
      code: "MAT-25022",
      name: "Smart-city RFP advisory",
      practice: "Compliance",
      type: "Compliance",
      jur: "Maharashtra",
      partner: "Rohan Desai",
      conf: "Internal",
      open: "2026-07-09",
      wall: true,
      desc: "Public procurement. Ethical wall versus Greenfield Residences.",
    },
    {
      id: m.vedaIP,
      client: c.veda,
      code: "MAT-24041",
      name: "Platform IP assignment and OSS audit",
      practice: "Intellectual Property",
      type: "Intellectual Property",
      jur: "India",
      partner: "Kabir Sharma",
      conf: "Confidential",
      open: "2026-04-28",
      wall: false,
      desc: "Employee IP assignment, OSS licence audit, trademark filing.",
    },
  ];

  for (const mt of matters) {
    await sql`
      insert into matters (
        id, user_id, client_id, matter_code, name, practice_area, matter_type,
        jurisdiction, responsible_partner, status, confidentiality, opening_date,
        description, ethical_wall
      ) values (
        ${mt.id}, ${userId}, ${mt.client}, ${mt.code}, ${mt.name}, ${mt.practice},
        ${mt.type}, ${mt.jur}, ${mt.partner}, ${"Active"}, ${mt.conf}, ${mt.open},
        ${mt.desc}, ${mt.wall}
      )
    `;
  }

  const nda = `MUTUAL NON-DISCLOSURE AGREEMENT
(Draft — for legal review)

This Mutual Non-Disclosure Agreement (the "Agreement") is made on 12 March 2026 between:

(1) VedaTech Solutions Pvt Ltd, a company incorporated under the Companies Act, 2013, with its registered office at One BKC, Mumbai ("Company"); and
(2) Meridian Ventures IV LP, a limited partnership organised under the laws of Delaware ("Investor").

1. Purpose. The parties intend to evaluate a proposed Series C investment (the "Purpose") and may disclose Confidential Information.

2. Confidential Information. "Confidential Information" means all non-public information, whether commercial, technical, financial or legal, disclosed by a party in connection with the Purpose, including cap tables, product roadmaps, customer metrics and draft transaction documents.

3. Non-use and non-disclosure. Each party shall (a) use the other party's Confidential Information solely for the Purpose; (b) not disclose it to any third party except to Representatives who have a need to know and are bound by written confidentiality obligations no less protective than this Agreement; and (c) protect it using at least the same degree of care it uses for its own confidential information of like importance, and in no event less than reasonable care.

4. Exclusions. Confidential Information does not include information that is or becomes public other than by breach, was rightfully known without restriction, is independently developed, or is required to be disclosed by law, provided that (where legally permitted) prior written notice is given.

5. Term. The obligations in this Agreement survive for three (3) years from the date of disclosure, except that trade secrets remain protected for so long as they remain trade secrets under applicable law.

6. Return. Upon written request, a party shall return or destroy Confidential Information, save for archival copies retained under automated backup systems or as required by law or professional standards.

7. Governing law and jurisdiction. This Agreement is governed by the laws of India. The courts at Mumbai shall have exclusive jurisdiction.

8. Privilege. Nothing in this Agreement requires the disclosure of information protected by attorney-client privilege or the attorney work-product doctrine.

IN WITNESS WHEREOF the parties have executed this Agreement as a deed.`;

  const sha = `SHAREHOLDERS' AGREEMENT
(Draft — for legal review)

PARTIES
VedaTech Solutions Pvt Ltd (the "Company")
The Founders named in Schedule 1
Meridian Ventures IV LP (the "Lead Investor")
The Existing Investors named in Schedule 2

1. Interpretation. Capitalised terms have the meanings given in Schedule 3.

2. Capitalisation. Immediately prior to Completion the share capital of the Company shall be as set out in the cap table at Schedule 4. The Company shall not issue any securities except in accordance with this Agreement.

3. Board. The Board shall consist of seven directors. The Lead Investor may appoint one director for so long as it holds at least 8% of the fully diluted share capital. Founders may appoint three directors. The remaining directors shall be independent.

4. Reserved matters. The Company shall not take any Reserved Matter without the prior written consent of the Lead Investor, including: (a) any amendment to the charter documents; (b) any issuance of securities other than an Approved ESOP grant; (c) any indebtedness above INR 25 crore; (d) any related-party transaction other than on arm's-length terms approved by the Board; (e) any liquidation, merger or sale of all or substantially all assets.

5. Transfer restrictions. No shareholder shall transfer securities except (a) to a Permitted Transferee, (b) pursuant to the right of first offer in clause 6, or (c) pursuant to the tag-along and drag-along rights in clauses 7 and 8.

6. Right of first offer. A selling shareholder shall first offer the securities to the Company and then to the Lead Investor on the same terms.

7. Tag-along. If the Founders propose to transfer more than 15% of the fully diluted capital, the Lead Investor may participate on a pro-rata basis on no less favourable terms.

8. Drag-along. If holders of at least 60% of the fully diluted capital accept a bona fide third-party offer for 100% of the Company, the remaining shareholders shall sell on the same terms.

9. Information rights. The Company shall deliver monthly MIS, quarterly reviewed accounts, and an annual audited financial statement within 120 days of year end.

10. ESOP. The Company shall maintain an ESOP pool of 12% on a fully diluted basis post the Series C issuance.

11. Governing law. This Agreement is governed by the laws of India. Disputes shall be referred to arbitration in Mumbai under the Arbitration and Conciliation Act, 1996, with a sole arbitrator appointed by SIAC if the parties cannot agree within 21 days.

THIS AGREEMENT is executed as a deed on the date first written above.`;

  const emp = `EMPLOYMENT AGREEMENT — CHIEF TECHNOLOGY OFFICER
(Draft — for legal review)

This Agreement is made between VedaTech Solutions Pvt Ltd (the "Company") and the employee named in Schedule A (the "Executive").

1. Appointment. The Company appoints the Executive as Chief Technology Officer, reporting to the Chief Executive Officer, commencing on 1 June 2026.

2. Duties. The Executive shall devote substantially all working time to the Company, act in good faith and in the best interests of the Company, and comply with all lawful policies including information security and the code of conduct.

3. Compensation. Base salary of INR 1,20,00,000 per annum, payable monthly in arrears, plus eligibility for an annual discretionary bonus of up to 40% of base salary and an ESOP grant as set out in the award letter.

4. Confidentiality. The Executive shall not disclose Confidential Information during employment or at any time thereafter, except as required by law or with prior written consent.

5. Intellectual property. All Intellectual Property created by the Executive in the course of employment, or using Company resources, is hereby assigned to the Company. The Executive shall execute all documents reasonably required to perfect that assignment.

6. Non-solicit. For 12 months after termination, the Executive shall not solicit any employee, or any customer with whom the Executive had material dealings in the last 12 months of employment, in competition with the Company.

7. Garden leave. The Company may place the Executive on garden leave during any notice period. During garden leave the Executive remains employed, continues to receive salary, and remains bound by fiduciary and confidentiality duties.

8. Termination. Either party may terminate on six months' written notice. The Company may terminate immediately for Cause as defined in Schedule B.

9. Governing law. The laws of India. Exclusive jurisdiction of the courts at Mumbai.

This Agreement is subject to partner review and is not an offer until executed.`;

  const notice = `LEGAL NOTICE
Without prejudice

To: Sable & Co. Holdings
1 Finsbury Circus, London EC2M 7EB

Re: Slot-sharing agreement dated 4 March 2024 — notice of breach

We act for Harborline Shipping Ltd.

1. Under clause 8.2 of the Slot Sharing Agreement, Sable is obliged to provide Harborline with not less than 42 days' written notice of any material reduction in allocated TEU capacity on the FE-N service.

2. On 11 September 2025 Sable reduced Harborline's allocation from 1,800 TEU to 620 TEU without notice. That reduction is a material breach.

3. Harborline has suffered loss including deadfreight, rolled cargo claims, and loss of customer contracts, particulars of which will be provided in the statement of claim.

4. Harborline requires, within 14 days of this notice:
   (a) restoration of the contracted allocation; and
   (b) a written proposal for compensation.

5. Failing which Harborline will commence arbitration in Singapore under the SIAC Rules, as provided in clause 19, and will seek damages, interest and costs.

This notice is given without prejudice to any other rights and remedies, including the right to treat the agreement as discharged.

Yours faithfully
Ashoka & Meridian LLP`;

  const lease = `LEAVE AND LICENCE AGREEMENT
(Draft — for legal review)

Licensor: Greenfield Residences LLP
Licensee: Northwind Advisory Pvt Ltd
Premises: Unit 4B, Koregaon Park Annex, Pune
Term: 60 months commencing 1 October 2026
Licence fee: INR 4,80,000 per month, plus GST, with 5% annual escalation
Security deposit: 6 months' licence fee
Lock-in: 24 months
Notice: 3 months after lock-in
Use: Commercial office, IT/ITES
Governing law: Maharashtra; courts at Pune
Stamp duty and registration: to be borne equally

The Licensee shall not sub-licence without prior written consent. The Licensor shall keep the structure and common areas in good repair. Either party may terminate for unremedied material breach after 21 days' notice.`;

  const opinion = `LEGAL OPINION
Privileged and confidential — attorney work product

To: The Board of Directors, VedaTech Solutions Pvt Ltd
From: Ashoka & Meridian LLP
Date: 18 August 2026
Re: Capacity and due authorisation — Series C issuance

1. We have acted as Indian counsel to the Company in connection with the proposed issuance of Series C CCPS.

2. We have examined the charter documents, board and shareholder resolutions supplied to us, and such other documents as we have considered necessary.

3. Assumptions. We have assumed the genuineness of all signatures, the authenticity of documents submitted as originals, and that all resolutions were duly passed.

4. Opinion. Subject to the assumptions and qualifications in the schedule:
   (a) the Company is duly incorporated and validly existing under the Companies Act, 2013;
   (b) the Company has the corporate power to execute the SSA and SHA and to issue the Series C CCPS;
   (c) the execution of the transaction documents has been duly authorised by all necessary corporate action.

5. This opinion is addressed solely to the Board and the persons entitled to rely upon it under the SSA, and may not be relied upon by any other person.

Ashoka & Meridian LLP`;

  const affidavit = `AFFIDAVIT
(Draft — for legal review)

I, Ananya Krishnan, aged 41 years, residing at 42 Lavelle Road, Bengaluru, do hereby solemnly affirm and state as follows:

1. I am the vendor under the agreement for sale dated 9 January 2026 in respect of the property more particularly described in the schedule.

2. I am the absolute owner of the said property, having acquired the same under a registered sale deed dated 14 August 2014, document no. BNG-1-04112-2014-15.

3. The property is free from encumbrances, lis pendens, attachments and claims save as disclosed in the title note of Ashoka & Meridian LLP dated 22 January 2026.

4. I have not entered into any other agreement for sale, lease or mortgage in respect of the property.

5. The contents of this affidavit are true to my knowledge. Nothing material has been concealed.

Deponent
Solemnly affirmed at Bengaluru this ____ day of ________ 2026`;

  const vendor = `VENDOR AGREEMENT
(Draft — for legal review)

Customer: Northern Grid Power Corp
Vendor: Helios Metering Systems Pvt Ltd
Scope: Supply and commissioning of 40,000 smart meters for the Northern circle, as specified in Annex A
Value: INR 186,00,00,000
Term: 36 months from the effective date
Payment: 10% mobilisation, 70% against shipping documents, 20% on commissioning
LD: 0.5% of delayed value per week, capped at 7.5%
Warranty: 60 months
Liability cap: 100% of the contract value, except for fraud, IP indemnity and personal injury
Governing law: India; arbitration at New Delhi, DIAC rules
Data protection: Vendor shall process personal data only on documented instructions and shall not transfer data outside India without prior written consent`;

  const board = `CERTIFIED TRUE COPY OF THE RESOLUTION PASSED AT THE MEETING OF THE BOARD OF DIRECTORS OF VEDATECH SOLUTIONS PVT LTD HELD ON 11 AUGUST 2026 AT THE REGISTERED OFFICE

"RESOLVED THAT pursuant to section 62 of the Companies Act, 2013 and the charter documents of the Company, the consent of the Board be and is hereby accorded to issue up to 18,40,000 Series C Compulsorily Convertible Preference Shares of face value INR 10 each at a premium of INR 1,240 per share to Meridian Ventures IV LP and other persons identified in the term sheet dated 28 July 2026, on the terms set out in the draft SSA tabled at the meeting.

RESOLVED FURTHER THAT Mr Rohan Iyer, Chief Executive Officer, and Ms Tara Menon, Chief Financial Officer, be and are hereby severally authorised to execute the SSA, SHA and all ancillary documents, and to do all acts necessary to give effect to this resolution."

Certified true copy
Company Secretary`;

  const documentRows: Array<{
    title: string;
    type: string;
    client: string;
    matter: string;
    folder: string;
    status: string;
    cls: string;
    author: string;
    content: string;
    priv: boolean;
    hold: boolean;
    fmt: string;
  }> = [
    {
      title: "Mutual NDA — Meridian Ventures IV",
      type: "NDA",
      client: c.veda,
      matter: m.vedaShare,
      folder: "Transaction / NDAs",
      status: "Executed",
      cls: "Confidential",
      author: "Kabir Sharma",
      content: nda,
      priv: false,
      hold: false,
      fmt: "DOCX",
    },
    {
      title: "Shareholders' Agreement — Series C (draft 4)",
      type: "Service Agreement",
      client: c.veda,
      matter: m.vedaShare,
      folder: "Transaction / Closing set",
      status: "Under Review",
      cls: "Highly Confidential",
      author: "Rohan Desai",
      content: sha,
      priv: true,
      hold: false,
      fmt: "DOCX",
    },
    {
      title: "CTO Employment Agreement — draft",
      type: "Employment Agreement",
      client: c.veda,
      matter: m.vedaEmp,
      folder: "Employment",
      status: "Draft",
      cls: "Confidential",
      author: "Leila Nassar",
      content: emp,
      priv: false,
      hold: false,
      fmt: "DOCX",
    },
    {
      title: "Legal notice to Sable & Co. — slot sharing",
      type: "Legal Notice",
      client: c.harbor,
      matter: m.harborArb,
      folder: "Correspondence",
      status: "Approved",
      cls: "Attorney-Client Privileged",
      author: "Amelia Hart",
      content: notice,
      priv: true,
      hold: true,
      fmt: "PDF",
    },
    {
      title: "SIAC notice of arbitration (working draft)",
      type: "Pleading",
      client: c.harbor,
      matter: m.harborArb,
      folder: "Pleadings",
      status: "Draft",
      cls: "Attorney Work Product",
      author: "Amelia Hart",
      content:
        "NOTICE OF ARBITRATION under the SIAC Rules (6th edition).\n\nClaimant: Harborline Shipping Ltd\nRespondent: Sable & Co. Holdings\nSeat: Singapore\nTribunal: three arbitrators\nClaims: breach of slot-sharing agreement; damages estimated at USD 18.4 million plus interest.\nRelief: declaration, damages, costs.\n\nThis working draft is privileged and subject to partner settlement authority.",
      priv: true,
      hold: true,
      fmt: "DOCX",
    },
    {
      title: "Leave and licence — Unit 4B Koregaon",
      type: "Lease Agreement",
      client: c.green,
      matter: m.greenLease,
      folder: "Leases",
      status: "Under Review",
      cls: "Internal",
      author: "Kabir Sharma",
      content: lease,
      priv: false,
      hold: false,
      fmt: "DOCX",
    },
    {
      title: "Capacity opinion — Series C issuance",
      type: "Legal Opinion",
      client: c.veda,
      matter: m.vedaShare,
      folder: "Opinions",
      status: "Approved",
      cls: "Attorney-Client Privileged",
      author: "Priya Mehta",
      content: opinion,
      priv: true,
      hold: false,
      fmt: "PDF",
    },
    {
      title: "Title affidavit — Lavelle Road",
      type: "Affidavit",
      client: c.ananya,
      matter: m.ananyaProp,
      folder: "Conveyance",
      status: "Draft",
      cls: "Confidential",
      author: "James Okonkwo",
      content: affidavit,
      priv: false,
      hold: false,
      fmt: "DOCX",
    },
    {
      title: "Smart meter vendor agreement",
      type: "Vendor Agreement",
      client: c.grid,
      matter: m.gridComp,
      folder: "Procurement",
      status: "Under Review",
      cls: "Confidential",
      author: "Kabir Sharma",
      content: vendor,
      priv: false,
      hold: false,
      fmt: "DOCX",
    },
    {
      title: "Board resolution — Series C issuance",
      type: "Board Resolution",
      client: c.veda,
      matter: m.vedaShare,
      folder: "Corporate records",
      status: "Executed",
      cls: "Internal",
      author: "Rohan Desai",
      content: board,
      priv: false,
      hold: false,
      fmt: "PDF",
    },
    {
      title: "OSS licence audit memorandum",
      type: "Legal Opinion",
      client: c.veda,
      matter: m.vedaIP,
      folder: "IP",
      status: "Approved",
      cls: "Attorney Work Product",
      author: "Kabir Sharma",
      content:
        "MEMORANDUM\nTo: General Counsel, VedaTech\nRe: Open-source licence audit of the Orion platform\n\nWe reviewed 214 repositories. Four copyleft components (GPL-3.0) are linked in a manner that presents distribution risk if the SaaS offering is packaged for on-premise delivery. Recommendation: isolate the GPL components behind a process boundary, or replace with MIT/Apache-2.0 equivalents before any on-premise SKU is offered. Trademark filing for ORION FLOW is clear on the Indian register in class 9 and 42.",
      priv: true,
      hold: false,
      fmt: "PDF",
    },
    {
      title: "Trust deed restatement — working copy",
      type: "Board Resolution",
      client: c.trust,
      matter: m.trustGov,
      folder: "Governance",
      status: "Draft",
      cls: "Highly Confidential",
      author: "Priya Mehta",
      content:
        "RESTATED DEED OF TRUST\nThe Settlor restates the Meridian Family Trust established on 12 April 2016.\nTrustees: Priya Mehta (professional) and two family trustees.\nProper law: India.\nInvestment mandate: listed securities, regulated funds, and residential property in India and the United Kingdom, subject to the prohibited-jurisdiction list in Schedule 4.\nProtector: independent, with power to appoint and remove trustees.\nThis draft is for trustee review only.",
      priv: true,
      hold: false,
      fmt: "DOCX",
    },
    {
      title: "RFP fairness memorandum — smart city",
      type: "Legal Opinion",
      client: c.pune,
      matter: m.puneProc,
      folder: "Procurement",
      status: "Under Review",
      cls: "Internal",
      author: "Rohan Desai",
      content:
        "The evaluation criteria in the draft RFP are, in our view, objectively stated. Two conditions (minimum turnover of INR 2,000 crore and a mandatory OEM joint venture) may be challenged as restrictive. We recommend a two-stage bid with a pre-qualification that is proportionate to the package size, and that the OEM JV condition be recast as a scored technical criterion rather than a pass/fail gate.",
      priv: true,
      hold: false,
      fmt: "PDF",
    },
    {
      title: "Customer correspondence — rolled cargo claims",
      type: "Correspondence",
      client: c.harbor,
      matter: m.harborArb,
      folder: "Evidence",
      status: "Approved",
      cls: "Attorney-Client Privileged",
      author: "James Okonkwo",
      content:
        "Compilation of customer notices received between 12 September and 3 October 2025 following the allocation cut. 41 notices. Aggregate claimed exposure USD 6.1 million. Privilege asserted — prepared at the direction of counsel for use in contemplated arbitration.",
      priv: true,
      hold: true,
      fmt: "PDF",
    },
    {
      title: "ESOP restatement 2026",
      type: "Board Resolution",
      client: c.veda,
      matter: m.vedaShare,
      folder: "Corporate records",
      status: "Approved",
      cls: "Confidential",
      author: "Leila Nassar",
      content:
        "VEDATECH EMPLOYEE STOCK OPTION PLAN 2026\nPool: 12% fully diluted post Series C.\nVesting: 4 years, 1-year cliff, monthly thereafter.\nExercise period: 90 days post termination except for Cause (immediate lapse) and Good Leaver (12 months).\nGoverning law: India. Plan administered by the Nomination and Remuneration Committee.",
      priv: false,
      hold: false,
      fmt: "DOCX",
    },
    {
      title: "Sale deed — Lavelle Road (engrossment)",
      type: "Service Agreement",
      client: c.ananya,
      matter: m.ananyaProp,
      folder: "Conveyance",
      status: "Under Review",
      cls: "Confidential",
      author: "Priya Mehta",
      content:
        "SALE DEED\nVendor: Ananya Krishnan\nPurchaser: [to be completed]\nConsideration: INR 18,40,00,000\nProperty: residential bungalow at 42 Lavelle Road, Bengaluru, more particularly described in the schedule, together with all easements, fixtures and the benefit of the compound wall.\nThe Vendor conveys the property free from encumbrances. Possession on completion. Stamp duty and registration as per Karnataka law, borne by the Purchaser.",
      priv: false,
      hold: false,
      fmt: "DOCX",
    },
  ];

  for (const d of documentRows) {
    const id = mk();
    docs[d.title] = id;
    const hash = `sha256:${id.replace(/-/g, "").slice(0, 16)}`;
    await sql`
      insert into documents (
        id, user_id, client_id, matter_id, folder, title, document_type, file_format,
        version, status, classification, language, author, content, file_hash,
        ocr_status, privilege_flag, personal_data_flag, legal_hold
      ) values (
        ${id}, ${userId}, ${d.client}, ${d.matter}, ${d.folder}, ${d.title}, ${d.type},
        ${d.fmt}, ${d.status === "Draft" ? 1 : 3}, ${d.status}, ${d.cls}, ${"English"},
        ${d.author}, ${d.content}, ${hash}, ${d.fmt === "PDF" ? "Complete" : "Not required"},
        ${d.priv}, ${false}, ${d.hold}
      )
    `;
    await sql`
      insert into document_versions (id, user_id, document_id, version, author, change_summary, content, status)
      values (${nid()}, ${userId}, ${id}, ${1}, ${d.author}, ${"Initial upload"}, ${d.content}, ${"Draft"})
    `;
    if (d.status !== "Draft") {
      await sql`
        insert into document_versions (id, user_id, document_id, version, author, change_summary, content, status)
        values (${nid()}, ${userId}, ${id}, ${2}, ${d.author}, ${"Partner comments incorporated"}, ${d.content}, ${"Under Review"})
      `;
    }
  }

  const shaId = docs["Shareholders' Agreement — Series C (draft 4)"];
  if (shaId) {
    await sql`
      insert into document_comments (id, user_id, document_id, author, body)
      values (${nid()}, ${userId}, ${shaId}, ${"Amelia Hart"}, ${"Drag threshold at 60% is aggressive for a 8% holder. Consider 75% or a higher ownership trigger for the Lead Investor's own drag."})
    `;
    await sql`
      insert into document_comments (id, user_id, document_id, author, body)
      values (${nid()}, ${userId}, ${shaId}, ${"Kabir Sharma"}, ${"Reserved matter (c) — INR 25 crore is below the working-capital facility. Align with the existing SBI sanction."})
    `;
  }

  const contracts = [
    {
      title: "Mutual NDA — Meridian Ventures IV",
      type: "NDA",
      client: c.veda,
      matter: m.vedaShare,
      doc: docs["Mutual NDA — Meridian Ventures IV"],
      a: "VedaTech Solutions Pvt Ltd",
      b: "Meridian Ventures IV LP",
      agree: "2026-03-12",
      eff: "2026-03-12",
      exp: "2029-03-12",
      ren: null as string | null,
      notice: 0,
      value: null as string | null,
      cur: "INR",
      status: "Executed",
      risk: 18,
      auto: false,
      law: "India",
    },
    {
      title: "Series C Shareholders' Agreement",
      type: "Shareholders' Agreement",
      client: c.veda,
      matter: m.vedaShare,
      doc: docs["Shareholders' Agreement — Series C (draft 4)"],
      a: "VedaTech Solutions Pvt Ltd",
      b: "Meridian Ventures IV LP",
      agree: "2026-08-11",
      eff: "2026-09-01",
      exp: null,
      ren: null,
      notice: 30,
      value: "22816000000",
      cur: "INR",
      status: "Under negotiation",
      risk: 62,
      auto: false,
      law: "India",
    },
    {
      title: "CTO Employment Agreement",
      type: "Employment Agreement",
      client: c.veda,
      matter: m.vedaEmp,
      doc: docs["CTO Employment Agreement — draft"],
      a: "VedaTech Solutions Pvt Ltd",
      b: "Incoming CTO",
      agree: null,
      eff: "2026-06-01",
      exp: null,
      ren: null,
      notice: 180,
      value: "12000000",
      cur: "INR",
      status: "Under negotiation",
      risk: 41,
      auto: false,
      law: "India",
    },
    {
      title: "Slot sharing agreement — FE-N service",
      type: "Vendor Agreement",
      client: c.harbor,
      matter: m.harborArb,
      doc: docs["Legal notice to Sable & Co. — slot sharing"],
      a: "Harborline Shipping Ltd",
      b: "Sable & Co. Holdings",
      agree: "2024-03-04",
      eff: "2024-04-01",
      exp: "2027-03-31",
      ren: "2026-12-31",
      notice: 42,
      value: "64000000",
      cur: "USD",
      status: "Disputed",
      risk: 88,
      auto: true,
      law: "Singapore",
    },
    {
      title: "Unit 4B Koregaon leave and licence",
      type: "Lease Agreement",
      client: c.green,
      matter: m.greenLease,
      doc: docs["Leave and licence — Unit 4B Koregaon"],
      a: "Greenfield Residences LLP",
      b: "Northwind Advisory Pvt Ltd",
      agree: "2026-08-01",
      eff: "2026-10-01",
      exp: "2026-09-28",
      ren: "2026-09-01",
      notice: 90,
      value: "28800000",
      cur: "INR",
      status: "Pending execution",
      risk: 35,
      auto: true,
      law: "Maharashtra",
    },
    {
      title: "Smart meter supply — Helios",
      type: "Vendor Agreement",
      client: c.grid,
      matter: m.gridComp,
      doc: docs["Smart meter vendor agreement"],
      a: "Northern Grid Power Corp",
      b: "Helios Metering Systems Pvt Ltd",
      agree: "2026-07-15",
      eff: "2026-08-01",
      exp: "2026-09-10",
      ren: null,
      notice: 30,
      value: "18600000000",
      cur: "INR",
      status: "Under negotiation",
      risk: 71,
      auto: false,
      law: "India",
    },
    {
      title: "Master services — cloud hosting",
      type: "Service Agreement",
      client: c.veda,
      matter: m.vedaIP,
      doc: null,
      a: "VedaTech Solutions Pvt Ltd",
      b: "Nimbus Cloud India Pvt Ltd",
      agree: "2025-09-01",
      eff: "2025-09-01",
      exp: "2026-10-15",
      ren: "2026-09-15",
      notice: 60,
      value: "42000000",
      cur: "INR",
      status: "Active",
      risk: 44,
      auto: true,
      law: "India",
    },
    {
      title: "Consultancy — CERC tariff",
      type: "Consultancy Agreement",
      client: c.grid,
      matter: m.gridComp,
      doc: null,
      a: "Northern Grid Power Corp",
      b: "Ashoka & Meridian LLP",
      agree: "2026-02-03",
      eff: "2026-02-03",
      exp: "2027-02-02",
      ren: null,
      notice: 30,
      value: "18000000",
      cur: "INR",
      status: "Active",
      risk: 22,
      auto: false,
      law: "India",
    },
  ];

  for (const ct of contracts) {
    await sql`
      insert into contracts (
        id, user_id, document_id, client_id, matter_id, title, contract_type,
        first_party, second_party, agreement_date, effective_date, expiry_date,
        renewal_date, notice_period_days, contract_value, currency, status,
        risk_score, auto_renewal, governing_law
      ) values (
        ${nid()}, ${userId}, ${ct.doc}, ${ct.client}, ${ct.matter}, ${ct.title},
        ${ct.type}, ${ct.a}, ${ct.b}, ${ct.agree}, ${ct.eff}, ${ct.exp}, ${ct.ren},
        ${ct.notice}, ${ct.value}, ${ct.cur}, ${ct.status}, ${ct.risk}, ${ct.auto},
        ${ct.law}
      )
    `;
  }

  const clauses = [
    [
      "CL-CONF-01",
      "Confidential-use confidentiality",
      "Confidentiality",
      "India",
      "Contracts",
      "Low",
      "Three-year survival; trade secrets perpetual",
      "Two-year survival",
      "Prefer a purpose limitation plus a reasonableness standard of care.",
      "The Receiving Party shall use Confidential Information solely for the Purpose and shall protect it with no less than reasonable care, and in any event with the same degree of care it uses for its own confidential information of like importance.",
    ],
    [
      "CL-LIAB-02",
      "Liability cap — 100% of fees",
      "Liability",
      "India",
      "Contracts",
      "Medium",
      "Cap at fees paid in prior 12 months; carve-outs for fraud, IP and personal injury",
      "Cap at 12 months' fees with additional carve-out for data protection fines",
      "Do not accept unlimited liability except for the standard carve-outs.",
      "Subject to the remaining provisions of this clause, each party's aggregate liability arising out of or in connection with this Agreement shall not exceed the fees paid or payable in the twelve (12) months preceding the claim. Nothing in this Agreement limits liability for fraud, death or personal injury caused by negligence, or infringement of intellectual property.",
    ],
    [
      "CL-IND-03",
      "IP indemnity — vendor",
      "Indemnity",
      "India",
      "Intellectual Property",
      "High",
      "Vendor indemnifies for third-party IP claims, with control of defence",
      "Mutual IP indemnity capped",
      "Customer-favourable on inbound vendor IP.",
      "The Vendor shall indemnify the Customer against all losses arising from any claim that the deliverables infringe the intellectual property rights of a third party, provided the Customer gives prompt notice and grants the Vendor sole control of the defence and settlement (not to impose any obligation on the Customer without consent).",
    ],
    [
      "CL-TERM-04",
      "Termination for convenience — 90 days",
      "Termination",
      "India",
      "Contracts",
      "Medium",
      "Either party, 90 days after lock-in",
      "Customer only, 60 days",
      "Avoid termination for convenience by the vendor on critical offtake.",
      "Without prejudice to any other rights, either party may terminate this Agreement for convenience by giving not less than ninety (90) days' prior written notice, provided that no such notice may expire during any lock-in period.",
    ],
    [
      "CL-GOV-05",
      "Governing law — India, Mumbai courts",
      "Governing law",
      "India",
      "Contracts",
      "Low",
      "India; exclusive Mumbai courts for non-arbitrable relief",
      "India; Delhi courts",
      "Keep seat and governing law aligned.",
      "This Agreement is governed by the laws of India. Subject to the arbitration clause, the courts at Mumbai shall have exclusive jurisdiction.",
    ],
    [
      "CL-ARB-06",
      "Arbitration — SIAC, Singapore seat",
      "Dispute resolution",
      "Singapore",
      "Arbitration",
      "Medium",
      "SIAC, three arbitrators, English language, Singapore seat",
      "SIAC, sole arbitrator under the expedited procedure if under USD 5m",
      "Use three arbitrators above USD 5 million.",
      "Any dispute arising out of or in connection with this Agreement, including any question regarding its existence, validity or termination, shall be referred to and finally resolved by arbitration administered by the Singapore International Arbitration Centre in accordance with the SIAC Rules. The seat shall be Singapore. The tribunal shall consist of three arbitrators. The language shall be English.",
    ],
    [
      "CL-PAY-07",
      "Payment — 30 days, no set-off",
      "Payment",
      "India",
      "Contracts",
      "Low",
      "30 days from invoice; interest at 12% per annum",
      "45 days; interest at SBI MCLR + 2%",
      "Resist pay-when-paid in construction-adjacent work.",
      "Undisputed invoices shall be paid within thirty (30) days of receipt. Late amounts shall bear interest at 12% per annum. The Customer may not set off any claim against sums due except for a claim that has been finally adjudicated or agreed.",
    ],
    [
      "CL-DP-08",
      "Data processing — India residency",
      "Data protection",
      "India",
      "Compliance",
      "High",
      "No transfer outside India without consent; DPDP Act 2023 compliance",
      "Standard contractual clauses plus consent",
      "Public sector clients will require localisation.",
      "The Processor shall process personal data only on documented instructions of the Controller, shall not transfer personal data outside India without prior written consent, and shall implement technical and organisational measures appropriate to the risk, in accordance with the Digital Personal Data Protection Act, 2023.",
    ],
    [
      "CL-IP-09",
      "Foreground IP assignment",
      "Intellectual property",
      "India",
      "Intellectual Property",
      "Medium",
      "Customer owns deliverables; vendor retains tools",
      "Joint ownership of foreground",
      "Avoid joint ownership — it is operationally painful.",
      "All intellectual property in the deliverables created under this Agreement shall vest in the Customer upon creation. The Vendor retains ownership of its pre-existing tools, libraries and frameworks, and hereby grants the Customer a perpetual, irrevocable, worldwide licence to use those tools solely as embodied in the deliverables.",
    ],
    [
      "CL-FM-10",
      "Force majeure — epidemic and grid failure",
      "Force majeure",
      "India",
      "Contracts",
      "Low",
      "Standard list plus epidemic, cyber incident, grid failure; 60-day termination right",
      "Exclude cyber incidents",
      "Require mitigation and prompt notice.",
      "Neither party is liable for delay or failure caused by an event beyond its reasonable control, including act of God, war, terrorism, epidemic, nationwide grid failure, or a cyber incident affecting a party's critical systems, provided that the affected party gives prompt notice and takes reasonable steps to mitigate. If the event continues for 60 days, either party may terminate.",
    ],
    [
      "CL-AUD-11",
      "Audit rights — annual, reasonable notice",
      "Audit rights",
      "India",
      "Compliance",
      "Medium",
      "Once per year, 10 business days' notice, confidentiality",
      "Once per year plus for cause",
      "Cap auditor at a Big Four or the Customer's internal audit.",
      "The Customer may, not more than once in any twelve-month period (and additionally for cause), audit the Vendor's relevant records on not less than ten (10) business days' notice, during business hours, subject to confidentiality and without unreasonably disrupting operations.",
    ],
    [
      "CL-EXC-12",
      "Non-exclusive dealing",
      "Exclusivity",
      "India",
      "Contracts",
      "Low",
      "Non-exclusive unless a paid retainer is agreed",
      "Limited exclusivity in a named territory",
      "Do not grant exclusivity without a minimum commitment.",
      "Nothing in this Agreement grants either party any exclusivity. Each party may enter into similar arrangements with third parties, provided it continues to perform its obligations in full.",
    ],
  ] as const;

  for (const cl of clauses) {
    await sql`
      insert into clauses (
        id, user_id, clause_code, title, category, jurisdiction, practice_area,
        risk_category, preferred_position, fallback_position, guidance, body, status
      ) values (
        ${nid()}, ${userId}, ${cl[0]}, ${cl[1]}, ${cl[2]}, ${cl[3]}, ${cl[4]},
        ${cl[5]}, ${cl[6]}, ${cl[7]}, ${cl[8]}, ${cl[9]}, ${"Approved"}
      )
    `;
  }

  const templates = [
    [
      "Mutual NDA — India (balanced)",
      "NDA",
      "India",
      "Contracts",
      "A balanced mutual NDA for preliminary discussions.\nPlaceholders: {{CLIENT_NAME}}, {{PARTY_NAME}}, {{AGREEMENT_DATE}}, {{PURPOSE}}, {{CONFIDENTIALITY_PERIOD}}, {{JURISDICTION}}.\nStructure: parties, purpose, definition, obligations, exclusions, term, return, governing law.",
    ],
    [
      "Employment agreement — CXO (India)",
      "Employment Agreement",
      "India",
      "Employment",
      "Executive employment form. Placeholders: {{PARTY_NAME}}, {{EFFECTIVE_DATE}}, {{PAYMENT_TERMS}}, {{JURISDICTION}}, {{LIABILITY_CAP}}.\nInclude IP assignment, garden leave, non-solicit. Do not include a non-compete that would be void under Indian law without more.",
    ],
    [
      "Vendor agreement — supply (India)",
      "Vendor Agreement",
      "India",
      "Contracts",
      "Supply of goods. Placeholders: {{CLIENT_NAME}}, {{PARTY_NAME}}, {{CONTRACT_VALUE}}, {{PAYMENT_TERMS}}, {{LIABILITY_CAP}}, {{JURISDICTION}}.\nLD cap, warranty, IP indemnity, data residency if personal data is processed.",
    ],
    [
      "Legal notice — commercial breach",
      "Legal Notice",
      "India",
      "Litigation",
      "Without-prejudice notice. Placeholders: {{CLIENT_NAME}}, {{PARTY_NAME}}, {{PURPOSE}}, {{JURISDICTION}}.\nFacts, breach, demand, deadline, reservation of rights. Do not admit liability.",
    ],
    [
      "Leave and licence — Maharashtra",
      "Lease Agreement",
      "Maharashtra",
      "Real Estate",
      "Leave and licence, not a lease. Placeholders: {{CLIENT_NAME}}, {{PARTY_NAME}}, {{EFFECTIVE_DATE}}, {{PAYMENT_TERMS}}, {{JURISDICTION}}.\nLock-in, deposit, stamp and registration.",
    ],
    [
      "Board resolution — share issuance",
      "Board Resolution",
      "India",
      "Corporate",
      "Certified true copy form. Placeholders: {{CLIENT_NAME}}, {{AGREEMENT_DATE}}, {{PURPOSE}}.\nQuorum, section references, authorisation of signatories.",
    ],
    [
      "Affidavit of title",
      "Affidavit",
      "India",
      "Real Estate",
      "Vendor affidavit. Placeholders: {{PARTY_NAME}}, {{PURPOSE}}, {{JURISDICTION}}.\nIdentity, ownership, encumbrances, concealment statement.",
    ],
    [
      "Consultancy agreement — professional services",
      "Consultancy Agreement",
      "India",
      "Contracts",
      "Professional services. Placeholders: {{CLIENT_NAME}}, {{PARTY_NAME}}, {{PAYMENT_TERMS}}, {{LIABILITY_CAP}}, {{JURISDICTION}}.\nIndependent contractor, IP, confidentiality, no employment relationship.",
    ],
  ] as const;

  for (const t of templates) {
    await sql`
      insert into templates (
        id, user_id, name, document_type, jurisdiction, practice_area, status, placeholders, body, version
      ) values (
        ${nid()}, ${userId}, ${t[0]}, ${t[1]}, ${t[2]}, ${t[3]}, ${"Active"},
        ${"{{CLIENT_NAME}} {{PARTY_NAME}} {{AGREEMENT_DATE}} {{EFFECTIVE_DATE}} {{JURISDICTION}} {{LIABILITY_CAP}} {{PAYMENT_TERMS}}"},
        ${t[4]}, ${1}
      )
    `;
  }

  const tasks = [
    ["Incorporate partner comments on SHA draft 4", m.vedaShare, "Kabir Sharma", "2026-08-20", "Open", "High"],
    ["File SIAC notice of arbitration", m.harborArb, "Amelia Hart", "2026-08-26", "Open", "High"],
    ["Obtain original title documents from client", m.ananyaProp, "James Okonkwo", "2026-08-18", "Open", "Medium"],
    ["Stamp duty computation — Unit 4B", m.greenLease, "Kabir Sharma", "2026-08-28", "In Progress", "Medium"],
    ["CERC annexures — load data", m.gridComp, "Leila Nassar", "2026-09-04", "Open", "Low"],
    ["Ethical wall acknowledgement — Pune RFP", m.puneProc, "Sofia Alvarez", "2026-08-22", "Open", "High"],
    ["ESOP board note", m.vedaShare, "Leila Nassar", "2026-08-25", "In Progress", "Medium"],
    ["OSS replacement plan for GPL components", m.vedaIP, "Kabir Sharma", "2026-09-08", "Open", "Medium"],
    ["Trustee meeting pack", m.trustGov, "Priya Mehta", "2026-09-01", "Open", "Low"],
    ["Customer claim schedule — Harborline", m.harborArb, "James Okonkwo", "2026-08-21", "Open", "High"],
  ] as const;

  for (const t of tasks) {
    await sql`
      insert into tasks (id, user_id, matter_id, title, assigned_to, due_date, status, priority)
      values (${nid()}, ${userId}, ${t[1]}, ${t[0]}, ${t[2]}, ${t[3]}, ${t[4]}, ${t[5]})
    `;
  }

  const approvals = [
    ["Shareholders' Agreement — Series C (draft 4)", m.vedaShare, shaId ?? null, "Kabir Sharma", "Partner review", "Pending", "High", "2026-08-24"],
    ["Smart meter vendor agreement", m.gridComp, docs["Smart meter vendor agreement"] ?? null, "Kabir Sharma", "Senior associate", "Pending", "High", "2026-08-25"],
    ["Leave and licence — Unit 4B", m.greenLease, docs["Leave and licence — Unit 4B Koregaon"] ?? null, "Kabir Sharma", "Partner review", "Pending", "Medium", "2026-08-27"],
    ["Capacity opinion — Series C", m.vedaShare, docs["Capacity opinion — Series C issuance"] ?? null, "Priya Mehta", "Managing partner", "Approved", "Medium", "2026-08-18"],
    ["Legal notice to Sable", m.harborArb, docs["Legal notice to Sable & Co. — slot sharing"] ?? null, "Amelia Hart", "Partner", "Approved", "High", "2026-08-12"],
    ["RFP fairness memorandum", m.puneProc, docs["RFP fairness memorandum — smart city"] ?? null, "Rohan Desai", "Compliance", "Pending", "Medium", "2026-08-29"],
  ] as const;

  for (const a of approvals) {
    await sql`
      insert into approvals (
        id, user_id, matter_id, document_id, title, submitted_by, current_stage, status, risk_level, due_date
      ) values (
        ${nid()}, ${userId}, ${a[1]}, ${a[2]}, ${a[0]}, ${a[3]}, ${a[4]}, ${a[5]}, ${a[6]}, ${a[7]}
      )
    `;
  }

  const hearings = [
    ["Case management conference", m.harborArb, "SIAC, Singapore", "2026-08-26", "10:00 SGT", "Video — SIAC platform", "Tribunal procedural timetable"],
    ["Interim relief mention", m.harborArb, "SIAC, Singapore", "2026-09-02", "14:00 SGT", "Video", "Preservation of allocation data"],
    ["Title objections hearing", m.ananyaProp, "City Civil Court, Bengaluru", "2026-09-18", "11:00 IST", "Court hall 4", "Vendor to attend with originals"],
    ["CERC mention", m.gridComp, "CERC, New Delhi", "2026-09-08", "10:30 IST", "CERC, Chanderlok Building", "Tariff petition 42/MP/2026"],
    ["RERA conciliation", m.greenLease, "MahaRERA, Mumbai", "2026-09-22", "15:00 IST", "MahaRERA, Bandra", "Allottee complaint — Wing C"],
    ["Pre-filing conference", m.puneProc, "Internal", "2026-08-28", "16:00 IST", "Pune office", "Ethics wall briefing"],
    ["Trustee meeting", m.trustGov, "Chambers", "2026-09-01", "17:30 IST", "Nariman Point", "Restatement approval"],
  ] as const;

  for (const h of hearings) {
    await sql`
      insert into hearings (
        id, user_id, matter_id, title, court, hearing_date, hearing_time, location, notes, status
      ) values (
        ${nid()}, ${userId}, ${h[1]}, ${h[0]}, ${h[2]}, ${h[3]}, ${h[4]}, ${h[5]}, ${h[6]}, ${"Scheduled"}
      )
    `;
  }

  await sql`
    insert into legal_holds (id, user_id, matter_id, title, reason, custodians, status, effective_date)
    values
      (${nid()}, ${userId}, ${m.harborArb}, ${"Harborline slot-sharing — preservation"},
       ${"Contemplated SIAC arbitration. Preserve emails, allocation reports, customer claims and board papers from 1 March 2024."},
       ${"Amelia Hart; James Okonkwo; Harborline GC; operations director"}, ${"Active"}, ${"2025-11-08"}),
      (${nid()}, ${userId}, ${m.puneProc}, ${"Pune RFP — public procurement hold"},
       ${"Potential bid-challenge. Preserve evaluation notes and communications with bidders."},
       ${"Rohan Desai; Sofia Alvarez"}, ${"Active"}, ${"2026-07-09"}),
      (${nid()}, ${userId}, ${m.vedaShare}, ${"Series C working papers (released)"},
       ${"Hold released after signing of the NDA stage. Transaction documents remain under ordinary retention."},
       ${"Rohan Desai; Kabir Sharma"}, ${"Released"}, ${"2026-03-12"})
  `;

  const audits = [
    ["Login", "Session", "Workspace opened"],
    ["View", "Matter", "SIAC slot-sharing arbitration"],
    ["Download", "Document", "Legal notice to Sable & Co. — slot sharing"],
    ["Edit", "Document", "Shareholders' Agreement — Series C (draft 4)"],
    ["AI draft generation", "Draft", "CTO Employment Agreement"],
    ["Approval", "Document", "Capacity opinion — Series C issuance"],
    ["Share", "Document", "Mutual NDA — Meridian Ventures IV"],
    ["Search", "Workspace", "auto-renewal expiring"],
    ["Legal hold applied", "Matter", "Harborline slot-sharing — preservation"],
    ["Access denied", "Matter", "Conflict register — Sable (adverse)"],
    ["Upload", "Document", "Customer correspondence — rolled cargo claims"],
    ["Permission change", "Matter", "Smart-city RFP advisory"],
  ] as const;
  for (const [action, type, name] of audits) {
    const denied = action === "Access denied";
    await sql`
      insert into audit_events (id, user_id, action, object_type, object_name, result, ip_address)
      values (${nid()}, ${userId}, ${action}, ${type}, ${name}, ${denied ? "Denied" : "Allowed"}, ${"10.40.12.18"})
    `;
  }

  const notes = [
    ["SHA draft 4 is waiting on your review", "Partner comments from Amelia and Kabir are on the document.", "approval", "/approvals"],
    ["Hearing tomorrow — SIAC CMC", "Case management conference at 10:00 SGT.", "hearing", "/calendar"],
    ["Contract expiring — Helios meters", "Smart meter supply expires 10 September 2026.", "contract", "/contracts"],
    ["Overdue: original title documents", "Lavelle Road conveyance — client still to send originals.", "task", "/tasks"],
    ["Legal hold acknowledgement outstanding", "Pune RFP hold — two custodians have not acknowledged.", "hold", "/holds"],
    ["New comment on SHA reserved matters", "Kabir Sharma mentioned the SBI facility threshold.", "comment", "/documents"],
  ] as const;
  for (const n of notes) {
    await sql`
      insert into notifications (id, user_id, title, body, kind, read, href)
      values (${nid()}, ${userId}, ${n[0]}, ${n[1]}, ${n[2]}, ${false}, ${n[3]})
    `;
  }

  await sql`
    update workspace_profiles set seeded = ${true} where user_id = ${userId}
  `;
}
