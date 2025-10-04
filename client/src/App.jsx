"use client";

import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="min-h-dvh">
      <Outlet />
    </div>
  );
}
