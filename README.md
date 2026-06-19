# Meetup Coordinator MCP

PlayMCP가 호출하는 downstream MCP 서버입니다. 카카오톡 단체방 대화에서 약속 후보,
투표 문구, 확정 공지, 미응답자, 정산 문구를 정리합니다.

## Tools

- `meetup_availability_extract`: 단체방 메시지에서 가능한 날짜, 불가능한 날짜, 장소 신호를 추출합니다.
- `meetup_option_rank`: 날짜/장소 후보를 충돌이 적은 순서로 정렬합니다.
- `meetup_poll_draft`: 카카오톡 투표 문구와 선택지를 만듭니다.
- `meetup_final_notice`: 확정된 약속 공지문과 체크리스트를 만듭니다.
- `meetup_missing_people`: 아직 답하지 않았거나 애매하게 답한 사람을 정리합니다.
- `meetup_split_bill_message`: 총액과 참석자를 기준으로 정산 안내 문구를 만듭니다.

## Local Run

```bash
bun install
bun run verify
bun run start
```

확인:

```bash
curl -i http://localhost:3000/health
curl -i http://localhost:3000/mcp
```

## Kakao Cloud Git Source Build

- Git URL: `https://github.com/jclee941/meetup-coordinator-mcp.git`
- Branch/ref: `master`
- Dockerfile path: `Dockerfile`
- Container port: `3000`
- Health check path: `/health`
- PlayMCP endpoint: `https://<Kakao-Cloud-domain>/mcp`

## PlayMCP Registration Flow

1. PlayMCP in KC에서 배포가 Active가 되면 발급된 Endpoint URL을 복사합니다.
2. PlayMCP 개발자 콘솔에서 새 MCP 서버로 등록합니다.
3. 먼저 임시 등록하고, 상세 미리보기에서 도구함에 추가한 뒤 PlayMCP AI 채팅으로 테스트합니다.
4. 테스트가 끝난 뒤 심사 요청합니다.
5. 승인 후 공개 상태를 전체 공개로 전환하고, 공개 MCP 상세 URL을 공모전 접수 양식에 제출합니다.

## PlayMCP Submission Fields

- 대표 이미지: `assets/submission-representative-template.png`
- MCP 이름: `meetup-coordinator-mcp`
- MCP 식별자: `meetupCoord`
- MCP 설명:
  카카오톡 단체방 대화에서 약속 가능한 날짜와 장소 후보를 추출하고, 충돌이 적은 후보 정렬, 투표 문구, 확정 공지, 미응답자 확인, 정산 안내 문구를 생성하는 약속 조율 MCP입니다. 실제 카카오톡 계정에 접근하지 않고 사용자가 붙여넣은 대화 텍스트만 분석합니다.
- 대화 예시:
  - `단톡 대화에서 가능한 날짜 정리해줘`
  - `이 후보들로 카톡 투표 문구 만들어줘`
  - `참석자 기준으로 정산 안내문 써줘`
- 인증 방식: `인증 사용하지 않음`
- MCP Endpoint: `https://<Kakao-Cloud-domain>/mcp`

## Safety

- 실제 카카오톡 계정이나 메시지에 직접 접근하지 않습니다.
- 사용자가 붙여넣은 텍스트만 분석합니다.
- 전화번호, 계좌번호, 실명 등 민감한 정보는 입력하지 않는 것을 권장합니다.
