---
sidebar_position: 1
---
# Supported Tools

Playwright MCP for API automation has following key features
- Support of GET Request
- Support of POST Request
- Support of PATCH Request
- Support of PUT Request
- Support of DELETE Request

:::warning Note
Still the library is not matured enough to support Oauth, Multi-form, Binary input or complex API requests. Please feel free to fork the repo and add the feature with a PR, will can build the library together!
:::

### Playwright_get
Perform a GET operation on any given API request.

- **Inputs:**
  - **`url`** *(string)*:  
    URL to perform the GET operation.

- **Response:**
  - **`statusCode`** *(string)*:  
    Status code of the API.

---

### Playwright_post
Perform a POST operation on any given API request.

- **Inputs:**
  - **`url`** *(string)*:  
    URL to perform the POST operation.  
  - **`value`** *(string)*:  
    Data to include in the body of the POST request.

- **Response:**
  - **`statusCode`** *(string)*:  
    Status code of the API.  
  - **`responseData`** *(string)*:  
    Response data in JSON format.

---

### Playwright_put
Perform a PUT operation on any given API request.

- **Inputs:**
  - **`url`** *(string)*:  
    URL to perform the PUT operation.  
  - **`value`** *(string)*:  
    Data to include in the body of the PUT request.

- **Response:**
  - **`statusCode`** *(string)*:  
    Status code of the API.  
  - **`responseData`** *(string)*:  
    Response data in JSON format.

---

### Playwright_patch
Perform a PATCH operation on any given API request.

- **Inputs:**
  - **`url`** *(string)*:  
    URL to perform the PATCH operation.  
  - **`value`** *(string)*:  
    Data to include in the body of the PATCH request.

- **Response:**
  - **`statusCode`** *(string)*:  
    Status code of the API.  
  - **`responseData`** *(string)*:  
    Response data in JSON format.

---

### Playwright_delete
Perform a DELETE operation on any given API request.

- **Inputs:**
  - **`url`** *(string)*:  
    URL to perform the DELETE operation.

- **Response:**
  - **`statusCode`** *(string)*:  
    Status code of the API.

### Upon running the test Claude Desktop will run MCP Server to use above tools
![Playwright MCP Server](./img/playwright-api.png)