import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { createStateSyncMiddleware, initMessageListener } from 'redux-state-sync';
import AuthSlice from '../slices/AuthSlice';
import uiSlice from '../slices/uiSlice';  
import { encryptTransform } from '../../utils/encryptUtils';

// Persistencia de auth con encriptación
const authPersistConfig = {
  key: 'auth',
  storage,
  transforms: [encryptTransform],
};


// Reducer combinado con persistencias individuales
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, AuthSlice),
  ui: uiSlice, // ui no se persiste ni sincroniza
});

// Middleware de sincronización solo para auth
const stateSyncMiddleware = createStateSyncMiddleware({
  predicate: (action) => action.type.startsWith('auth/'),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(stateSyncMiddleware),
});

export const persistor = persistStore(store);

// Habilita la escucha entre pestañas
initMessageListener(store);

export default store;