# SDK Output Specification

Default TypeScript output:

```txt
generated/
  types.ts
  client.ts
```

Optional output:

```txt
generated/
  hooks.ts
  schemas.ts
  index.ts
```

## Generate Options

```ts
export type GenerateOptions = {
  language: "typescript" | "python" | "go" | "java" | "csharp" | "php";
  client: "fetch" | "axios";
  generateTypes: boolean;
  generateReactQuery: boolean;
  generateZod: boolean;
  outputPath: string;
  namingStyle: "operationId" | "camelCase";
};
```

Python output:

```txt
generated/
  pyproject.toml
  specdock_client/
    __init__.py
    client.py
    models.py
```

Go output:

```txt
generated/
  go.mod
  client.go
  models.go
```

Java output:

```txt
generated/
  pom.xml
  src/main/java/com/specdock/client/
    SpecDockClient.java
    Models.java
```

C# output:

```txt
generated/
  SpecDock.Client.csproj
  SpecDockClient.cs
  Models.cs
```

PHP output:

```txt
generated/
  composer.json
  src/
    SpecDockClient.php
    Models.php
```

Every language also includes:

```txt
generated/
  README.md
  specdock.manifest.json
```

## Naming Rules

Prefer `operationId`.

Fallback:

```txt
GET /users         -> getUsers
GET /users/{id}    -> getUserById
POST /users        -> createUser
PUT /users/{id}    -> updateUserById
PATCH /users/{id}  -> patchUserById
DELETE /users/{id} -> deleteUserById
```

## Generator Rules

1. Generators are pure functions.
2. Generators return `GeneratedFile[]`.
3. Generators do not write to disk.
4. ZIP creation is separate.
5. Generated code must not depend on SpecDock runtime.

## Feature Support

| Language | Target | HTTP runtime | Models | Path/query/header/body |
| --- | --- | --- | --- | --- |
| TypeScript | TypeScript 5.x, Node.js 20+ or modern browsers | fetch or axios | Type aliases | Yes |
| Python | Python >=3.11 | httpx >=0.27.0 | TypedDict | Yes |
| Go | Go 1.22 | net/http | Structs | Yes |
| Java | Java 17 | java.net.http + Jackson 2.17.2 | Jackson DTOs | Yes |
| C# | .NET 8.0 | HttpClient | System.Text.Json DTOs | Yes |
| PHP | PHP >=8.1 | Guzzle ^7.0 | DTO classes | Yes |

Future CLI shape:

```bash
specdock generate --language python --input openapi.yaml --out sdk/
```

## Release Smoke Checks

Run:

```bash
npm run test:sdk-smoke
```

The smoke check generates every supported language from one fixture contract,
validates required files plus `README.md` and `specdock.manifest.json`, and
writes the output to a temporary directory. It always type-checks generated
TypeScript. If local toolchains are available, it also runs Python compile,
Go tests, Maven test, .NET build, PHP lint, and Composer validation.

## MVP Limitations

MVP may skip:

- allOf/oneOf/anyOf advanced support
- multipart/form-data
- binary uploads
- OAuth flows
- advanced parameter serialization
