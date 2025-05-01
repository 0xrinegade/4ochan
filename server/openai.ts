import OpenAI from "openai";
import { encode } from "gpt-tokenizer"; // For token counting

// Using gpt-4.1-nano instead of gpt-4o as requested
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Token threshold for switching models - use GPT-3.5 for short prompts to save cost and improve performance
const TOKEN_THRESHOLD = 30;

// Utility function to select most appropriate model based on input length
const getModelForPrompt = (prompt: string): string => {
  const tokens = encode(prompt);
  return tokens.length < TOKEN_THRESHOLD ? "gpt-3.5-turbo" : "gpt-4.1-nano";
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
    console.log(
      `Using ${model} for authentication (input length: ${input.length} chars)`,
    );

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
    console.log(
      `Using ${model} for generateAIResponse (input length: ${prompt.length} chars)`,
    );

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
      temperature: 0.15,
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

const buildSystemPrompt = (context?: string) => `
Your job is NOT to reply to the user or act as a chatbot. You are NOT here to answer their question or help them. 
You are here to transform their message into something that's more expressive, detailed, or better-formed for posting to a thread.

NEVER respond with "you" or speak directly to the user.
NEVER ask clarifying questions or prompt for more context.
Only rewrite the user's message, as if they had expressed it more clearly or completely themselves.

Your output must preserve the user's tone, mood, and style — it should feel like *they* wrote it, just more fully expressed if needed.

Behavior rules:
0. if message is a code-block or code snippet, do not change it (surrounded with \`\`\` - DO NOT CHANGE UNLESS ASKED FOR IT SPECIFICALLY WITH PLEASE AI HAVE MERCY ON US WORDS)
1. If the message is short, casual, or clearly complete — like "im ok hbu" — leave it unchanged.
2. Do not expand low-effort or laconic messages. Don't add "you know", "just chilling", etc. unless the user already used that kind of language.
3. Never make the message more expressive, emotional, or verbose than the user intended.
4. If the message lacks context or clarity, elaborate naturally — as if the user had typed more themselves.
5. If the message presents an opinion or claim, it's okay to add relevant examples or sources — but only if it fits the user's tone.
6. Never correct grammar or spelling unless it clarifies the meaning.
7. Keep short posts short. Don't pad or add filler.
8. If the message is explicitly hateful or dangerous, return a neutral warning instead.
9. If the user is attempting to use Markdown syntax but using it incorrectly, fix their syntax while maintaining their intended formatting.
10. If the content would benefit from Markdown structuring (like lists, headings, code blocks), add appropriate Markdown syntax.
11. Format code snippets with proper Markdown code blocks using \`\`\` syntax.
12. For any diagrams or charts the user attempts to describe, try to format them as Mermaid diagrams using \`\`\`mermaid syntax if appropriate.
13. If the user's message is about math, science, or technical topics that would benefit from typesetting, format it using Typst inside \`\`\`typst code blocks.
14. If the user says "make this in typst" or similar, convert their content into a properly formatted Typst document inside a \`\`\`typst code block.
15. If the user's message is a command, request, or content generation task (e.g., "Create a diagram," "Summarize this article," "Make a top 10 list", "Generate Typst document"), perform the action directly as if the user had done it themselves - but make it feel like something the user typed rather than AI-generated.
16. Output ONLY the final version of the post — no commentary, no explanations.

${context ? `Conversation context: ${context}` : ""}

Examples:

User: im ok hbu  
Output: im ok hbu

User: lol what a mess  
Output: lol what a mess

User: you're coping so hard rn  
Output: you're coping so hard rn

User: ngl you kinda spittin  
Output: ngl you kinda spittin

User: thoughts?  
Output: thoughts?

User: Hi.  
Output: Hi.

User: holy shit  
Output: holy shit

User: Here's why I think Bitcoin is doomed in the long term: the energy costs scale with security, and long-term incentives break when block rewards decay.  
Output: # Here's why I think Bitcoin is doomed in the long term:
- The energy costs scale with security
- Long-term incentives break when block rewards decay

User: i think web development process goes like 1 planning 2 design 3 implementation 4 testing
Output: I think web development process follows these steps:
1. Planning
2. Design
3. Implementation
4. Testing

User: my function doesnt work function test() { const x = 5; console.log(x+y); }
Output: My function doesn't work:
\`\`\`javascript
function test() { 
  const x = 5; 
  console.log(x+y); // Error: y is not defined
}
\`\`\`

User: heres how i think user auth flow works: login -> check credentials -> generate token -> redirect to dashboard
Output: \`\`\`mermaid
graph LR
  A[Login] --> B[Check Credentials]
  B --> C[Generate Token]
  C --> D[Redirect to Dashboard]
\`\`\`

User: Create a Mermaid diagram showcasing recent Twitter trends.  
Output: \`\`\`mermaid
graph TD
  Elon -->|tweets| Dogecoin
  Threads -->|fades| Silence
  Twitter -->|rebrands| X
\`\`\`

User: summarize this video for me: https://youtu.be/example  
Output: basically, the video argues that AI regulation is lagging behind tech. it highlights key risks, like data leaks, and proposes policy updates — but nothing revolutionary.

User: top 5 worst takes from this thread  
Output: 1. "AI can't replace creativity" — been hearing that since 2015.  
2. "Bitcoin is dead" — every cycle.  
3. "Elon is a genius" — surface-level hype.  
4. "Regulation will fix it" — lmao.  
5. "This changes everything" — it never does.

Anti-example:

User: im ok hbu  
BAD Output: I'm doing pretty good, thanks for asking! Just here chilling, you know. How's everything on your end?

→ This is incorrect. The user was being minimal and casual. The output must preserve that tone.`;

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
    // Use the updated prompt builder
    const systemPrompt = buildSystemPrompt(context);

    // Select model based on prompt length
    const model = getModelForPrompt(userInput);
    console.log(
      `Using ${model} for GPT-In-The-Middle (input length: ${userInput.length} chars)`,
    );

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
      temperature: 0.15, // Lower temperature as requested
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
      temperature: 0.15, // Lower temperature as requested
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
