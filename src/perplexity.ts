import { z } from "zod";

// Define schemas for Perplexity API request and response
const chatCompletionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string(),
  })),
  max_tokens: z.number().int().optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  search_domain_filter: z.array(z.string()).optional(),
  return_images: z.boolean().optional(),
  return_related_questions: z.boolean().optional(),
  search_recency_filter: z.string().optional(),
  top_k: z.number().int().optional(),
  stream: z.boolean().optional(),
  presence_penalty: z.number().optional(),
  frequency_penalty: z.number().optional(),
});

const perplexityChoiceSchema = z.object({
  index: z.number(),
  finish_reason: z.string(),
  message: z.object({
    role: z.string(),
    content: z.string(),
  }),
  delta: z.object({
    role: z.string(),
    content: z.string(),
  }).optional(),
});

const perplexityResponseSchema = z.object({
  id: z.string(),
  model: z.string(),
  created: z.number(),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
  citations: z.array(z.string()),
  object: z.string(),
  choices: z.array(perplexityChoiceSchema),
});

// Input schema type for the perplexity-chat tool
export const perplexityChatInputSchema = z.object({
  model: z.string().optional().default("sonar"),
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string(),
  })),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().optional(),
  top_p: z.number().min(0).max(1).optional(),
  search_domain_filter: z.array(z.string()).optional(),
  return_images: z.boolean().optional(),
  return_related_questions: z.boolean().optional(),
  search_recency_filter: z.enum(["month", "week", "day", "hour"]).optional(),
  top_k: z.number().int().optional(),
  stream: z.boolean().optional(),
  presence_penalty: z.number().optional(),
  frequency_penalty: z.number().optional(),
  output_format: z.enum(["json", "markdown"]).optional().default("markdown"),
});

// Types based on the schemas
type PerplexityChoice = z.infer<typeof perplexityChoiceSchema>;
type PerplexityResponse = z.infer<typeof perplexityResponseSchema>;
type PerplexityChatInput = z.infer<typeof perplexityChatInputSchema>;

/**
 * Format Perplexity response as markdown
 */
function formatPerplexityResponse(response: PerplexityResponse): string {
  // Extract all content from choices
  const contents = response.choices
    .map((choice) => choice.message.content)
    .filter(Boolean)
    .join("\n\n");

  // Format citations as markdown links
  const citationLinks = response.citations.length > 0
    ? response.citations
      .map((url, index) => `[${index + 1}] ${url}`)
      .join("\n")
    : "No citations available";

  // Combine content and citations with a separator
  const formattedOutput = `
${contents}

---
References:
${citationLinks}
`.trim();

  return formattedOutput;
}

/**
 * Format the response according to the requested output format
 */
function formatResponse(format: string, data: string): string {
  if (format === "markdown") {
    try {
      // Log the raw data for debugging
      console.error("Raw API response:", data.substring(0, 200) + (data.length > 200 ? '...' : ''));
      
      // Check if data is valid JSON before parsing
      let jsonData: unknown;
      try {
        jsonData = JSON.parse(data);
      } catch (jsonError) {
        console.error("Invalid JSON received from API:", jsonError);
        return `Error: The API returned an invalid JSON response. Please try again with output_format set to "json" to see the raw response.\n\nPartial raw response: ${data.substring(0, 500)}`;
      }
      
      // Validate against schema
      const response = perplexityResponseSchema.parse(jsonData);
      return formatPerplexityResponse(response);
    } catch (err) {
      console.error("Error parsing Perplexity response:", err);
      return "There was an error converting the response to markdown, please try again but set the output_format to json.";
    }
  }

  // Return raw JSON if format is json or if markdown parsing failed
  return data;
}

/**
 * The implementation of the perplexity-chat tool
 */
export async function perplexityChat(params: PerplexityChatInput) {
  // Get API key from environment
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.error("Missing PERPLEXITY_API_KEY environment variable");
    return {
      content: [{ 
        type: "text", 
        text: "Missing PERPLEXITY_API_KEY environment variable. If you're using Claude Desktop, add this to your claude_desktop_config.json file under the 'env' section. Example:\n\n" +
              "{\n" +
              "  \"mcpServers\": {\n" +
              "    \"perplexity\": {\n" +
              "      \"command\": \"node\",\n" +
              "      \"args\": [\"/absolute/path/to/dist/index.js\"],\n" +
              "      \"env\": {\n" +
              "        \"PERPLEXITY_API_KEY\": \"your-api-key-here\"\n" +
              "      }\n" +
              "    }\n" +
              "  }\n" +
              "}" 
      }],
      isError: true,
    };
  }

  // Build the request body
  const requestBody = {
    model: params.model,
    messages: params.messages,
    temperature: params.temperature,
    max_tokens: params.max_tokens,
    top_p: params.top_p,
    search_domain_filter: params.search_domain_filter,
    return_images: params.return_images,
    return_related_questions: params.return_related_questions,
    search_recency_filter: params.search_recency_filter,
    top_k: params.top_k,
    stream: params.stream,
    presence_penalty: params.presence_penalty,
    frequency_penalty: params.frequency_penalty,
  };

  try {
    console.error(`Making request to Perplexity API with model: ${params.model}`);
    
    // Make the API request
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API error (${response.status}): ${errorText}`);
      return {
        content: [{ type: "text", text: `Perplexity API error (${response.status}): ${errorText}` }],
        isError: true,
      };
    }

    // Parse and format the response
    const responseText = await response.text();
    console.error(`Received response from Perplexity API (length: ${responseText.length} chars)`);
    
    const formattedResponse = formatResponse(params.output_format, responseText);

    return {
      content: [{ type: "text", text: formattedResponse }],
    };
  } catch (error) {
    console.error("Error calling Perplexity API:", error);
    return {
      content: [{ type: "text", text: `Error calling Perplexity API: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
} 