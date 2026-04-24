import type { IUser } from "@/apis/interfaces";
import type { UserDto } from "@/types/auth";

// 백엔드 `GetUserDto` 응답을 기존 공구 UI가 쓰는 `IUser` 형태로 변환
// TODO 추후에는 Redux IUser를 없애고 전역 사용자 타입을 UserDto로 전면 통일
export function mapUserDtoToIUser(dto: UserDto): IUser {
  return {
    id: dto.id,
    displayName: dto.name,
    jobTitle: "",
    mail: dto.universityEmail,
    department: dto.universityName,
    userPrincipalName: dto.loginId,
  };
}
