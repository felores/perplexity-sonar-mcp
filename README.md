# Perplexity Sonar MCP Server

An MCP server implementation that brings the power of Perplexity's Sonar models to Claude Desktop and other MCP clients. Unlike traditional MCP servers, this implementation provides access to Perplexity's advanced AI models with web search capabilities, allowing Claude to perform real-time web searches and provide up-to-date information during conversations.

## Why Perplexity Sonar MCP?

- **Real-time Web Search**: Access current information from the web during conversations
- **Multiple Models**: Choose from various Sonar models to fit your needs:
  - `sonar`: Balanced model for general use
  - `sonar-pro`: Enhanced capabilities for complex tasks
  - `sonar-reasoning`: Specialized in logical reasoning and analysis
  - `sonar-deep-research`: In-depth research with comprehensive citations
- **Rich Parameters**: Fine-tune your queries with extensive parameters:
  - Control search domains and recency
  - Adjust response format (markdown/JSON)
  - Manage temperature and token generation
  - Get related questions and images
- **Seamless Integration**: Works natively with Claude Desktop and other MCP clients

## Requirements

- Node.js 18.0.0 or higher
- A Perplexity API key (get one at https://www.perplexity.ai/account/api)
- Claude Desktop (for desktop integration)

To verify your Node.js installation:
```bash
node --version  # Should be 18.0.0 or higher
```

If Node.js is not installed or needs updating:
1. Download from [nodejs.org](https://nodejs.org/)
2. Follow the installation instructions for your operating system
3. Restart your terminal after installation

## Usage

### With Claude Desktop

1. Edit your Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the following configuration:
   ```json
   {
     "mcpServers": {
       "perplexity": {
         "command": "npx",
         "args": [
           "-y",
           "@felores/perplexity-sonar-mcp"
         ],
         "env": {
           "PERPLEXITY_API_KEY": "your_api_key_here"
         }
       }
     }
   }
   ```

3. Restart Claude Desktop

### Standalone Mode

You can also run the server in standalone mode with HTTP/SSE support:

```bash
PERPLEXITY_API_KEY=your_api_key_here perplexity-sonar-mcp
```

This will start the server on port 3000 by default. You can specify a different port:

```bash
PERPLEXITY_API_KEY=your_api_key_here PORT=8080 perplexity-sonar-mcp
```

## API Reference

The server exposes the following MCP tool:

### perplexity-chat

Parameters:
- `model` (optional): Model to use (default: "sonar")
  - Options:
    - `sonar`: Balanced model for general use
    - `sonar-pro`: Enhanced capabilities for complex tasks
    - `sonar-reasoning`: Specialized in logical reasoning
    - `sonar-deep-research`: In-depth research with citations
- `messages`: Array of message objects with:
  - `role`: "system" | "user" | "assistant"
  - `content`: string
- `temperature` (optional): Controls randomness (0-2)
  - Lower values (e.g., 0.3) for more focused responses
  - Higher values (e.g., 0.8) for more creative responses
- `max_tokens` (optional): Maximum tokens to generate
- `top_p` (optional): Controls diversity via nucleus sampling (0-1)
- `search_domain_filter` (optional): Array of domains to limit citations to
  - Example: ["wikipedia.org", "github.com"]
- `return_images` (optional): Whether to return images from search results
- `return_related_questions` (optional): Whether to return related questions
- `search_recency_filter` (optional): Filter search results by recency
  - Options: "month", "week", "day", "hour"
- `top_k` (optional): Maximum number of search results to consider
- `stream` (optional): Whether to stream the response
- `presence_penalty` (optional): Penalizes token presence
- `frequency_penalty` (optional): Penalizes token frequency
- `output_format` (optional): Response format ("json" or "markdown", default: "markdown")

## Example Queries

Here are some examples of what you can ask Claude using this server:

1. Basic search with default model:
   "What are the latest developments in quantum computing?"

2. Deep research with citations:
   "Using sonar-deep-research, explain the current state of fusion energy."

3. Domain-specific search:
   "Search only on arxiv.org and nature.com for recent papers about large language models."

4. Recent news search:
   "What happened in AI research this week? Use search_recency_filter: 'week'"

## Development

1. Clone the repository:
   ```bash
   git clone https://github.com/felores/perplexity-sonar-mcp.git
   cd perplexity-sonar-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run in development mode:
   ```bash
   npm run dev
   ```

## Troubleshooting

If you encounter issues:

1. Verify your API key is correct
2. Check Node.js version compatibility
3. Look for errors in Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/mcp.log`
   - Windows: `%APPDATA%\Claude\logs\mcp.log`
4. Try running in standalone mode to isolate issues

## License

MIT
