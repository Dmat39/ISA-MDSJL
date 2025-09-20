import { configureStore, combineReducers } from '@reduxjs/toolkit';
import AuthSlice from '../slices/AuthSlice';
import uiSlice from '../slices/uiSlice';

// Reducer combinado simple
const rootReducer = combineReducers({
  auth: AuthSlice,
  ui: uiSlice,
});

export const store = configureStore({
  reducer: rootReducer,
});

export default store;