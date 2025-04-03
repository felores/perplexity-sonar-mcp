#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Get directory name
const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(__dirname, "../dist/index.js");

// Validation messages
const listToolsMessage = JSON.stringify({
  type: "listTools"
});

// Start server process
console.log("Starting MCP server...");
const server = spawn("node", [serverPath], {
  stdio: ["pipe", "pipe", "inherit"],
  env: process.env
});

// Handle server output
let buffer = "";
server.stdout.on("data", (data) => {
  buffer += data.toString();
  
  // Try to parse complete JSON messages
  try {
    // See if we have a complete message
    const message = JSON.parse(buffer);
    
    console.log("Received message:", JSON.stringify(message, null, 2));
    
    // If we got a successful listTools response, exit successfully
    if (message.type === "listToolsResult") {
      console.log("\n✅ Server validation successful!");
      console.log(`Found ${message.tools.length} tool(s): ${message.tools.map(t => t.name).join(", ")}`);
      server.kill();
      process.exit(0);
    }
    
    // Clear buffer after successful parse
    buffer = "";
  } catch (e) {
    // Incomplete JSON, keep buffering
  }
});

// Handle server close
server.on("close", (code) => {
  if (code !== 0) {
    console.error(`\n❌ Server exited with code ${code}`);
    process.exit(code || 1);
  }
});

// Send listTools message
console.log("Sending listTools message...");
server.stdin.write(listToolsMessage + "\n");

// Exit if no response after 5 seconds
setTimeout(() => {
  console.error("\n❌ Timeout waiting for server response");
  server.kill();
  process.exit(1);
}, 5000); 