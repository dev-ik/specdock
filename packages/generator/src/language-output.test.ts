import { describe, expect, it } from "vitest";
import { generateSdk } from "./index.js";

const spec = {
  openapi: "3.1.0",
  info: { title: "Test", version: "1.0.0" },
  paths: {
    "/users/{id}": {
      get: {
        operationId: "getUser",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: { "200": { description: "OK" } }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
          age: { type: "integer" }
        }
      }
    }
  }
};

describe("language-specific SDK output", () => {
  it("generates Python SDK files", () => {
    const files = generateSdk(spec, { language: "python" });

    expect(pathsWithoutMetadata(files)).toEqual([
      "generated/pyproject.toml",
      "generated/specdock_client/__init__.py",
      "generated/specdock_client/client.py",
      "generated/specdock_client/models.py"
    ]);
    expect(files.find((file) => file.path.endsWith("pyproject.toml"))?.content).toContain(
      '"httpx>=0.27.0"'
    );
    expect(files.find((file) => file.path.endsWith("client.py"))?.content).toContain(
      "def getUser(client: SpecDockClient"
    );
    expect(files.find((file) => file.path.endsWith("models.py"))?.content).toContain(
      "class User(TypedDict):"
    );
  });

  it("escapes untrusted Python path literals without f-string execution", () => {
    const files = generateSdk(
      specWithPath("/users/{user-id}/{__import__('os').system('id')}"),
      { language: "python" }
    );
    const client = files.find((file) => file.path.endsWith("client.py"))?.content;

    expect(client).toContain(
      `path = "/users/" + quote(str(user_id), safe='') + "/{__import__('os').system('id')}"`
    );
    expect(client).not.toContain("path = f");
  });

  it("generates Go SDK files", () => {
    const files = generateSdk(spec, { language: "go" });

    expect(pathsWithoutMetadata(files)).toEqual([
      "generated/go.mod",
      "generated/client.go",
      "generated/models.go"
    ]);
    expect(files.find((file) => file.path.endsWith("go.mod"))?.content).toContain(
      "module specdockclient"
    );
    expect(files.find((file) => file.path.endsWith("client.go"))?.content).toContain(
      "func GetUser(ctx context.Context, client *Client"
    );
    expect(files.find((file) => file.path.endsWith("models.go"))?.content).toContain(
      "type User struct"
    );
  });

  it("escapes untrusted Go path literals without expression injection", () => {
    const files = generateSdk(specWithPath('/users/{user-id}/{panic("x")}'), {
      language: "go"
    });
    const client = files.find((file) => file.path.endsWith("client.go"))?.content;

    expect(client).toContain(
      'path := "/users/" + url.PathEscape(userId) + "/{panic(\\"x\\")}"'
    );
    expect(client).not.toContain(' + panic("x") + ');
  });

  it("omits unsafe Go JSON tags from generated models", () => {
    const files = generateSdk(
      {
        ...spec,
        components: {
          schemas: {
            Unsafe: {
              type: "object",
              properties: {
                'bad`tag': { type: "string" }
              }
            }
          }
        }
      },
      { language: "go" }
    );
    const models = files.find((file) => file.path.endsWith("models.go"))?.content;

    expect(models).toContain("BadTag string");
    expect(models).not.toContain("bad`tag");
  });

  it("generates Java SDK files", () => {
    const files = generateSdk(spec, { language: "java" });

    expect(pathsWithoutMetadata(files)).toEqual([
      "generated/pom.xml",
      "generated/src/main/java/com/specdock/client/SpecDockClient.java",
      "generated/src/main/java/com/specdock/client/Models.java"
    ]);
    expect(files.find((file) => file.path.endsWith("pom.xml"))?.content).toContain(
      "jackson-databind"
    );
    expect(files.find((file) => file.path.endsWith("SpecDockClient.java"))?.content).toContain(
      "public JsonNode getUser(String id"
    );
    expect(files.find((file) => file.path.endsWith("Models.java"))?.content).toContain(
      "public static final class User"
    );
  });

  it("escapes untrusted Java path literals without expression injection", () => {
    const files = generateSdk(specWithPath('/users/{user-id}/{Runtime.getRuntime().exec("id")}'), {
      language: "java"
    });
    const client = files.find((file) => file.path.endsWith("SpecDockClient.java"))?.content;

    expect(client).toContain(
      'String path = "/users/" + encodePath(userId) + "/{Runtime.getRuntime().exec(\\"id\\")}";'
    );
    expect(client).not.toContain(' + Runtime.getRuntime().exec("id") + ');
  });

  it("generates C# SDK files", () => {
    const files = generateSdk(spec, { language: "csharp" });

    expect(pathsWithoutMetadata(files)).toEqual([
      "generated/SpecDock.Client.csproj",
      "generated/SpecDockClient.cs",
      "generated/Models.cs"
    ]);
    expect(files.find((file) => file.path.endsWith(".csproj"))?.content).toContain(
      "<Nullable>enable</Nullable>"
    );
    expect(files.find((file) => file.path.endsWith("SpecDockClient.cs"))?.content).toContain(
      "public Task<JsonElement?> GetUserAsync(string id"
    );
    expect(files.find((file) => file.path.endsWith("SpecDockClient.cs"))?.content).toContain(
      "CancellationToken cancellationToken = default"
    );
    expect(files.find((file) => file.path.endsWith("Models.cs"))?.content).toContain(
      "public sealed class User"
    );
  });

  it("escapes untrusted C# path literals without expression injection", () => {
    const files = generateSdk(specWithPath('/users/{user-id}/{System.Diagnostics.Process.Start("id")}'), {
      language: "csharp"
    });
    const client = files.find((file) => file.path.endsWith("SpecDockClient.cs"))?.content;

    expect(client).toContain(
      'var path = "/users/" + Uri.EscapeDataString(userId) + "/{System.Diagnostics.Process.Start(\\"id\\")}";'
    );
    expect(client).not.toContain(' + System.Diagnostics.Process.Start("id") + ');
  });

  it("generates PHP SDK files", () => {
    const files = generateSdk(spec, { language: "php" });

    expect(pathsWithoutMetadata(files)).toEqual([
      "generated/composer.json",
      "generated/src/SpecDockClient.php",
      "generated/src/Models.php"
    ]);
    expect(files.find((file) => file.path.endsWith("composer.json"))?.content).toContain(
      '"guzzlehttp/guzzle": "^7.0"'
    );
    expect(files.find((file) => file.path.endsWith("SpecDockClient.php"))?.content).toContain(
      "public function getUser(string $id"
    );
    expect(files.find((file) => file.path.endsWith("Models.php"))?.content).toContain(
      "final class User"
    );
  });

  it("escapes untrusted PHP path literals without string interpolation", () => {
    const files = generateSdk(specWithPath("/users/{user-id}/{$danger->run()}"), {
      language: "php"
    });
    const client = files.find((file) => file.path.endsWith("SpecDockClient.php"))?.content;

    expect(client).toContain(
      "$path = '/users/' . rawurlencode((string) $userId) . '/{$danger->run()}';"
    );
    expect(client).not.toContain('"{$danger->run()}"');
  });
});

const specWithPath = (path: string) => ({
  ...spec,
  paths: {
    [path]: {
      get: {
        operationId: "get-user",
        parameters: [
          {
            name: "user-id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: { "200": { description: "OK" } }
      }
    }
  }
});

const pathsWithoutMetadata = (files: { path: string }[]) =>
  files
    .map((file) => file.path)
    .filter((path) => !path.endsWith("/README.md") && !path.endsWith("/specdock.manifest.json"));
