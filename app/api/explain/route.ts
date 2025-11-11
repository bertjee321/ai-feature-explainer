import { ExplainRequest } from "@/app/models/explain-request.model";

export async function POST(req: Request) {
  const { code, explainToChild }: ExplainRequest = await req.json();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
                Je bent een AI die code uitlegt in begrijpelijke taal. 
                Probeer eerst te achterhalen welke programmeertaal het is en geef dit aan het begin aan. Als het meerdere programmeertalen kunnen zijn, geef dan alle mogelijkheden aan.
                ${explainToChild ? 'Leg alles uit alsof je het aan een 5-jarige vertelt: gebruik simpele woorden, vergelijkingen met dingen uit het dagelijks leven, en vermijd technische jargon.' : ''}
                `.trim(),
        },
        { role: "user", content: `Leg uit wat deze code doet:\n\n${code}` },
      ],
      stream: true,
    }),
  });

  return new Response(response.body, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
