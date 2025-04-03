# Changelog

## 0.1.2 (2025-04-03)

### Fixes
- Fixed critical issue with MCP server shutting down unexpectedly in Claude Desktop
- Added robust process handling to prevent premature termination
- Improved error logging and transport error handling
- Added keepalive interval to maintain Node.js event loop
- Better handling of stdin/stderr errors to prevent crashes

## 0.1.1 (2025-04-03)

### Improvements
- Improved error handling for Perplexity API responses
- Enhanced Claude Desktop integration with better stdio mode detection
- Fixed JSON parsing issues with malformed responses
- Better error messages with helpful configuration guidance
- All logging now properly routed to stderr when in stdio mode
- Updated default model handling

### Fixes
- Fixed compatibility with Claude Desktop by improving stdout handling
- Fixed potential timeouts in MCP server initialization
- Improved error reporting for missing API keys

## 0.1.0 (2025-04-03)

### Features
- Initial release with support for Perplexity Sonar models
- Claude Desktop integration via MCP protocol
- Support for various model parameters
- Markdown and JSON output formats
- Citation formatting 