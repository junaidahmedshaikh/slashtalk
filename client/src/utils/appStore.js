import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import userReducer from "./userSlice";




const store = configureStore({
  reducer: {
    user: userReducer, 
  },
 
});

export default store;
