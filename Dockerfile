FROM node:20-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends \
        texlive \
        texlive-latex-extra \
        texlive-publishers \
        latexmk \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .

EXPOSE 5000
CMD ["node", "server.js"]