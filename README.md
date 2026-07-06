# Meetup Coordinator MCP

![Bun](https://img.shields.io/badge/Bun-1.3.10-f9f1e1?logo=bun)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)
![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.29.0-1f6feb)
![Status](https://img.shields.io/badge/PlayMCP-Active-2ea44f)
![Private](https://img.shields.io/badge/package-private-lightgrey)

PlayMCP 에서 호출하는 downstream MCP 서버입니다. 한국어로 약속(만남) 일정을
조율할 때 자주 필요한 6가지 작업을 도구로 제공합니다. 대화 분석이 필요한
기능은 사용자가 붙여넣은 일부 단체방 대화 텍스트만 사용하고, 투표·공지·정산
기능은 대화 내용 없이도 사용할 수 있습니다.

A downstream MCP server invoked by PlayMCP. It exposes six tools for
coordinating Korean-language meetups (extract availability, rank options,
draft polls, write final notices, list missing respondents, draft split-bill
messages).

---

## 한눈에 보기 / At a Glance

| 항목 / Item | 값 / Value |
| --- | --- |
| 런타임 / Runtime | Bun 1.3.10 (TypeScript, ESM) |
| MCP SDK | `@modelcontextprotocol/sdk` 1.29.0 |
| 전송 / Transport | Streamable HTTP (`/mcp`), 무상태 / stateless |
| 보조 전송 / Alt transport | stdio (`bun run mcp:stdio`) |
| 도구 수 / Tools | 6 (ASCII 영문자 + `_` 만, `kakao` 부분 문자열 미포함) |
| 헬스 체크 / Health | `GET /health` |
| 컨테이너 포트 / Container port | `3000` |
| 배포 / Deployment | Kakao Cloud Git Source Build → PlayMCP endpoint |
| 상태 / Status | Active |
| 라이선스 / License | Private (see `LICENSE`) |

## 빠른 흐름 / Quick Flow

PlayMCP 가 보내는 도구 호출을 이 서버가 어떻게 처리하는지 한 줄 흐름으로
요약합니다. / How a PlayMCP tool call flows through this server:

1. **진입 / Entry** — `src/http-server.ts` 가 `POST /mcp` 요청을 받습니다.
2. **전송 / Transport** — 요청마다 새 `StreamableHTTPServerTransport` 와 `McpServer` 인스턴스를 만듭니다 (무상태).
3. **스키마 검증 / Validate** — `src/mcp/meetup-schemas.ts` 의 `zod` 스키마로 입력을 검증합니다.
4. **도구 실행 / Execute** — `src/mcp/meetup-coordinator.ts` 의 6개 도구 중 하나가 호출됩니다.
5. **응답 / Respond** — 간결한 한국어 마크다운 텍스트와 최소 구조화 JSON 을 반환합니다.
6. **헬스 체크 / Probe** — Kakao Cloud 컨테이너 헬스 체크는 `GET /health` 를 사용합니다.

---

## 목차 / Contents

1. [프로젝트 개요 / Overview](#project-overview)
2. [주요 기능 / Features](#features)
3. [패키지 구성 / Package Contents](#package-contents)
4. [아키텍처 / Architecture](#architecture)
5. [빠른 시작 / Quickstart](#quickstart)
6. [환경 설정 / Configuration](#configuration)
7. [명령어 / Commands Reference](#commands-reference)
8. [로컬 개발 / Local Development](#local-development)
9. [테스트 / Testing](#testing)
10. [PlayMCP 배포 및 제출 / PlayMCP Deployment & Submission](#playmcp-deployment--submission)
11. [유지보수 / Maintainers](#maintainers)
12. [라이선스 / License](#license)
13. [추가 문서 / Further Documentation](#further-documentation)

---

## Project Overview

한국어 단체방 대화에서 반복되는 약속 조율 작업을 자동화하기 위한 downstream
MCP 서버입니다. 본 저장소는 PlayMCP 가 호출하는 외부 MCP 서버이며,
호출자가 PlayMCP 의 AI 채팅 클라이언트인지 로컬 MCP 클라이언트인지에 따라
HTTP 전송(Streamable HTTP) 또는 stdio 전송으로 진입합니다.

This repository hosts a **downstream** MCP server that PlayMCP calls. Tools
that need conversational evidence accept a user-provided chat snippet as
optional input; the rest work without any chat context.

### 왜 유용한가 / Why it is useful

- 한국어 약속 조율의 다섯 단계 (후보 수집 → 정렬 → 투표 → 확정 공지 →
  정산) 를 한 서버에서 일관된 도구 묶음으로 제공합니다.
- 모든 도구가 `inputSchema` 와 `outputSchema` 를 함께 노출해 PlayMCP
  미리보기에서 호출 형태를 그대로 검증할 수 있습니다.
- 도구명은 ASCII 영문자와 `_` 만 사용하므로 PlayMCP 의 도구함 인덱싱
  정책과 충돌하지 않습니다.
- 무상태 HTTP 전송으로 동작해 단일 컨테이너 인스턴스로도 수평 확장이
  단순합니다.

---

## Features

6개의 도구를 제공합니다. 각 도구는 한국어 약속 조율에서 한 가지 작업을
담당합니다.

| 도구 / Tool | 입력 / Input | 출력 / Output | 대화 맥락 / Chat context |
| --- | --- | --- | --- |
| `meetup_availability_extract` | 단체방 메시지 스니펫 | 가능한 날짜, 불가능한 날짜, 장소 신호 | 필요 / Required |
| `meetup_option_rank` | 날짜/장소 후보 목록 | 정렬된 후보 + 근거 | 선택 / Optional |
| `meetup_poll_draft` | 주제, 선택지 | 투표 문구 | 불필요 / Not needed |
| `meetup_final_notice` | 확정된 날짜·시간·장소 | 공지문 + 체크리스트 | 불필요 / Not needed |
| `meetup_missing_people` | 참석자 목록, 응답 상태 | 미응답자/애매 응답자 정리 | 선택 / Optional |
| `meetup_split_bill_message` | 총액, 참석자 | 정산 안내 문구 | 불필요 / Not needed |

각 도구는 `name`, `description`, `inputSchema`, `outputSchema`, 그리고
전체 `annotations` 를 노출하며, 결과는 간결한 한국어 마크다운 본문과 최소
구조화 페이로드로 구성됩니다.

---

## Package Contents

저장소 최상위 구조입니다. 디렉터리는 실제 트리를 그대로 반영합니다.

| 경로 / Path | 역할 / Role |
| --- | --- |
| `src/http-server.ts` | HTTP 전송(Streamable HTTP) 진입점. PlayMCP 프로덕션 진입점. |
| `src/stdio-server.ts` | stdio 전송 진입점. 로컬 MCP 클라이언트용. |
| `src/mcp/server.ts` | MCP 서버 생성, 도구 등록, 라우팅. |
| `src/mcp/meetup-coordinator.ts` | 6개 도구 구현체. |
| `src/mcp/meetup-schemas.ts` | 입력/출력용 `zod` 스키마. |
| `src/config.ts` | 환경 변수 로딩 및 검증. |
| `tests/config.test.ts` | 환경 변수 파싱 테스트. |
| `tests/http-mcp.test.ts` | HTTP 전송 통합 테스트. |
| `tests/meetup-coordinator.test.ts` | 6개 도구 동작 테스트. |
| `docs/kakao-cloud-git-source-build.md` | Kakao Cloud Git Source Build 절차 가이드. |
| `assets/playmcp-registration-image.{svg,png}` | PlayMCP 등록 화면 참고 이미지. |
| `assets/submission-representative-template.{svg,png}` | 공모전 제출 양식 참고 템플릿. |
| `Dockerfile` | `oven/bun:1.3.10-alpine` 기반 이미지. |
| `biome.json`, `tsconfig.json`, `bun.lock`, `package.json` | 빌드/린트/타입 설정. |
| `LICENSE`, `CONTRIBUTING.md` | 라이선스, 기여 가이드. |

---

## Architecture

### 모듈 구성 / Modules

| 계층 / Layer | 파일 / File | 책임 / Responsibility |
| --- | --- | --- |
| Entry (HTTP) | `src/http-server.ts` | Bun HTTP 서버 부트스트랩, `/mcp` 와 `/health` 라우팅. |
| Entry (stdio) | `src/stdio-server.ts` | stdin/stdout 기반 MCP 서버 부트스트랩. |
| Transport | `@modelcontextprotocol/sdk` | Streamable HTTP, stdio. |
| Server core | `src/mcp/server.ts` | `McpServer` 인스턴스화, 6개 도구 등록. |
| Tools | `src/mcp/meetup-coordinator.ts` | 6개 도구 핸들러 구현. |
| Schemas | `src/mcp/meetup-schemas.ts` | `zod` 입력/출력 스키마. |
| Config | `src/config.ts` | `PORT` 등 환경 변수 파싱. |

### 요청 흐름 / Request Flow (HTTP)

1. 클라이언트(PlayMCP 등)가 `POST /mcp` 로 JSON-RPC 요청을 전송합니다.
2. `src/http-server.ts` 가 각 요청에 대해 새 `StreamableHTTPServerTransport`
   와 `McpServer` 인스턴스를 만듭니다.
3. 클라이언트가 `initialize` 를 보내면 세션이 열리고, 이후 `tools/list`
   또는 `tools/call` 을 보냅니다.
4. `tools/call` 은 `src/mcp/meetup-coordinator.ts` 의 핸들러로 라우팅됩니다.
5. 핸들러는 `src/mcp/meetup-schemas.ts` 의 `zod` 스키마로 입력을 검증합니다.
6. 검증된 입력을 처리해 한국어 마크다운 텍스트 + 구조화 JSON 을 반환합니다.
7. 요청이 끝나면 서버/전송 인스턴스는 폐기됩니다 (무상태).
8. 운영 환경에서 `GET /health` 는 컨테이너 헬스 체크에 사용됩니다.

### stdio 흐름 / stdio Flow

1. 로컬 MCP 클라이언트가 `bun run mcp:stdio` 로 서버 프로세스를 실행합니다.
2. stdin/stdout 으로 JSON-RPC 가 교환되며 `src/mcp/server.ts` 의 핸들러가
   동일하게 호출됩니다.
3. 종료 시 stdin EOF 또는 클라이언트 측 종료 시그널로 프로세스가 정리됩니다.

---

## Quickstart

선행 조건 / Prerequisites:

- Bun 1.3.10 이상 (Bun 설치 후 `bun --version` 으로 확인)
- (선택) 컨테이너로 실행할 경우 Docker

### 1. 의존성 설치 / Install

```bash
bun install
```

### 2. 검증 / Verify

린트, 타입 체크, 테스트를 한 번에 실행합니다.

```bash
bun run verify
```

### 3. 로컬 HTTP 서버 실행 / Run HTTP Server

```bash
bun run start
# 또는 핫 리로드 모드
bun run dev
```

### 4. 동작 확인 / Smoke Test

```bash
curl -i http://localhost:3000/health
curl -i http://localhost:3000/mcp
```

### 5. stdio 전송으로 실행 (선택) / stdio Transport

```bash
bun run mcp:stdio
```

---

## Configuration

서버는 다음 환경 변수를 사용합니다.

| 변수 / Variable | 기본값 / Default | 출처 / Source | 설명 / Description |
| --- | --- | --- | --- |
| `PORT` | `3000` | `src/config.ts`, `Dockerfile` | HTTP 서버 포트. 컨테이너/로컬 공통. |
| `NODE_ENV` | `production` (Docker) | `Dockerfile` | 컨테이너 런타임 모드. |

`src/config.ts` 가 환경 변수를 읽고 검증합니다. 컨테이너 환경에서 값을
변경하려면 `Dockerfile` 과 Kakao Cloud Git Source Build 설정을 함께
수정해야 반영됩니다.

---

## Commands Reference

| 명령어 / Command | 설명 / Description |
| --- | --- |
| `bun run dev` | HTTP 서버 핫 리로드 모드로 실행 (`src/http-server.ts`). |
| `bun run start` | HTTP 서버 프로덕션 모드로 실행 (`src/http-server.ts`). |
| `bun run mcp:stdio` | stdio 전송 MCP 서버 실행 (`src/stdio-server.ts`). |
| `bun run typecheck` | `tsc --noEmit` 으로 타입 체크. |
| `bun run lint` | Biome 으로 정적 분석. |
| `bun run format` | Biome 으로 자동 포맷팅 (`biome check --write .`). |
| `bun test` | `bun test` 로 단위/통합 테스트 실행. |
| `bun run verify` | lint → typecheck → test 순차 실행. |

---

## Local Development

1. `bun install` 로 의존성을 설치합니다.
2. `bun run dev` 로 핫 리로드를 시작합니다.
3. MCP 인스펙터 또는 `curl` 로 `http://localhost:3000/mcp` 에 접근해
   `tools/list`, `tools/call` 을 시험합니다.
4. 코드 수정 후 `bun run verify` 로 정적 분석과 테스트 회귀를 확인합니다.
5. 커밋 전에 `bun run format` 으로 Biome 포맷을 정리합니다.

스타일 가이드, 커밋 메시지 규칙, PR 절차는 `CONTRIBUTING.md` 를 따릅니다.

---

## Testing

| 테스트 파일 / File | 대상 / Subject |
| --- | --- |
| `tests/config.test.ts` | `src/config.ts` 의 환경 변수 파싱 및 검증. |
| `tests/http-mcp.test.ts` | HTTP 전송의 부트스트랩과 라우팅. |
| `tests/meetup-coordinator.test.ts` | 6개 도구의 입력/출력 스키마와 동작. |

전체 실행:

```bash
bun test
```

권장: CI 또는 로컬 사전 검증 단계에서는 `bun run verify` 로 정적 분석과
테스트를 함께 실행하세요.

---

## PlayMCP Deployment & Submission

### 배포 설정 / Deployment

| 항목 / Item | 값 / Value |
| --- | --- |
| Git URL | `https://github.com/jclee941/jclee-bot` |
| Branch / ref | `master` |
| Dockerfile 경로 / Path | `Dockerfile` |
| 컨테이너 포트 / Port | `3000` |
| 헬스 체크 경로 / Health path | `/health` |
| 상태 / Status | `Active` |
| Endpoint 이름 / Name | `meetup-coordinator-mcp` |
| Namespace | `kbm-u-4950521354` |
| PlayMCP Endpoint | `https://meetup-coordinator-mcp.playmcp-endpoint.kakaocloud.io/mcp` |

자세한 절차는 [`docs/kakao-cloud-git-source-build.md`](docs/kakao-cloud-git-source-build.md) 를
참조하세요.

### PlayMCP 호환성 / Compatibility

- MCP 프로토콜 / Protocol: `@modelcontextprotocol/sdk` 1.29.0, 협상 범위
  `2025-03-26` ~ `2025-11-25`
- 전송 / Transport: Streamable HTTP at `/mcp`
- 서버 모드 / Server mode: 요청별 무상태 / stateless per request
- 인증 / Authentication: 없음 / none
- 도구 수 / Tool count: 6
- 도구명 규칙 / Naming: ASCII 영문자 + `_` 만 사용, `kakao` 부분 문자열 미포함
- 도구 메타데이터 / Metadata: `name`, `description`, `inputSchema`,
  `outputSchema`, 전체 `annotations` 노출
- 도구 결과 / Results: 간결한 마크다운 텍스트 + 최소 구조화 페이로드

### 등록 흐름 / Registration Flow

1. PlayMCP in KC 에서 배포가 `Active` 가 되면 발급된 Endpoint URL 을 복사합니다.
2. PlayMCP 개발자 콘솔에서 새 MCP 서버로 등록합니다.
3. 먼저 임시 등록하고, 상세 미리보기에서 도구함에 추가한 뒤 PlayMCP AI 채팅으로 테스트합니다.
4. 테스트가 끝난 뒤 심사 요청합니다.
5. 승인 후 공개 상태를 전체 공개로 전환하고, 공개 MCP 상세 URL 을 공모전 접수 양식에 제출합니다.

### 제출 정보 / Submission Fields

| 필드 / Field | 값 / Value |
| --- | --- |
| 제작자 정보 / 팀프로필 이름 | 이재철2 |
| 대표 이미지 / Representative image | [`assets/playmcp-registration-image.svg`](assets/playmcp-registration-image.svg) (참고 템플릿) |
| 제출 양식 템플릿 / Submission template | [`assets/submission-representative-template.svg`](assets/submission-representative-template.svg) (참고 템플릿) |
| 공개 MCP 상세 URL | PlayMCP 등록 후 발급된 전체 공개 URL |

> 참고 이미지(`assets/*.svg`, `assets/*.png`) 는 제출 양식과 등록 화면을
> 설명하기 위한 예시 자산이며, 실제 제출 시 본 서버의 공개 MCP 상세 URL
> 을 함께 기재해야 합니다.

---

## Maintainers

| 역할 / Role | 담당 / Owner |
| --- | --- |
| 제작자 / Author | 이재철2 |
| 배포 환경 / Deployment | Kakao Cloud (Git Source Build) |
| 호출자 / Caller | PlayMCP |

문의는 저장소 이슈 트래커를 사용하세요.

---

## License

본 저장소는 비공개(private) 패키지입니다. 자세한 내용은 [`LICENSE`](LICENSE)
를 참조하세요.

---

## Further Documentation

- [`docs/kakao-cloud-git-source-build.md`](docs/kakao-cloud-git-source-build.md) —
  Kakao Cloud Git Source Build 절차와 트러블슈팅.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — 기여 가이드 (스타일, 커밋, PR 절차).
- [`LICENSE`](LICENSE) — 라이선스 전문.
- [`assets/playmcp-registration-image.svg`](assets/playmcp-registration-image.svg) /
  [`.png`](assets/playmcp-registration-image.png) — PlayMCP 등록 화면 참고 이미지.
- [`assets/submission-representative-template.svg`](assets/submission-representative-template.svg) /
  [`.png`](assets/submission-representative-template.png) — 공모전 제출 양식 참고 템플릿.