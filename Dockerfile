FROM mcr.microsoft.com/playwright:v1.42.1-jammy

# Set noninteractive frontend to avoid prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Install additional dependencies
RUN apt-get update && apt-get install -y \
    xvfb \
    x11vnc \
    fluxbox \
    dbus \
    dbus-x11 \
    x11-utils \
    x11-xserver-utils \
    libxss1 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libasound2 \
    fonts-noto-color-emoji \
    fonts-liberation \
    git


RUN git clone -b mybranch https://github.com/casistack/mcp-playwright.git /mcp-playwright
WORKDIR /mcp-playwright

# Install dependencies and build
RUN npm install && \
    npm run build && \
    npm link

# Create wrapper script
RUN echo '#!/bin/bash\n\
Xvfb :99 -screen 0 1920x1080x24 & \n\
sleep 1 \n\
fluxbox & \n\
x11vnc -display :99 -forever -nopw & \n\
export DISPLAY=:99 \n\
dbus-launch --exit-with-session npx mcp-playwright' > /usr/local/bin/start-server.sh && \
chmod +x /usr/local/bin/start-server.sh

ENV DISPLAY=:99
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

ENTRYPOINT ["/usr/local/bin/start-server.sh"]