# SDK Output Specification

Default output:

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
  client: "fetch" | "axios";
  generateTypes: boolean;
  generateReactQuery: boolean;
  generateZod: boolean;
  outputPath: string;
  namingStyle: "operationId" | "camelCase";
};
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

## MVP Limitations

MVP may skip:

- allOf/oneOf/anyOf advanced support
- multipart/form-data
- binary uploads
- OAuth flows
- advanced parameter serialization
