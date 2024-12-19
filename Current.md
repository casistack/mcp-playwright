# MCP Playwright Implementation Documentation

## Overview
This repository implements a Model Context Protocol (MCP) server for Playwright, enabling AI models like Claude to interact with web browsers programmatically. The implementation is containerized using Docker and provides a secure, optimized headless browser environment with X11 support.

## Architecture

### Docker Configuration
The implementation uses a Docker container based on the official Playwright image (`mcr.microsoft.com/playwright:v1.42.1-jammy`) with enhanced security and performance configurations:

1. **Display Server Setup**:
   - Uses Xvfb as virtual framebuffer with optimized color depth (16-bit)
   - Implements VNC server (x11vnc) with localhost-only access
   - Uses lightweight Openbox window manager
   - Implements systemd-free DBUS setup for inter-process communication

2. **Security Enhancements**:
   - Non-root user execution
   - Minimal dependency installation
   - Resource limits configuration
   - Regular security updates
   - Cleanup of sensitive build artifacts

3. **Environment Configuration**:
   - Production mode settings
   - Display configuration (DISPLAY=:99)
   - Timezone settings (UTC)
   - Optimized browser configuration

4. **Reliability Features**:
   - Health checking with automatic recovery
   - Process monitoring and cleanup
   - Graceful shutdown handling
   - Service dependency management

### Project Structure
The implementation consists of several key components:

1. **Core Files**:
   - `index.ts`: Entry point and server initialization
   - `requestHandler.ts`: Handles incoming MCP requests
   - `tools.ts`: Defines available browser automation tools
   - `toolsHandler.ts`: Implements tool execution logic

2. **Dependencies**:
   - `@modelcontextprotocol/sdk`: MCP protocol implementation
   - `playwright`: Browser automation framework
   - `@playwright/browser-chromium`: Chromium browser package

## Integration
The server is designed to be run as a Docker container with specific configurations for X11 forwarding and IPC:

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

## Security Considerations
- Non-root user execution with minimal permissions
- Container runs with specific security options
- X11 socket is mounted with restricted access
- DBUS socket mounted with session isolation
- Regular security updates through base image
- Cleanup of build artifacts and caches

## Performance Optimizations
- Minimal color depth for Xvfb (16-bit)
- Lightweight window manager (Openbox)
- Optimized dependency installation
- Resource limits configuration
- Production mode settings

## Reliability Features
- Docker health checks
- Process monitoring
- Automatic service recovery
- Graceful shutdown handling
- Proper cleanup of child processes
- Startup dependency management

## Build and Deployment
The project uses TypeScript and includes:
- Optimized build process using `npm ci`
- Production-only dependency installation
- Executable permission setting for distribution
- NPM package distribution configuration
- Build artifact cleanup

## Monitoring and Debugging
- VNC server available on localhost:5900
- Health check status through Docker
- Process monitoring logs
- Service status reporting

## Current Limitations
1. Requires X11 setup on host system
2. Network access uses host networking
3. Some security options still require privileged mode

## Future Improvements
1. Implementation of custom seccomp profile
2. Network isolation improvements
3. Further reduction of container privileges
4. Implementation of logging aggregation
5. Addition of metrics collection