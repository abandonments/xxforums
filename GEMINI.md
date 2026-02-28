# Project Overview

This project is a full-stack web application, functioning as a forum or social platform, developed using a modern technology stack. It features robust user management, real-time interactions, moderation tools, and a cryptocurrency-based payment/escrow system.

**Key Components:**

*   **Frontend:** Built with **React (TypeScript)**, leveraging **Vite** as the build tool. It uses `react-router-dom` for navigation, `react-toastify` for UI notifications, and integrates heavily with **Firebase Client SDK** for authentication, real-time data (Firestore), and file storage (Storage).
*   **Backend:** A **Node.js/Express.js** application. It handles API requests, interacts with a PostgreSQL database, and integrates with **Firebase Admin SDK** for secure authentication verification. Key functionalities include user profile management, a reputation system, and moderation actions. Logging is handled via `winston`.
*   **Database:** **PostgreSQL** serves as the primary data store for core application data such as user profiles, reputation, and moderation logs. Database schema management is handled by `knex.js` migrations. **Firebase Firestore** is utilized for real-time updates, notifications, global alerts, and user activity tracking.
*   **Features:**
    *   User Authentication & Authorization (multiple roles: Root, Admin, Mod, Elite, VIP, Rich, User, Banned).
    *   Comprehensive User Profiles with custom bios, signatures, avatars, banners, and an inventory/badge system.
    *   Forum Threads and Replies with categories.
    *   Real-time Shoutbox.
    *   Moderation Tools (user warnings, banning, content deletion).
    *   Cryptocurrency (Monero) based User Upgrades and Escrow system for secure transactions.
    *   Real-time Notifications and Global Broadcasts.

# Building and Running

This project requires both a frontend and a backend setup. Ensure you have Node.js and npm/yarn installed.

## Environment Variables

Both the frontend and backend rely on environment variables. Create `.env` files in the root directory (for frontend) and in the `backend/` directory (for backend).

**Root `.env` (Frontend):**
```dotenv
VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
VITE_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
VITE_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY" # Used by Vite's define for frontend access
```

**`backend/.env` (Backend):**
```dotenv
PGUSER="YOUR_PG_USER"
PGHOST="YOUR_PG_HOST"
PGDATABASE="YOUR_PG_DATABASE"
PGPASSWORD="YOUR_PG_PASSWORD"
PGPORT="YOUR_PG_PORT"
FIREBASE_SERVICE_ACCOUNT_PATH="./rebornsecretstuff.json" # Path to your Firebase Admin SDK service account key
FRONTEND_URL="http://localhost:5173" # Or your frontend's production URL

# Monero Wallet RPC Configuration
MONERO_RPC_HOST="127.0.0.1"
MONERO_RPC_PORT="18081"
MONERO_WALLET_RPC_USER=""
MONERO_WALLET_RPC_PASSWORD=""
```
Ensure `rebornsecretstuff.json` (your Firebase Admin SDK private key file) is placed in the `backend/` directory as specified.

## Frontend Setup and Commands

Navigate to the project root directory:

*   **Install Dependencies:**
    ```bash
    npm install
    ```
*   **Run Development Server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server, usually at `http://localhost:5173`.
*   **Build for Production:**
    ```bash
    npm run build
    ```
*   **Preview Production Build:**
    ```bash
    npm run preview
    ```

## Backend Setup and Commands

Navigate to the `backend/` directory:

*   **Install Dependencies:**
    ```bash
    cd backend
    npm install
    ```
*   **Run Development Server:**
    *   The `backend/package.json` now includes a `dev` script:
        ```bash
        npm run dev
        ```
    *   The backend server will listen on `http://localhost:3000`.
*   **Run Tests:**
    ```bash
    npm test
    ```
    This executes tests using Mocha.
*   **Build for Production:**
    ```bash
    npm run build
    ```
    This will compile TypeScript files to JavaScript in the `dist` directory.
*   **Start Production Server:**
    ```bash
    npm run start
    ```

## Database (PostgreSQL)

Before running the backend, ensure your PostgreSQL database is set up and accessible with the credentials provided in `backend/.env`.

*   **Run Migrations:**
    ```bash
    cd backend
    npx knex migrate:latest
    ```
*   **Run Seeds (if available):**
    ```bash
    cd backend
    npx knex seed:run
    ```

# Development Conventions

*   **Languages:** TypeScript (Frontend and Backend).
*   **Frontend Framework:** React with Vite.
*   **Backend Framework:** Node.js/Express.js (TypeScript).
*   **Styling:** Implicitly uses Tailwind CSS classes (based on `index.html` inclusion, though no configuration found).
*   **State Management:** React Context API (`AuthContext`, `UIContext`).
*   **API Communication:** Frontend communicates with the custom Node.js/Express backend for critical actions (e.g., user profile initiation, reputation, moderation) and directly with Firebase Firestore for real-time data and notifications.
*   **Code Structure:** Features are modularized into `components/`, `pages/`, `context/`, `hooks/`, `lib/`, `features/`.
*   **Authentication Flow:** Frontend uses Firebase Authentication. Firebase ID tokens are passed to the custom backend to authenticate API requests via an `Authorization: Bearer <token>` header.
*   **Testing:** Backend uses Mocha, Chai, and Supertest. Frontend testing not explicitly configured in `package.json`.

# Missing Information / TODOs

*   **Frontend Testing:** No explicit frontend testing setup was identified.
*   **Backend TypeScript:** The backend is now in TypeScript.
*   **Linting/Formatting:** No explicit scripts for linting or code formatting (e.g., ESLint, Prettier) were found.
*   **Deployment Information:** Details on how to deploy this full-stack application to production environments (e.g., containerization, CI/CD) are not present in the analyzed files.
*   **Database Schema:** While migrations are present, a full E-R diagram or detailed schema documentation is not explicitly within the analyzed files.
*   **Firebase Admin Service Account:** The `rebornsecretstuff.json` file contains sensitive information and should be handled securely, typically not committed to version control directly.
*   **Backend Migrations/Tests:** Some migration files in the backend are still in JavaScript, while all test files have been converted to TypeScript. The remaining JavaScript migration files could be converted to TypeScript for full type safety.

This `GEMINI.md` file provides a comprehensive overview for future interactions.
# Project Progress Update

## Overall Progress Estimate: **60-65% Complete** towards a fully production-ready state.

This estimate considers the core functionality, migration, tooling, and an initial assessment of production readiness requirements (testing, security, performance, DevOps, unaddressed features).

## What Has Been Accomplished:

### **1. Backend Migration & API Implementation:**
*   **Firebase to PostgreSQL Migration:** Successfully migrated core data models (users, categories, threads, posts, reputation, moderation actions, user profiles, profile comments, user vouches) to PostgreSQL.
*   **API Endpoints:** Implemented comprehensive RESTful API endpoints for:
    *   User Authentication/Profile Management (`/api/users/initiate-profile`, `/api/users/:uid`, `/api/users/:uid/profile`, `/api/users/:uid/comments`, `/api/users/:uid/vouch`, `/api/users/:uid` for deletion).
    *   Forum Management (`/api/forum/categories`, `/api/forum/threads`, `/api/forum/posts`).
    *   Reputation and Moderation (`/api/reputation/vote`, `/api/moderation/warn`).
    *   Image Uploads (`/api/upload/image`) proxied securely to ImgBB.
*   **Authentication/Authorization:** Integrated Firebase Admin SDK for secure token verification on all protected backend routes.
*   **Database Schema:** Created necessary Knex migrations for new tables (`profile_comments`, `user_vouches`) and columns (`postCount`, `trustScore`, `vouchCount`, `profileViews`, `createdAt`, `updatedAt`) in the `users` table.

### **2. Frontend Refactoring & Integration:**
*   **API Consumption:** Frontend (React) components (`AuthContext`, `AuthModal`, `useUserActions`, `UserProfileModal`, `useForumApi` replacing `useFirestore`, `Home`, `Category`, `Thread`, `ThreadController`) have been refactored to consume the new backend APIs instead of direct Firebase client SDK calls.
*   **Axios Integration:** Implemented Axios with an interceptor for automatic Firebase ID token attachment to backend requests.
*   **Firebase Cleanup (Partial):** `firebase.ts` and `useFirestore.ts` have been removed. Direct Firestore SDK imports have been eliminated from core migrated components.

### **3. Code Quality & Tooling:**
*   **Linting & Formatting:** Implemented ESLint and Prettier for consistent code style across both frontend and backend (TypeScript, React, Node.js).
*   **Backend Code Style:** Improved backend code (controllers, middleware, main `index.ts`) for better readability, idiomatic patterns, centralized logging, and consistent error handling.

### **4. Deployment Preparation:**
*   **Backend Dockerization:** Created a `Dockerfile` and `.dockerignore` for the backend application, enabling containerized deployment.

## What Needs to Be Done (Remaining Tasks for Production Readiness):

### **1. Comprehensive Testing:**
*   **Backend Test Conversion & Expansion:**
    *   Convert existing JavaScript tests (`moderation.test.js`, `users.test.js`) to TypeScript.
    *   **Expand Test Coverage:** Significantly add more unit, integration, and end-to-end tests for all new and modified backend endpoints (e.g., all user profile endpoints, comment endpoints, image upload).
*   **Frontend Testing:** Implement unit, integration, and end-to-end tests for the React application.

### **2. Real-time Feature Re-implementation (Deferred):**
*   **Shoutbox:** Re-implement real-time Shoutbox functionality using a new backend approach (e.g., WebSockets/SSE) and integrate it with the frontend.
*   **Online Users Tracking:** Re-implement real-time online user tracking with backend support.

### **3. Security Enhancements:**
*   **Input Sanitization:** Implement server-side input sanitization where necessary (e.g., `xss` library).
*   **Secrets Management:** Implement a more robust secrets management strategy for production environments (e.g., environment-specific variables, vault solutions) beyond simple `.env` files.
*   **Dependency Audits:** Regular and automated security audits of dependencies.
*   **HTTPS Enforcement:** Configure web server/load balancer to enforce HTTPS.

#### **Secrets Management Strategy**

For production environments, relying solely on `.env` files is not recommended due to security risks. Instead, consider the following:

1.  **Environment Variables**: Utilize your deployment platform's native environment variable management system (e.g., Netlify Environment Variables, Vercel Environment Variables, Docker secrets, Kubernetes secrets). This keeps sensitive information out of your codebase and allows for easy rotation.
2.  **Secret Management Services**: For highly sensitive data or complex requirements, integrate with dedicated secret management services such as:
    *   **AWS Secrets Manager**
    *   **Google Cloud Secret Manager**
    *   **Azure Key Vault**
    *   **HashiCorp Vault**
3.  **Firebase Admin Service Account (`rebornsecretstuff.json`)**: This file contains the private key for your Firebase Admin SDK and **must never be committed to version control**.
    *   **Development**: For local development, you may place it in the `backend/` directory as specified in `backend/.env`.
    *   **Production**: In production, avoid placing this file directly on the filesystem. Instead, consider storing its content securely (e.g., as a base64-encoded string) in an environment variable or a secret management service. The backend application can then read this environment variable, decode it, and initialize the Firebase Admin SDK. Update the `backend/index.ts` to load the service account credentials from an environment variable if `FIREBASE_SERVICE_ACCOUNT_BASE64` is set, for example.

#### **HTTPS Enforcement**

Enforcing HTTPS is crucial for securing communication between clients and the server, protecting against eavesdropping, tampering, and message forgery. This is typically handled at the infrastructure level, outside of the application code itself.

**Recommendations:**

1.  **Load Balancers/Proxies**: If you are using a load balancer (e.g., AWS Elastic Load Balancing, Google Cloud Load Balancing) or a reverse proxy (e.g., Nginx, Apache), configure it to:
    *   **Redirect HTTP to HTTPS**: Automatically redirect all incoming HTTP traffic to HTTPS.
    *   **Terminate SSL/TLS**: Handle SSL/TLS certificates and encryption/decryption.
2.  **CDN Configuration**: If using a Content Delivery Network (CDN) like Cloudflare, configure it to:
    *   **Full (strict) SSL**: Encrypt all traffic between the client and the CDN, and between the CDN and your origin server.
    *   **Always Use HTTPS**: Force all traffic to use HTTPS.
3.  **HSTS (HTTP Strict Transport Security)**: Implement HSTS headers to instruct browsers to *only* interact with your site using HTTPS, even if a user attempts to access it via HTTP. This helps prevent SSL stripping attacks.
4.  **Application-level Redirect (as a fallback)**: While not ideal as a primary solution, your application can include a simple middleware to redirect HTTP to HTTPS. However, it's generally more efficient and secure to handle this at the edge (load balancer/proxy/CDN).

**Example (Nginx configuration snippet for HTTP to HTTPS redirect):**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/yourdomain.com.crt;
    ssl_certificate_key /etc/nginx/ssl/yourdomain.com.key;

    # ... other SSL settings and proxy_pass to your application
}
```

This ensures that all traffic to your application is encrypted and secure.

### **4. Performance Optimization:**
*   **Database Indexing:** Comprehensive review and application of database indexes.
*   **Caching:** Implement caching for frequently accessed data.
*   **Query Optimization:** Profile and optimize database queries for performance.
*   **Frontend Performance:** Code splitting, lazy loading, image optimization, memoization.

#### **Database Query Optimization**

Optimizing database queries is crucial for application responsiveness and scalability. A systematic approach involves identifying slow queries, understanding their execution plans, and refining them.

**Recommendations:**

1.  **Identify Slow Queries**:
    *   **Database Logs**: Configure your PostgreSQL database to log slow queries (e.g., using `log_min_duration_statement`).
    *   **Application Monitoring**: Integrate APM (Application Performance Monitoring) tools (e.g., New Relic, Datadog, Prometheus with Grafana) to track query performance.
    *   **Knex Debugging**: Enable `debug: true` in your Knex configuration during development to see generated SQL and query timings.
2.  **Analyze Query Plans (EXPLAIN)**:
    *   Use `EXPLAIN ANALYZE` in PostgreSQL to view the query execution plan. This will show you how PostgreSQL is executing your query, where time is spent, and if indexes are being used effectively.
    *   Look for full table scans, inefficient joins, and large sorts that could be optimized.
3.  **Optimize Query Structure**:
    *   **Select Only Necessary Columns**: Avoid `SELECT *`. Retrieve only the columns your application needs.
    *   **Refine `WHERE` Clauses**: Ensure conditions are specific and can leverage indexes.
    *   **Optimize `JOIN`s**: Use appropriate join types and ensure join conditions are indexed.
    *   **Avoid Subqueries (where possible)**: Sometimes subqueries can be rewritten as `JOIN`s for better performance.
    *   **Batch Operations**: For multiple inserts/updates/deletes, use batch operations instead of individual statements.
4.  **Leverage Indexes**: Ensure that columns frequently used in `WHERE`, `ORDER BY`, `GROUP BY`, and `JOIN` clauses are indexed.
    *   **Composite Indexes**: Consider creating composite indexes for queries that filter on multiple columns.
    *   **Partial Indexes**: For large tables, partial indexes (indexes on a subset of rows) can be useful.
5.  **Connection Pooling**: Ensure your application uses an efficient database connection pool (Knex handles this by default) to manage connections effectively.
6.  **Regular Review**: Periodically review your most critical or slowest queries as application usage patterns evolve.

#### **Frontend Performance**

Optimizing frontend performance is key to a good user experience. This involves reducing initial load times, improving rendering speed, and ensuring smooth interactions.

**Recommendations:**

1.  **Code Splitting and Lazy Loading**:
    *   **Route-based Splitting**: Use `React.lazy` and `React.Suspense` to split the application into smaller chunks based on routes. This has been implemented in `App.tsx`.
    *   **Component-based Splitting**: For large components that are not always visible (e.g., modals, complex tabs), consider lazy loading them as well.
2.  **Memoization**:
    *   Use `React.memo` for functional components to prevent unnecessary re-renders when their props haven't changed. This is particularly effective for presentational components and components in large lists. This has been implemented for components in `components/UI.tsx`.
    *   Use `useMemo` to memoize expensive calculations and `useCallback` to memoize functions passed down to child components.
3.  **Image Optimization**:
    *   **Modern Formats**: Serve images in modern formats like WebP, which offer better compression than traditional JPEG and PNG.
    *   **Compression**: Use image compression tools to reduce file sizes without significant quality loss.
    *   **Lazy Loading**: For off-screen images, use `loading="lazy"` attribute to defer their loading until they are about to enter the viewport.
    *   **Image CDN**: Use a Content Delivery Network (CDN) or an image optimization service (e.g., Cloudinary, Imgix) to handle image resizing, format conversion, and caching.
4.  **Bundle Size Analysis**:
    *   Use tools like `vite-plugin-bundle-visualizer` to analyze the contents of your JavaScript bundles and identify large dependencies that could be optimized or replaced.
5.  **Efficient State Management**:
    *   Be mindful of how state updates affect your component tree. Avoid placing rapidly changing state high up in the component tree if it causes many unnecessary re-renders. Use context providers strategically and consider more advanced state management libraries if needed.

### **5. Deployment & Operations (DevOps):**
*   **CI/CD Pipeline:** Set up automated Continuous Integration/Continuous Deployment workflows.
*   **Monitoring & Alerting:** Integrate monitoring tools for application health, performance, and error detection.
*   **Scalability:** Plan and implement strategies for horizontal scaling and load balancing.
*   **Backup & Restore:** Establish robust database backup and recovery procedures.

#### **CI/CD Pipeline**

Automating your build, test, and deployment processes with a CI/CD (Continuous Integration/Continuous Deployment) pipeline is essential for efficient and reliable software delivery. A sample GitHub Actions workflow has been provided in `.github/workflows/ci.yml`.

**Workflow Overview:**

The provided workflow (`.github/workflows/ci.yml`) demonstrates the basic steps for a CI pipeline:

1.  **Trigger**: The workflow is triggered on every `push` and `pull_request` to the `main` branch.
2.  **Setup**: It checks out the code and sets up the Node.js environment.
3.  **Install & Build**:
    *   It installs dependencies for both the frontend and backend.
    *   It runs the build process for both the frontend (`npm run build`) and the backend (`npm run build` in the `backend` directory).
4.  **Testing (Placeholder)**:
    *   The workflow includes a commented-out section for running backend tests. To enable this, you would need to set up a test database and provide the necessary environment variables as GitHub Secrets.
5.  **Deployment (Placeholder)**:
    *   The workflow includes commented-out sections for deploying the frontend and backend. These would need to be replaced with your specific deployment scripts or actions (e.g., using `actions/deploy-pages` for GitHub Pages, `aws-actions/configure-aws-credentials` for AWS, or custom scripts for SSH/Docker).

**Recommendations for a Production-ready CI/CD Pipeline:**

1.  **Environment-specific Configuration**: Use different configurations and secrets for development, staging, and production environments.
2.  **Automated Testing**: Ensure your pipeline runs all relevant tests (unit, integration, end-to-end) before deploying to prevent regressions.
3.  **Linting and Code Style Checks**: Integrate your linting and formatting scripts (`npm run lint`, `npm run format:check`) into the pipeline to enforce code quality.
4.  **Security Scanning**: Add steps to run security audits on your dependencies (`npm audit`) and perform static analysis security testing (SAST).
5.  **Database Migrations**: For automated deployments, ensure your pipeline can run database migrations (`npx knex migrate:latest`) against the target database. This requires careful handling of database credentials and permissions.
6.  **Notifications**: Configure notifications (e.g., via Slack or email) to alert your team of build successes or failures.
7.  **Artifacts**: Store build artifacts (e.g., the `dist` directories) for later deployment or analysis.

**Sample GitHub Actions Workflow (`.github/workflows/ci.yml`):**
```yaml
name: Node.js CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20.x]

    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install Frontend Dependencies
      run: npm install

    - name: Build Frontend
      run: npm run build

    - name: Install Backend Dependencies
      run: npm install
      working-directory: ./backend

    - name: Build Backend
      run: npm run build
      working-directory: ./backend

    # - name: Run Backend Tests
    #   run: npm test
    #   working-directory: ./backend
    #   env:
    #     CI: true
    #     # You would need to set up your test database and other environment variables here
    #     # For example, using services: https://docs.github.com/en/actions/using-containerized-services
    #     PGHOST: localhost
    #     PGUSER: postgres
    #     PGPASSWORD: password
    #     PGDATABASE: test_db
    #     PGPORT: 5432

    # - name: Deploy Frontend
    #   uses: actions/deploy-pages@v4 # Example for GitHub Pages
    #   with:
    #     # Configure deployment settings
    #
    # - name: Deploy Backend
    #   run: |
    #     # Add your backend deployment script here
    #     # e.g., ssh into a server, docker push, etc.
    #   env:
    #     # Add production environment variables here, using GitHub Secrets
    #     FIREBASE_SERVICE_ACCOUNT_BASE64: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_BASE64 }}
```

#### **Monitoring & Alerting**

Proactive monitoring and alerting are essential for maintaining application health and performance.

**Recommendations:**

1.  **Health Checks**:
    *   The backend includes a `/health` endpoint that can be used by monitoring services to check the application's status and database connectivity.
    *   Configure your monitoring service to periodically ping this endpoint and alert you if it becomes unresponsive or reports an error.
2.  **Application Performance Monitoring (APM)**:
    *   Integrate with an APM tool like **Datadog**, **New Relic**, or **Sentry** to get detailed insights into application performance, identify bottlenecks, and track errors.
    *   These tools can monitor transaction times, database query performance, external service calls, and more.
3.  **Log Aggregation**:
    *   Use a log aggregation service (e.g., **Logstash**, **Graylog**, **Papertrail**, or the logging features of your APM tool) to collect and analyze logs from all your application instances.
    *   The backend is already configured to use `winston` for structured logging, which can be easily integrated with these services.
4.  **Frontend Monitoring**:
    *   Use a frontend-specific monitoring service (e.g., Sentry, Datadog RUM) to track frontend performance, JavaScript errors, and user interactions.
5.  **Alerting**:
    *   Configure alerts based on key metrics, such as:
        *   High error rates
        *   Increased response times
        *   High CPU or memory usage
        *   Failed health checks
    *   Set up notifications for these alerts to be sent to your team via Slack, email, or another on-call management tool.

#### **Scalability & Load Balancing**

As the application grows, you will need to scale it horizontally (i.e., run multiple instances of your backend) to handle increased traffic.

**Recommendations:**

1.  **Stateless Backend**: The backend should be as stateless as possible. The current implementation uses in-memory storage for online users, which is not suitable for a multi-instance setup. For production scaling, this should be replaced with a distributed store like Redis.
2.  **Load Balancing**: Use a load balancer to distribute traffic evenly across your backend instances.
3.  **Sticky Sessions (for WebSockets)**:
    *   Standard load balancing (like round-robin) does not work well with WebSockets, as it can cause a user's connection to be dropped or re-established with a different server instance.
    *   Enable **sticky sessions** (also known as session affinity) on your load balancer. This ensures that a user's requests (including WebSocket connections) are consistently routed to the same backend instance.
4.  **`socket.io` with Redis Adapter**:
    *   For a truly scalable WebSocket setup, use the `socket.io-redis` adapter.
    *   This adapter uses a Redis instance as a backplane to broadcast events across all `socket.io` instances, so you don't need sticky sessions. This is the recommended approach for production environments.
    *   To implement this, you would install `socket.io-redis` and modify your `backend/index.ts` to use the adapter.

**Example (`socket.io-redis` integration):**
```typescript
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
});
```

#### **Database Backup & Recovery**

Regularly backing up your database is critical for disaster recovery.

**Recommendations:**

1.  **Automated Backups**:
    *   If using a managed database service (e.g., Amazon RDS, Google Cloud SQL, Azure Database for PostgreSQL), enable automated backups.
    *   If self-hosting PostgreSQL, use `pg_dump` and a `cron` job to schedule regular backups.
2.  **Backup Strategy**:
    *   **Full Backups**: Perform full backups daily or weekly.
    *   **Point-in-Time Recovery (PITR)**: Use write-ahead logging (WAL) to enable point-in-time recovery, allowing you to restore the database to a specific moment.
3.  **Backup Storage**:
    *   Store backups in a secure, off-site location (e.g., Amazon S3, Google Cloud Storage).
    *   Ensure backups are encrypted at rest.
4.  **Recovery Plan**:
    *   Document the process for restoring a backup.
    *   Regularly test your recovery process to ensure it works as expected.

**Example (`pg_dump` command for a manual backup):**
```bash
pg_dump -U your_user -h your_host -p your_port your_database > backup.sql
```

### **6. Unaddressed Core Features from Original Spec:**
*   **Cryptocurrency (Monero) based User Upgrades and Escrow system:** This significant feature from the original `GEMINI.md` overview has not yet been addressed in the migration.
*   **Real-time Notifications and Global Broadcasts:** Requires a real-time backend component.
