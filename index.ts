import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID")!;
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY")!;

const messages: Record<string, string> = {
  like:    "liked your post",
  fire:    "reacted to your post",
  follow:  "started following you",
  repost:  "reposted your post",
  comment: "replied to your post",
  mention: "mentioned you in a post",
};

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record?.user_id || !record?.type) {
      return new Response("missing fields", { status: 400 });
    }

    const notifText = messages[record.type] ?? "sent you a notification";
    const targetUrl = record.post_id
      ? `https://flowapp.net/#/post/${record.post_id}`
      : `https://flowapp.net/#/notifications`;

    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [record.user_id],
        contents: { en: notifText },
        headings: { en: "Flow" },
        url: targetUrl,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
});