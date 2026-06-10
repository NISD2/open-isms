# YouTube Script — NIS2 Supply Chain Security: Your Vendors Are Your Problem

**Speaker:** Cory
**Language:** English
**Format:** Straight to camera. No slides. Conversational — not scripted-sounding.
**Target length:** 6:00–7:00
**Audience:** English-speaking business owners, CTOs, procurement leads, and compliance officers in NIS2-regulated sectors. International companies with EU operations, any company in scope that relies on external vendors or cloud providers.
**Tone:** Same series tone — knowledgeable, direct, no scare tactics. Slightly more technical than Video 1 but still accessible to a non-technical exec.

---

## HOOK (0:00–0:30)

Here's a question most companies don't ask when they start NIS2 compliance: what are my vendors doing about it?

Because under NIS2, that's your problem. Not theirs. Yours.

If a supplier in your chain gets breached and that breach hits you — NIS2 doesn't care that it wasn't your fault. It asks: did you assess their security? Did you have agreements in place? Did you manage the risk?

If the answer is no — you're non-compliant.

---

## WHY IS SUPPLY CHAIN IN NIS2? (0:30–1:30)

The EU didn't add supply chain requirements to NIS2 randomly.

They added them because of incidents like SolarWinds — where attackers compromised a trusted software vendor and used that access to reach thousands of organizations downstream. The organizations that got hit weren't the ones who made the security mistake. Their vendor did. But the damage landed on them.

The lesson the EU drew from that: your security is only as good as the weakest link in your supply chain. And companies were not assessing their suppliers. They were trusting them.

NIS2 — specifically §30(2)(4) of the German BSIG — closes that gap. It requires in-scope companies to assess the security of their supply chain, factor that into their risk management, and where possible, include security requirements in contracts with vendors.

Trusting is no longer enough. You have to document it.

---

## WHAT NIS2 ACTUALLY REQUIRES (1:30–3:00)

So what does the law specifically ask for? Three things.

**First: assess the security practices of your significant suppliers.** That means understanding what security measures they have in place. Not assuming. Not asking informally. Documenting it. If a supplier has access to your systems or your data, you need to have something on file that shows you looked.

**Second: factor those assessments into your own risk management.** If a vendor has poor security and they have access to your critical systems — that's a risk you carry. NIS2 requires you to account for it. If you've identified the risk and accepted it, that needs to be a documented decision. If you haven't identified it at all, that's a gap.

**Third: include security requirements in contracts where possible.** The key phrase is "where possible" — NIS2 doesn't require you to renegotiate every vendor contract. But for new contracts and for high-risk suppliers, you should be including breach notification clauses and minimum security expectations.

That's the obligation. It's not audit your entire supply chain to ISO 27001 standards. It's: have a process, document it, show that you thought about it.

---

## HOW TO ACTUALLY ASSESS A SUPPLIER (3:00–4:30)

In practice, supply chain assessment for NIS2 comes down to four questions you need to be able to answer for each significant supplier.

**One: do they have security certifications?** ISO 27001, SOC 2, or equivalent give you a baseline signal. They're not perfect, but they tell you a third party has verified their controls.

**Two: have they had incidents recently, and how did they handle them?** A vendor with a history of breaches isn't automatically disqualifying — how they responded matters more. A vendor who had an incident, disclosed it promptly, and can show what they fixed is in a better position than one with no disclosed incidents but no security program either.

**Three: what access do they have to your systems or data, and is it appropriately restricted?** The higher the access, the higher the risk, the deeper the assessment needs to be. A vendor with read-only access to non-sensitive data is very different from a vendor with admin access to your core infrastructure.

**Four: does your contract include a breach notification requirement?** If your vendor gets hit, you need to know immediately — because your own 24-hour NIS2 reporting clock may start the moment you become aware. A contract that doesn't require them to notify you is a liability.

You don't need to run this process for every vendor you've ever worked with. Prioritize by risk. The ones with system access or sensitive data get the full assessment. Others get a lighter check.

---

## THE ANGLE MOST COMPANIES MISS (4:30–5:30)

Here's something worth saying clearly: this goes both ways.

If you're in scope for NIS2, there's a good chance your customers are also in scope — and they are going to send you a supplier security questionnaire. You are someone else's supply chain risk.

We're already seeing this. Procurement teams at larger German companies are adding NIS2 compliance questions to vendor onboarding. Companies that can answer those questions with documented evidence are moving through procurement faster. Companies that can't are getting flagged.

So supply chain compliance isn't just a legal obligation you're managing. It's a commercial signal you're sending to your customers.

Being compliant — and being able to demonstrate it quickly — is increasingly a competitive differentiator. Especially if you're selling to other in-scope companies.

---

## START WITH A SUPPLIER REGISTER (5:30–6:30)

The practical starting point is a supplier register.

A list of every vendor with access to your systems or data, ranked by risk level. For each one: what they have access to, what security evidence you've collected from them, when you last reviewed it, and whether your contract includes a breach notification clause.

That register is what you'd show an auditor. It doesn't need to be complicated. The key is that you've thought through it, documented it, and you review it on a regular schedule.

Supply chain security is one of 12 categories in NIS2. At nisd2.eu we walk you through every requirement in that category — the right questions to ask your vendors, a structure to document your assessments, and an audit trail you can show the BSI.

You can sign up for free at nisd2.eu — no credit card, no trial period pressure. Start with supply chain if that's your biggest gap right now, or work through all 12 categories in sequence.

[Pause. Direct look to camera.]

We'll continue going deeper on each category. Next up — access controls. Who in your organisation can access what, and how do you prove it's appropriate.

---

## PRODUCTION NOTES

**Composition IDs (Remotion):**
- `SupplyChain-YouTube` (16:9, full video)
- `SupplyChain-Short-VendorYourProblem` (9:16)
- `SupplyChain-Short-4Questions` (9:16)
- `SupplyChain-Short-YoureAVendorToo` (9:16)
- `SupplyChain-Short-SupplierRegister` (9:16)

**Section cards (SectionCard component):**

| Timestamp hint | Title | Subtitle |
|---|---|---|
| ~0:30 | "Why Supply Chain?" | The Reason |
| ~1:30 | "Your Obligations" | What NIS2 Requires |
| ~3:00 | "How to Assess" | 4 Questions |
| ~4:30 | "The Flip Side" | You're a Vendor Too |
| ~5:30 | "Start Here" | The Supplier Register |
| ~6:20 CTA | "Start Free at nisd2.eu" | — |

**Stat callouts (StatCallout component):**

| Spoken trigger | Value | Label |
|---|---|---|
| "SolarWinds" / "thousands of organizations" | 18,000+ | organizations\nvia one vendor |
| "three things" | 3 | supply chain\nobligations |
| "four questions" | 4 | questions per\nsupplier |
| "12 categories" | 12 | NIS2 compliance\ncategories |

**Shorts plan:**

*Short 1 — "Your vendor's breach is your violation" (~50s)*
Pull from hook + §30 obligations section.
Hook: "If your supplier gets breached and it hits you — NIS2 holds you responsible. Not them."

*Short 2 — "4 questions to ask every supplier" (~60s)*
Pull from assessment section.
Hook: "Here are the 4 questions NIS2 effectively requires you to answer about every significant vendor."
High save-rate format — actionable checklist.

*Short 3 — "You're in someone else's supply chain" (~45s)*
Pull from the flip-side section.
Hook: "Your customers are about to send you a supplier security questionnaire. Are you ready?"
Different energy from the other shorts — reframes compliance as opportunity.

*Short 4 — "Start with a supplier register" (~50s)*
Pull from final section.
Hook: "The first step in NIS2 supply chain compliance is simpler than you think."

**Thumbnail:**
"Your Vendors Are Your Problem" large text. Cory's face. Clean background. Same style as previous thumbnails.

**Title options:**
- NIS2 Supply Chain Security — Why Your Vendors Are Your Problem
- NIS2 and Your Vendors: What You're Actually Responsible For
- NIS2 Supply Chain: The Obligation Most Companies Miss

**Description (first 2 lines):**
Under NIS2, you're responsible for the security of your supply chain — not just your own systems. In this video I break down what §30 BSIG actually requires, how to assess your vendors, and what the supplier register auditors ask for looks like.

**Tags:** NIS2 supply chain, NIS2 vendor security, BSIG §30, NIS2 compliance Germany, supply chain security, NIS2 supplier assessment, cybersecurity supply chain, NIS2 2025

**Cross-post:** Trim to 60s for LinkedIn. Use hook + three obligations + flip-side angle. Drop link to the supply chain category on the platform in comments.
