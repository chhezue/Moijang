import { combineReducers, configureStore } from "@reduxjs/toolkit";
import commonReducer from "./slice/commonSlice";

const rootReducer = combineReducers({
  common: commonReducer,
});

const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;

export default store;
