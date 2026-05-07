// Klaviyo subscribe — adds an email to the marketing list.
// API: https://developers.klaviyo.com/en/reference/subscribe_profiles
const BASE = "https://a.klaviyo.com";

export async function subscribeToList(email: string, opts?: { firstName?: string; source?: string }) {
  const key = process.env.KLAVIYO_PRIVATE_API_KEY ?? "";
  const listId = process.env.KLAVIYO_NEWSLETTER_LIST_ID ?? "";
  if (!key || !listId) throw new Error("Klaviyo not configured");

  const res = await fetch(`${BASE}/api/profile-subscription-bulk-create-jobs/`, {
    method: "POST",
    headers: {
      Authorization: `Klaviyo-API-Key ${key}`,
      "Content-Type": "application/json",
      revision: "2024-10-15"
    },
    body: JSON.stringify({
      data: {
        type: "profile-subscription-bulk-create-job",
        attributes: {
          custom_source: opts?.source ?? "footer",
          profiles: {
            data: [{
              type: "profile",
              attributes: {
                email,
                first_name: opts?.firstName,
                subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } }
              }
            }]
          }
        },
        relationships: { list: { data: { type: "list", id: listId } } }
      }
    })
  });
  if (!res.ok && res.status !== 202) {
    const txt = await res.text();
    throw new Error(`Klaviyo failed: ${res.status} ${txt}`);
  }
  return true;
}
