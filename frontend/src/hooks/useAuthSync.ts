// src/hooks/useAuthSync.ts

"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { SET_USER, CLEAR_USER } from "@/redux/slice/commonSlice"; // CLEAR_USER 추가
import { getMyInfo } from "@/apis/services/auth";

export const useAuthSync = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.common.user);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 이미 사용자 정보가 있다면 로딩 상태를 종료합니다.
    if (user) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await getMyInfo();
        console.log("getMyInfo OK:", res);
        dispatch(SET_USER(res));
      } catch {
        // API 호출이 실패하면 Redux 스토어의 사용자 정보를 초기화합니다.
        dispatch(CLEAR_USER());
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [user, dispatch]);

  return { user, loading };
};
