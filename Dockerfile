# FROM 065147804054.dkr.ecr.ap-southeast-1.amazonaws.com/gosoft-images-registry:node16-alpine
FROM registry.access.redhat.com/ubi9/nodejs-20-minimal:1-51 AS builder

WORKDIR /app

# Install ALL dependencies first for better layer caching
COPY ./package*.json ./
COPY ./tsconfig*.json ./
COPY src src

# RUN npm install npm@latest -g
RUN npm install -g npm@10.9.0
RUN npm install --force
RUN npm run build

FROM public.ecr.aws/docker/library/node:20-alpine AS runtime


WORKDIR /app

RUN adduser -D nonroot

COPY --from=builder --chown=nonroot /app/node_modules ./node_modules
COPY --from=builder --chown=nonroot /app/build ./
# COPY --from=builder --chown=nonroot /app/build/src ./build
# RUN rm -rf /app/src
# install dynatrace agent
COPY --from=lss67296.live.dynatrace.com/linux/oneagent-codemodules-musl:nodejs / /

# EXPOSE 3000
USER nonroot

HEALTHCHECK NONE

CMD ["node", "src/app.js"]
