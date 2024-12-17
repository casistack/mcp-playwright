---
sidebar_position: 1
---

# Supported Tools

Playwright MCP for Browser automation has following key features
- Console log monitoring
- Screenshot capabilities
- JavaScript execution
- Basic web interaction (navigation, clicking, form filling, drop down select and hover)

### Playwright_navigate
Navigate to any URL in the browser
- **`Input`** url (string):
URL of the application under test

---

### Playwright_screenshot

Capture screenshots of the entire page or specific elements

- **`name`** *(string, required)*:  
  Name for the screenshot.

- **`selector`** *(string, optional)*:  
  CSS selector for the element to screenshot.

- **`width`** *(number, optional, default: 800)*:  
  Screenshot width.

- **`height`** *(number, optional, default: 600)*:  
  Screenshot height.

---

### Playwright_click
Click elements on the page.

- **`selector`** *(string)*:  
  CSS selector for the element to click.

---

### Playwright_hover
Hover over elements on the page.

- **`selector`** *(string)*:  
  CSS selector for the element to hover.

---

### Playwright_fill
Fill out input fields.

- **`selector`** *(string)*:  
  CSS selector for the input field.  
- **`value`** *(string)*:  
  Value to fill.

---

### Playwright_select
Select an element with the `SELECT` tag.

- **`selector`** *(string)*:  
  CSS selector for the element to select.  
- **`value`** *(string)*:  
  Value to select.

---

### Playwright_evaluate
Execute JavaScript in the browser console.

- **`script`** *(string)*:  
  JavaScript code to execute.