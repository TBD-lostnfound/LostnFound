import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ReportItem from "./reportItem";
import HomePage from "./HomePage";
import LostCategory from "./lostItemCategory";
import AgentPage from "./agentPage";
import AboutPage from "./AboutPage";
import "./globals.css";

const page = window.location.pathname.replace(/\/+$/, "") || "/";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {page === "/found/report" ? (
      <ReportItem />
    ) : page === "/lost/agent" ? (
      <AgentPage />
    ) : page === "/lost/category" ? (
      <LostCategory />
    ) : page === "/about" ? (
      <AboutPage />
    ) : (
      <HomePage />
    )}
  </StrictMode>,
);
