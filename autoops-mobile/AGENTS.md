# AutoOps Mobile — Expo Car Shop App

Mobile client for AutoOps car shop operations, consuming the AutoOps REST API.

## Stack

- **Framework:** React Native (TS) + Expo (Expo Router)
- **Navigation:** Stack navigation via Expo Router
- **Auth:** Bearer token (JWT) on all API requests

## Backend Integration

- **API source:** `../autoops-web/src/app/api`
- **Auth header:** `Authorization: Bearer <token>` on every request
- **Base URL:** configure via environment variable (e.g. `EXPO_PUBLIC_API_URL`)

## Architecture

- **Modular design** — self-contained components; split when a file grows complex or logic repeats
- **Reuse first** — extract shared UI and logic into `/components` and `/hooks` before duplicating

## UI & Platform

- Responsive layout supporting smartphones and tablets
- User-friendly, mobile-native feel
- **Alerts & dialogs:** always implement a web fallback — use modal popups in place of
  `Alert.alert()`, `confirm()`, and other native dialogs when running on web (`Platform.OS === 'web'`)