# Kakao Cloud Git Source Build

Kakao Cloud의 `Git 소스 빌드` 화면에서 다음 값을 사용합니다.

| 항목 | 값 |
| --- | --- |
| MCP 서버 이름 | `meetup-coordinator` |
| 설명 | `붙여넣은 단체방 대화 텍스트에서 날짜 후보, 투표 문구, 확정 공지, 미응답자, 정산 문구를 정리하는 PlayMCP downstream MCP 서버` |
| Git URL | `https://github.com/jclee941/meetup-coordinator-mcp.git` |
| 브랜치/ref | `master` |
| Dockerfile 경로 | `Dockerfile` |
| PAT | public repo이므로 비워둠 |

MCP 서버 이름과 설명은 PlayMCP in KC 관리 화면용입니다. 이후 PlayMCP 개발자 콘솔의 공개 MCP 정보와는 별도로 입력합니다.

환경변수:

| 이름 | 값 |
| --- | --- |
| `PORT` | `3000` |
| `MCP_SERVER_NAME` | `meetup-coordinator-mcp` |
| `MCP_SERVER_VERSION` | `0.1.0` |
| `PUBLIC_BASE_URL` | `https://<Kakao-Cloud-domain>` |

배포 후 확인:

```bash
curl -i https://<Kakao-Cloud-domain>/health
```

PlayMCP 개발자 콘솔에 등록할 endpoint:

```text
https://<Kakao-Cloud-domain>/mcp
```

## PlayMCP 심사 기준 확인

- MCP protocol: `2025-03-26`부터 `2025-11-25`까지 SDK 지원 범위 안에서 협상
- Transport: Streamable HTTP only
- Server mode: 요청마다 새 MCP 서버/transport를 생성하는 stateless HTTP 처리
- Tool count: 6개
- Tool names: `meetup_*` 형식, `kakao` 문자열 없음
- Tool metadata: `description`, `inputSchema`, `outputSchema`, `annotations` 제공
- Tool result: JSON 전체를 text content에 반복하지 않고, 짧은 markdown text와 structured output만 반환
- 인증 방식: 인증 사용하지 않음

## PlayMCP 공모전 등록 순서

1. PlayMCP 개발자 콘솔에서 KC Endpoint URL을 입력하고 정보 불러오기를 실행합니다.
2. 지금은 등록 및 심사요청이 아니라 임시 등록을 먼저 선택합니다.
3. MCP 상세 미리보기에서 도구함에 추가하고 PlayMCP AI 채팅으로 충분히 테스트합니다.
4. 테스트가 완료되면 임시 등록 상태의 MCP를 심사 요청합니다.
5. 심사 승인 후 공개 상태를 전체 공개로 전환합니다.
6. 공개 MCP 상세페이지 URL을 복사해 Agentic Player 10 예선 접수 양식에 제출합니다.
