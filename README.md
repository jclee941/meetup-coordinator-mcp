# Meetup Coordinator MCP

PlayMCP가 호출하는 downstream MCP 서버입니다. 약속 후보 정리, 투표 문구 작성, 확정 공지, 미응답자 확인, 정산 문구 작성까지 모임 운영에 필요한 6개의 도구를 제공합니다. 대화 분석이 필요한 기능은 사용자가 붙여넣은 일부 단체방 대화 텍스트만 사용하며, 투표·공지·정산 기능은 대화 내용 없이도 동작합니다.

> English: A stateless downstream MCP server for PlayMCP that helps group organizers with availability extraction, poll drafting, final notices, missing-responder tracking, and split-bill messages. Built on Bun + TypeScript + `@modelcontextprotocol/sdk` 1.29.0, exposed over Streamable HTTP at `/mcp`.

## 한눈에 보기

| 항목 | 값 |
|---|---|
| 제품 | Meetup Coordinator MCP |
| 패키지명 | `meetup-coordinator-mcp` |
| 버전 | 0.1.0 |
| 런타임 | Bun 1.3.10 (Docker base `oven/bun:1.3.10-alpine`) |
| 언어 | TypeScript (ESM, `strict`) |
| MCP SDK | `@modelcontextprotocol/sdk` 1.29.0 |
| 검증 라이브러리 | Zod 4.4.3 |
| 지원 프로토콜 범위 | `2025-03-26` ~ `2025-11-25` |
| 전송(transport) | Streamable HTTP |
| 엔드포인트 경로 | `/mcp` |
| 서버 모드 | Stateless per request |
| 인증 | 불필요 |
| 노출 도구 수 | 6 (ASCII + underscore만 사용, `kakao` 접두 없음) |
| 기본 포트 | 3000 |
| 컨테이너 포트 | 3000 |
| 헬스 체크 | `GET /health` |
| 배포 상태 | `Active` (Kakao Cloud Git Source Build) |
| 운영 엔드포인트 | `https://meetup-coordinator-mcp.playmcp-endpoint.kakaocloud.io/mcp` |
| 네임스페이스 | `kbm-u-4950521354` |
| 빌드 소스 | GitHub `master` 브랜치, Dockerfile 경로 `Dockerfile` |
| 라이선스 | 저장소 `LICENSE` 파일 참조 |

## 동작 요약

요청 흐름:

1. MCP 클라이언트가 `/mcp`로 JSON-RPC 요청 전송
2. `src/http-server.ts`가 stateless 컨텍스트에서 요청 라우팅
3. `src/mcp/server.ts`가 도구 메타데이터(`name`, `description`, `inputSchema`, `outputSchema`, `annotations`)를 노출
4. `src/mcp/meetup-coordinator.ts`가 Zod 스키마(`src/mcp/meetup-schemas.ts`)로 입력을 검증한 뒤 비즈니스 로직 수행
5. 응답은 간결한 markdown 텍스트 + 최소화된 구조화 출력으로 반환

운영자가 가장 자주 쓰는 명령:

- 로컬 실행: `bun run start`
- 핫 리로드 개발: `bun run dev`
- 검증 (린트 + 타입 + 테스트): `bun run verify`
- STDIO transport: `bun run mcp:stdio`
- 헬스 확인: `curl -i http://localhost:3000/health`

## 목차

- [Tools](#tools)
- [아키텍처](#architecture)
- [Quick Start](#quick-start)
- [명령어 레퍼런스](#commands)
- [설정 / 환경 변수](#configuration)
- [로컬 개발](#local-development)
- [테스트](#testing)
- [PlayMCP 호환성](#playmcp-compatibility)
- [배포 (Kakao Cloud)](#deployment)
- [PlayMCP 등록 절차](#playmcp-registration)
- [PlayMCP 제출 양식](#playmcp-submission)
- [유지보수 / 연락처](#maintainers)
- [기여 / 문서](#contributing)
- [라이선스](#license)

## Tools

| 도구 이름 | 입력 의존성 | 주요 용도 |
|---|---|---|
| `meetup_availability_extract` | 단체방 메시지 텍스트 (필수) | 가능한 날짜·불가능한 날짜·장소 신호 추출 |
| `meetup_option_rank` | 후보 배열 (대화 텍스트는 선택) | 날짜/장소 후보 정렬 |
| `meetup_poll_draft` | 주제 + 선택지 (대화 불필요) | 투표 문구 작성 |
| `meetup_final_notice` | 확정된 날짜·시간·장소 (대화 불필요) | 공지문 + 체크리스트 작성 |
| `meetup_missing_people` | 응답자/비응답자 명단 | 미응답자·애매 응답자 정리 |
| `meetup_split_bill_message` | 총액 + 참석자 (대화 불필요) | 정산 안내 문구 작성 |

모든 도구 이름은 ASCII 문자와 underscore만 사용하며 `kakao` 부분 문자열을 포함하지 않습니다. 각 도구는 `name`, `description`, `inputSchema`, `outputSchema`, 그리고 전체 `annotations` 메타데이터를 노출하고, 결과는 짧은 markdown 텍스트와 최소화된 구조화 출력으로 반환됩니다.

## Architecture

소스 모듈 책임:

| 파일 | 책임 |
|---|---|
| `src/config.ts` | 포트/환경 변수 로딩, 런타임 설정 |
| `src/http-server.ts` | Bun HTTP 서버 부트스트랩, `/mcp` 라우팅, `/health` 노출 |
| `src/stdio-server.ts` | STDIO transport 진입점 (로컬 테스트/디버깅용) |
| `src/mcp/server.ts` | MCP 서버 등록, 도구 메타데이터 노출 |
| `src/mcp/meetup-coordinator.ts` | 6개 도구의 비즈니스 로직 구현 |
| `src/mcp/meetup-schemas.ts` | Zod 기반 입력/출력 스키마 정의 |

요청 처리 단계:

1. `http-server.ts`가 HTTP 요청을 받아 `/mcp` 핸들러로 전달
2. MCP SDK가 JSON-RPC 메시지를 파싱하고 도구 호출을 식별
3. `meetup-coordinator.ts`가 해당 도구의 Zod 스키마로 입력 검증
4. 비즈니스 로직 수행 후 markdown 텍스트와 구조화 결과 동시 반환
5. 각 요청은 독립적인 stateless 컨텍스트에서 처리되어 종료

상세 흐름도 및 시퀀스 다이어그램은 [docs/ 디렉터리](#further-documentation)에 별도 문서로 보관합니다.

## Quick Start

로컬에서 30초 만에 실행:

```bash
# 1) 의존성 설치
bun install

# 2) 검증 (린트 + 타입 체크 + 테스트)
bun run verify

# 3) HTTP transport 서버 시작
bun run start
```

서버 기동 후 확인:

```bash
# 헬스 체크
curl -i http://localhost:3000/health

# MCP 엔드포인트 핸드셰이크
curl -i http://localhost:3000/mcp
```

Docker로 실행:

```bash
docker build -t meetup-coordinator-mcp .
docker run --rm -p 3000:3000 meetup-coordinator-mcp
```

## Commands

| 명령 | 설명 |
|---|---|
| `bun run dev` | 핫 리로드로 HTTP 서버 실행 (`bun run --hot src/http-server.ts`) |
| `bun run start` | 프로덕션 모드로 HTTP 서버 실행 |
| `bun run mcp:stdio` | STDIO transport로 MCP 서버 실행 (로컬 디버깅/Claude Desktop 연동) |
| `bun run typecheck` | `tsc --noEmit`로 타입 체크만 수행 |
| `bun run lint` | Biome으로 정적 분석 |
| `bun run format` | Biome으로 자동 포맷팅 (`--write`) |
| `bun test` | Bun 테스트 러너 실행 |
| `bun run verify` | `lint && typecheck && test` 일괄 실행 |

## Configuration

| 환경 변수 | 기본값 | 설명 |
|---|---|---|
| `PORT` | `3000` | HTTP 서버 바인딩 포트 |
| `NODE_ENV` | (미설정) | 컨테이너에서 `production`으로 설정됨 |

설정은 `src/config.ts`에서 읽으며, 그 외 환경 변수에 의존하지 않습니다. 인증이 필요하지 않은 stateless 서버이므로 시크릿 관리가 필요 없습니다.

## Local Development

필수 도구:

- Bun 1.3.10 이상 (권장: `oven/bun:1.3.10-alpine` 이미지와 동일 버전)
- TypeScript 5.8 이상
- Biome 2.0 이상

권장 워크플로우:

1. `bun install`로 의존성 설치
2. `bun run dev`로 핫 리로드 서버 기동
3. `src/mcp/` 하위 코드를 수정한 뒤 `bun run typecheck`로 타입 검증
4. 변경 사항에 대해 `bun test`로 테스트 실행
5. 커밋 전 `bun run verify`로 린트 + 타입 + 테스트 일괄 통과 확인
6. Biome 포맷팅은 `bun run format`

새 도구를 추가할 때:

- `src/mcp/meetup-schemas.ts`에 입력/출력 Zod 스키마 정의
- `src/mcp/meetup-coordinator.ts`에 핸들러 구현
- `src/mcp/server.ts`에서 도구 메타데이터(이름/설명/inputSchema/outputSchema/annotations) 등록
- `tests/meetup-coordinator.test.ts`에 단위 테스트 추가

## Testing

| 파일 | 대상 |
|---|---|
| `tests/config.test.ts` | `src/config.ts` 환경 변수 처리 |
| `tests/http-mcp.test.ts` | HTTP transport + MCP 핸드셰이크 통합 동작 |
| `tests/meetup-coordinator.test.ts` | 6개 도구의 비즈니스 로직 |

전체 실행:

```bash
bun test
```

`bun run verify`는 테스트와 함께 린트/타입 체크까지 함께 수행하므로 PR 전 권장 명령입니다.

## PlayMCP Compatibility

| 항목 | 값 |
|---|---|
| MCP protocol support | `@modelcontextprotocol/sdk` 1.29.0 |
| Negotiated range | `2025-03-26` ~ `2025-11-25` |
| Transport | Streamable HTTP at `/mcp` |
| Server mode | Stateless per request |
| Authentication | Not required |
| Tool count | 6 |
| Tool naming | ASCII letters and underscores only, no `kakao` substring |
| Tool metadata | `name`, `description`, `inputSchema`, `outputSchema`, full `annotations` |
| Tool results | Concise markdown text + minimal structured output |

## Deployment

Kakao Cloud Git Source Build 설정값:

| 항목 | 값 |
|---|---|
| Git URL | `https://github.com/jclee941/jclee-bot` |
| Branch / ref | `master` |
| Dockerfile path | `Dockerfile` |
| Container port | `3000` |
| Health check path | `/health` |
| Status | `Active` |
| Endpoint name | `meetup-coordinator-mcp` |
| Namespace | `kbm-u-4950521354` |
| PlayMCP endpoint | `https://meetup-coordinator-mcp.playmcp-endpoint.kakaocloud.io/mcp` |

컨테이너 빌드는 멀티 스테이지 Dockerfile을 사용합니다:

1. `deps` 단계에서 `oven/bun:1.3.10-alpine` 위에 `bun install --frozen-lockfile`로 의존성만 설치
2. 런타임 단계에서 동일 베이스 이미지에 `node_modules`와 소스만 복사
3. `NODE_ENV=production` 환경 변수와 `PORT=3000` 기본값 설정
4. `EXPOSE 3000` 후 `bun run start`로 컨테이너 시작

상세 빌드 절차는 `docs/kakao-cloud-git-source-build.md`를 참조하세요.

## PlayMCP Registration

PlayMCP 등록 절차:

1. PlayMCP in KC(Kakao Cloud)에서 배포가 `Active` 상태가 되면 발급된 Endpoint URL을 복사합니다.
2. PlayMCP 개발자 콘솔에서 새 MCP 서버로 등록합니다.
3. 먼저 임시 등록하고, 상세 미리보기에서 도구함에 추가한 뒤 PlayMCP AI 채팅으로 테스트합니다.
4. 테스트가 끝난 뒤 심사 요청합니다.
5. 승인 후 공개 상태를 전체 공개로 전환하고, 공개 MCP 상세 URL을 공모전 접수 양식에 제출합니다.

참고 이미지:

- `assets/playmcp-registration-image.png` — PlayMCP 등록 화면 예시
- `assets/submission-representative-template.png` — 공모전 제출 양식 예시

같은 자산의 SVG 원본은 `assets/*.svg`에서 확인할 수 있습니다.

## PlayMCP Submission

공모전 접수 양식 입력값:

| 필드 | 값 |
|---|---|
| 제작자 정보 / 팀프로필 이름 | `이재철2` |
| 대표 이미지 | `assets/playmcp-registration-image.png` |
| MCP 상세 URL | `https://meetup-coordinator-mcp.playmcp-endpoint.kakaocloud.io/mcp` |

추가 제출 항목(미리보기 캡처 등)은 `assets/` 디렉터리의 템플릿을 참고하세요.

## Maintainers

| 역할 | 담당 |
|---|---|
| 제작 / 운영 | 이재철 (`jclee941`) |
| 배포 환경 | Kakao Cloud (PlayMCP in KC) |
| 레지스트리 | PlayMCP 개발자 콘솔 |

이슈 및 운영 문의는 저장소 이슈 트래커를 통해 접수합니다.

## Contributing

기여 절차는 [`CONTRIBUTING.md`](./CONTRIBUTING.md)를 참조하세요. 핵심 규칙:

- 커밋 전 `bun run verify` 통과 필수
- Biome 규칙 준수 (`bun run format`)
- 새 도구 추가 시 6개 기존 도구의 명명·메타데이터 컨벤션 준수
- 테스트 동반 추가 (`tests/` 디렉터리)

## Further Documentation

| 문서 | 용도 |
|---|---|
| [`docs/kakao-cloud-git-source-build.md`](./docs/kakao-cloud-git-source-build.md) | Kakao Cloud Git Source Build 상세 절차 |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | 기여 가이드라인 |
| [`LICENSE`](./LICENSE) | 라이선스 전문 |

## License

저장소 [`LICENSE`](./LICENSE) 파일을 참조하세요.