FROM mcr.microsoft.com/playwright:v1.49.1-jammy

# Set noninteractive frontend and timezone
ENV DEBIAN_FRONTEND=noninteractive \
    TZ=UTC \
    NODE_ENV=production \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0 \
    DISPLAY=:99 \
    SCREEN_WIDTH=1280 \
    SCREEN_HEIGHT=1024 \
    SCREEN_DEPTH=24 \
    SCREEN_DPI=96

# Create a non-root user
RUN groupadd -r mcpuser && useradd -r -g mcpuser -G audio,video mcpuser \
    && mkdir -p /home/mcpuser && chown -R mcpuser:mcpuser /home/mcpuser

# Install minimal dependencies with security updates
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    xvfb \
    dbus-x11 \
    x11-utils \
    libxss1 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libasound2 \
    fonts-noto-color-emoji \
    fonts-liberation \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set up workspace
WORKDIR /mcp-playwright

# Install build dependencies globally
RUN npm install -g \
    typescript@4.9.5 \
    @types/node@20.10.5 \
    shx@0.3.4 \
    @modelcontextprotocol/sdk@1.0.3

# Copy all source files
COPY . .

# Install dependencies and build
RUN npm ci && \
    npm run build && \
    # Cleanup unnecessary files
    rm -rf node_modules/.cache && \
    npm cache clean --force

# Create startup script
RUN echo '#!/bin/bash\n\
\n\
cleanup() {\n\
    echo "Cleaning up..."\n\
    kill -TERM $XVFB_PID $DBUS_PID 2>/dev/null\n\
    exit 0\n\
}\n\
\n\
# Cleanup on script exit\n\
trap cleanup SIGTERM SIGINT EXIT\n\
\n\
# Start Xvfb\n\
Xvfb :99 -screen 0 ${SCREEN_WIDTH}x${SCREEN_HEIGHT}x${SCREEN_DEPTH} -dpi ${SCREEN_DPI} +extension RANDR & \n\
XVFB_PID=$!\n\
\n\
# Wait for Xvfb\n\
max_attempts=30\n\
attempt=0\n\
until xdpyinfo -display :99 >/dev/null 2>&1; do\n\
    attempt=$(( attempt + 1 ))\n\
    if [ $attempt -ge $max_attempts ]; then\n\
        echo "Failed to start Xvfb after $max_attempts attempts"\n\
        exit 1\n\
    fi\n\
    echo "Waiting for Xvfb... (attempt $attempt/$max_attempts)"\n\
    sleep 1\n\
done\n\
\n\
# Start dbus\n\
mkdir -p /tmp/dbus\n\
dbus-daemon --session --address=unix:path=/tmp/dbus/session & \n\
DBUS_PID=$!\n\
\n\
# Export environment variables\n\
export DISPLAY=:99\n\
export DBUS_SESSION_BUS_ADDRESS=unix:path=/tmp/dbus/session\n\
\n\
# Health check function\n\
health_check() {\n\
    while true; do\n\
        if ! ps -p $XVFB_PID >/dev/null || ! ps -p $DBUS_PID >/dev/null; then\n\
            echo "Critical service died. Exiting..."\n\
            exit 1\n\
        fi\n\
        sleep 30\n\
    done\n\
}\n\
\n\
# Start health check in background\n\
health_check & \n\
\n\
# Start MCP server\n\
cd /mcp-playwright && node dist/index.js\n\
' > /usr/local/bin/start-server.sh && \
chmod +x /usr/local/bin/start-server.sh

# Create necessary directories and set permissions
RUN mkdir -p /tmp/.X11-unix && \
    chmod 1777 /tmp/.X11-unix && \
    chown mcpuser:mcpuser /tmp/.X11-unix

# Switch to non-root user
USER mcpuser

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD xdpyinfo -display :99 >/dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/start-server.sh"]

