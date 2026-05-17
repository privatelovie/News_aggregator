import type { ArticleSummary, ArticleSummaryInput } from "@/lib/ai/types";

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export async function summarizeArticleWithOpenAI({
  article,
  model
}: {
  article: ArticleSummaryInput;
  model: string;
}): Promise<ArticleSummary> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "developer",
          content:
            "You summarize news articles for a modern news app. Be accurate, neutral, concise, and avoid adding facts not present in the article. Return only valid structured JSON."
        },
        {
          role: "user",
          content: buildPrompt(article)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "article_summary",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              threeLineSummary: {
                type: "array",
                minItems: 3,
                maxItems: 3,
                items: { type: "string" }
              },
              explainSimply: { type: "string" },
              keyTakeaways: {
                type: "array",
                minItems: 3,
                maxItems: 5,
                items: { type: "string" }
              },
              whyThisMatters: { type: "string" }
            },
            required: [
              "threeLineSummary",
              "explainSimply",
              "keyTakeaways",
              "whyThisMatters"
            ]
          }
        }
      },
      max_output_tokens: 900
    })
  });

  const payload = (await response.json()) as OpenAIResponse;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ?? `OpenAI request failed with ${response.status}.`
    );
  }

  const outputText = payload.output_text ?? extractOutputText(payload);

  if (!outputText) {
    throw new Error("OpenAI returned an empty summary response.");
  }

  return parseSummary(outputText);
}

function buildPrompt(article: ArticleSummaryInput) {
  return [
    `Title: ${article.title}`,
    `Source: ${article.source ?? "Unknown"}`,
    `URL: ${article.url ?? "Not provided"}`,
    `Published: ${article.publishedAt ?? "Unknown"}`,
    `Existing summary: ${article.summary ?? "Not provided"}`,
    `Article content: ${trimArticleText(article.content ?? article.summary ?? "")}`
  ].join("\n\n");
}

function trimArticleText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 24000);
}

function parseSummary(value: string): ArticleSummary {
  const parsed = JSON.parse(value) as ArticleSummary;

  return {
    threeLineSummary: parsed.threeLineSummary.slice(0, 3),
    explainSimply: parsed.explainSimply,
    keyTakeaways: parsed.keyTakeaways.slice(0, 5),
    whyThisMatters: parsed.whyThisMatters
  };
}

function extractOutputText(payload: OpenAIResponse) {
  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n");
}
