# meetup-coordinator-mcp

Model Context Protocol(MCP) 서버로, 밋업(Meetup) 일정·장소·참가자 정보를 AI 에이전트가 도구로 호출할 수 있게 해 주는 경량 코디네이터입니다. 동일한 코어 로직을 HTTP 트랜스포트와 stdio 트랜스포트 양쪽으로 노출하므로, 원격 에이전트와 로컬 CLI 에이전트가 같은 도구 집합을 공유합니다.

## 한 줄 요약

밋업 코디네이션 작업을 위한 MCP 서버 — HTTP와 stdio 양쪽 트랜스포트를 지원하며, Zod 스키마로 입력·출력을 검증합니다.

## 빠른 상태

| 항목 | 값 |
| --- | --- |
| 패키지 이름 | `meetup-coordinator-mcp` |
| 버전 | `0.1.0` |
| 비공개 | `private: true` |
| 런타임 | Bun 1.3.x (Alpine) |
| 언어 | TypeScript (`module`) |
| 주요 의존성 | `@modelcontextprotocol/sdk` 1.29.0, `zod` 4.4.3 |
| 트랜스포트 | HTTP(`src/http-server.ts`), stdio(`src/stdio-server.ts`) |
| 기본 포트 | `3000` (Dockerfile의 `ENV PORT`) |
| 컨테이너 | `oven/bun:1.3.10-alpine` 멀티스테이지 |
| 테스트 | `bun test` |
| 린트/포맷 | Biome |
| 타입 검사 | `tsc --noEmit` |

## 주요 흐름 요약

| 시점 | 동작 |
| --- | --- |
| 부팅 | `src/config.ts` → 환경 변수 로드 → MCP 서버 인스턴스화 |
| 노출 | HTTP는 `PORT`(기본 `3000`)에서 SSE/Streamable, stdio는 표준 입출력 |
| 호출 | 에이전트가 도구 호출 → `meetup-coordinator.ts` 코디네이터 동작 |
| 검증 | `meetup-schemas.ts`의 Zod 스키마로 입력·출력 검증 |
| 검증 일괄 | `bun run verify` (lint + typecheck + test) |

진입점은 운영자가 `bun run dev`, `bun run start`, `bun run mcp:stdio` 중 하나를 선택하거나 컨테이너의 `CMD ["bun", "run", "start"]`를 사용하는 것입니다.

## 패키지 구성

| 경로 | 역할 |
| --- | --- |
| `src/config.ts` | 환경 변수 기반 설정 로딩 |
| `src/http-server.ts` | HTTP 트랜스포트 엔트리포인트 (개발 핫리로드 포함) |
| `src/stdio-server.ts` | stdio 트랜스포트 엔트리포인트 |
| `src/mcp/server.ts` | MCP 서버 팩토리 / 도구 등록 |
| `src/mcp/meetup-coordinator.ts` | 밋업 코디네이션 도메인 로직 |
| `src/mcp/meetup-schemas.ts` | Zod 스키마(요청·응답·도메인 모델) |
| `tests/` | `bun test` 기반 단위 테스트 |
| `docs/kakao-cloud-git-source-build.md` | Kakao Cloud Git 소스 빌드 배포 가이드 |
| `assets/` | PlayMCP 등록·제출용 이미지 자산(SVG/PNG) |
| `Dockerfile` | Bun Alpine 멀티스테이지 빌드 |
| `biome.json` | Biome 린트/포맷 규칙 |

## 먼저 읽을 파일

1. `src/mcp/server.ts` — MCP 서버 등록 구조와 노출 도구 목록.
2. `src/mcp/meetup-coordinator.ts` — 도메인 로직과 호출 흐름.
3. `src/mcp/meetup-schemas.ts` — 에이전트가 받는 입력·응답 스키마.
4. `src/http-server.ts` — 원격 트랜스포트 진입점.
5. `src/stdio-server.ts` — 로컬/파이프라인용 진입점.
6. `src/config.ts` — 환경 변수 키와 기본값.

## 엔트리포인트와 API

| 엔트리포인트 | 트랜스포트 | 기본 URL/스트림 | 사용 스크립트 |
| --- | --- | --- | --- |
| `src/http-server.ts` | HTTP(원격 에이전트) | `http://0.0.0.0:${PORT}` (기본 `3000`) | `bun run dev`, `bun run start` |
| `src/stdio-server.ts` | stdio(로컬 에이전트) | 표준 입출력 | `bun run mcp:stdio` |

도구 목록과 요청·응답 스키마는 `src/mcp/meetup-schemas.ts`에서 단일 출처로 관리됩니다. 호출 시 MCP SDK가 해당 Zod 스키마로 입력을 검증하고 도구별 출력을 직렬화합니다.

## 빠른 시작

사전 준비: Bun 1.3 이상.

```bash
# 1) 의존성 설치
bun install

# 2) 개발 모드 (HTTP, 핫리로드)
bun run dev

# 3) 프로덕션 모드 (HTTP)
bun run start

# 4) stdio 트랜스포트로 실행
bun run mcp:stdio

# 5) 일괄 검증 (린트 + 타입체크 + 테스트)
bun run verify
```

HTTP 모드는 별도의 환경 변수가 없으면 `PORT=3000`으로 동작합니다. 포트를 바꾸려면 `PORT=<포트>`로 실행 컨텍스트에서 주입하세요.

### Docker

```bash
docker build -t meetup-coordinator-mcp .
docker run --rm -p 3000:3000 meetup-coordinator-mcp
```

컨테이너는 `oven/bun:1.3.10-alpine` 기반이며, 멀티스테이지로 `node_modules`만 프로덕션 스테이지에 복사합니다.

## 스크립트 레퍼런스

| 명령어 | 동작 |
| --- | --- |
| `bun run dev` | `bun run --hot src/http-server.ts` (HTTP + 핫리로드) |
| `bun run start` | `bun run src/http-server.ts` (HTTP 프로덕션) |
| `bun run mcp:stdio` | `bun run src/stdio-server.ts` |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | `biome check .` |
| `bun run format` | `biome check --write .` |
| `bun test` | Bun 테스트 러너 |
| `bun run verify` | `lint && typecheck && test` |

## 로컬 개발

- 런타임은 Bun 전용입니다. Node로 직접 실행하지 마세요(`@types/bun`만 설치돼 있습니다).
- 코드 스타일은 Biome가 단일 출처입니다. 커밋 전 `bun run format`을 권장합니다.
- 변경 후에는 `bun run verify`로 린트·타입·테스트를 한 번에 통과시키세요.
- MCP SDK 버전은 `@modelcontextprotocol/sdk` 1.29.0에 고정되어 있습니다. 호환성 확인 없이 메이저 버전을 올리지 마세요.

## 테스트

- 위치: `tests/` 디렉터리.
- 실행: `bun test`.
- 일괄 게이트: `bun run verify`.
- 도메인 로직(`meetup-coordinator.test.ts`), 설정(`config.test.ts`), HTTP MCP 통합(`http-mcp.test.ts`)을 다룹니다.

## 운영 관측 포인트

| 항목 | 위치 | 비고 |
| --- | --- | --- |
| HTTP 리스너 | `src/http-server.ts` | 포트는 `PORT` 환경 변수, 기본 `3000` |
| stdio 핸들 | `src/stdio-server.ts` | 부모 프로세스의 stdin/stdout |
| 설정 | `src/config.ts` | 부팅 시 1회 로드 |
| 스키마 | `src/mcp/meetup-schemas.ts` | Zod로 호출 검증 |

## 자산과 배포 자료

| 자산 | 용도 |
| --- | --- |
| `assets/playmcp-registration-image.png` / `.svg` | PlayMCP 등록용 시각 자료 |
| `assets/submission-representative-template.png` / `.svg` | 제출 대표 템플릿 |
| `docs/kakao-cloud-git-source-build.md` | Kakao Cloud Git 소스 빌드 배포 절차 |

## 기여 가이드

1. 이슈 또는 작업 항목 식별 → 작업 브랜치 생성.
2. `bun install` 후 `bun run verify`가 통과하는 상태에서 시작.
3. 도메인 로직 변경 시 `tests/meetup-coordinator.test.ts` 갱신 필수.
4. 스키마 변경 시 `src/mcp/meetup-schemas.ts`와 연관 테스트를 동시에 수정.
5. PR 전 `bun run format && bun run verify` 실행.

자세한 정책은 `CONTRIBUTING.md`를 참고하세요.

## 유지보수와 문의

- 저장소 내 `CONTRIBUTING.md`에 정의된 절차와 연락처를 우선 사용하세요.
- 배포 매뉴얼은 `docs/kakao-cloud-git-source-build.md`를 참고하세요.
- 라이선스는 저장소 내 `LICENSE`를 참조하세요.

## 추가 문서

| 문서 | 위치 |
| --- | --- |
| Kakao Cloud Git 소스 빌드 가이드 | `docs/kakao-cloud-git-source-build.md` |
| 기여 정책 | `CONTRIBUTING.md` |
| 라이선스 | `LICENSE` |

---

# meetup-coordinator-mcp (English)

A Model Context Protocol (MCP) server that exposes meetup coordination workflows—scheduling, location, and participant data—as callable tools for AI agents. The same core ships over HTTP and stdio transports, so remote agents and local CLI agents share an identical tool surface.

## At a glance

A meetup coordination MCP server — dual HTTP/stdio transports with Zod-validated inputs and outputs.

## Status

| Item | Value |
| --- | --- |
| Package | `meetup-coordinator-mcp` |
| Version | `0.1.0` |
| Private | yes |
| Runtime | Bun 1.3.x (Alpine) |
| Language | TypeScript (`module`) |
| Key deps | `@modelcontextprotocol/sdk` 1.29.0, `zod` 4.4.3 |
| Transports | HTTP (`src/http-server.ts`), stdio (`src/stdio-server.ts`) |
| Default port | `3000` (`ENV PORT` in Dockerfile) |
| Container | `oven/bun:1.3.10-alpine` multi-stage |
| Tests | `bun test` |
| Lint/format | Biome |
| Type check | `tsc --noEmit` |

## Operator flow

| Step | What happens |
| --- | --- |
| Boot | `src/config.ts` loads environment, instantiates the MCP server |
| Exposure | HTTP listens on `PORT` (default `3000`); stdio uses the parent process streams |
| Invoke | Agent calls a tool → `meetup-coordinator.ts` runs the domain logic |
| Validate | `meetup-schemas.ts` enforces Zod contracts on inputs and outputs |
| Gate | `bun run verify` runs lint + typecheck + test |

## Entry points

| Entry | Transport | Script |
| --- | --- | --- |
| `src/http-server.ts` | HTTP | `bun run dev`, `bun run start` |
| `src/stdio-server.ts` | stdio | `bun run mcp:stdio` |

Tool definitions and request/response contracts live in `src/mcp/meetup-schemas.ts` as the single source of truth.

## Quickstart

```bash
bun install
bun run dev          # HTTP, hot reload
bun run start        # HTTP, production mode
bun run mcp:stdio    # stdio transport
bun run verify       # lint + typecheck + test
```

Override the HTTP port with `PORT=<port>`. The container image exposes the HTTP transport on `3000` by default.

## Scripts

| Command | Action |
| --- | --- |
| `bun run dev` | HTTP with Bun hot reload |
| `bun run start` | HTTP, production |
| `bun run mcp:stdio` | stdio transport |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | Biome check |
| `bun run format` | Biome format |
| `bun test` | Run tests |
| `bun run verify` | Lint + typecheck + test |

## Development

- Bun only (no Node fallback).
- Biome is the single source of code style.
- Run `bun run verify` before opening a PR.
- Keep the MCP SDK version pinned to `1.29.0` unless an upgrade is explicitly scoped.

## Tests

- Located in `tests/`; run with `bun test`.
- Coverage areas: domain coordinator, config, HTTP MCP integration.

## Further reading

| Document | Location |
| --- | --- |
| Kakao Cloud Git source build guide | `docs/kakao-cloud-git-source-build.md` |
| Contributing policy | `CONTRIBUTING.md` |
| License | `LICENSE` |