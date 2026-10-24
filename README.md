# Blog Project

A full-stack blog application: a React single-page app in `BlogFront/` and an ASP.NET Core Web API in
`BlogBack/`. Users authenticate with JWT, manage posts and media, browse posts by category, and reset
their password by email.

## Tech stack

| Layer | Stack |
| --- | --- |
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7, Axios, DOMPurify, react-quill-new, Oxlint |
| Backend | .NET 8, ASP.NET Core Web API, Entity Framework Core 8, SQL Server, ASP.NET Core Identity, JWT bearer auth |
| Backend libraries | AutoMapper, Scrutor, Swashbuckle (Swagger) |

## Repository layout

```text
BlogFront/                 React SPA (Vite)
  src/                     pages, components, services, API endpoint definitions
  .env.example             example frontend environment file

BlogBack/
  Blog/                    API host: controllers, Program.cs, appsettings*.json, launch profiles
  BusinessLogicLayer/      services and AutoMapper profiles
  DataAccessLayer/         EF Core DbContext, migrations, models, seeders
  SharedLayer/             shared configuration classes and helpers
  BlogBack.sln             solution file
  README-SECRETS.md        backend configuration and secrets guide
```

## Prerequisites

- Node.js `^20.19.0` or `>=22.12.0` and npm (the Vite 8 and plugin-react engine requirement; CI uses
  Node.js 22).
- .NET 8 SDK.
- A SQL Server instance the API can reach (SQL Server Express, Developer, LocalDB, or containerized
  SQL Server).

## Configuration

`BlogBack/Blog/appsettings.json` is committed with empty placeholders only. Do not put real
credentials in any `appsettings*.json` file. Provide values through environment variables or the
.NET Secret Manager (user-secrets).

Connection string, JWT signing key, SMTP credentials, the development seed password, and the
allowed frontend origin are all configured this way. See
[`BlogBack/README-SECRETS.md`](BlogBack/README-SECRETS.md) for the full list of keys, environment
variable names, and user-secrets commands.

At startup the API applies pending EF Core migrations and runs the database seeders, so the database
must be reachable and the connection string configured before the first run.

## Run the backend

```bash
dotnet run --project BlogBack/Blog
```

Use an explicit launch profile to pick the URL: `--launch-profile https` listens on
`https://localhost:7034` (the frontend's default API base URL), while `--launch-profile http`
listens on `http://localhost:5218`. In Development, Swagger UI is available at `/swagger`.

To build without running:

```bash
dotnet build BlogBack/BlogBack.sln --configuration Release
```

## Run the frontend

```bash
cd BlogFront
npm ci
npm run dev
```

The dev server listens on `http://localhost:5173`, which matches the backend's default CORS origin.

### API base URL

The frontend reads `VITE_API_BASE_URL` in `BlogFront/src/config/apiEndpoints.js`. If it is not set,
the default is `https://localhost:7034/api`. To point the app at another API, set the variable in a
local `BlogFront/.env` file (copy `BlogFront/.env.example` as a starting point) or export it in your
shell before running Vite. Keep local environment overrides out of version control.

### Available scripts

Run from `BlogFront/`:

| Script | Command | Description |
| --- | --- | --- |
| `npm run dev` | `vite` | Start the development server with hot module replacement. |
| `npm run build` | `vite build` | Create a production build in `BlogFront/dist/`. |
| `npm run lint` | `oxlint` | Run the linter configured in `.oxlintrc.json`. |
| `npm run preview` | `vite preview` | Serve the production build locally. |

## Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request targeting
`main`, with read-only repository permissions. It has two independent jobs:

- **Frontend** — checks out the repo, installs Node.js 22 with the npm cache keyed on
  `BlogFront/package-lock.json`, then runs `npm ci`, `npm run lint`, and `npm run build` in
  `BlogFront/`.
- **Backend** — installs the .NET 8 SDK and runs
  `dotnet build BlogBack/BlogBack.sln --configuration Release` (the build performs its own restore).

A newer run on the same ref cancels the previous one via the workflow `concurrency` setting. The
workflow does not deploy or require repository secrets.

## Testing

There is no automated test suite yet. The checks available today are the frontend lint and
production build and the backend Release build, all of which run in CI.
