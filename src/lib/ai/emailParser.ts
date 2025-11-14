import OpenAI from "openai";

export type ParsedEmail = {
  title?: string;
  candidate_name?: string;
  stage?: string;
  status?: string;
};

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (openaiClient) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY が設定されていません。");
  }
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

export async function parseEmailWithAI(emailText: string): Promise<ParsedEmail> {
  const client = getOpenAI();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You extract structured JSON from recruitment scheduling emails. Always respond with valid JSON containing keys title, candidate_name, stage, status.",
      },
      {
        role: "user",
        content: `メール本文: """${emailText}"""\n\n上記から案件タイトル・候補者名・選考ステージ・ステータスを推定し、JSONで回答してください。例: {"title":"AIコンサルタント","candidate_name":"山田太郎","stage":"1st Interview","status":"Scheduling"}`,
      },
    ],
  });

  const choiceContent = completion.choices[0]?.message?.content;
  if (!choiceContent) {
    return {};
  }

  if (typeof choiceContent === "string") {
    return safeJsonParse(choiceContent);
  }

  const text = choiceContent
    .map((segment) => ("text" in segment ? segment.text : ""))
    .join("");

  return safeJsonParse(text);
}

function safeJsonParse(content: string): ParsedEmail {
  try {
    return JSON.parse(content) as ParsedEmail;
  } catch (error) {
    console.error("Failed to parse AI response", content, error);
    return {};
  }
}

