import { Tool } from "@modelcontextprotocol/sdk/types.js";

export function createToolDefinitions(): Tool[] {
  return [
    {
      name: "playwright_navigate",
      description: "Navigate to a URL",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string" },
        },
        required: ["url"],
      },
    },
    {
      name: "playwright_screenshot",
      description:
        "Take a screenshot of the current page or a specific element",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name for the screenshot" },
          selector: {
            type: "string",
            description: "CSS selector for element to screenshot",
          },
          width: {
            type: "number",
            description: "Width in pixels (default: 800)",
          },
          height: {
            type: "number",
            description: "Height in pixels (default: 600)",
          },
          storeBase64: {
            type: "boolean",
            description: "Store screenshot in base64 format (default: true)",
          },
          savePng: {
            type: "boolean",
            description: "Save screenshot as PNG file (default: false)",
          },
          downloadsDir: {
            type: "string",
            description:
              "Custom downloads directory path (default: user's Downloads folder)",
          },
        },
        required: ["name"],
      },
    },
    {
      name: "playwright_click",
      description: "Click an element on the page",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for element to click",
          },
        },
        required: ["selector"],
      },
    },
    {
      name: "playwright_fill",
      description: "fill out an input field",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for input field",
          },
          value: { type: "string", description: "Value to fill" },
        },
        required: ["selector", "value"],
      },
    },
    {
      name: "playwright_select",
      description: "Select an element on the page with Select tag",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for element to select",
          },
          value: { type: "string", description: "Value to select" },
        },
        required: ["selector", "value"],
      },
    },
    {
      name: "playwright_hover",
      description: "Hover an element on the page",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for element to hover",
          },
        },
        required: ["selector"],
      },
    },
    {
      name: "playwright_evaluate",
      description: "Execute JavaScript in the browser console",
      inputSchema: {
        type: "object",
        properties: {
          script: { type: "string", description: "JavaScript code to execute" },
        },
        required: ["script"],
      },
    },
    {
      name: "playwright_get",
      description: "Perform an HTTP GET request",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to perform GET operation" },
        },
        required: ["url"],
      },
    },
    {
      name: "playwright_post",
      description: "Perform an HTTP POST request",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to perform POST operation" },
          value: { type: "string", description: "Data to post in the body" },
        },
        required: ["url", "value"],
      },
    },
    {
      name: "playwright_put",
      description: "Perform an HTTP PUT request",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to perform PUT operation" },
          value: { type: "string", description: "Data to PUT in the body" },
        },
        required: ["url", "value"],
      },
    },
    {
      name: "playwright_patch",
      description: "Perform an HTTP PATCH request",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to perform PUT operation" },
          value: { type: "string", description: "Data to PATCH in the body" },
        },
        required: ["url", "value"],
      },
    },
    {
      name: "playwright_delete",
      description: "Perform an HTTP DELETE request",
      inputSchema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "URL to perform DELETE operation",
          },
        },
        required: ["url"],
      },
    },
    {
      name: "playwright_getText",
      description: "Extract text content from elements on the page",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for elements",
          },
          includeHidden: {
            type: "boolean",
            description: "Include hidden text (default: false)",
          },
        },
        required: ["selector"],
      },
    },
    {
      name: "playwright_findElements",
      description: "Find and analyze elements on the page",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for elements",
          },
          attributes: {
            type: "array",
            items: { type: "string" },
            description: "Attributes to extract",
          },
          limit: {
            type: "number",
            description: "Maximum number of elements to return",
          },
        },
        required: ["selector"],
      },
    },
    {
      name: "playwright_uploadFile",
      description: "Upload a file to an input element",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for file input",
          },
          filePath: { type: "string", description: "Path to file to upload" },
        },
        required: ["selector", "filePath"],
      },
    },
    {
      name: "playwright_downloadFile",
      description: "Download a file from a link",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for download link",
          },
          downloadPath: {
            type: "string",
            description: "Path to save downloaded file",
          },
        },
        required: ["selector"],
      },
    },
    {
      name: "playwright_manageCookies",
      description: "Manage browser cookies",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["get", "set", "delete", "clear"],
            description: "Cookie action",
          },
          name: { type: "string", description: "Cookie name" },
          value: { type: "string", description: "Cookie value" },
          domain: { type: "string", description: "Cookie domain" },
        },
        required: ["action"],
      },
    },
    {
      name: "playwright_localStorage",
      description: "Manage local storage",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["get", "set", "delete", "clear"],
            description: "Storage action",
          },
          key: { type: "string", description: "Storage key" },
          value: { type: "string", description: "Storage value" },
        },
        required: ["action"],
      },
    },
    {
      name: "playwright_extractOCR",
      description: "Extract text from images using OCR",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for image element",
          },
          language: {
            type: "string",
            description: "OCR language (default: eng)",
          },
        },
        required: ["selector"],
      },
    },
    {
      name: "playwright_extractTable",
      description: "Extract data from HTML tables",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for table element",
          },
          format: {
            type: "string",
            enum: ["json", "csv"],
            description: "Output format",
          },
        },
        required: ["selector"],
      },
    },
    {
      name: "playwright_extractStructuredData",
      description: "Extract structured data (JSON-LD, microdata)",
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["json-ld", "microdata"],
            description: "Type of structured data",
          },
        },
        required: ["type"],
      },
    },
    {
      name: "playwright_manageHistory",
      description: "Manage browser history",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["back", "forward", "go"],
            description: "History action",
          },
          steps: {
            type: "number",
            description: "Number of steps (for 'go' action)",
          },
        },
        required: ["action"],
      },
    },
    {
      name: "playwright_manageTabs",
      description: "Manage browser tabs/windows",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["new", "close", "switch"],
            description: "Tab action",
          },
          index: { type: "number", description: "Tab index for switching" },
          url: { type: "string", description: "URL for new tab" },
        },
        required: ["action"],
      },
    },
    {
      name: "playwright_networkMonitor",
      description: "Monitor network traffic",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["start", "stop", "get"],
            description: "Monitor action",
          },
          filter: { type: "string", description: "URL pattern to filter" },
        },
        required: ["action"],
      },
    },
    {
      name: "playwright_performance",
      description: "Collect performance metrics",
      inputSchema: {
        type: "object",
        properties: {
          metrics: {
            type: "array",
            items: { type: "string" },
            description: "Metrics to collect",
          },
        },
        required: ["metrics"],
      },
    },
    {
      name: "playwright_console",
      description: "Capture console logs",
      inputSchema: {
        type: "object",
        properties: {
          level: {
            type: "string",
            enum: ["log", "info", "warn", "error"],
            description: "Log level",
          },
          clear: { type: "boolean", description: "Clear existing logs" },
        },
      },
    },
  ];
}

// Browser-requiring tools for conditional browser launch
export const BROWSER_TOOLS = [
  "playwright_navigate",
  "playwright_screenshot",
  "playwright_click",
  "playwright_fill",
  "playwright_select",
  "playwright_hover",
  "playwright_evaluate",
  "playwright_getText",
  "playwright_findElements",
  "playwright_uploadFile",
  "playwright_downloadFile",
  "playwright_manageCookies",
  "playwright_localStorage",
  "playwright_extractOCR",
  "playwright_extractTable",
  "playwright_extractStructuredData",
  "playwright_manageHistory",
  "playwright_manageTabs",
  "playwright_networkMonitor",
  "playwright_performance",
  "playwright_console",
];

// API Request tools for conditional launch
export const API_TOOLS = [
  "playwright_get",
  "playwright_post",
  "playwright_put",
  "playwright_delete",
  "playwright_patch",
];
