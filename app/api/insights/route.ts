import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { storeData } = await request.json();

    const anthropic = new Anthropic({
      apiKey: process.env.NEXT_ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an eBay seller AI. Analyse this data and return exactly 3 insights as a JSON array. No other text. Format: [{"icon":"emoji","title":"title","body":"one sentence","action":"label"}]. Data: ${JSON.stringify(storeData)}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "bad response" }, { status: 500 });
    }

    const insights = JSON.parse(content.text);
    return NextResponse.json({ insights });

  } catch (error: any) {
    console.error("Insights error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
