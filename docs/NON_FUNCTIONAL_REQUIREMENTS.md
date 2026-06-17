# Non-Functional Requirements

## Supported OpenAPI

```txt
OpenAPI 3.0.x
OpenAPI 3.1.x
```

Swagger 2.0 is not supported in MVP.

## Import

```txt
Max spec size: 10 MB
URL import timeout: 10 sec
Formats: YAML, JSON
Extensions: .yaml, .yml, .json
```

## Generation

```txt
Generate timeout: 10 sec
Max generated files: 100
Max generated JSON files response: 10 MB
Max ZIP size: 20 MB
Max generate paths: 2000
Max generate operations: 2000
Max generate schemas: 2000
```

Backend generation runs in an isolated child process and is terminated when the
timeout is reached.
Generated output paths are relative ZIP-safe paths. `.` and `..` path segments,
backslashes, and drive-letter style paths are rejected.

## Proxy

Default:

```env
PROXY_ENABLED=false
```

When enabled:

```txt
Proxy timeout: 15 sec
Max proxy request body: 5 MB
Max proxy response body: 10 MB
Max redirects: 3
```

Allowed protocols:

```txt
http:
https:
```

Blocked targets:

```txt
localhost
127.0.0.1
0.0.0.0
::1
10.0.0.0/8
172.16.0.0/12
192.168.0.0/16
169.254.0.0/16
fc00::/7
fe80::/10
```

Self-hosted deployments should also enforce outbound firewall rules. The app
pins proxy requests to the validated DNS address, and platform egress policy is
still recommended as defense in depth.

## Browser Support

Latest stable:

```txt
Chrome
Edge
Firefox
Safari
```

## Performance Targets

```txt
Parse 5 MB spec < 2 sec
Search latency < 100 ms for 1000 operations
Initial app load < 3 sec
```

## CI

Minimum:

```txt
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```
