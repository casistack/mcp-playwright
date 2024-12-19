# Playwright MCP Server

[![smithery badge](https://smithery.ai/badge/@executeautomation/playwright-mcp-server)](https://smithery.ai/protocol/@executeautomation/playwright-mcp-server)

A Model Context Protocol server that provides enhanced browser automation capabilities using Playwright. This server enables LLMs to interact with web pages, perform complex web scraping, handle file operations, and execute JavaScript in a real browser environment.

## Features

### Core Web Automation
- Page navigation and interaction
- Element clicking, filling, and selection
- Screenshot capture
- JavaScript execution
- Form handling

### Enhanced Web Interaction
- Text content extraction with visibility control
- Element finding with attribute analysis
- File upload and download management
- Cookie and local storage management
- Tab and window management

### Rich Content Analysis
- OCR text extraction from images
- Table data extraction (JSON/CSV formats)
- Structured data extraction (JSON-LD, Microdata)
- DOM traversal and search
- Network traffic monitoring

### Performance and Debugging
- Performance metrics collection
- Console log capture and filtering
- Network request monitoring
- Resource timing analysis
- Error tracking and reporting

## Screenshot
![Playwright + Claude](image/playwright_claude.png)

## [Documentation](https://executeautomation.github.io/mcp-playwright/) | [API reference](http://localhost:3000/mcp-playwright/docs/playwright-web/Supported-Tools)

## Installation

You can install the package using npm, mcp-get, or Smithery:

Using npm:
```bash
npm install -g @executeautomation/playwright-mcp-server
```

Using mcp-get:
```bash
npx @michaellatman/mcp-get@latest install @executeautomation/playwright-mcp-server
```

Using Smithery:
```bash
npx @smithery/cli install @executeautomation/playwright-mcp-server --client claude
```

## Configuration

### Basic Configuration
Here's the Claude Desktop configuration to use the Playwright server:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

### Docker Configuration
For containerized environments:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--network=host",
        "--ipc=host",
        "--security-opt=seccomp=unconfined",
        "-e", "DISPLAY=:99",
        "-e", "XAUTHORITY=/tmp/.Xauthority",
        "-v", "/tmp/.X11-unix:/tmp/.X11-unix",
        "-v", "/var/run/dbus:/var/run/dbus",
        "your-image-name"
      ]
    }
  }
}
```

## Usage Examples

### Basic Navigation
```typescript
// Navigate to a URL
await callTool("playwright_navigate", { url: "https://example.com" });

// Click an element
await callTool("playwright_click", { selector: "#submit-button" });

// Fill a form
await callTool("playwright_fill", { selector: "#search", value: "query" });
```

### Rich Content Analysis
```typescript
// Extract text from an image
await callTool("playwright_extractOCR", { 
  selector: "img.captcha",
  language: "eng" 
});

// Extract table data
await callTool("playwright_extractTable", {
  selector: "table.data",
  format: "json"
});

// Extract structured data
await callTool("playwright_extractStructuredData", {
  type: "json-ld"
});
```

### Performance Monitoring
```typescript
// Start network monitoring
await callTool("playwright_networkMonitor", {
  action: "start",
  filter: "api.example.com"
});

// Get performance metrics
await callTool("playwright_performance", {
  metrics: ["navigationTiming", "resourceTiming"]
});
```

## Development

### Prerequisites
- Node.js >= 16.0.0
- npm >= 7.0.0

### Setup
```bash
git clone https://github.com/executeautomation/mcp-playwright.git
cd mcp-playwright
npm install
npm run build
```

### Testing
```bash
npm run test
```

### Linting and Formatting
```bash
npm run lint
npm run format
```

## Contributing
We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License
MIT License - see [LICENSE](LICENSE) for details.
