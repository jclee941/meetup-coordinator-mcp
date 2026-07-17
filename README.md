# Meetup Coordinator MCP

[![Bun](https://img.shields.io/badge/Bun-1.3.10-f9f1e1?logo=bun&logoColor=black)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MCP](https://img.shields.io/badge/MCP-1.29.0-6b46c1)](https://modelcontextprotocol.org)
[![License](https://img.shields.io/badge/license-Internal-blue)](#license)

## 개요 (Overview)

`meetup-coordinator-mcp`는 밋업 운영을 위한 Model Context Protocol(MCP) 서버입니다.
주최자, 발표자, 참가자, 일정, 장소를 다루는 도구와 리소스를 표준화된 인터페이스로 노출하여
에이전트와 외부 시스템이 밋업 라이프사이클을 일관되게 다룰 수 있도록 합니다.
Bun 런타임에서 HTTP와 STDIO 두 가지 전송 방식으로 동작하며, Kakao Cloud 컨테이너 Registry의
Git 소스 빌드 파이프라인으로 배포할 수 있습니다.

## 한눈에 보기 (Status at a Glance)

| 항목 | 값 |
| --- | --- |
| 패키지 이름 | `meetup-coordinator-mcp` v0.1.0 |
| 런타임 | Bun 1.3.10 (Alpine) |
| 언어 / 모듈 시스템 | TypeScript 5.8 / ESM (`"type": "module"`) |
| 핵심 SDK | `@modelcontextprotocol/sdk` 1.29.0, `zod` 4.4.3 |
| 린트 / 포맷 | Biome 2.x |
| 테스트 러너 | `bun test` |
| 컨테이너 베이스 | `oven/bun:1.3.10-alpine` |
| 기본 포트 | `3000` (HTTP) |
| 진입점 | `src/http-server.ts`, `src/stdio-server.ts` |
| 전송 방식 | HTTP(SSE) 및 STDIO |
| 운영 상태 | 초기 개발 (v0.1.0) — 프로덕션 사용 전 운영팀 검증 필요 |

## 실행 흐름 요약 (Operator Flow)

1. 운영자는 이미지를 배포한 뒤 `bun run start`(HTTP) 또는 `bun run mcp:stdio`(STDIO)로 서버를 기동합니다.
2. HTTP 모드는 `PORT`(기본 3000)에서 MCP 엔드포인트를 노출하고, STDIO 모드는 로컬 에이전트와 직접 연결됩니다.
3. 클라이언트는 `src/mcp/server.ts`가 등록한 도구·리소스·프롬프트를 통해 밋업 정보를 조회·변경합니다.
4. 요청/응답은 `src/mcp/meetup-schemas.ts`의 Zod 스키마로 검증되고, 비즈니스 로직은 `src/mcp/meetup-coordinator.ts`에 위임됩니다.
5. 검증 단계는 `bun run verify`(`lint` + `typecheck` + `test`)로 일괄 실행합니다.

## 목차 (Table of Contents)

- [패키지 구성](#패키지-구성-package-contents)
- [먼저 읽을 파일](#먼저-읽을-파일-first-files-to-read)
- [진입점과 API](#진입점과-api-entry-points)
- [빠른 시작](#빠른-시작-quickstart)
- [설정](#설정-configuration)
- [명령어 레퍼런스](#명령어-레퍼런스-commands)
- [로컬 개발](#로컬-개발-local-development)
- [테스트](#테스트-testing)
- [컨테이너 빌드와 배포](#컨테이너-빌드와-배포)
- [기여](#기여-contributing)
- [유지보수와 문의](#유지보수와-문의-maintainers)
- [추가 문서](#추가-문서-further-documentation)
- [라이선스](#라이선스-license)

## 패키지 구성 (Package Contents)

| 경로 | 역할 |
| --- | --- |
| `src/config.ts` | 환경 변수 파싱과 서버 설정 로딩 |
| `src/http-server.ts` | HTTP 전송 기반 MCP 서버 부트스트랩 |
| `src/stdio-server.ts` | STDIO 전송 기반 MCP 서버 부트스트랩 |
| `src/mcp/server.ts` | MCP 서버 인스턴스와 핸들러 등록 |
| `src/mcp/meetup-coordinator.ts` | 밋업 도메인 로직(조율) |
| `src/mcp/meetup-schemas.ts` | Zod 기반 요청/응답/리소스 스키마 |
| `tests/` | 단위 테스트 (`bun test`) |
| `docs/kakao-cloud-git-source-build.md` | Kakao Cloud Git 소스 빌드 배포 가이드 |
| `assets/` | PlayMCP 등록과 제출용 이미지/템플릿 |
| `Dockerfile` | 다단계 Bun 이미지 (`oven/bun:1.3.10-alpine`) |
| `biome.json`, `tsconfig.json`, `package.json` | 정적 분석/타입체크/스크립트 정의 |

## 먼저 읽을 파일 (First Files to Read)

1. `package.json` — 의존성, 스크립트, 패키지 메타데이터 확인.
2. `src/mcp/server.ts` — 노출되는 MCP 도구·리소스·프롬프트의 진입 정의.
3. `src/mcp/meetup-schemas.ts` — 에이전트와 주고받는 데이터의 Zod 스키마.
4. `src/mcp/meetup-coordinator.ts` — 도메인 로직과 외부 호출의 경계.
5. `src/config.ts` — 환경 변수 키와 기본값.
6. `docs/kakao-cloud-git-source-build.md` — 배포 절차.

## 진입점과 API (Entry Points)

| 진입점 | 트랜스포트 | 기본 호출 | 사용 시나리오 |
| --- | --- | --- | --- |
| `src/http-server.ts` | HTTP (SSE 기반 MCP) | `bun run start` | 원격 에이전트, 컨테이너 배포 |
| `src/stdio-server.ts` | STDIO | `bun run mcp:stdio` | 로컬 에이전트, 데스크톱 클라이언트 |

HTTP 모드는 `PORT`(기본 3000) 환경 변수로 포트를 조정할 수 있으며, 컨테이너 이미지에서도 동일하게 노출됩니다.
STDIO 모드는 표준 입출력으로 MCP 메시지를 교환하므로 셸 기반 클라이언트와 직접 연동하기에 적합합니다.

## 빠른 시작 (Quickstart)

### 1. 의존성 설치 (Bun 1.3.10 이상)

```bash
bun install --frozen-lockfile
```

### 2. 로컬에서 HTTP 서버 실행

```bash
bun run dev      # 핫 리로드 개발 모드
bun run start    # 운영 모드
```

서버는 기본적으로 `http://localhost:3000`에서 MCP 엔드포인트를 노출합니다.

### 3. STDIO 모드 실행

```bash
bun run mcp:stdio
```

### 4. 검증 일괄 실행

```bash
bun run verify
```

## 설정 (Configuration)

`src/config.ts`는 다음 환경 변수를 사용합니다. 컨테이너 환경에서도 동일한 키를 그대로 전달하면 됩니다.

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `PORT` | `3000` | HTTP 서버가 바인딩할 포트 (Dockerfile `ENV`와 일치) |
| `NODE_ENV` | `production` (Docker) | 런타임 모드. 개발 시에는 미설정 또는 `development` |

추가 키(예: 외부 API 토큰, 로깅 레벨 등)는 `src/config.ts`에서 중앙 관리됩니다.
값을 변경할 때는 스키마와 기본값을 함께 갱신하고 `bun run typecheck`로 회귀를 확인하세요.

## 명령어 레퍼런스 (Commands)

| 명령 | 용도 |
| --- | --- |
| `bun run dev` | 핫 리로드 HTTP 개발 서버 |
| `bun run start` | 운영 HTTP 서버 |
| `bun run mcp:stdio` | STDIO 전송 MCP 서버 |
| `bun run typecheck` | `tsc --noEmit`로 타입 검사 |
| `bun run lint` | Biome 정적 분석 |
| `bun run format` | Biome 자동 수정 (`--write`) |
| `bun test` | 단위 테스트 실행 |
| `bun run verify` | `lint` + `typecheck` + `test` 일괄 실행 |

## 로컬 개발 (Local Development)

- 코드 스타일은 `biome.json`의 규칙을 따르며, PR 전 `bun run format`을 실행합니다.
- 타입 안전성은 `tsconfig.json`의 `strict` 옵션이 적용되어 있으며, 모든 PR에서 `bun run typecheck`를 통과해야 합니다.
- 새 MCP 도구/리소스/프롬프트를 추가할 때는 다음 순서를 권장합니다.
  1. `src/mcp/meetup-schemas.ts`에 Zod 스키마를 정의합니다.
  2. `src/mcp/meetup-coordinator.ts`에 도메인 로직을 구현합니다.
  3. `src/mcp/server.ts`에서 핸들러를 등록합니다.
  4. `tests/`에 단위 테스트를 추가하고 `bun test`로 확인합니다.
- 외부 시스템 호출은 가능한 한 `config.ts`에서 주입받아 테스트 용이성을 확보합니다.

## 테스트 (Testing)

- 테스트는 `tests/` 아래에 위치하며 `bun test`로 실행합니다.
- 권장 시점: 기능 변경 후, PR 전, 그리고 컨테이너 빌드 전 로컬에서 `bun run verify`.
- 테스트가 실패하면 컨테이너 빌드/배포 단계로 진행하지 마세요.

## 컨테이너 빌드와 배포

- `Dockerfile`은 `oven/bun:1.3.10-alpine`을 베이스로 한 다단계 빌드입니다.
  1. `deps` 단계에서 `bun install --frozen-lockfile`로 의존성을 설치합니다.
  2. 런타임 단계는 `node_modules`와 소스만 복사해 이미지 크기를 줄입니다.
  3. `PORT=3000`을 기본값으로 노출하고 `bun run start`를 실행합니다.
- Kakao Cloud 컨테이너 Registry의 Git 소스 빌드를 사용할 때는
  `docs/kakao-cloud-git-source-build.md`의 절차(저장소 연결 → 빌드 트리거 → 배포)를 따릅니다.
- 컨테이너 환경 변수는 Kakao Cloud 콘솔 또는 시크릿 매니저를 통해 주입하고, `PORT`를 노출 포트와 일치시킵니다.

## 기여 (Contributing)

- 작은 단위로 PR을 만들고 `bun run verify` 통과를 PR 체크리스트에 포함합니다.
- 새 의존성을 추가할 때는 `bun.lock`을 갱신하고 `bun install --frozen-lockfile`이 깨지지 않는지 확인합니다.
- 도메인 동작을 변경하는 경우 `docs/` 아래 관련 문서도 함께 갱신합니다.
- 자세한 절차는 [`CONTRIBUTING.md`](./CONTRIBUTING.md)를 참고하세요.

## 유지보수와 문의 (Maintainers / Points of Contact)

- 저장소 소유자: 내부 밋업 플랫폼 운영팀.
- 이슈 트래킹: 저장소 내 Issue 트래커를 사용합니다.
- 보안/비공개 사안: 저장소 메인tainer에게 직접 연락합니다.

## 추가 문서 (Further Documentation)

- [Kakao Cloud Git 소스 빌드 가이드](./docs/kakao-cloud-git-source-build.md)
- [PlayMCP 등록용 이미지](./assets/playmcp-registration-image.png)
- [제출 대표 템플릿](./assets/submission-representative-template.png)
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [Model Context Protocol 명세](https://modelcontextprotocol.org)

## 라이선스 (License)

이 저장소는 저장소 내 [`LICENSE`](./LICENSE) 파일의 조항을 따릅니다.
사내 배포 산출물이므로 외부 공유 전에 라이선스 정책과 내부 검토 절차를 확인하세요.