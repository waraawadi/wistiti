export function getTitleShimmerParts(title: string): { lead: string; shimmer: string } {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { lead: "", shimmer: "" };
  }
  if (parts.length === 1) {
    return { lead: "", shimmer: parts[0] };
  }
  if (parts.length === 2) {
    return { lead: `${parts[0]} `, shimmer: parts[1] };
  }
  const leadParts = parts.slice(0, -2);
  const shimmerParts = parts.slice(-2);
  return { lead: `${leadParts.join(" ")} `, shimmer: shimmerParts.join(" ") };
}

export function MarketingShimmerTitle({ title }: { title: string }) {
  const { lead, shimmer } = getTitleShimmerParts(title);
  return (
    <>
      {lead ? lead : null}
      <span className="marketing-shimmer-text">{shimmer}</span>
    </>
  );
}
