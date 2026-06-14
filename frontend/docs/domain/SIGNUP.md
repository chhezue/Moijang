# 회원가입 흐름 (Frontend)

## 파일 구조

```
(auth)/signup/
├── page.tsx                        # 서버 컴포넌트, SignupClient 렌더
└── components/
    ├── SignupClient.tsx             # 전체 상태 관리 + 단계 제어 (CSR)
    ├── Step1University.tsx         # 대학교 검색/선택
    ├── Step2Email.tsx              # 이메일 입력 + 인증코드
    ├── Step3Account.tsx            # 아이디 / 이름 / 비밀번호
    └── StepComplete.tsx            # 가입 완료 환영 화면
```

---

## 단계별 흐름

### Step 0 — 대학교 선택

- 입력창에 키워드 입력 시 300ms debounce 후 `GET /api/university?keyword=` 호출
- 빈 문자열 전송 시 전체 목록 반환 (마운트 시 자동 로드)
- 검색 결과 Autocomplete로 표시 (지역 · 캠퍼스 유형 함께 표시)
- 목록에 있는 항목만 선택 가능 (`filterOptions={(x) => x}` — 클라이언트 필터 비활성화)
- 대학교 변경 시 Step 2 상태(이메일, 인증코드) 초기화

**다음 버튼 활성 조건:** `university !== null`

---

### Step 1 — 이메일 인증

- 이메일 로컬파트만 입력받고 `@{university.domain}` 은 InputAdornment로 고정 표시
- 전송 버튼 → `POST /api/auth/email/send` `{ email: "${emailLocal}@${domain}" }`
- 인증코드 6자리 입력 후 확인 → `POST /api/auth/email/verify` `{ email, code }`
  - 성공: `emailVerified = true`
  - 실패: 스낵바 에러 표시
- 인증 완료 후 이메일 · 코드 입력 비활성화

**다음 버튼 활성 조건:** `emailVerified === true`

---

### Step 2 — 계정 정보

- 이름 입력 (2~20자)
- 아이디 입력 (영문·숫자·언더스코어, 4~20자) + 중복검사 버튼
  - `GET /api/auth/check-username?username=`
  - 아이디 변경 시 중복검사 결과 초기화
- 비밀번호 입력 (영문 + 숫자 포함 8자 이상) + 확인

**다음 버튼 활성 조건:** `usernameChecked === true && name 유효 && password 유효 && password === passwordConfirm`

**가입 완료 버튼** 클릭 시 `POST /api/auth/register` 호출:

```ts
{ username, password, name, email: `${emailLocal}@${domain}`, universityId }
```

---

### Step 3 — 완료

- 이전/다음 버튼 없음 (`activeStep < steps.length - 1` 조건으로 버튼 블록 전체 숨김)
- 응답 DTO에서 `name`, `universityName` 꺼내서 환영 메시지 표시
- "로그인 하러 가기" 버튼 → `/login`

**응답 DTO (`RegisterResponse`):**

```ts
{
  loginId: string;
  name: string;
  universityEmail: string;
  universityId: string;
  universityName: string;
}
```

---

## 상태 구조 (SignupClient)

| 상태              | 타입                       | 용도                                      |
| ----------------- | -------------------------- | ----------------------------------------- |
| `activeStep`      | `number`                   | 현재 단계 (0~3)                           |
| `university`      | `University \| null`       | 선택한 대학교                             |
| `emailLocal`      | `string`                   | 이메일 로컬파트                           |
| `codeSent`        | `boolean`                  | 인증코드 발송 여부                        |
| `code`            | `string`                   | 입력한 인증코드                           |
| `emailVerified`   | `boolean`                  | 이메일 인증 완료 여부                     |
| `username`        | `string`                   | 아이디                                    |
| `usernameChecked` | `boolean \| null`          | null: 미확인, true: 사용가능, false: 중복 |
| `name`            | `string`                   | 이름                                      |
| `password`        | `string`                   | 비밀번호                                  |
| `passwordConfirm` | `string`                   | 비밀번호 확인                             |
| `registerResult`  | `RegisterResponse \| null` | 가입 완료 응답                            |

---

## API 연동 전환 방법

현재 모든 API 호출은 stub 처리 상태. 백엔드 연결 시:

1. **`Step1University.tsx`** — 상단 `STUB_UNIVERSITIES` 블록과 로컬 `searchUniversities` 함수 제거, import 주석 해제
2. **`SignupClient.tsx`** — 각 핸들러의 `// TODO` 주석 해제, stub 라인 제거

```ts
// 해제할 import
import {
  checkDuplicateUsername,
  sendVerificationCode,
  verifyCode,
  register,
} from '@/apis/services/docs';
```
