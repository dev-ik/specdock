import type {
  HttpMethod,
  MockRouteSummary,
  MockRouteUpsertRequest
} from "@specdock/core";

export type StoredMockRoute = MockRouteUpsertRequest;

export const createMockRouteRegistry = () => {
  const routes = new Map<string, StoredMockRoute>();

  return {
    save(route: StoredMockRoute): MockRouteSummary {
      routes.set(routeKey(route.method, route.path), route);
      return summarizeRoute(route);
    },
    list(): MockRouteSummary[] {
      return [...routes.values()].map(summarizeRoute);
    },
    find(method: HttpMethod, path: string): StoredMockRoute | undefined {
      const exact = routes.get(routeKey(method, path));
      if (exact) {
        return exact;
      }

      return [...routes.values()].find(
        (route) => route.method === method && matchesPathTemplate(route.path, path)
      );
    }
  };
};

export const liveMockPath = (url: string): string => {
  const pathname = new URL(url, "http://mock.local").pathname;
  return pathname.replace(/^\/mock/, "") || "/";
};

const summarizeRoute = (route: StoredMockRoute): MockRouteSummary => ({
  method: route.method,
  path: route.path,
  status: route.status,
  contentType: route.contentType,
  operationId: route.operationId,
  url: `/mock${examplePath(route.path)}`
});

const routeKey = (method: HttpMethod, path: string): string =>
  `${method.toUpperCase()} ${path}`;

const matchesPathTemplate = (template: string, path: string): boolean => {
  const templateSegments = template.split("/");
  const pathSegments = path.split("/");

  if (templateSegments.length !== pathSegments.length) {
    return false;
  }

  return templateSegments.every(
    (segment, index) => isPathParameter(segment) || segment === pathSegments[index]
  );
};

const examplePath = (path: string): string =>
  path.replace(/\{[^/{}]+\}/g, "1");

const isPathParameter = (segment: string): boolean =>
  /^\{[^/{}]+\}$/.test(segment);
