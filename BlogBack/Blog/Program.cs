using System;
using System.Text;
using System.Threading.RateLimiting;
using Blog.Middleware;
using BusinessLogicLayer.Services;
using BusinessLogicLayer.Services.JWT;
using DataAccessLayer.Context;
using DataAccessLayer.Models;
using DataAccessLayer.Seeders;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SharedLayer.ConfigClasses;

var builder = WebApplication.CreateBuilder(args);

// Fail fast on missing required configuration instead of booting a broken app.
// Secrets come from environment variables or user-secrets — never appsettings.
var connectionString = builder.Configuration.GetConnectionString("Connection1");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "ConnectionStrings:Connection1 is not configured. Set it via environment variables or user-secrets.");
}

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key is missing or too short (need at least 32 characters for HS256). " +
        "Set it via environment variables or user-secrets.");
}

foreach (var setting in new[] { "Jwt:Issuer", "Jwt:Audience" })
{
    if (string.IsNullOrWhiteSpace(builder.Configuration[setting]))
    {
        throw new InvalidOperationException($"{setting} is not configured.");
    }
}

// Optional persistent DataProtection key ring (needed if more than one instance
// must decrypt Identity tokens, e.g. reset-password links across replicas).
var dataProtectionKeyPath = builder.Configuration["DataProtection:KeyPath"];
if (!string.IsNullOrWhiteSpace(dataProtectionKeyPath))
{
    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeyPath));
}

builder.Services.AddDbContext<BlogDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Connection1")));

// inject business logic
builder.Services.Scan(scan => scan
    .FromAssembliesOf(typeof(JwtService))
    .AddClasses(classes => classes.Where(c => c.Name.EndsWith("Service")))
    .AsImplementedInterfaces()
    .WithScopedLifetime()
);


builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options => {
    // Login uses UserManager.CheckPasswordAsync (no SignInManager), and the email
    // confirmation flow is deferred until SMTP is configured — so confirmation is off.
    options.SignIn.RequireConfirmedAccount = false;
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 12;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
})
    .AddEntityFrameworkStores<BlogDbContext>()
    .AddDefaultTokenProviders();

// Configuration
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection(EmailSettings.SectionName));

// Auth
var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>();
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings?.Issuer,
        ValidAudience = jwtSettings?.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings?.Key ?? string.Empty))
    };
});


builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

// rate limiting for anonymous authentication endpoints
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // Authenticated uploads get their own per-user budget so a single account
    // cannot fill the disk with 5 MB images.
    options.AddPolicy("upload", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? context.Connection.RemoteIpAddress?.ToString()
                ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

// cors
var frontendOrigin = builder.Configuration["Frontend:Origin"];
if (string.IsNullOrWhiteSpace(frontendOrigin))
{
    frontendOrigin = "http://localhost:5173";
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend",
        policy =>
        {
            policy.WithOrigins(frontendOrigin)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddAutoMapper(configuration => { }, typeof(BusinessLogicLayer.Mapper.MappingProfile).Assembly);
builder.Services.AddHttpContextAccessor();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Blog API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// Hosted Services
builder.Services.AddHostedService<MigrationService<BlogDbContext>>();

// Health endpoint for PaaS platforms / load balancers (real DB connectivity check).
builder.Services.AddHealthChecks()
    .AddCheck<BusinessLogicLayer.Services.Health.BlogDbHealthCheck>("database");

var app = builder.Build();

// Behind PaaS load balancers (TLS termination) X-Forwarded-* headers carry the real
// client IP and scheme. Off by default; enabled in production via ForwardedHeaders__Enabled=true.
if (builder.Configuration.GetValue<bool>("ForwardedHeaders:Enabled"))
{
    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
    });
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    // Generic ProblemDetails 500 responses: no stack traces or internal messages.
    app.UseExceptionHandler();
    app.UseHsts();
}

// CSP is omitted in Development so Swagger UI keeps working.
app.UseMiddleware<SecurityHeadersMiddleware>(!app.Environment.IsDevelopment());

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Blog API V1");
    });
}

app.UseStaticFiles();
app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health").AllowAnonymous();
app.MapControllers();

await app.RunAsync();
