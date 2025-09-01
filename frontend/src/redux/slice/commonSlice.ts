import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { IUser } from "@/apis/interfaces";

interface ICommonState {
  isDarkMode: boolean;
  user: IUser | null;
}

const initialState: ICommonState = {
  isDarkMode: false,
  user: null,
};

const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    CHANGE_DARK_MODE: (state, action) => {
      state.isDarkMode = !state.isDarkMode;
    },
    SET_USER: (state, action: PayloadAction<IUser>) => {
      state.user = action.payload;
    },
    CLEAR_USER: (state) => {
      state.user = null;
    },
  },
});

export const { CHANGE_DARK_MODE, SET_USER, CLEAR_USER } = commonSlice.actions;

export const selectIsDarkMode = (state: RootState) => state.common.isDarkMode;

export default commonSlice.reducer;
