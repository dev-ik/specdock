import { describe, expect, it } from "vitest";
import { CurlImportError, importCurlCommand } from "./curl-import.js";

describe("importCurlCommand", () => {
  it("creates an OpenAPI spec and request state from a JSON POST cURL", () => {
    const imported = importCurlCommand(
      `curl -X POST 'https://api.example.com/users?include=profile' \
        -H 'Authorization: Bearer token' \
        -H 'Content-Type: application/json' \
        --data-raw '{"name":"Ada"}'`,
      "proxy"
    );
    const spec = JSON.parse(imported.specText);

    expect(imported.baseUrl).toBe("https://api.example.com");
    expect(imported.operationId).toBe("postUsers");
    expect(imported.requestState).toMatchObject({
      operationId: "postUsers",
      queryParams: { include: "profile" },
      headers: {
        Authorization: "Bearer token",
        "Content-Type": "application/json"
      },
      body: '{"name":"Ada"}',
      requestMode: "proxy"
    });
    expect(spec.paths["/users"].post.operationId).toBe("postUsers");
    expect(spec.paths["/users"].post.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "include",
          in: "query",
          example: "profile"
        }),
        expect.objectContaining({ name: "Authorization", in: "header" })
      ])
    );
    expect(
      spec.paths["/users"].post.parameters.find(
        (parameter: { name: string }) => parameter.name === "Authorization"
      )
    ).not.toHaveProperty("example");
    expect(
      spec.paths["/users"].post.requestBody.content["application/json"]
    ).not.toHaveProperty("example");
    expect(imported.specText).not.toContain("Bearer token");
    expect(imported.specText).not.toContain('"name": "Ada"');
  });

  it("defaults to POST when data is present", () => {
    const imported = importCurlCommand(
      "curl https://api.example.com/search -d 'q=specdock'"
    );
    const spec = JSON.parse(imported.specText);

    expect(spec.paths["/search"].post.operationId).toBe("postSearch");
    expect(imported.requestState.body).toBe("q=specdock");
  });

  it("moves -G data into query params", () => {
    const imported = importCurlCommand(
      "curl -G https://api.example.com/search -d 'q=specdock' -d 'page=1'"
    );
    const spec = JSON.parse(imported.specText);

    expect(imported.requestState.body).toBeUndefined();
    expect(imported.requestState.queryParams).toEqual({
      q: "specdock",
      page: "1"
    });
    expect(spec.paths["/search"].get.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "q", in: "query" }),
        expect.objectContaining({ name: "page", in: "query" })
      ])
    );
  });

  it("redacts sensitive query examples from imported cURL specs", () => {
    const imported = importCurlCommand(
      "curl 'https://api.example.com/users?api_key=secret&page=1'"
    );
    const spec = JSON.parse(imported.specText);
    const parameters = spec.paths["/users"].get.parameters;

    expect(
      parameters.find(
        (parameter: { name: string }) => parameter.name === "api_key"
      )
    ).not.toHaveProperty("example");
    expect(
      parameters.find(
        (parameter: { name: string }) => parameter.name === "page"
      )
    ).toHaveProperty("example", "1");
    expect(imported.specText).not.toContain("secret");
  });

  it("rejects non-curl commands", () => {
    expect(() => importCurlCommand("fetch https://example.com")).toThrow(
      CurlImportError
    );
  });
});
