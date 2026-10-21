import type { BuddyLanguage, BuddyMode, BuddyReply, BuddyRequest, KeyTerm } from './types';

const MOCK_CONVERSATION_ID = 'mock-conv-0001';

interface MockEntry {
  keywords: string[];
  explanation: string;
  localExample: string;
  keyTerms: KeyTerm[];
  examTrap: string;
  checkQuestion: string;
  outlineSection: string;
  socraticQuestion: string;
  socraticFeedback: string;
}

const ENTRIES: MockEntry[] = [
  {
    keywords: ['high availability', 'ha', 'uptime', 'available'],
    explanation:
      'High availability means keeping a service running with very little downtime, even when something fails. In Azure this is done by removing single points of failure: you spread workloads across multiple machines, zones, or regions, and add health checks so a broken piece is skipped automatically. The goal is not "never goes down" — it is "stays up almost all the time and recovers fast."',
    localExample:
      'Think of load-shedding in many South African towns. If a whole suburb depends on one substation, a single trip leaves everyone in the dark. But if your area is fed from two substations with an automatic switch-over, one can fail and your lights only flicker. That redundancy is exactly what high availability adds to a cloud service.',
    keyTerms: [
      { term: 'SLA', meaning: 'Service Level Agreement — the % uptime a provider promises, e.g. 99.9%.' },
      { term: 'Redundancy', meaning: 'Having spare copies of a component so one failure does not stop the service.' },
      { term: 'Failover', meaning: 'Automatically switching to a healthy copy when the primary one fails.' },
    ],
    examTrap:
      'High availability is about staying up during failures. Disaster recovery is about recovering after a big disaster. They sound alike but answer different questions: "resist" vs "recover".',
    checkQuestion:
      'Your single VM reboots itself after a crash. Is that high availability, or just reliability?',
    outlineSection: 'Describe high availability and scalability in Azure',
    socraticQuestion:
      'If a service runs on one machine and that machine dies, what happens to the users? What would you add to change that outcome?',
    socraticFeedback:
      'Right — one machine is a single point of failure. Adding a second copy plus a load balancer means traffic moves on automatically. That extra, ready-to-go copy is the heart of high availability.',
  },
  {
    keywords: ['scalability', 'elasticity', 'scale', 'elastic'],
    explanation:
      'Scalability is the ability to handle more or less load by adding resources. Elasticity is a special kind of scalability: it adds resources automatically when demand rises and removes them when it falls, so you only pay for what you need right now. Scalable means "can grow"; elastic means "grows and shrinks on its own".',
    localExample:
      'Think of mobile money on payday. On the 25th of each month, millions of people send money at once. An elastic system spins up extra servers for those few hours, then drops them again that night. A merely scalable system could handle the rush too, but you would have to buy and keep those servers all month — wasteful on quiet days.',
    keyTerms: [
      { term: 'Scale up', meaning: 'Bigger machine (more CPU/RAM) on the same instance — vertical scaling.' },
      { term: 'Scale out', meaning: 'More machines side by side — horizontal scaling.' },
      { term: 'Autoscale', meaning: 'Rules that add or remove instances based on metrics like CPU.' },
    ],
    examTrap:
      'Scaling up (bigger VM) is not the same as scaling out (more VMs). Up has a hard ceiling and no failover; out is what gives you both capacity and high availability.',
    checkQuestion:
      'A shop adds one more teller during the lunch rush, then sends them home at 3pm. Is that scalability or elasticity?',
    outlineSection: 'Describe high availability and scalability in Azure',
    socraticQuestion:
      'If you buy 10 servers for the busy season but keep all 10 running during the quiet season, what are you wasting? What would let you avoid that?',
    socraticFeedback:
      'Exactly — you are paying for idle machines. Elasticity lets the count shrink automatically when load drops, so cost tracks demand instead of peak.',
  },
  {
    keywords: ['iaas', 'paas', 'saas', 'as a service', 'service model', 'service models'],
    explanation:
      'These are three layers of cloud service. IaaS (Infrastructure as a Service) gives you raw machines and networking — you install and look after the operating system and apps. PaaS (Platform as a Service) gives you a ready runtime, so you only bring your code and data; the provider runs the OS and servers. SaaS (Software as a Service) is a finished app you just use, like webmail. The more the provider handles, the less you manage.',
    localExample:
      'Picture a spaza shop. IaaS is renting an empty stall — you bring the shelves, stock, and do everything. PaaS is renting a stall that already has shelves and a fridge — you just bring your stock and sell. SaaS is a fully running tuck shop — you walk in and buy a cool drink, someone else runs the whole thing.',
    keyTerms: [
      { term: 'IaaS', meaning: 'You manage OS + apps; provider manages hardware and network. e.g. Azure VMs.' },
      { term: 'PaaS', meaning: 'You manage apps + data only; provider manages OS and servers. e.g. Azure App Service.' },
      { term: 'SaaS', meaning: 'Provider manages everything; you just use the app. e.g. Microsoft 365, Gmail.' },
    ],
    examTrap:
      'Shared responsibility shifts with the model. In IaaS YOU patch the OS; in PaaS the PROVIDER patches it. Many candidates flip this on the exam.',
    checkQuestion:
      'You deploy a web app to Azure App Service and never touch Windows updates. Which model is that, and why?',
    outlineSection: 'Describe the difference between IaaS, PaaS, and SaaS',
    socraticQuestion:
      'If you only want to write code and never patch an operating system, which service model fits, and which one would force you to patch it yourself?',
    socraticFeedback:
      'Correct — PaaS frees you from OS patching because the provider runs the platform. IaaS would hand you a VM and leave the OS in your hands.',
  },
  {
    keywords: ['availability zone', 'zone', 'zones', 'az '],
    explanation:
      'An availability zone is a separate physical location inside one Azure region, with its own power, cooling, and network. Zones are far enough apart that a flood or fire in one is unlikely to hit another, but close enough for fast, low-latency replication. Putting your workload across two or three zones protects you from a single datacenter failure while staying in the same region.',
    localExample:
      'Think of a big hospital in a city with three campuses — each with its own generators and water tanks, spread a few kilometres apart. If one campus loses power, patients are moved to the other two without flying to another city. The campuses are the zones; the city is the region.',
    keyTerms: [
      { term: 'Region', meaning: 'A geographic area with one or more datacenters, e.g. South Africa North.' },
      { term: 'Availability Zone', meaning: 'An independent datacenter within a region with its own utilities.' },
      { term: 'Zone-redundant', meaning: 'Service that automatically spreads across multiple zones.' },
    ],
    examTrap:
      'Availability zones live INSIDE a region, they do not replace regions. For protection against a whole region going down you need region pairs, not zones.',
    checkQuestion:
      'A flood knocks out one datacenter in a region. Your app is zone-redundant across three zones. What happens to users?',
    outlineSection: 'Describe Azure regions and availability zones',
    socraticQuestion:
      'If two datacenters share one power grid, does losing that grid take out both? What does that tell you about how zones should be built?',
    socraticFeedback:
      'Yes — shared power means a single grid failure hits both, so true zones need independent power, cooling, and network. That independence is what makes a zone a zone.',
  },
  {
    keywords: ['shared responsibility', 'responsibility model', 'who is responsible'],
    explanation:
      'The shared responsibility model says the cloud provider and the customer each own different layers. The provider always owns the physical datacenter, network, and host hardware. What you own depends on the service model: with IaaS you own the OS and everything above; with PaaS you own your app and data; with SaaS you mostly just own your data. Security of your data and access is always yours.',
    localExample:
      'Like renting a flat. The landlord fixes the building, plumbing, and roof (the provider). But you lock your own door, decide who gets a key, and keep your valuables safe (your data and access). Even in a hotel (SaaS), you still lock your room and guard your suitcase.',
    keyTerms: [
      { term: 'Provider responsibilities', meaning: 'Datacenter, network, physical hosts, and (for PaaS/SaaS) the OS.' },
      { term: 'Customer responsibilities', meaning: 'Data, access, identities, and (for IaaS) the OS and patches.' },
      { term: 'Always yours', meaning: 'Your data and who can reach it — this never moves to the provider.' },
    ],
    examTrap:
      '"The cloud is secure, so I am secure" is the classic trap. The provider secures the cloud; you secure what is IN the cloud. A misconfigured storage account is still your problem.',
    checkQuestion:
      'You store files in Azure Blob Storage. Who is responsible for deciding who can read those files?',
    outlineSection: 'Describe the shared responsibility model',
    socraticQuestion:
      'If a thief uses a key you leaked, is that the landlord\'s fault or yours? How does that map to cloud data?',
    socraticFeedback:
      'Exactly — a leaked key is your responsibility, like a copied house key. The provider gives you the lock; managing the keys is on you.',
  },
  {
    keywords: ['region', 'regions', 'geography', 'data residency'],
    explanation:
      'A region is a set of one or more Azure datacenters deployed within a specific geographic area, such as "South Africa North". Each region has its own power and network, and is paired with another nearby region (a region pair) for backup and replication. Choosing a region affects latency for your users, which services are available, and where data is stored for compliance.',
    localExample:
      'Imagine two big markets in one country, one in Johannesburg and one in Cape Town. If you live in Durban, shopping in Johannesburg is quicker than flying to Cairo. Likewise, pick a region close to your users for speed, and rely on its pair (Cape Town) as a backup if the first one has trouble.',
    keyTerms: [
      { term: 'Region', meaning: 'One or more datacenters in a defined area, e.g. South Africa North.' },
      { term: 'Region pair', meaning: 'Two nearby regions paired for backup and replication, e.g. SA North + SA West.' },
      { term: 'Geography', meaning: 'A market area (e.g. Africa) containing one or more regions, for data residency.' },
    ],
    examTrap:
      'A region is not a country. Some countries have several regions, some have none. Region pairs are picked by Azure and are not always obvious on a map.',
    checkQuestion:
      'Your users are mostly in Lagos. Should you host in "West Europe" or a closer geography, and why?',
    outlineSection: 'Describe Azure regions and availability zones',
    socraticQuestion:
      'If data must stay inside a country by law, does picking the nearest region always satisfy that? What else do you need to check?',
    socraticFeedback:
      'Right — "nearest" is not the same as "inside the country". You must confirm the region is actually within the required geography for residency rules.',
  },
  {
    keywords: ['capex', 'opex', 'capital', 'operational', 'capex vs opex', 'cost model'],
    explanation:
      'CapEx is capital expenditure: big up-front spending on physical things you own, like buying servers. OpEx is operational expenditure: pay-as-you-go spending on services as you use them, like renting cloud capacity by the hour. Cloud shifts spending from CapEx to OpEx — you avoid a huge purchase and instead pay for what you consume each month.',
    localExample:
      'CapEx is buying a bakkie for your delivery business outright — a big payment now, yours forever, but it sits idle on weekends. OpEx is hiring a delivery bakkie per trip — you only pay when there is a delivery, and you can stop any time. The cloud is the per-trip model: pay for the compute you actually use.',
    keyTerms: [
      { term: 'CapEx', meaning: 'Up-front spend on assets you own and depreciate over time.' },
      { term: 'OpEx', meaning: 'Recurring spend on services as you consume them; no big up-front cost.' },
      { term: 'Pay-as-you-go', meaning: 'Cloud pricing where you are billed per hour/second of use.' },
    ],
    examTrap:
      'Cloud is not automatically cheaper. It converts CapEx to OpEx and can cut idle costs, but a badly sized cloud workload can cost MORE than owning the boxes.',
    checkQuestion:
      'You rent 10 cloud VMs for a 3-day event, then turn them off. Is that CapEx or OpEx, and why does it matter?',
    outlineSection: 'Describe CapEx vs OpEx and consumption-based pricing',
    socraticQuestion:
      'If you buy a generator, you pay a lot once but own it for years. If you buy grid power, you pay per unit. Which is CapEx and which is OpEx, and which is more like the cloud?',
    socraticFeedback:
      'Spot on — the generator is CapEx, grid power is OpEx. The cloud behaves like grid power: you pay only while you consume.',
  },
  {
    keywords: ['azure policy', 'policy', 'policies', 'governance', 'compliance'],
    explanation:
      'Azure Policy is a service that enforces rules over your Azure resources so they stay compliant with your standards. You write policies like "all storage accounts must use HTTPS" or "no resources in this region", and Policy checks new and existing resources, blocking non-compliant ones or flagging them. It is about preventing bad configuration, not just detecting it.',
    localExample:
      'Like a school rule that says "no cellphones in class". The rule is posted, and teachers (Policy) check at the door. A student with a phone is stopped before they enter. Azure Policy does the same at the "door" of your subscription: a resource that breaks a rule is blocked before it is created.',
    keyTerms: [
      { term: 'Policy definition', meaning: 'The rule itself, written as a JSON condition on resources.' },
      { term: 'Assignment', meaning: 'Applying a definition to a scope like a subscription or resource group.' },
      { term: 'Initiative', meaning: 'A bundle of related policy definitions applied together.' },
    ],
    examTrap:
      'Azure Policy prevents and enforces. Azure Blueprints bundles policies, roles, and templates for repeatable environments. They are partners, not rivals — do not confuse them.',
    checkQuestion:
      'A team tries to create a storage account without HTTPS. Azure Policy blocks it. Is that prevention or just detection?',
    outlineSection: 'Describe Azure governance features and compliance',
    socraticQuestion:
      'If a rule only reports violations but never blocks them, can someone still create a non-compliant resource? What would change that?',
    socraticFeedback:
      'Correct — report-only rules let bad resources through. Adding a "deny" effect turns Policy into a real gatekeeper that stops the creation at the door.',
  },
  {
    keywords: ['resource group', 'resource groups', 'rg', 'group resources'],
    explanation:
      'A resource group is a container that holds related Azure resources for a solution, like its VMs, databases, and networks. Every resource lives in exactly one resource group, and the group gives it a lifecycle: you can deploy, update, and delete the whole solution together, see its total cost, and apply access rules at the group level. Resources in a group do not have to be in the same region.',
    localExample:
      'Think of a resource group as a labelled box in your storeroom. Everything for the "payroll project" goes in one box: the server, the database, the network cable. When the project ends, you carry the whole box out at once instead of hunting for parts across the room.',
    keyTerms: [
      { term: 'Resource', meaning: 'A single Azure thing you create, like a VM, database, or storage account.' },
      { term: 'Resource group', meaning: 'A logical container that holds related resources and their lifecycle.' },
      { term: 'Lifecycle', meaning: 'Resources in a group are created, updated, and deleted together.' },
    ],
    examTrap:
      'A resource group is a logical container, not a network boundary, and resources inside can live in different regions. Do not assume it isolates traffic or forces one location.',
    checkQuestion:
      'You delete a resource group. What happens to the resources inside it, and can they survive somewhere else?',
    outlineSection: 'Describe Azure resources and resource groups',
    socraticQuestion:
      'If you had to throw out one whole project at once, would you rather dig through a mixed drawer or grab a single labelled box? Why?',
    socraticFeedback:
      'Exactly — the labelled box (the resource group) lets you act on the whole project in one move. That shared lifecycle is the whole point of grouping resources.',
  },
  {
    keywords: ['cost management', 'cost', 'budget', 'pricing', 'spend', 'billing'],
    explanation:
      'Azure Cost Management is a free set of tools to see, plan, and control your cloud spending. You can view spending by resource, tag, or subscription; set budgets with alerts; and export reports for analysis. The goal is no surprises: you see where money goes, get warned before you overspend, and can act early by resizing or switching off unused resources.',
    localExample:
      'Like the prepaid electricity meter in many homes. You can see the units dropping, set a warning when you hit 10, and buy more before the power cuts. Cost Management does the same for cloud spend: a live meter, a budget alarm, and a chance to act before the bill lands.',
    keyTerms: [
      { term: 'Budget', meaning: 'A spending limit you set, with alerts when you reach a percentage of it.' },
      { term: 'Tags', meaning: 'Key-value labels that let you group and report cost by team, project, or env.' },
      { term: 'Pricing calculator', meaning: 'A tool to estimate costs before you deploy a resource.' },
    ],
    examTrap:
      'Cost Management shows and warns about spend, but it does not stop you from overspending on its own. A budget is an alarm, not a hard cap — you still need to act on the alert.',
    checkQuestion:
      'You set a budget of $500 with an alert at 80%. What happens at $400 — and what does NOT happen automatically?',
    outlineSection: 'Describe cost management in Azure',
    socraticQuestion:
      'If your meter only buzzes when you overspend but never turns off the tap, what would you still have to do yourself to actually save money?',
    socraticFeedback:
      'Right — the alert tells you, but you must close the tap: resize, stop, or delete resources. Cost Management warns; people act.',
  },
];

const GENERIC: MockEntry = {
  keywords: [],
  explanation:
    'Good question. In the Azure Fundamentals (AZ-900) world, this usually connects to one of the core ideas: cloud service models (IaaS, PaaS, SaaS), shared responsibility, scalability and elasticity, high availability, regions and zones, or cost management. Try one of the suggested topics to see a full beginner-friendly explanation with a local example.',
  localExample:
    'As an everyday analogy: the cloud is like renting instead of buying. You pay for what you use, someone else maintains the building, and you can move or grow quickly without a big up-front cost.',
  keyTerms: [
    { term: 'Cloud model', meaning: 'Public, private, or hybrid — how cloud resources are owned and accessed.' },
    { term: 'Consumption-based', meaning: 'You pay only for what you use, measured per second or per transaction.' },
  ],
  examTrap:
    'On the AZ-900 exam, most "which is better" questions have the answer that depends on the requirement. Avoid absolutes like "always cheaper" or "always more secure".',
  checkQuestion:
    'Can you name one Azure concept this question reminds you of, and say it back in your own words?',
  outlineSection: 'Describe core Azure concepts',
  socraticQuestion:
    'Before I explain, what do you already think this means? Take a guess, and I will help you refine it.',
  socraticFeedback:
    'Nice attempt. Now connect it to a concrete example — how would someone use this idea in a real day?',
};

function pickEntry(message: string): MockEntry {
  const lower = message.toLowerCase();
  let best: MockEntry | null = null;
  let bestScore = 0;
  for (const entry of ENTRIES) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) score += kw.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return best ?? GENERIC;
}

function buildReply(entry: MockEntry, req: BuddyRequest): BuddyReply {
  const isLocalLang = req.language !== 'en';
  const socraticActive = req.mode === 'socratic';
  const hadPriorAssistant = req.history.some((t) => t.role === 'assistant');

  let explanation = entry.explanation;
  if (req.mode === 'local') {
    explanation = `${entry.explanation}\n\nLocal example: ${entry.localExample}`;
  } else if (req.mode === 'exam') {
    explanation = `${entry.explanation}\n\nExam tip: ${entry.examTrap}`;
  } else if (socraticActive) {
    explanation = hadPriorAssistant
      ? `${entry.socraticFeedback}\n\nFollow-up: ${entry.socraticQuestion}`
      : entry.socraticQuestion;
  }

  if (isLocalLang) {
    explanation = `(Mock mode: translations are only available with the real API)\n\n${explanation}`;
  }

  const showStructured = !socraticActive;

  return {
    conversationId: req.conversationId ?? MOCK_CONVERSATION_ID,
    mode: req.mode,
    explanation,
    localExample: showStructured ? entry.localExample : null,
    keyTerms: showStructured ? entry.keyTerms : [],
    examTrap: showStructured ? entry.examTrap : null,
    checkQuestion: showStructured ? entry.checkQuestion : null,
    outlineSection: showStructured ? entry.outlineSection : null,
    cached: false,
  };
}

export async function mockSendBuddyMessage(req: BuddyRequest): Promise<BuddyReply> {
  if (req.message.trim() === '/mock429') {
    throw {
      code: 'RATE_LIMITED' as const,
      message: 'Slow down a little, try again in a moment.',
      retryAfterSeconds: 10,
    };
  }

  await new Promise((r) => setTimeout(r, 800 + Math.random() * 200));

  const entry = pickEntry(req.message);
  return buildReply(entry, req);
}
