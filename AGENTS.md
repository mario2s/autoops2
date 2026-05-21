# AutoOps Workspace

Auto shop operations platform for creating and tracking orders.

## Projects

| Workspace | Stack | Role |
|---|---|---|
| `autoops-web` | Next.js + Neon DB + Drizzle + Tailwind | Back-end API + Web front-end |
| `autoops-mobile` | React Native + Expo + Expo Router | Mobile client |

## Cross-Project

- Mobile consumes the web API — see `autoops-web/src/app/api`
- Shared auth: JWT Bearer tokens across both projects