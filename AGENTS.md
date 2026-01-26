# AI Agentic Development Guidelines

This document outlines the operational protocols, coding standards, and testing procedures for AI agents (and human developers) working on the Avica NestJS Backend repository.

## 1. Environment & Build Commands

- **Package Manager:** `npm` (Lockfile: `package-lock.json`)
- **Runtime:** Node.js (via `ts-node` for dev, `node` for prod)
- **Framework:** NestJS (Express adapter)

### Essential Commands

- **Install Dependencies:** `npm install`
- **Start Development Server:** `npm run start:dev` (Watch mode)
- **Production Build:** `npm run build` (Outputs to `dist/`)
- **Start Production:** `npm run start:prod`
- **Lint:** `npm run lint` (ESLint)
- **Format:** `npm run format` (Prettier)
- **Database (Prisma):**
  - Generate Client: `npx prisma generate`
  - Seed Database: `npx prisma db seed` (Configured in `package.json` under `prisma.seed`)
- **Routes:**
  - Copy Routes: `npm run routes:copy` (Copies `routes.json` to `dist/`)

> **Note on Tests:** Currently, there are no visible test files (`*.spec.ts` or `*.test.ts`) in the `src` or `test` directories. When creating new features, **always add unit tests** (e.g., `feature.service.spec.ts`) using the standard NestJS testing utilities (`@nestjs/testing`).

## 2. Code Style & Conventions

### General Structure

- **Module-Based Architecture:** Follow the strict NestJS module structure: `feature.module.ts`, `feature.controller.ts`, `feature.service.ts`.
- **Platform Separation:** Separate controllers/logic for different clients if necessary (e.g., `web.controller.ts`, `app.controller.ts`, `medication.web.ts`, `medication.app.ts`).
- **DTOs:** Always use DTOs (Data Transfer Objects) for request validation, located in `src/[feature]/dto/`.
- **Types:** Define interfaces/types in `src/[feature]/types.d.ts` or `src/types/`.

### Formatting & Linting

- **Style Guide:** Prettier + ESLint.
- **Indentation:** 2 spaces (standard Prettier).
- **Quotes:** Single quotes preferred.
- **Semicolons:** Always used.
- **Line Length:** Generally 80-120 chars (Prettier defaults).
- **Imports:** Organize imports by group:
  1. External libraries (`@nestjs/...`, `prisma`, etc.)
  2. Internal absolute imports (`src/...`)
  3. Relative imports (`./dto`, `./types`)

### Naming Conventions

- **Files:** `kebab-case.ts` (e.g., `patient-service.ts`, `auth.controller.ts`).
- **Classes:** `PascalCase` (e.g., `PatientService`, `AuthModule`).
- **Variables/Functions:** `camelCase` (e.g., `addPatient`, `encryptPassword`).
- **Database Fields:** `snake_case` (observed in Prisma usage: `first_name`, `organization_id`).
- **Interfaces:** `PascalCase` (e.g., `AddPatientResult`).

### Error Handling

- **Global Filters:** The app uses a global exception filter. Ensure custom exceptions extend standard NestJS `HttpException` or use built-in exceptions (`NotFoundException`, `BadRequestException`).
- **Try/Catch:** Use try/catch blocks in services, especially for external API calls (e.g., Vivalink, SendGrid) or database transactions. Log errors before throwing or returning error objects.
- **Response Format:** The app uses a global `ResponseInterceptor` (`src/interceptor/response.interceptor.ts`) that standardizes responses, especially for mobile clients.

### Typing & Validation

- **Strict Types:** Avoid `any` where possible. Use explicit return types for all service methods.
- **Validation Pipes:** The app uses global `ValidationPipe`. Decorate DTO properties with `class-validator` decorators (`@IsString()`, `@IsOptional()`, etc.).
- **Transformation:** `enableImplicitConversion: true` is set globally.

## 3. Specific Patterns

### Database (Prisma)

- Inject `PrismaService` into other services.
- Use `snake_case` for database column names in queries.
- Use `$transaction` for operations requiring atomicity (e.g., creating a user and a patient record simultaneously).

### External Integrations

- **Puppeteer:** Used for some automation tasks (e.g., Vivalink scraping). Ensure headless mode configuration matches `src/patient/patient.service.ts`.
- **Email:** Uses SendGrid (`SendgridService`).
- **Configuration:** Use `dotenv` and `process.env` for secrets.

## 4. Testing (Future Implementation)

Since no tests currently exist, follow this pattern when adding them:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureService } from './feature.service';

describe('FeatureService', () => {
  let service: FeatureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeatureService],
    }).compile();

    service = module.get<FeatureService>(FeatureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

To run a single test file (once created):
`npx jest src/path/to/test.spec.ts`
