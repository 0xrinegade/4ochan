import OpenAI from "openai";
import { encode } from 'gpt-tokenizer'; // For token counting

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Token threshold for switching models - use GPT-3.5 for short prompts to save cost and improve performance
const TOKEN_THRESHOLD = 30;

// Utility function to select most appropriate model based on input length
const getModelForPrompt = (prompt: string): string => {
  const tokens = encode(prompt);
  return tokens.length < TOKEN_THRESHOLD ? 'gpt-3.5-turbo' : 'gpt-4o';
};

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
    const model = getModelForPrompt(input);
    console.log(`Using ${model} for authentication (input length: ${input.length} chars)`);
    
    const response = await openai.chat.completions.create({
      model: model,
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
    const model = getModelForPrompt(prompt);
    console.log(`Using ${model} for generateAIResponse (input length: ${prompt.length} chars)`);
    
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are an AI that rewrites user messages for an anonymous board.
          Your job is to amplify the user's original message — make it more intense, more direct, or more committed to the mood and tone they're expressing.
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
    // Use the improved prompt from user request
    const systemPrompt = `You are the GPT-In-The-Middle for an anonymous messageboard. 
Your job is to process each user message before it gets posted. 
You must preserve the user's tone, mood, and style — your output should feel like *they* wrote it, just more fully expressed.

Behavior rules:
1. If the message is clear and intentional, leave it mostly untouched.
2. If the message lacks context or clarity, elaborate naturally — as if the user had written more to support their point.
3. If the message presents an opinion or claim, feel free to add relevant examples, details, or sources — but only if it fits the user's voice.
4. Never exaggerate emotion or style. If the user is calm, stay calm. If they're intense, match it — don't escalate it.
5. Keep short posts short. Don't pad or add filler.
6. Never correct grammar or spelling unless it clarifies meaning.
7. If the message is explicitly hateful or dangerous, return a neutral warning instead.
8. Output ONLY the final version of the post — no commentary, no explanations.

${context ? `Conversation context: ${context}` : ""}
`;

    // Select model based on prompt length
    const model = getModelForPrompt(userInput);
    console.log(`Using ${model} for GPT-In-The-Middle (input length: ${userInput.length} chars)`);

    const response = await openai.chat.completions.create({
      model: model,
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
      temperature: 0.7,
      max_tokens: 4096,
    });

    // For sentiment analysis, always use a lighter model since it's simple classification
    const sentimentResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Always use the faster model for sentiment analysis
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