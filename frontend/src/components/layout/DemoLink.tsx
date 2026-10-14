"use client";

import { createContext, useContext } from "react";

export const DemoUrlContext = createContext("http://localhost:4000/demo/");

export function useDemoUrl() {
  return useContext(DemoUrlContext);
}
