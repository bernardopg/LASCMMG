# AI Development Rules for LASCMMG Application

This document outlines the technical stack and specific library usage guidelines for developing the LASCMMG application. Adhering to these rules ensures consistency, maintainability, and leverages the strengths of our chosen technologies.

## 1. Tech Stack Overview

The LASCMMG application is built with a modern and robust technology stack:

- **Frontend Framework**: React.js for building dynamic and interactive user interfaces.
- **Styling**: Tailwind CSS for a utility-first approach to styling, enabling rapid and consistent UI development.
- **UI Component Library**: Shadcn/ui for accessible, customizable, and pre-built UI components, often built on Radix UI primitives.
- **Frontend Routing**: React Router for declarative navigation within the Single-Page Application (SPA).
- **Backend Runtime**: Node.js with Express.js for building a fast and scalable RESTful API server.
- **Database**: SQLite for local data persistence, managed efficiently with `better-sqlite3`.
- **Caching & Session Management**: Redis for high-performance caching, rate limiting, and managing session-related data like refresh tokens.
- **Data Validation**: Joi (backend) and Yup (frontend, integrated with Formik) for robust and consistent data validation.
- **HTTP Client**: Axios for making asynchronous HTTP requests from the frontend to the backend API.
- **Icons**: Lucide React for a comprehensive and easily customizable set of SVG icons.
- **Real-time Communication**: Socket.IO for enabling real-time features and notifications between the server and clients.
- **Language**: JavaScript (ES6+) is used across the codebase. TypeScript dependencies are included for future migration considerations.

## 2. Library Usage Guidelines

To maintain a cohesive and efficient development process, please follow these guidelines for library usage:

- **UI Components**:
  - **Prioritize Shadcn/ui**: For any new UI element, always check if `shadcn/ui` offers a suitable component first. These components are pre-styled with Tailwind CSS and are highly accessible.
  - **Radix UI**: If a specific `shadcn/ui` component is not available or requires customization beyond `shadcn/ui`'s capabilities, `Radix UI` can be used directly for unstyled, accessible primitives.
  - **Custom Components**: Only create entirely new custom components if neither `shadcn/ui` nor `Radix UI` can fulfill the requirement. Keep custom components small, focused, and reusable.
  - **Styling**: All UI components (whether from `shadcn/ui`, `Radix UI`, or custom-built) **must** be styled using **Tailwind CSS** utility classes. Avoid inline styles or separate CSS files unless absolutely necessary for complex, unique scenarios.

- **Frontend Routing**: Use `react-router-dom` for all application navigation. The main application routes should be defined and managed within `src/App.jsx`.

- **Frontend State Management**: Leverage the **React Context API** for managing application-wide state. Avoid introducing additional state management libraries unless a clear and complex need arises that Context API cannot efficiently address.

- **API Communication (Frontend)**: All HTTP requests to the backend API must be made using **Axios**. Centralize API calls within `src/services/api.js`.

- **Icons**: Use **Lucide React** for all icons throughout the application.

- **Form Handling (Frontend)**: For form management and validation, use **Formik** in conjunction with **Yup** for schema validation.

- **Data Validation (Backend)**: All incoming API request data on the backend must be validated using **Joi**.

- **Logging (Backend)**: Use **Pino** for all server-side logging to ensure consistent and performant log output.

- **Real-time Features**: Implement any real-time communication or notification features using **Socket.IO**.

- **File Structure**:
  - Frontend page-level components should reside in `frontend-react/src/pages/`.
  - Reusable UI components should be placed in `frontend-react/src/components/`.
  - Custom React hooks belong in `frontend-react/src/hooks/`.
  - General utility functions should be in `frontend-react/src/utils/`.
  - Backend logic is organized under `backend/lib/`, API endpoints in `backend/routes/`, and database interaction models in `backend/models/`.
