// uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    loading: false,
    moduleLoading: false,
}

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setModuleLoading: (state, action) => {
            state.moduleLoading = action.payload;
        },
    },
});

export const { setLoading, setModuleLoading } = uiSlice.actions;
export default uiSlice.reducer;
