#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { z } from "zod";
import { perplexityChat } from "./perplexity.js";

// Create a logger that won't corrupt the stdio channel
function createLogger(isStdioMode: boolean) {
  return {
    log: (...args: unknown[]) => {
      if (isStdioMode) {
        console.error('[INFO]', ...args);
      } else {
        console.log(...args);
      }
    },
    error: (...args: unknown[]) => {
      console.error('[ERROR]', ...args);
    },
    warn: (...args: unknown[]) => {
      console.error('[WARN]', ...args);
    },
    debug: (...args: unknown[]) => {
      if (isStdioMode) {
        console.error('[DEBUG]', ...args);
      } else {
        console.debug(...args);
      }
    }
  };
}

// Create an MCP server
const server = new McpServer({
  name: "Perplexity MCP",
  version: "0.1.1"
});

// Register the perplexity-chat tool
server.tool(
  "perplexity-chat",
  {
    model: z.string().optional().default("sonar").describe(
      "The name of the model to use (e.g. 'sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-deep-research')"
    ),
    messages: z.array(z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string()
    })).describe("The messages to send to the model"),
    temperature: z.number().min(0).max(2).optional().describe("Controls randomness (0-2)"),
    max_tokens: z.number().int().optional().describe("Maximum number of tokens to generate"),
    top_p: z.number().min(0).max(1).optional().describe("Controls diversity via nucleus sampling (0-1)"),
    search_domain_filter: z.array(z.string()).optional().describe("Limit citations to specific domains"),
    return_images: z.boolean().optional().describe("Whether to return images in the response"),
    return_related_questions: z.boolean().optional().describe("Whether to return related questions"),
    search_recency_filter: z.enum(["month", "week", "day", "hour"]).optional().describe("Filter search results by recency"),
    top_k: z.number().int().optional().describe("Maximum number of search results to consider"),
    stream: z.boolean().optional().describe("Whether to stream the response"),
    presence_penalty: z.number().optional().describe("Penalizes new tokens based on presence in the text so far"),
    frequency_penalty: z.number().optional().describe("Penalizes new tokens based on frequency in the text so far"),
    output_format: z.enum(["json", "markdown"]).optional().default("markdown").describe("Format to return the response in")
  },
  async (args) => {
    const result = await perplexityChat(args);
    return {
      content: result.content.map(item => ({
        type: "text",
        text: item.text
      })),
      isError: result.isError
    };
  }
);

// Start the server
export async function startServer() {
  // Check if we're running under Claude Desktop or inspector
  const isClaudeOrInspector = process.argv.includes("--inspector") || 
                     process.argv.includes("--stdio") || 
                     process.env.MCP_INSPECTOR === "true" || 
                     !!process.env.MCP_INSPECTOR || 
                     process.argv.some(arg => arg.includes("--args=")) ||
                     process.argv.some(arg => arg.includes("inspector")) ||
                     // Claude Desktop typically doesn't pass any special args
                     (process.argv.length === 2 && !process.argv.includes("--port") && !process.argv.includes("-p"));

  // Create a logger that won't corrupt stdio
  const logger = createLogger(isClaudeOrInspector);
  
  logger.log("Starting with arguments:", process.argv);
  logger.log("Environment variables:", {
    MCP_INSPECTOR: process.env.MCP_INSPECTOR,
    PORT: process.env.PORT
  });
  logger.log("Running in stdio mode:", isClaudeOrInspector ? "yes" : "no");

  if (isClaudeOrInspector) {
    // Use stdio transport for Claude Desktop or inspector
    const transport = new StdioServerTransport();
    
    // Set up error handling
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception:", error);
    });

    process.on("unhandledRejection", (error) => {
      logger.error("Unhandled rejection:", error);
    });

    // Set up cleanup on exit
    process.on("SIGINT", async () => {
      logger.log("Shutting down...");
      try {
        await server.close();
      } catch (error) {
        logger.error("Error during shutdown:", error);
      }
      process.exit(0);
    });

    // Connect to the transport once
    logger.log("Starting Perplexity MCP server with stdio transport...");
    await server.connect(transport);

    // Keep the process running
    process.stdin.resume();
  } else {
    // Use Express with SSE for standalone mode
    const app = express();
    app.use(cors());

    // Store active transports
    const transports: { [sessionId: string]: SSEServerTransport } = {};

    // Set up SSE endpoint
    app.get("/sse", async (_: Request, res: Response) => {
      const transport = new SSEServerTransport("/messages", res);
      
      // Store the transport
      transports[transport.sessionId] = transport;
      
      // Clean up on connection close
      res.on("close", async () => {
        try {
          await server.close();
          delete transports[transport.sessionId];
        } catch (error) {
          logger.error("Error cleaning up transport:", error);
        }
      });

      try {
        await transport.start();
        await server.connect(transport);
      } catch (error) {
        logger.error("Error establishing SSE connection:", error);
        res.status(500).send("Failed to establish SSE connection");
      }
    });

    // Set up message handling endpoint
    app.post("/messages", express.json(), async (req: Request, res: Response) => {
      const sessionId = req.query.sessionId as string;
      const transport = transports[sessionId];
      
      if (!transport) {
        res.status(404).send("Session not found");
        return;
      }

      try {
        await transport.handlePostMessage(req, res);
      } catch (error) {
        logger.error("Error handling message:", error);
        res.status(500).send("Failed to handle message");
      }
    });

    // Start the HTTP server
    const PORT = process.env.PORT || 3000;
    const httpServer = app.listen(PORT, () => {
      logger.log(`Starting Perplexity MCP server on port ${PORT}...`);
    });

    // Clean up on server shutdown
    httpServer.on("close", async () => {
      try {
        await Promise.all(
          Object.values(transports).map(transport => server.close())
        );
      } catch (error) {
        logger.error("Error during server shutdown:", error);
      }
    });
  }
}

// Only start the server if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(error => {
    console.error("Error starting server:", error);
    process.exit(1);
  });
}
