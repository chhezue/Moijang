next.js 템플릿

- node v20.15.0
- next v14 (react v18)
- App Router 방식 사용

---

## 라이브러리

- next (next)
- react (react, react-dom)
- axios: http 통신
- redux (react-redux, @reduxjs/toolkit): 상태관리

## 참고사항

- prettier 적용 (eslint 선택): .prettierrc 사용중이니 작업하실 때 적용 부탁드립니다.

---

## 디렉토리 설명

- ### app

클라이언트 컴포넌트는 파일 이름에 Client 명시해 주시기 바랍니다.

기본적으로 page.tsx 를 서버 컴포넌트로 사용하고 OOOClient.tsx 를 클라이언트 컴포넌트로 불러와서 사용하는걸 권장합니다.

- ### apis

services 디렉토리에 사용할 api 들을 작성해주면 됩니다.

services/apiClient 에서 기본 api 설정을 합니다. (axios 사용)

에러 처리는 utils/apiHelpers 를 사용하시면 편리할 거 같습니다.

- ### assets

이미지 및 아이콘 보관

- ### components

common 은 완전 공통적인 컴포넌트를 구분하고 있습니다.

특정 페이지들만 사용하는 거라면 따로 디렉토리를 생성 해주시기 바랍니다.

- ### constants

전역 변수 또는 상수 관리

- ### hooks

- ### layouts

- ### redux

상태관리로 리덕스 사용중입니다. 다른 라이브러리를 쓰고 싶다면

redux 관련 라이브러리(react-redux, @reduxjs/toolkit) 삭제 후

redux 디렉토리 삭제 및 app/layout.tsx 의 <ReduxProvider /> 삭제 하시면 됩니다.

- ### styles

reset.css 가 있습니다. 공통 css 사용 시에 :root 사용 바랍니다.

- ### types

타입 관리

- ### utils

유틸 함수
