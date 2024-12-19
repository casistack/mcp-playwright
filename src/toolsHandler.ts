import {
  chromium,
  Browser,
  Page,
  request,
  APIRequest,
  APIRequestContext,
} from "playwright";
import {
  CallToolResult,
  TextContent,
  ImageContent,
} from "@modelcontextprotocol/sdk/types.js";
import { BROWSER_TOOLS, API_TOOLS } from "./tools.js";
import fs from "node:fs";
import * as os from "os";
import * as path from "path";
import Tesseract from "tesseract.js";

// Global state
let browser: Browser | undefined;
let page: Page | undefined;
const consoleLogs: string[] = [];
const screenshots = new Map<string, string>();
const defaultDownloadsPath = path.join(os.homedir(), "Downloads");
let networkRequests: any[] = [];
let isMonitoringNetwork = false;

async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxAttempts) break;

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay for next attempt
      delay *= 1.5;
    }
  }
  throw lastError;
}

async function ensureBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: false,
      args: [
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      bypassCSP: true,
      javaScriptEnabled: true,
      hasTouch: false,
      isMobile: false,
      locale: "en-US",
      timezoneId: "UTC",
      permissions: ["geolocation"],
    });

    page = await context.newPage();

    // Add wait for network idle
    await page.setDefaultNavigationTimeout(30000);
    await page.setDefaultTimeout(30000);

    // Enhanced error handling for console messages
    page.on("console", (msg) => {
      const logEntry = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(logEntry);
    });

    // Handle dialog boxes automatically
    page.on("dialog", async (dialog) => {
      await dialog.dismiss().catch(() => {});
    });

    // Setup request interception for better network handling
    await page.route("**/*", async (route) => {
      try {
        await route.continue();
      } catch (error) {
        console.error("Route error:", error);
        await route.abort().catch(() => {});
      }
    });
  }
  return page!;
}

async function ensureApiContext(url: string) {
  return await request.newContext({
    baseURL: url,
  });
}

export async function handleToolCall(
  name: string,
  args: any,
  server: any
): Promise<{ toolResult: CallToolResult }> {
  // Check if the tool requires browser interaction
  const requiresBrowser = BROWSER_TOOLS.includes(name);
  // Check if the tool requires api interaction
  const requiresApi = API_TOOLS.includes(name);
  let page: Page | undefined;
  let apiContext: APIRequestContext;

  // Only launch browser if the tool requires browser interaction
  if (requiresBrowser) {
    page = await ensureBrowser();
  }

  // Set up API context for API-related operations
  if (requiresApi) {
    apiContext = await ensureApiContext(args.url);
  }

  switch (name) {
    case "playwright_navigate":
      try {
        await page!.goto(args.url, {
          timeout: args.timeout || 30000,
          waitUntil: args.waitUntil || "load",
        });
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Navigated to ${args.url} with ${args.waitUntil || "load"} wait`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Navigation failed: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_screenshot": {
      try {
        const screenshotOptions: any = {
          type: args.type || "png",
          fullPage: !!args.fullPage,
        };

        if (args.selector) {
          const element = await page!.$(args.selector);
          if (!element) {
            return {
              toolResult: {
                content: [
                  {
                    type: "text",
                    text: `Element not found: ${args.selector}`,
                  },
                ],
                isError: true,
              },
            };
          }
          screenshotOptions.element = element;
        }

        if (args.mask) {
          screenshotOptions.mask = await Promise.all(
            args.mask.map(async (selector: string) => await page!.$(selector))
          );
        }

        const screenshot = await page!.screenshot(screenshotOptions);
        const base64Screenshot = screenshot.toString("base64");

        const responseContent: (TextContent | ImageContent)[] = [];

        // Handle PNG file saving
        if (args.savePng !== false) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const filename = `${args.name}-${timestamp}.png`;
          const downloadsDir = args.downloadsDir || defaultDownloadsPath;

          // Create downloads directory if it doesn't exist
          if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
          }

          const filePath = path.join(downloadsDir, filename);
          await fs.promises.writeFile(filePath, screenshot);
          responseContent.push({
            type: "text",
            text: `Screenshot saved to: ${filePath}`,
          } as TextContent);
        }

        // Handle base64 storage
        if (args.storeBase64 !== false) {
          screenshots.set(args.name, base64Screenshot);
          server.notification({
            method: "notifications/resources/list_changed",
          });

          responseContent.push({
            type: "image",
            data: base64Screenshot,
            mimeType: "image/png",
          } as ImageContent);
        }

        return {
          toolResult: {
            content: responseContent,
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Screenshot failed: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }
    }
    case "playwright_click":
      try {
        await page!.click(args.selector);
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Clicked: ${args.selector}`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Failed to click ${args.selector}: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_fill":
      try {
        await page!.waitForSelector(args.selector);
        await page!.fill(args.selector, args.value);
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Filled ${args.selector} with: ${args.value}`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Failed to type ${args.selector}: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_select":
      try {
        await page!.waitForSelector(args.selector);
        await page!.selectOption(args.selector, args.value);
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Selected ${args.selector} with: ${args.value}`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Failed to select ${args.selector}: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_hover":
      try {
        await page!.waitForSelector(args.selector);
        await page!.hover(args.selector);
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Hovered ${args.selector}`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Failed to hover ${args.selector}: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_evaluate":
      try {
        const result = await page!.evaluate((script) => {
          const logs: string[] = [];
          const originalConsole = { ...console };

          ["log", "info", "warn", "error"].forEach((method) => {
            (console as any)[method] = (...args: any[]) => {
              logs.push(`[${method}] ${args.join(" ")}`);
              (originalConsole as any)[method](...args);
            };
          });

          try {
            const result = eval(script);
            Object.assign(console, originalConsole);
            return { result, logs };
          } catch (error) {
            Object.assign(console, originalConsole);
            throw error;
          }
        }, args.script);

        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Execution result:\n${JSON.stringify(result.result, null, 2)}\n\nConsole output:\n${result.logs.join("\n")}`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Script execution failed: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_get":
      try {
        var response = await apiContext!.get(args.url);

        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Performed GET Operation ${args.url}`,
              },
              {
                type: "text",
                text: `Response: ${JSON.stringify(await response.json(), null, 2)}`,
              },
              {
                type: "text",
                text: `Response code ${response.status()}`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Failed to perform GET operation on ${args.url}: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_post":
      try {
        var data = {
          data: args.value,
          headers: {
            "Content-Type": "application/json",
          },
        };

        var response = await apiContext!.post(args.url, data);
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Performed POST Operation ${args.url} with data ${JSON.stringify(args.value, null, 2)}`,
              },
              {
                type: "text",
                text: `Response: ${JSON.stringify(await response.json(), null, 2)}`,
              },
              {
                type: "text",
                text: `Response code ${response.status()}`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Failed to perform POST operation on ${args.url}: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_put":
      try {
        var data = {
          data: args.value,
          headers: {
            "Content-Type": "application/json",
          },
        };
        var response = await apiContext!.put(args.url, data);

        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Performed PUT Operation ${args.url} with data ${JSON.stringify(args.value, null, 2)}`,
              },
              {
                type: "text",
                text: `Response: ${JSON.stringify(await response.json(), null, 2)}`,
              },
              {
                type: "text",
                text: `Response code ${response.status()}`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Failed to perform PUT operation on ${args.url}: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_delete":
      try {
        var response = await apiContext!.delete(args.url);

        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Performed delete Operation ${args.url}`,
              },
              {
                type: "text",
                text: `Response code ${response.status()}`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Failed to perform delete operation on ${args.url}: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_patch":
      try {
        var data = {
          data: args.value,
          headers: {
            "Content-Type": "application/json",
          },
        };
        var response = await apiContext!.patch(args.url, data);

        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Performed PATCH Operation ${args.url} with data ${JSON.stringify(args.value, null, 2)}`,
              },
              {
                type: "text",
                text: `Response: ${JSON.stringify(await response.json(), null, 2)}`,
              },
              {
                type: "text",
                text: `Response code ${response.status()}`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Failed to perform PATCH operation on ${args.url}: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_getText":
      try {
        const elements = await page!.$$(args.selector);
        const texts = await Promise.all(
          elements.map(async (element) => {
            const isHidden = await element.evaluate((el) => {
              const style = window.getComputedStyle(el);
              return style.display === "none" || style.visibility === "hidden";
            });
            if (!args.includeHidden && isHidden) return null;
            return element.textContent();
          })
        );
        const filteredTexts = texts.filter((text) => text !== null);
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: JSON.stringify(filteredTexts),
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Failed to get text: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_findElements":
      try {
        const elements = await page!.$$(args.selector);
        const limit = args.limit || elements.length;
        const results = await Promise.all(
          elements.slice(0, limit).map(async (element) => {
            const result: any = {};
            if (args.attributes) {
              for (const attr of args.attributes) {
                result[attr] = await element.getAttribute(attr);
              }
            }
            result.innerText = await element.innerText();
            result.isVisible = await element.isVisible();
            return result;
          })
        );
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: JSON.stringify(results),
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Failed to find elements: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_uploadFile":
      try {
        const fileInput = await page!.$(args.selector);
        await fileInput!.setInputFiles(args.filePath);
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `File uploaded: ${args.filePath}`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Failed to upload file: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_downloadFile":
      try {
        const downloadPromise = page!.waitForEvent("download");
        await page!.click(args.selector);
        const download = await downloadPromise;
        const downloadPath =
          args.downloadPath ||
          path.join(defaultDownloadsPath, await download.suggestedFilename());
        await download.saveAs(downloadPath);
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `File downloaded to: ${downloadPath}`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Failed to download file: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_manageCookies":
      try {
        const context = page!.context();
        switch (args.action) {
          case "get":
            const cookies = await context.cookies();
            return {
              toolResult: {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(cookies),
                  },
                ],
                isError: false,
              },
            };
          case "set":
            await context.addCookies([
              {
                name: args.name,
                value: args.value,
                domain: args.domain,
                path: "/",
              },
            ]);
            break;
          case "delete":
            await context.clearCookies();
            break;
        }
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Cookie operation ${args.action} completed successfully`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Cookie operation failed: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_localStorage":
      try {
        switch (args.action) {
          case "get":
            const value = await page!.evaluate(
              (key) => localStorage.getItem(key),
              args.key
            );
            return {
              toolResult: {
                content: [
                  {
                    type: "text",
                    text: value || "null",
                  },
                ],
                isError: false,
              },
            };
          case "set":
            await page!.evaluate(
              ({ key, value }) => localStorage.setItem(key, value),
              {
                key: args.key,
                value: args.value,
              }
            );
            break;
          case "delete":
            await page!.evaluate(
              (key) => localStorage.removeItem(key),
              args.key
            );
            break;
          case "clear":
            await page!.evaluate(() => localStorage.clear());
            break;
        }
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `LocalStorage operation ${args.action} completed successfully`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `LocalStorage operation failed: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_extractOCR":
      try {
        const element = await page!.$(args.selector);
        const screenshot = await element!.screenshot();
        const result = await Tesseract.recognize(
          screenshot,
          args.language || "eng"
        );
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: result.data.text,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `OCR extraction failed: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_extractTable":
      try {
        const tableData = await page!.evaluate((selector) => {
          const table = document.querySelector(selector);
          const rows = table!.querySelectorAll("tr");
          const data = [];
          for (const row of rows) {
            const rowData = [];
            const cells = row.querySelectorAll("td, th");
            for (const cell of cells) {
              rowData.push(cell.textContent?.trim());
            }
            data.push(rowData);
          }
          return data;
        }, args.selector);

        const output =
          args.format === "csv"
            ? tableData.map((row) => row.join(",")).join("\n")
            : JSON.stringify(tableData);

        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: output,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Table extraction failed: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_extractStructuredData":
      try {
        const data = await page!.evaluate((type) => {
          if (type === "json-ld") {
            const scripts = document.querySelectorAll(
              'script[type="application/ld+json"]'
            );
            return Array.from(scripts).map((script) =>
              JSON.parse(script.textContent || "{}")
            );
          } else {
            // Microdata extraction
            const items = document.querySelectorAll("[itemscope]");
            return Array.from(items).map((item) => {
              const properties = item.querySelectorAll("[itemprop]");
              const data: any = {};
              properties.forEach((prop) => {
                const name = prop.getAttribute("itemprop");
                if (name) data[name] = prop.textContent;
              });
              return data;
            });
          }
        }, args.type);

        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: JSON.stringify(data),
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Structured data extraction failed: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_manageHistory":
      try {
        switch (args.action) {
          case "back":
            await page!.goBack();
            break;
          case "forward":
            await page!.goForward();
            break;
          case "go":
            await page!.goto(args.url);
            break;
        }
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `History action ${args.action} completed successfully`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `History operation failed: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_manageTabs":
      try {
        const context = page!.context();
        switch (args.action) {
          case "new":
            const newPage = await context.newPage();
            if (args.url) await newPage.goto(args.url);
            break;
          case "close":
            const pages = context.pages();
            if (pages.length > 1) {
              await pages[pages.length - 1].close();
            }
            break;
          case "switch":
            const targetPage = context.pages()[args.index || 0];
            if (targetPage) {
              await targetPage.bringToFront();
              page = targetPage;
            }
            break;
        }
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Tab operation ${args.action} completed successfully`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Tab operation failed: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_networkMonitor":
      try {
        switch (args.action) {
          case "start":
            isMonitoringNetwork = true;
            page!.on("request", (request) => {
              if (args.filter && !request.url().includes(args.filter)) return;
              networkRequests.push({
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                timestamp: new Date().toISOString(),
              });
            });
            break;
          case "stop":
            isMonitoringNetwork = false;
            page!.removeAllListeners("request");
            break;
          case "get":
            return {
              toolResult: {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(networkRequests),
                  },
                ],
                isError: false,
              },
            };
        }
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Network monitoring ${args.action} completed successfully`,
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Network monitoring failed: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_performance":
      try {
        const metrics = await page!.evaluate(() => {
          const perfData: any = {};
          const timing = performance.timing;

          perfData.navigationStart = timing.navigationStart;
          perfData.loadEventEnd = timing.loadEventEnd;
          perfData.domComplete = timing.domComplete;
          perfData.firstPaint =
            performance.getEntriesByType("paint")[0]?.startTime;

          // Get resource timing data
          const resources = performance.getEntriesByType("resource");
          perfData.resources = resources.map((resource: any) => ({
            name: resource.name,
            duration: resource.duration,
            transferSize: resource.transferSize,
          }));

          return perfData;
        });

        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: JSON.stringify(metrics),
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Performance metrics collection failed: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    case "playwright_console":
      try {
        if (args.clear) {
          consoleLogs.length = 0;
        }
        const filteredLogs = args.level
          ? consoleLogs.filter((log) => log.includes(`[${args.level}]`))
          : consoleLogs;

        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: JSON.stringify(filteredLogs),
              },
            ],
            isError: false,
          },
        };
      } catch (error) {
        return {
          toolResult: {
            content: [
              {
                type: "text",
                text: `Console log operation failed: ${(error as Error).message}`,
              },
            ],
            isError: true,
          },
        };
      }

    default:
      return {
        toolResult: {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        },
      };
  }
}

// Expose utility functions for resource management
export function getConsoleLogs(): string[] {
  return consoleLogs;
}

export function getScreenshots(): Map<string, string> {
  return screenshots;
}

export async function navigate(url: string) {
  const page = await ensureBrowser();

  return await withRetry(async () => {
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait for content to be available
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    // Try multiple common selectors for content readiness
    const readySelectors = ["main", "#content", ".container", "body > *"];
    for (const selector of readySelectors) {
      await page.waitForSelector(selector, { timeout: 5000 }).catch(() => {});
    }

    return {
      content: [{ type: "text", text: `Navigated to ${url} with load wait` }],
      isError: false,
    };
  });
}

export async function findElements(selector: string, attributes: string[]) {
  const page = await ensureBrowser();

  return await withRetry(async () => {
    await page.waitForLoadState("networkidle");

    // Enhanced selector strategy
    const elements = await page.$$eval(
      [
        selector,
        // GitHub specific selectors
        ".Box-row",
        '[data-test-selector="tree-entry-item"]',
        ".js-navigation-item",
        // Common web selectors
        '[role="listitem"]',
        '[role="row"]',
        ".list-item",
        ".item",
        // Semantic HTML selectors
        "article",
        "section > *",
        ".content > *",
      ].join(","),
      (elements, attrs) => {
        return elements.map((el) => {
          const htmlEl = el as HTMLElement;
          const result: any = {};

          attrs.forEach((attr) => {
            if (attr === "text") {
              result[attr] = htmlEl.textContent?.trim() || null;
            } else if (attr === "innerText") {
              result[attr] = htmlEl.innerText?.trim() || null;
            } else if (attr === "href") {
              const hrefEl =
                htmlEl.getAttribute("href") ||
                htmlEl.querySelector("a")?.getAttribute("href") ||
                htmlEl.closest("a")?.getAttribute("href");
              result[attr] = hrefEl || null;
            } else {
              result[attr] =
                htmlEl.getAttribute(attr) ||
                htmlEl.querySelector(`[${attr}]`)?.getAttribute(attr) ||
                null;
            }
          });

          // Enhanced visibility check
          const style = window.getComputedStyle(htmlEl);
          result.isVisible =
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.opacity !== "0" &&
            htmlEl.offsetParent !== null;

          return result;
        });
      },
      attributes
    );

    return {
      content: [{ type: "text", text: JSON.stringify(elements) }],
      isError: false,
    };
  });
}
