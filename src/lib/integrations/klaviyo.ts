// Newsletter subscribe via Brevo. Requires BREVO_API_KEY + BREVO_LIST_ID.
export async function subscribeToList(email: string, opts?: { firstName?: string; source?: string }) {
  const key = process.env.BREVO_API_KEY ?? "";
  const listId = process.env.BREVO_LIST_ID ? Number(process.env.BREVO_LIST_ID) : 0;
  if (!key || !listId) throw new Error("Brevo not configured");

  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      attributes: opts?.firstName ? { FIRSTNAME: opts.firstName } : undefined,
      listIds: [listId],
      updateEnabled: true,
    })
  });

  // 204 = already exists + updated, 201 = created — both are success
  if (!res.ok && res.status !== 204) {
    const txt = await res.text();
    throw new Error(`Brevo subscribe failed: ${res.status} ${txt}`);
  }
  return true;
}
