import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { routerConfig } from "./routerConfig";
import "./index.css";
import { Provider } from "react-redux";
import store from "./utils/appStore";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
        <RouterProvider router={routerConfig} />
    </Provider>
  </StrictMode>
);
