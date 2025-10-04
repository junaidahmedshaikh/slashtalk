// import { createSlice } from "@reduxjs/toolkit";
// import { io } from "socket.io-client";
// import { BASE_URL } from "./constant";

// const initialState = {
//   socket: null,
//   connected: false,
//   messages: [],
// };

// const socketSlice = createSlice({
//   name: "socket",
//   initialState,
//   reducers: {
//     connectSocket: (state) => {
//       if (!state.socket) {
//         state.socket = io(BASE_URL, {
//           autoConnect: true,
//         });
//         state.connected = true;
//       }
//     },
//     disconnectSocket: (state) => {
//       if (state.socket) {
//         state.socket.disconnect();
//         state.socket = null;
//         state.connected = false;
//       }
//     },
//     addMessage: (state, action) => {
//       state.messages.push(action.payload);
//     },
//     setConnectionStatus: (state, action) => {
//       state.connected = action.payload;
//     },
//   },
// });

// export const {
//   connectSocket,
//   disconnectSocket,
//   addMessage,
//   setConnectionStatus,
// } = socketSlice.actions;
// export default socketSlice.reducer;
