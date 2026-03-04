# Forum Application Architecture

This application is a full-stack web forum with the following architecture:

## Frontend
*   **Technology Stack**: React (TypeScript)
*   **Build Tool**: Vite
*   **Routing**: `react-router-dom`
*   **UI Notifications**: `react-toastify`
*   **Authentication**: Firebase Authentication Client SDK is used for user authentication.

## Backend
*   **Technology Stack**: Node.js/Express.js (TypeScript)
*   **Functionality**: Handles all API requests, business logic, and interactions with the PostgreSQL database.
*   **Authentication**: Integrates Firebase Admin SDK to securely verify Firebase ID tokens from the frontend.
*   **Logging**: `winston` for structured logging.

## Database
*   **Primary Database**: PostgreSQL is used as the main data store for all core application data including user profiles, forum content (categories, threads, posts), reputation, and moderation logs.
*   **Schema Management**: `knex.js` is used for database migrations.

## Key Features
*   User Authentication & Authorization (multiple roles).
*   Comprehensive User Profiles.
*   Forum Threads and Replies with categories.
*   Real-time Shoutbox (to be re-implemented).
*   Moderation Tools.
*   Real-time Notifications and Global Broadcasts (to be re-implemented).
