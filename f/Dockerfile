FROM ghcr.io/pnpm/pnpm:11
RUN pnpm runtime set node 22 -g

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm run build

EXPOSE 5173

# For now
CMD ["pnpm", "run", "preview", "--host", "--port", "5173"]
