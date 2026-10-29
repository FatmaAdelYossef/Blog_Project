# Backend secrets configuration

`BlogBack/Blog/appsettings.json` is committed with **empty placeholders only**. Never put real
credentials in any `appsettings*.json` file or anywhere else under version control.

Provide values through environment variables or the .NET Secret Manager (user-secrets).

## Configuration keys

| Configuration key | Environment variable | Notes |
| --- | --- | --- |
| `Jwt:Key` | `Jwt__Key` | JWT signing key. Use a random value of at least 256 bits (32 bytes). |
| `Jwt:Issuer` | `Jwt__Issuer` | Defaults to `BlogApi` in `appsettings.json`. |
| `Jwt:Audience` | `Jwt__Audience` | Defaults to `BlogUser` in `appsettings.json`. |
| `EmailSettings:Password` | `EmailSettings__Password` | SMTP password or app-specific password. |
| `EmailSettings:SenderEmail` | `EmailSettings__SenderEmail` | SMTP account / From address. |
| `ConnectionStrings:Connection1` | `ConnectionStrings__Connection1` | PostgreSQL connection string, for example `Host=localhost;Port=5432;Database=blog;Username=blog;Password=...`. |
| `Seed:DefaultPassword` | `Seed__DefaultPassword` | Password for the development seed users. If empty, seeding users is skipped. |
| `Frontend:Origin` | `Frontend__Origin` | Allowed CORS origin. Defaults to `http://localhost:5173`; set this in non-development environments. |

Environment variables take precedence over JSON files, so production deployments should set the
`__`-separated names above in the host's secret store or environment.

## User-secrets (local development)

User-secrets are loaded only when `ASPNETCORE_ENVIRONMENT=Development`. Initialize once per
checkout (this adds a `UserSecretsId` to `Blog.csproj`; it is not a secret):

```bash
dotnet user-secrets init --project BlogBack/Blog/Blog.csproj
```

Then set the values:

```bash
dotnet user-secrets set "Jwt:Key" "<random-256-bit-key>" --project BlogBack/Blog/Blog.csproj
dotnet user-secrets set "Jwt:Issuer" "BlogApi" --project BlogBack/Blog/Blog.csproj
dotnet user-secrets set "Jwt:Audience" "BlogUser" --project BlogBack/Blog/Blog.csproj
dotnet user-secrets set "EmailSettings:SenderEmail" "<smtp-account>" --project BlogBack/Blog/Blog.csproj
dotnet user-secrets set "EmailSettings:Password" "<smtp-password>" --project BlogBack/Blog/Blog.csproj
dotnet user-secrets set "ConnectionStrings:Connection1" "<connection-string>" --project BlogBack/Blog/Blog.csproj
dotnet user-secrets set "Seed:DefaultPassword" "<development-seed-password>" --project BlogBack/Blog/Blog.csproj
```

Values are stored outside the repository (under the user profile) and are never committed.

## Rotation

The JWT signing key and SMTP password were previously committed to this repository. Removing them
from the current files does not remove them from git history. Rotate both credentials (and any
database credential that was ever committed) wherever they are issued, and prefer short-lived,
per-environment secrets going forward.
