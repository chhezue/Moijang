/**
 * 팀 커밋 메시지 규칙 (첫 줄 검사)
 * 형식: 타입 - 내용 / 타입[#이슈번호] - 내용
 * 예시: chore - 배포 설정 변경
 *       fix[#33] - 로그인 오류 수정
 * 이슈 번호는 선택이며 숫자만 사용합니다. 구분자는 공백을 포함한 " - "입니다.

 * 타입: feat(기능), fix(버그), docs(문서), style(코드 서식), refactor(구조 개선),
 *       perf(성능), test(테스트), build(빌드·의존성), ci(자동화),
 *       chore(기타 관리), revert(변경 되돌리기).
 * Git 자동 merge/revert 메시지 등은 commitlint 기본 예외를 따릅니다.
 * npm install 후 로컬 commit-msg 훅에서 검사하며, GitHub 웹 커밋은 검사하지 않습니다.
 */
module.exports = {
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w+)(?:\[#(\d+)\])? - (\S.*)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
  },
  helpUrl: 'https://github.com/chhezue/Moijang#-기여',
};
