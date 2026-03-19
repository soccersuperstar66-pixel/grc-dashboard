import { Router, type IRouter } from "express";
import { db, policiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreatePolicyBody,
  UpdatePolicyParams,
  UpdatePolicyBody,
  DeletePolicyParams,
  AnalyzeGapsBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const FRAMEWORKS = [
  {
    id: "nist-csf",
    name: "NIST CSF 2.0",
    description: "NIST Cybersecurity Framework — a set of guidelines for mitigating organizational cybersecurity risks.",
    categories: [
      {
        id: "govern",
        name: "Govern (GV)",
        description: "Establish and monitor the organization's cybersecurity risk management strategy, expectations, and policy.",
        controls: [
          { id: "GV.OC", name: "Organizational Context", description: "The circumstances — mission, stakeholder expectations, and legal, regulatory, and contractual requirements — surrounding the organization's cybersecurity risk management decisions are understood." },
          { id: "GV.RM", name: "Risk Management Strategy", description: "The organization's priorities, constraints, risk tolerance and appetite statements, and assumptions are established, communicated, and used to support operational risk decisions." },
          { id: "GV.RR", name: "Roles, Responsibilities, and Authorities", description: "Cybersecurity roles, responsibilities, and authorities to foster accountability, performance assessment, and continuous improvement are established and communicated." },
          { id: "GV.PO", name: "Policy", description: "Organizational cybersecurity policy is established, communicated, and enforced." },
          { id: "GV.OV", name: "Oversight", description: "Results of organization-wide cybersecurity risk management activities and performance are used to inform, improve, and adjust the risk management strategy." },
          { id: "GV.SC", name: "Cybersecurity Supply Chain Risk Management", description: "Cyber supply chain risk management processes are identified, established, managed, monitored, and improved by organizational stakeholders." },
        ],
      },
      {
        id: "identify",
        name: "Identify (ID)",
        description: "Develop the organizational understanding to manage cybersecurity risk to systems, assets, data, and capabilities.",
        controls: [
          { id: "ID.AM", name: "Asset Management", description: "Assets (data, hardware, software, systems, facilities, services, people) that enable the organization to achieve business purposes are identified and managed consistent with their relative importance to organizational objectives and the organization's risk strategy." },
          { id: "ID.RA", name: "Risk Assessment", description: "The cybersecurity risk to the organization, assets, and individuals is understood by the organization." },
          { id: "ID.IM", name: "Improvement", description: "Improvements to organizational cybersecurity risk management processes, procedures and activities are identified across all CSF Functions." },
        ],
      },
      {
        id: "protect",
        name: "Protect (PR)",
        description: "Develop and implement the appropriate safeguards to ensure delivery of critical services.",
        controls: [
          { id: "PR.AA", name: "Identity Management, Authentication, and Access Control", description: "Access to physical and logical assets is limited to authorized users, services, and hardware and managed commensurate with the assessed risk of unauthorized access." },
          { id: "PR.AT", name: "Awareness and Training", description: "The organization's personnel are provided with cybersecurity awareness and training so that they can perform their cybersecurity-related tasks." },
          { id: "PR.DS", name: "Data Security", description: "Data are managed consistent with the organization's risk strategy to protect the confidentiality, integrity, and availability of information." },
          { id: "PR.PS", name: "Platform Security", description: "The hardware, software (e.g., firmware, operating systems, applications), and services of physical and virtual platforms are managed consistent with the organization's risk strategy to protect their confidentiality, integrity, and availability." },
          { id: "PR.IR", name: "Technology Infrastructure Resilience", description: "Security architectures are managed with the organization's risk strategy to protect asset confidentiality, integrity, and availability, and organizational resilience." },
        ],
      },
      {
        id: "detect",
        name: "Detect (DE)",
        description: "Develop and implement the appropriate activities to identify the occurrence of a cybersecurity event.",
        controls: [
          { id: "DE.CM", name: "Continuous Monitoring", description: "Assets are monitored to find anomalies, indicators of compromise, and other potentially adverse events." },
          { id: "DE.AE", name: "Adverse Event Analysis", description: "Anomalies, indicators of compromise, and other potentially adverse events are analyzed to characterize the events and detect cybersecurity incidents." },
        ],
      },
      {
        id: "respond",
        name: "Respond (RS)",
        description: "Develop and implement the appropriate activities to take action regarding a detected cybersecurity event.",
        controls: [
          { id: "RS.MA", name: "Incident Management", description: "Responses to detected cybersecurity incidents are managed." },
          { id: "RS.AN", name: "Incident Analysis", description: "Investigations are conducted to ensure effective response and support forensics and recovery activities." },
          { id: "RS.CO", name: "Incident Response Reporting and Communication", description: "Response activities are coordinated with internal and external stakeholders as required by laws, regulations, or policies." },
          { id: "RS.MI", name: "Incident Mitigation", description: "Activities are performed to prevent expansion of an event and mitigate its effects." },
        ],
      },
      {
        id: "recover",
        name: "Recover (RC)",
        description: "Develop and implement the appropriate activities to maintain plans for resilience and to restore any capabilities or services that were impaired due to a cybersecurity event.",
        controls: [
          { id: "RC.RP", name: "Incident Recovery Plan Execution", description: "Restoration activities are performed to ensure operational availability of systems and services affected by cybersecurity incidents." },
          { id: "RC.CO", name: "Incident Recovery Communication", description: "Restoration activities are coordinated with internal and external parties." },
        ],
      },
    ],
  },
  {
    id: "iso-27001",
    name: "ISO 27001:2022",
    description: "International standard for information security management systems (ISMS).",
    categories: [
      {
        id: "org-controls",
        name: "Organizational Controls",
        description: "Controls related to policies, organization, and supplier relationships.",
        controls: [
          { id: "A.5.1", name: "Information Security Policies", description: "Policies for information security shall be defined, approved by management, published, communicated to and acknowledged by employees and relevant external parties." },
          { id: "A.5.2", name: "Information Security Roles and Responsibilities", description: "All information security responsibilities shall be defined and allocated." },
          { id: "A.5.3", name: "Segregation of Duties", description: "Conflicting duties and conflicting areas of responsibility shall be segregated to reduce opportunities for unauthorized or unintentional modification or misuse of the organization's assets." },
          { id: "A.5.9", name: "Inventory of Information and Other Associated Assets", description: "An inventory of information and other associated assets, including owners, shall be developed and maintained." },
          { id: "A.5.14", name: "Information Transfer", description: "Information transfer rules, procedures, or agreements shall be in place for all types of transfer facilities within the organization and between the organization and other parties." },
          { id: "A.5.20", name: "Addressing Information Security Within Supplier Agreements", description: "Relevant information security requirements shall be established and agreed with each supplier based on the type of supplier relationship." },
        ],
      },
      {
        id: "people-controls",
        name: "People Controls",
        description: "Controls related to human resources security.",
        controls: [
          { id: "A.6.1", name: "Screening", description: "Background verification checks on all candidates for employment shall be carried out prior to joining the organization and on an ongoing basis." },
          { id: "A.6.3", name: "Information Security Awareness, Education and Training", description: "All employees of the organization and, where relevant, contractors shall receive appropriate awareness education and training and regular updates in organizational policies and procedures." },
          { id: "A.6.5", name: "Responsibilities After Termination or Change of Employment", description: "Information security responsibilities and duties that remain valid after termination or change of employment shall be defined, enforced and communicated to relevant personnel and other interested parties." },
        ],
      },
      {
        id: "physical-controls",
        name: "Physical Controls",
        description: "Controls related to physical and environmental security.",
        controls: [
          { id: "A.7.1", name: "Physical Security Perimeters", description: "Security perimeters shall be defined and used to protect areas that contain information and other associated assets." },
          { id: "A.7.4", name: "Physical Security Monitoring", description: "Premises shall be continuously monitored for unauthorized physical access." },
          { id: "A.7.8", name: "Equipment Siting and Protection", description: "Equipment shall be sited securely and protected." },
        ],
      },
      {
        id: "tech-controls",
        name: "Technological Controls",
        description: "Controls related to technology and systems.",
        controls: [
          { id: "A.8.2", name: "Privileged Access Rights", description: "The allocation and use of privileged access rights shall be restricted and managed." },
          { id: "A.8.5", name: "Secure Authentication", description: "Secure authentication technologies and procedures shall be implemented based on information access restrictions and the topic-specific policy on access control." },
          { id: "A.8.7", name: "Protection Against Malware", description: "Protection against malware shall be implemented and supported by appropriate user awareness." },
          { id: "A.8.9", name: "Configuration Management", description: "Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed." },
          { id: "A.8.24", name: "Use of Cryptography", description: "Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented." },
          { id: "A.8.28", name: "Secure Coding", description: "Secure coding principles shall be applied to software development." },
        ],
      },
    ],
  },
  {
    id: "soc2",
    name: "SOC 2 Type II",
    description: "Service Organization Control 2 — auditing standard for service organizations.",
    categories: [
      {
        id: "security",
        name: "Security (CC)",
        description: "Common Criteria related to security.",
        controls: [
          { id: "CC1", name: "Control Environment", description: "The entity demonstrates a commitment to integrity and ethical values." },
          { id: "CC2", name: "Communication and Information", description: "The entity obtains or generates and uses relevant, quality information to support the functioning of internal controls." },
          { id: "CC3", name: "Risk Assessment", description: "The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks relating to objectives." },
          { id: "CC4", name: "Monitoring Activities", description: "The entity selects, develops, and performs ongoing and/or separate evaluations to ascertain whether components of internal control are present and functioning." },
          { id: "CC5", name: "Control Activities", description: "The entity selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels." },
          { id: "CC6", name: "Logical and Physical Access Controls", description: "The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events." },
          { id: "CC7", name: "System Operations", description: "The entity detects and monitors for new vulnerabilities and threats on an ongoing basis." },
          { id: "CC8", name: "Change Management", description: "The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures." },
          { id: "CC9", name: "Risk Mitigation", description: "The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions." },
        ],
      },
      {
        id: "availability",
        name: "Availability (A)",
        description: "Criteria related to availability.",
        controls: [
          { id: "A1.1", name: "Availability Commitments", description: "The entity maintains, monitors, and evaluates current processing capacity and use of system components." },
          { id: "A1.2", name: "Environmental Protections", description: "Environmental protections, software, data back-up processes, and recovery infrastructure are authorized, designed, developed, implemented, operated, approved, maintained, and monitored." },
          { id: "A1.3", name: "Recovery Plan Testing", description: "Recovery plan procedures supporting system recovery are tested to help meet the entity's objectives." },
        ],
      },
      {
        id: "confidentiality",
        name: "Confidentiality (C)",
        description: "Criteria related to confidentiality.",
        controls: [
          { id: "C1.1", name: "Confidentiality Commitments", description: "The entity identifies and maintains confidential information to meet the entity's objectives related to confidentiality." },
          { id: "C1.2", name: "Disposal of Confidential Information", description: "The entity disposes of confidential information to meet the entity's objectives related to confidentiality." },
        ],
      },
    ],
  },
  {
    id: "hipaa",
    name: "HIPAA Security Rule",
    description: "Health Insurance Portability and Accountability Act security requirements for PHI.",
    categories: [
      {
        id: "admin",
        name: "Administrative Safeguards",
        description: "Administrative actions, policies, and procedures to manage security measures.",
        controls: [
          { id: "164.308(a)(1)", name: "Security Management Process", description: "Implement policies and procedures to prevent, detect, contain, and correct security violations." },
          { id: "164.308(a)(2)", name: "Assigned Security Responsibility", description: "Identify the security official who is responsible for the development and implementation of the policies and procedures." },
          { id: "164.308(a)(3)", name: "Workforce Security", description: "Implement policies and procedures to ensure that all members of its workforce have appropriate access to electronic protected health information." },
          { id: "164.308(a)(5)", name: "Security Awareness and Training", description: "Implement a security awareness and training program for all members of its workforce." },
          { id: "164.308(a)(6)", name: "Security Incident Procedures", description: "Implement policies and procedures to address security incidents." },
          { id: "164.308(a)(7)", name: "Contingency Plan", description: "Establish (and implement as needed) policies and procedures for responding to an emergency or other occurrence." },
        ],
      },
      {
        id: "physical",
        name: "Physical Safeguards",
        description: "Physical measures, policies, and procedures to protect electronic information systems.",
        controls: [
          { id: "164.310(a)", name: "Facility Access Controls", description: "Implement policies and procedures to limit physical access to its electronic information systems and the facility or facilities in which they are housed." },
          { id: "164.310(b)", name: "Workstation Use", description: "Implement policies and procedures that specify the proper functions to be performed, the manner in which those functions are to be performed, and the physical attributes of the surroundings of a specific workstation or class of workstation that can access electronic protected health information." },
          { id: "164.310(c)", name: "Workstation Security", description: "Implement physical safeguards for all workstations that access electronic protected health information." },
        ],
      },
      {
        id: "technical",
        name: "Technical Safeguards",
        description: "Technology and related policies to protect electronic protected health information.",
        controls: [
          { id: "164.312(a)", name: "Access Control", description: "Implement technical policies and procedures for electronic information systems that maintain electronic protected health information to allow access only to those persons or software programs that have been granted access rights." },
          { id: "164.312(b)", name: "Audit Controls", description: "Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use electronic protected health information." },
          { id: "164.312(c)", name: "Integrity", description: "Implement policies and procedures to protect electronic protected health information from improper alteration or destruction." },
          { id: "164.312(d)", name: "Person or Entity Authentication", description: "Implement procedures to verify that a person or entity seeking access to electronic protected health information is the one claimed." },
          { id: "164.312(e)", name: "Transmission Security", description: "Implement technical security measures to guard against unauthorized access to electronic protected health information that is being transmitted over an electronic communications network." },
        ],
      },
    ],
  },
];

router.get("/frameworks", (_req, res) => {
  res.json(FRAMEWORKS);
});

router.get("/policies", async (_req, res) => {
  const rows = await db.select().from(policiesTable).orderBy(policiesTable.createdAt);
  const result = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
  res.json(result);
});

router.post("/policies", async (req, res) => {
  const parsed = CreatePolicyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db
    .insert(policiesTable)
    .values({
      ...parsed.data,
      coveredControls: parsed.data.coveredControls ?? [],
    })
    .returning();
  res.status(201).json({ ...created, createdAt: created.createdAt.toISOString(), updatedAt: created.updatedAt.toISOString() });
});

router.put("/policies/:id", async (req, res) => {
  const paramsParsed = UpdatePolicyParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = UpdatePolicyBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }
  const [updated] = await db
    .update(policiesTable)
    .set({ ...bodyParsed.data, updatedAt: new Date() })
    .where(eq(policiesTable.id, paramsParsed.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Policy not found" });
    return;
  }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
});

router.delete("/policies/:id", async (req, res) => {
  const parsed = DeletePolicyParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(policiesTable).where(eq(policiesTable.id, parsed.data.id));
  res.status(204).send();
});

router.post("/analyze", async (req, res) => {
  const parsed = AnalyzeGapsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const framework = FRAMEWORKS.find((f) => f.id === parsed.data.frameworkId);
  if (!framework) {
    res.status(404).json({ error: "Framework not found" });
    return;
  }

  const policies = await db.select().from(policiesTable);
  const coveredControlIds = new Set(policies.flatMap((p) => p.coveredControls));

  const allControls = framework.categories.flatMap((cat) =>
    cat.controls.map((ctrl) => ({ ...ctrl, categoryName: cat.name }))
  );

  const gaps = [];
  const covered = [];

  for (const ctrl of allControls) {
    const coveredByPolicies = policies
      .filter((p) => p.coveredControls.includes(ctrl.id))
      .map((p) => p.name);

    const item = {
      controlId: ctrl.id,
      controlName: ctrl.name,
      categoryName: ctrl.categoryName,
      description: ctrl.description,
      coveredByPolicies,
    };

    if (coveredControlIds.has(ctrl.id)) {
      covered.push(item);
    } else {
      gaps.push(item);
    }
  }

  res.json({
    frameworkId: framework.id,
    frameworkName: framework.name,
    totalControls: allControls.length,
    coveredControls: covered.length,
    gapControls: gaps.length,
    coveragePercent: allControls.length > 0 ? Math.round((covered.length / allControls.length) * 100) : 0,
    gaps,
    covered,
  });
});

export default router;
