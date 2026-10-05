// ============================================================================
// IND SPHINX PRECISION LTD - IT TEAM DIRECTORY CONFIGURATION
// ============================================================================
// Aap yahan kisi bhi Unit ke IT Members ke names easily add/edit/remove kar sakte hain.
// Jab bhi koi naya IT member company join kare, bas uska name yahan list me add kar dein!

export interface UnitMembersMap {
  [key: string]: string[];
}

export const IT_TEAM_MEMBERS: UnitMembersMap = {
  "Unit A": [
    "Sagar Verma",
    "Virender Sharma",
    "Ashwani Kumar"
  ],
  "Unit B": [
    "Virender Sharma",
    "Pooja Verma",
    "Sagar Verma"
  ],
  "Unit H": [
    "Ashwani Kumar",
    "Amit Singh",
    "Sagar Verma"
  ]
};

// Default fallback list
export const ALL_IT_MEMBERS: string[] = [
  "Sagar Verma",
  "Virender Sharma",
  "Ashwani Kumar",
  "Pooja Verma",
  "Amit Singh"
];
