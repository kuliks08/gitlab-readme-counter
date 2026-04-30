export type ProjectMini = { star_count?: number };

export function totalStars(projects: ProjectMini[]): number {
  let sum = 0;
  for (const p of projects) {
    const c = p.star_count;
    if (typeof c === "number" && Number.isFinite(c)) {
      sum += c;
    }
  }
  return sum;
}
