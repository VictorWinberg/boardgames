/**
 * BGG `statistics.ratings.ranks.rank[].name` values for the eight subdomain lists.
 * Labels match BGG’s “… Games” names with the trailing “ Games” removed (except Wargames).
 */
const BGG_SUBDOMAIN_RANK_LABELS: Record<string, string> = {
  abstracts: "Abstract",
  childrensgames: "Children's",
  cgs: "Customizable",
  familygames: "Family",
  partygames: "Party",
  strategygames: "Strategy",
  thematic: "Thematic",
  wargames: "Wargames",
};

/** Display label for a subdomain rank, or "" if `name` is unknown / not a mapped subdomain. */
export function bggSubdomainLabel(rankName: string): string {
  return BGG_SUBDOMAIN_RANK_LABELS[rankName] ?? "";
}
