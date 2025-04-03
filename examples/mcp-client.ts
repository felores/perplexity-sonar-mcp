import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import dotenv from "dotenv";

dotenv.config();

// Help text function
function printUsage() {
  console.log(`
Usage: node dist/examples/mcp-client.js [options]

Options:
  --model, -m         Specify the model to use (default: "llama-3.1-sonar-small-128k-online")
  --query, -q         The query to send to the model (default: "What is the capital of France?")
  --temperature, -t   Temperature parameter for model generation (0-2) (default: 0.7)
  --max-tokens, -mt   Maximum number of tokens to generate (default: 1000)
  --server, -s        Path to the server script (default: "dist/index.js")
  --help, -h          Show this help message
  
Examples:
  node dist/examples/mcp-client.js --model sonar --query "Tell me about quantum computing"
  node dist/examples/mcp-client.js -m sonar-pro -q "Explain neural networks" -t 0.9
`);
}

// Parse command line arguments into a more usable format
function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === "--help" || arg === "-h") {
      result.help = true;
      continue;
    }
    
    if (arg.startsWith("--") || arg.startsWith("-")) {
      const key = arg.replace(/^(-+)/, "").replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      
      // Check if the next item is a value or another flag
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        result[key] = args[i + 1];
        i++; // Skip the next item as we've processed it
      } else {
        result[key] = true;
      }
    }
  }
  
  return result;
}

async function main() {
  // Parse command line arguments
  const args = parseArgs(process.argv.slice(2));
  
  // Check if help was requested
  if (args.help) {
    printUsage();
    return;
  }
  
  // Get configuration with defaults
  const config = {
    model: (args.model || args.m || "llama-3.1-sonar-small-128k-online") as string,
    query: (args.query || args.q || "What is the capital of France?") as string,
    temperature: Number.parseFloat((args.temperature || args.t || "0.7") as string),
    maxTokens: Number.parseInt((args.maxTokens || args.mt || "1000") as string, 10),
    serverScript: (args.server || args.s || "dist/index.js") as string
  };
  
  console.log("Configuration:");
  console.log(`- Model: ${config.model}`);
  console.log(`- Query: ${config.query}`);
  console.log(`- Temperature: ${config.temperature}`);
  console.log(`- Max Tokens: ${config.maxTokens}`);
  console.log(`- Server Script: ${config.serverScript}`);
  console.log();

  const client = new Client({
    name: "perplexity-mcp-client",
    version: "1.0.0"
  });

  const transport = new StdioClientTransport({
    command: "node",
    args: [config.serverScript]
  });
  
  console.log("Connecting to MCP server...");
  await client.connect(transport);
  console.log("Connected successfully.");

  try {
    console.log("Sending query to model...");
    const result = await client.callTool({
      name: "perplexity-chat",
      arguments: {
        model: config.model,
        messages: [
          {
            role: "user",
            content: config.query
          }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens
      }
    });

    console.log("\nResponse:");
    console.log(result);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await transport.close();
  }
}

main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
}); 