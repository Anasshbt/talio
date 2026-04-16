import { useState } from "react";
import MatchTab from "./components/MatchTab.jsx";
import RankTab from "./components/RankTab.jsx";
import Exercice2 from "./components/Exercice2.jsx";
import Exercice3 from "./components/Exercice3.jsx";
import Exercice4 from "./components/Exercice4.jsx";
import Exercice5 from "./components/Exercice5.jsx";
import QuestionFinale from "./components/QuestionFinale.jsx";

const SIDEBAR_ITEMS = [
  {
    id: "ex1",
    label: "Exercice 1",
    sublabel: "Matching Engine",
    icon: "1",
    color: "#4F6DFF",
  },
  {
    id: "ex2",
    label: "Exercice 2",
    sublabel: "DevOps & Déploiement",
    icon: "2",
    color: "#9B5CF6",
  },
  {
    id: "ex3",
    label: "Exercice 3",
    sublabel: "Product Thinking",
    icon: "3",
    color: "#F59E0B",
  },
  {
    id: "ex4",
    label: "Exercice 4",
    sublabel: "Code Review",
    icon: "4",
    color: "#DC2626",
  },
  {
    id: "ex5",
    label: "Exercice 5",
    sublabel: "IA & Productivité",
    icon: "5",
    color: "#EC4899",
  },
  {
    id: "finale",
    label: "Question Finale",
    sublabel: "Pourquoi Talio ?",
    icon: "🎯",
    color: "#92400E",
  },
];

const EX1_TABS = [
  { id: "match", label: "Match unique" },
  { id: "rank", label: "Classement" },
];

export default function App() {
  const [activePage, setActivePage] = useState("ex1");
  const [activeTab, setActiveTab] = useState("match");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarOpen ? " sidebar-open" : " sidebar-closed"}`}>
        <div className="sidebar-logo">
          <div className="logo-icon-wrap">🎯</div>
          {sidebarOpen && <span className="logo-wordmark">Talio</span>}
        </div>

        <nav className="sidebar-nav">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item${activePage === item.id ? " sidebar-item-active" : ""}${item.disabled ? " sidebar-item-disabled" : ""}`}
              style={{ "--item-color": item.color }}
              onClick={() => !item.disabled && setActivePage(item.id)}
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              {sidebarOpen && (
                <span className="sidebar-item-text">
                  <span className="sidebar-item-label">{item.label}</span>
                  <span className="sidebar-item-sub">{item.sublabel}</span>
                </span>
              )}
              {item.disabled && sidebarOpen && <span className="sidebar-item-soon">soon</span>}
            </button>
          ))}
        </nav>

        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? "Réduire" : "Agrandir"}
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>
      </aside>

      {/* ── Main area ── */}
      <div className="main-area">
        <header className="app-header">
          <div className="header-inner">
            <div className="header-breadcrumb">
              <span className="header-page-label">
                {SIDEBAR_ITEMS.find((i) => i.id === activePage)?.icon}{" "}
                {SIDEBAR_ITEMS.find((i) => i.id === activePage)?.label}
              </span>
              <span className="header-page-sub">
                — {SIDEBAR_ITEMS.find((i) => i.id === activePage)?.sublabel}
              </span>
            </div>
            <span className="header-badge">Matching Engine</span>
          </div>
        </header>

        <main className="app-main">
          {/* ── Exercice 1 ── */}
          {activePage === "ex1" && (
            <>
              <nav className="tabs">
                {EX1_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className={`tab-btn ${activeTab === tab.id ? "tab-active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
              <div className="tab-content">
                {activeTab === "match" && <MatchTab />}
                {activeTab === "rank" && <RankTab />}
              </div>
            </>
          )}

          {activePage === "ex2" && <Exercice2 />}
          {activePage === "ex3" && <Exercice3 />}
          {activePage === "ex4" && <Exercice4 />}
          {activePage === "ex5" && <Exercice5 />}
          {activePage === "finale" && <QuestionFinale />}
        </main>
      </div>
    </div>
  );
}
