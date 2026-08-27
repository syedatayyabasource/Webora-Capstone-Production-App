# Webora — Website Operations & Client Workspace

Webora is a full-stack workspace for managing clients, projects, tasks, deadlines and project progress in one place. The application includes secure authentication and role-based access for different types of users.

## Features

* Landing page
* Login and signup
* Role-based access for Admin, Team Member and Client
* Dashboard / Overview
* Project management
* Client management
* Task management
* Team Access for Admin
* Search for projects, clients and tasks
* Project progress and deadlines
* Client and server-side validation
* Loading, empty, success and error states
* Responsive interface
* SQLite database
* JWT authentication
* Password hashing with bcrypt
* Protected frontend routes
* Backend authorization

## User Roles

### Admin

Admin has full access to the workspace.

* Create projects, clients and tasks
* Edit projects, clients and tasks
* Delete projects, clients and tasks
* Create and manage Team Member accounts
* Access Team Access

### Team Member

Team Members can manage day-to-day project and task work.

* View projects, clients and tasks
* Create projects and tasks
* Edit projects, clients and tasks
* Update task status and project progress
* Cannot delete records
* Cannot access Admin-only management features

### Client

Clients have a separate workspace for viewing their own project work.

* View their projects
* View their tasks
* Track project progress
* Check deadlines

Clients cannot create, edit or delete management records and cannot access Team Access.

## Authentication

Webora uses JWT authentication with bcrypt password hashing.

When a user logs in, the selected role is checked against the role stored for that account in the database. Selecting a role in the login form does not grant access by itself.

Protected routes are handled on the frontend, while the API also checks authentication and permissions on the server.

For example:

* Admin users can delete records.
* Team Members receive a `403` response when attempting restricted delete operations.
* Clients can only access projects and tasks connected to their account.
* Users cannot access Admin-only pages simply by changing the URL.

## Account Creation

Client accounts can be created through the signup page.

Admin and Team Member accounts are handled separately:

* Admin accounts are provisioned privately.
* Admins can create Team Member accounts through Team Access.
* Clients can register through the public signup form.
* Account roles are stored in the database and verified during login.

This keeps privileged workspace accounts separate from public registration.

## Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Node.js
* Express.js
* JWT
* bcrypt
* Zod

### Database

* SQLite
* better-sqlite3

### Testing

* Vitest
* React Testing Library
* Supertest

## Project Structure

```text
Webora
├── client
│   ├── src
│   └── ...
│
├── server
│   ├── src
│   ├── database
│   └── ...
│
├── README.md
├── DEPLOYMENT.md
└── package.json
```

## Database

The application uses SQLite to store the main application data.

```text
users
clients
projects
tasks
```

Projects are connected to clients, while tasks are connected to projects.

The database is created automatically when the server starts. The seed script can be used when initial application data is required.

## Getting Started

### Requirements

* Node.js 20 or newer
* npm

### Install Dependencies

From the project root:

```bash
npm install
npm run install:all
```

Create the environment file:

```text
server/.env
```

Use `server/.env.example` as a reference and add a secure JWT secret.

### Start the Application

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

The Express API runs alongside the frontend during development.

### Database Setup

The database is initialized automatically when the server starts.

If the seed script needs to be run manually:

```bash
npm --prefix server run seed
```

No Prisma setup is required. Webora uses SQLite through `better-sqlite3`.

## Testing

Run the test suite with:

```bash
npm test
```

The tests cover the main authentication, authorization, CRUD and UI flows, including:

* Login
* Role validation
* Protected routes
* Client access restrictions
* Delete permissions
* Form validation
* Client navigation
* Frontend route protection

## Production Build

Create a production build with:

```bash
npm run build
```

Then start the application:

```bash
npm start
```

The Express server can serve the built React application together with the API.

See `DEPLOYMENT.md` for deployment configuration and hosting instructions.

## Project Notes

A key part of Webora is keeping permissions on the server instead of relying only on the interface.

For example, hiding a Delete button from a Team Member is not enough. The API also checks the user's role before processing a delete request.

Client access is handled in the same way. A Client can only retrieve projects and tasks associated with their own account.

## Case Study

### Problem

Small web teams often manage clients, projects and tasks across different tools. This can make it harder to keep track of deadlines and project progress. Clients also need visibility into their work without getting access to internal management features.

### Solution

Webora brings clients, projects and tasks into one workspace. Team Members can manage day-to-day work, while Clients have a separate view of their own projects and tasks.

### Technology Choices

React was used for the frontend to build a reusable component-based interface.

Express provides the REST API and handles authentication and authorization.

SQLite provides a simple relational database for the application.

JWT is used for authenticated sessions, while bcrypt is used to securely hash passwords.

Zod is used for server-side input validation.

### Main Challenge

The main challenge was implementing different permissions for Admins, Team Members and Clients.

The solution was to enforce permissions on the backend as well as the frontend. This prevents users from gaining additional access by changing a URL or sending restricted API requests directly.

**Webora**
Website Operations & Client Workspace
Developed by Tayyaba Zahra
