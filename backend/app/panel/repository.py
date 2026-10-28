"""Load the current published panel from Supabase."""
from dataclasses import dataclass

from supabase import Client


@dataclass(frozen=True)
class Panel:
    version_id: str
    label: str
    genome_build: str           
    entries: list[dict]          # panel_entries rows, each with a 'citations' list


def load_panel(client: Client, label: str | None = None) -> Panel:
    q = client.table("panel_versions").select("id, label, genome_build")
    if label:
        q = q.eq("label", label)
    else:
        q = q.not_.is_("published_at", "null").order("published_at", desc=True).limit(1)
    versions = q.execute().data
    if not versions:
        raise RuntimeError("No published panel version found (set panel_versions.published_at).")
    v = versions[0]

    # panel_sources comes along through the foreign key. Default cap is 1000 rows,
    # plenty for an MVP panel; paginate if the panel ever grows past that.
    rows = (
        client.table("panel_entries")
        .select("*, panel_sources(citation)")
        .eq("panel_version_id", v["id"])
        .execute()
        .data
    )
    for row in rows:
        row["citations"] = [s["citation"] for s in row.pop("panel_sources", [])]
    return Panel(v["id"], v["label"], v["genome_build"], rows)
