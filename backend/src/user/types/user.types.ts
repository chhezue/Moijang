import { Types } from "mongoose";
import { User } from "../schema/user.schema";

// 1. 대학교 객체의 모양 정의
export type PopulatedUniversity = {
  _id: Types.ObjectId;
  name: string;
};

// 2. User에서 universityId를 PopulatedUniversity로 교체한 새로운 타입
export type UserWithUniversity = Omit<User, "universityId"> & {
  universityId: PopulatedUniversity;
};
