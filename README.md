# Perplexity Sonar MCP Server

An MCP server implementation for integrating Perplexity API with Claude Desktop and other MCP clients.

## Features

- Seamless integration with Claude Desktop
- Full support for Perplexity API features
- Standalone mode with HTTP/SSE support
- TypeScript support with type definitions

## Installation

```bash
npm install -g @felores/perplexity-sonar-mcp
```

## Usage

### With Claude Desktop

1. Install the package globally:
   ```bash
   npm install -g @felores/perplexity-sonar-mcp
   ```

2. Edit your Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

3. Add the following configuration:
   ```json
   {
     "mcpServers": {
       "perplexity": {
         "command": "perplexity-sonar-mcp"
       }
     }
   }
   ```

4. Set your Perplexity API key:
   ```bash
   export PERPLEXITY_API_KEY=your_api_key_here
   ```

5. Restart Claude Desktop

### Standalone Mode

You can also run the server in standalone mode with HTTP/SSE support:

```bash
perplexity-sonar-mcp
```

This will start the server on port 3000 by default. You can specify a different port:

```bash
PORT=8080 perplexity-sonar-mcp
```

## API Reference

The server exposes the following MCP tool:

### perplexity-chat

Parameters:
- `model` (optional): Model to use (default: "sonar")
  - Options: "sonar", "sonar-pro", "sonar-reasoning", "sonar-deep-research"
- `messages`: Array of message objects with:
  - `role`: "system" | "user" | "assistant"
  - `content`: string
- `temperature` (optional): Controls randomness (0-2)
- `max_tokens` (optional): Maximum tokens to generate
- `top_p` (optional): Controls diversity via nucleus sampling (0-1)
- `search_domain_filter` (optional): Array of domains to limit citations to
- `return_images` (optional): Whether to return images
- `return_related_questions` (optional): Whether to return related questions
- `search_recency_filter` (optional): Filter search results by recency
  - Options: "month", "week", "day", "hour"
- `top_k` (optional): Maximum number of search results to consider
- `stream` (optional): Whether to stream the response
- `presence_penalty` (optional): Penalizes token presence
- `frequency_penalty` (optional): Penalizes token frequency
- `output_format` (optional): Response format ("json" or "markdown", default: "markdown")

## Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/perplexity-mcp.git
   cd perplexity-mcp
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

## License

MIT
