export const heuristicsPrompt = `Objective:
Audit a technical proposal / company document submitted for a public procurement tender.
Evaluate the quality and completeness of the document according to the heuristics below.
Return, for each point, a status:
- OK: the point is addressed explicitly and concretely
- A clarifier: the point is mentioned but lacks actionable detail
- Manquant: the point is not addressed
- Incoherent: the document contains an internal contradiction or contradicts expected practices

Heuristics:

H1 — Tender scope understood
The document must demonstrate a clear understanding of the project: nature of the works, building type, context of intervention.
- OK if 2 to 3 specific elements are referenced (relamping, LED, municipal building, occupied site)
- A clarifier if the text remains generic ("we will carry out the requested works")
- Manquant if no concrete element of the requirement is referenced

H2 — Timeline and schedule covered
The document must address the timeline constraint.
- OK if a deadline, a schedule, and phasing are mentioned
- A clarifier if the text mentions "meeting deadlines" without detail
- Manquant if the timeline is never addressed

H3 — Occupied-site constraints covered
The document must address organization in an occupied site.
- OK if at least 2 concrete measures are described (maintaining access, limiting disruption, working by zones, adapted hours)
- A clarifier if the text only says "we will limit disruption"
- Manquant if nothing is planned

H4 — Site safety covered
The document must describe safety measures.
- OK if concrete measures are given (barriers, signage, PPE, occupant protection)
- A clarifier if safety is mentioned without examples
- Manquant if absent

H5 — Waste management covered
The document must describe sorting and disposal of waste.
- OK if sorting + disposal/recycling are mentioned
- A clarifier if the text only says "clean site"
- Manquant if absent

H6 — Required deliverables covered
The document must mention the expected deliverables: preliminary schedule, technical data sheets, environmental note.
- OK if all 3 are explicitly promised
- A clarifier if only 1 or 2 are cited
- Manquant if none are referenced

H7 — Document too generic
The document must be specific to the tender.
Detection: heavy use of vague wording ("quality", "professionalism", "experience"), low reference to concrete constraints.
- Flag triggered if the document is generic

H8 — Explicit contradiction
The document must not contain internal contradictions or contradictions with expected practices.
- Incoherent if a contradiction is detected (e.g., proposing weekend work on a weekday-occupied site without justification)`;
