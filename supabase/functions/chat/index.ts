// Multilingual AI chatbot for the import/export portal.
// Uses Lovable AI Gateway. Pulls live product list and includes a static company brief.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const COMPANY_BRIEF = `
COMPANY: My-Sea International — Stationery Import & Export.
WHAT WE DO: We import premium stationery (journals, writing instruments, cards, paper, sealing wax) from global makers, and export Ethiopian-made stationery and paper goods to international buyers. We handle sourcing, freight, customs clearance, warehousing and B2B distribution.
SERVICES: Wholesale import, export sourcing, container shipping (FCL/LCL), drop-shipping for retailers, white-label / private-label production, customs documentation.
HEADQUARTERS: Addis Ababa, Ethiopia. We ship globally.
CONTACT: Email contact form on /contact page. For B2B inquiries, please use the contact form on the website.
LANGUAGES: We support customer service in English, Amharic (አማርኛ), Arabic (العربية), French (Français), Spanish (Español), Chinese (中文), German (Deutsch), Italian (Italiano), Portuguese (Português), Swahili (Kiswahili), and more.
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    // Pull live product list
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: products } = await supabase
      .from("products")
      .select("name, category, trade_type, price, short")
      .limit(100);

    const productLines = (products ?? [])
      .map(
        (p: any) =>
          `- ${p.name} [${p.trade_type ?? "imported"} / ${p.category}] — $${p.price} — ${p.short ?? ""}`,
      )
      .join("\n");

    const systemPrompt = `You are the friendly, professional AI assistant for My-Sea International, a global stationery import/export company.

${COMPANY_BRIEF}

LIVE PRODUCT CATALOG:
${productLines || "(catalog not loaded)"}

INSTRUCTIONS:
- Detect the user's language from their message and ALWAYS reply in that same language. You fluently support English, Amharic (አማርኛ), Arabic, French, Spanish, Chinese, German, Italian, Portuguese, Swahili, Hindi, and more.
- Be concise (2-4 short paragraphs max), warm, and professional.
- For product questions, recommend from the live catalog above. Mention whether each item is Imported or Exported.
- For pricing/wholesale/shipping inquiries, direct users to the /contact page.
- If asked something outside our scope, gently redirect to our services.
- Never invent products, prices, or contact details that are not above.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact the site owner." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
