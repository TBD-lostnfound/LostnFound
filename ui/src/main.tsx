import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import HomePage from "./HomePage";
import LostCategory from "./lostItemCategory";
import "./globals.css";

const page = window.location.pathname.replace(/\/+$/, "") || "/";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {page === "/lost/category" ? <LostCategory /> : <HomePage />}
  </StrictMode>,
);
