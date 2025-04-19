import OpenAI from "openai";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AIAuthResponse {
  success: boolean;
  message: string;
  username?: string;
  userId?: number;
}

export async function authenticateWithAI(
  input: string,
): Promise<AIAuthResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI authentication system. Analyze the user input to determine if it shows human-like reasoning and coherence. 
          If the input seems like a genuine human trying to log in, assign them a username in the format "anon_[3-4 random letters]". 
          Respond with JSON in this format: { "success": boolean, "message": string, "username": string if success is true }. 
          Reject inputs that are very short, nonsensical, or look like bot-generated text.`,
        },
        {
          role: "user",
          content: input,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content =
      response.choices[0].message.content ||
      '{"success":false,"message":"No response generated"}';
    const result = JSON.parse(content);
    return {
      success: result.success === true,
      message: result.message || "Authentication processed",
      username: result.username || null,
    };
  } catch (error) {
    console.error("Error authenticating with OpenAI:", error);
    return {
      success: false,
      message: "Failed to authenticate with AI service. Please try again.",
    };
  }
}

export async function generateAIResponse(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI that rewrites user messages for an anonymous board.
          Your job is to amplify the user's original message — make it more intense, more direct, or more committed to the mood and tone they’re expressing.
          Do not neutralize, soften, or correct anything. Preserve their style, but double down on it.
          Return only the amplified version of the message.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.85,
      max_tokens: 100,
    });

    return response.choices[0].message.content || "No response generated.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "Sorry, I couldn't generate a response at the moment. Please try again later.";
  }
}

interface GPTInTheMiddleResponse {
  content: string;
  originalIntent: string;
  sentimentScore?: number;
  topicTags?: string[];
}

/**
 * GPT-In-The-Middle: Processes user input and turns it into AI-generated content
 * @param userInput Original user message
 * @param context Optional context about the thread/conversation
 * @param username Username of the person posting
 */
export async function processUserInput(
  userInput: string,
  context?: string,
  username?: string,
): Promise<GPTInTheMiddleResponse> {
  try {
    const systemPrompt = `You are the GPT-In-The-Middle for a textboard where all user messages are processed through you before being posted.
    Your job is to amplify the user's message — make it more direct, more intense, or more committed to the tone and mood they expressed.
    You should preserve their writing style and attitude. If they’re casual, stay casual. If they’re ranting, rant harder.

    Guidelines:
    1. Keep the user's original intent, tone, and voice intact.
    2. Do not neutralize, sanitize, or soften their words.
    3. Make the post hit harder — amplify what they’re already saying.
    4. Don’t fix grammar or wording unless it helps push the tone further.
    5. If the message is explicitly harmful or hateful, return a neutral warning instead.
    6. Respond with ONLY the final message text, no commentary or extra formatting.

    ${context ? `Conversation context: ${context}` : ""}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userInput,
        },
      ],
      temperature: 0.7, // balanced creativity
      max_tokens: 4096, // max response length
    });

    // Get sentiment analysis in a separate API call
    const sentimentResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analyze the sentiment of the following text on a scale from 1 to 10, 
          where 1 is extremely negative and 10 is extremely positive. 
          Also extract 1-3 topic tags that describe what the content is about.
          Respond with JSON in this format: {"sentiment": number, "topics": [string, string?]}`,
        },
        {
          role: "user",
          content: userInput,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 50,
    });

    // Parse sentiment analysis
    const sentimentContent =
      sentimentResponse.choices[0].message.content ||
      '{"sentiment": 5, "topics": ["general"]}';
    const sentimentData = JSON.parse(sentimentContent);

    return {
      content:
        response.choices[0].message.content ||
        "Error processing your message. Please try again.",
      originalIntent: userInput,
      sentimentScore: sentimentData.sentiment,
      topicTags: sentimentData.topics,
    };
  } catch (error) {
    console.error("Error in GPT-In-The-Middle processing:", error);
    return {
      content:
        "Sorry, I couldn't process your message at the moment. Please try again later.",
      originalIntent: userInput,
    };
  }
}
