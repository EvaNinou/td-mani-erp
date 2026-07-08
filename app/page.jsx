'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient.js';
import './styles.css';
import Dashboard from './components/Dashboard/Dashboard';
import Customers from './components/customers/Customers';
import { normalizeText, formatCurrency, formatDate, formatGreekLongDate, formatGreekTime, formatLocalDate, getGreeting, getFirstName } from './utils/formatters';
import { calculateQuoteValues, calculateCustomerInvoiceValues, calculateSupplierInvoiceValues, getQuarterDates, isDateInRange } from './utils/calculations';
import {
  INITIAL_CUSTOMER,
  INITIAL_PROJECT,
  INITIAL_PAYMENT,
  INITIAL_EXPENSE,
  INITIAL_INVENTORY,
  INITIAL_QUOTE,
  INITIAL_TASK,
  INITIAL_DOCUMENT,
  INITIAL_CUSTOMER_INVOICE,
  INITIAL_SUPPLIER,
  INITIAL_SUPPLIER_INVOICE,
  INITIAL_SUPPLIER_PAYMENT,
  DEMO_USERS
} from './utils/constants';
import {
  getCustomers,
  createCustomer,
  updateCustomer
} from './services/customers';

const ERP_STYLES = `:root {
  --gold: #d6a84f;
  --dark: #0d0d0f;
  --card: rgba(29, 29, 34, 0.72);
  --text: #f5f1e8;
  --muted: #a8a29a;
  --danger: #ff6b5f;
  --border: rgba(255, 255, 255, 0.10);
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0 !important;
  background:
    radial-gradient(circle at top left, rgba(214, 168, 79, 0.14), transparent 32%),
    linear-gradient(135deg, #070708 0%, #101014 48%, #0a0a0c 100%) !important;
  color: var(--text) !important;
  font-family: Arial, Helvetica, sans-serif;
}

.app {
  width: min(1280px, 100%);
  margin: 0 auto;
  min-height: 100vh;
  padding: 16px;
}

.top {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
  padding: 14px 16px;
  background: rgba(13, 13, 15, 0.94) !important;
  backdrop-filter: blur(14px);
  border: 1px solid var(--border);
  border-radius: 22px;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.26);
}

.brand {
  display: flex;
  gap: 14px;
  align-items: center;
}

.logo {
  width: 64px;
  height: 54px;
  flex: 0 0 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #d6a84f, #7a551d) !important;
  color: #101014 !important;
  border: 1px solid rgba(214, 168, 79, 0.4);
  border-radius: 16px;
  font-size: 24px;
  font-weight: 950;
  letter-spacing: -1px;
}

.pdf-logo {
  width: 76px;
  height: 62px;
}

h1, h2, h3, h4, p { margin-top: 0; }

h1 {
  margin-bottom: 4px;
  color: var(--text);
  font-size: 24px;
  letter-spacing: 0.08em;
}

h2 {
  margin-bottom: 14px;
  color: var(--text);
  font-size: 21px;
}

h3 {
  margin-top: 18px;
  margin-bottom: 10px;
  color: var(--gold);
  font-size: 17px;
}

h4 {
  margin-top: 14px;
  margin-bottom: 8px;
  color: var(--text);
  font-size: 15px;
}

p { color: var(--text); }
small { color: var(--muted); }

.card {
  margin: 14px 0;
  padding: 18px;
  background: var(--card) !important;
  border: 1px solid var(--border);
  border-radius: 22px;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.card:hover {
  transform: translateY(-2px);
  border-color: rgba(214,168,79,0.30);
  box-shadow: 0 24px 54px rgba(0, 0, 0, 0.30);
}

.login-card {
  width: min(460px, 100%);
  margin: 8vh auto;
  text-align: center;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.line {
  margin: 10px 0;
  padding: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.070), rgba(255,255,255,0.026)) !important;
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 24px rgba(0,0,0,0.18);
  text-align: left;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.line:hover {
  transform: translateY(-2px);
  border-color: rgba(214,168,79,0.34);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), 0 16px 34px rgba(0,0,0,0.24);
}

.line p {
  margin: 0 0 7px;
  color: var(--text);
  font-size: 15px;
  line-height: 1.35;
}

.line p:last-child { margin-bottom: 0; }

.line b {
  color: var(--gold);
  font-size: 17px;
}

.alert {
  border-color: rgba(255, 107, 95, 0.55);
  background: linear-gradient(180deg, rgba(255,107,95,0.13), rgba(255,107,95,0.06)) !important;
}

input, select, textarea {
  width: 100%;
  margin: 7px 0;
  padding: 13px 14px;
  background: rgba(255,255,255,0.055) !important;
  color: var(--text) !important;
  border: 1px solid var(--border);
  border-radius: 14px;
  font-size: 15px;
  outline: none;
}

select option {
  background: #16161a;
  color: var(--text);
}

input::placeholder, textarea::placeholder { color: #8f8a82; }

input:focus, select:focus, textarea:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(214,168,79,0.13);
}

textarea {
  min-height: 92px;
  resize: vertical;
}

button {
  display: inline-block;
  width: auto;
  min-width: 120px;
  margin: 7px 7px 7px 0;
  padding: 12px 15px;
  border: 1px solid rgba(214,168,79,0.28);
  border-radius: 14px;
  background: linear-gradient(135deg, #d6a84f, #7a551d) !important;
  color: #101014 !important;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(0,0,0,0.24);
}

button + button {
  background: rgba(255,255,255,0.07) !important;
  color: var(--text) !important;
  border-color: var(--border);
}

a {
  color: var(--gold);
  font-weight: 800;
  text-decoration: none;
}

hr {
  margin: 18px 0;
  border: none;
  border-top: 1px solid var(--border);
}

.pdf-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.signature-line {
  margin-top: 26px;
  padding-top: 16px;
  border-top: 1px solid rgba(214,168,79,0.55);
  width: 220px;
}

.report-block {
  break-inside: avoid;
  padding: 12px 0;
}


/* Premium Project Progress */
.project-hero-card {
  position: relative;
  overflow: hidden;
  border-color: rgba(214,168,79,0.32);
  background:
    radial-gradient(circle at top left, rgba(214,168,79,0.18), transparent 34%),
    linear-gradient(135deg, rgba(255,255,255,0.070), rgba(255,255,255,0.022)) !important;
}

.project-hero-card::after {
  content: '';
  position: absolute;
  right: -70px;
  top: -70px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: rgba(214,168,79,0.08);
  filter: blur(4px);
}

.project-hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  flex-wrap: wrap;
}

.project-hero-title {
  margin-bottom: 8px;
  font-size: 26px;
}

.project-hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.project-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 11px;
  border-radius: 999px;
  border: 1px solid rgba(214,168,79,0.22);
  background: rgba(255,255,255,0.055);
  color: var(--text);
  font-weight: 800;
  font-size: 13px;
}

.project-progress-mini {
  min-width: 170px;
  text-align: right;
}

.progress-hero {
  position: relative;
  overflow: hidden;
  padding: 22px;
  border-radius: 24px;
  border: 1px solid rgba(214,168,79,0.30);
  background:
    radial-gradient(circle at top left, rgba(214,168,79,0.20), transparent 34%),
    linear-gradient(135deg, rgba(255,255,255,0.070), rgba(255,255,255,0.022)) !important;
}

.progress-hero::after {
  content: '';
  position: absolute;
  right: -80px;
  top: -80px;
  width: 230px;
  height: 230px;
  border-radius: 50%;
  background: rgba(214,168,79,0.08);
  filter: blur(4px);
}

.progress-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.1fr 1.4fr 0.9fr;
  gap: 14px;
  align-items: stretch;
}

.progress-ring-card, .progress-bars-card, .progress-status-card, .progress-timeline-card, .progress-finance-card {
  background: rgba(255,255,255,0.045) !important;
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 16px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 28px rgba(0,0,0,0.20);
}

.progress-ring-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.progress-ring {
  --value: 0;
  width: 190px;
  height: 190px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: conic-gradient(var(--gold) calc(var(--value) * 1%), rgba(255,255,255,0.10) 0);
  box-shadow: 0 0 28px rgba(214,168,79,0.15);
}

.progress-ring-inner {
  width: 145px;
  height: 145px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  text-align: center;
  background: rgba(13,13,15,0.94);
  border: 1px solid rgba(255,255,255,0.08);
}

.progress-ring-number {
  font-size: 42px;
  font-weight: 950;
  color: var(--text);
  line-height: 1;
}

.progress-ring-label {
  margin-top: 8px;
  color: var(--muted);
  font-weight: 800;
}

.progress-bar-row {
  display: grid;
  grid-template-columns: 160px 1fr 48px;
  gap: 10px;
  align-items: center;
  margin: 12px 0;
}

.progress-bar-label {
  color: var(--text);
  font-weight: 800;
}

.progress-bar-track {
  height: 10px;
  overflow: hidden;
  background: rgba(255,255,255,0.09);
  border-radius: 999px;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(135deg, #d6a84f, #7a551d);
}

.progress-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  color: #b9ff9e;
  border: 1px solid rgba(94,220,90,0.35);
  background: rgba(72,180,70,0.16);
  border-radius: 999px;
  font-weight: 950;
}

.progress-timeline {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.progress-stage {
  position: relative;
  min-height: 130px;
  padding: 14px 10px;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.035);
  text-align: center;
}

.progress-stage.done { border-color: rgba(90,210,95,0.35); }
.progress-stage.current { border-color: rgba(214,168,79,0.72); box-shadow: 0 0 26px rgba(214,168,79,0.10); }

.progress-stage-dot {
  width: 34px;
  height: 34px;
  margin: -2px auto 10px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,0.16);
  color: var(--text);
  font-weight: 950;
}

.progress-stage.done .progress-stage-dot { background: rgba(90,210,95,0.85); color: white; }
.progress-stage.current .progress-stage-dot { background: linear-gradient(135deg, #d6a84f, #7a551d); color: #101014; }

.progress-finance-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.erp-footer-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: min(340px, 100%);
  margin: 18px 0 90px;
  padding: 16px;
  border: 1px solid rgba(214,168,79,0.35);
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(214,168,79,0.13), rgba(255,255,255,0.035)) !important;
  box-shadow: 0 16px 34px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.05);
}

.erp-footer-icon {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  border: 1px solid rgba(214,168,79,0.35);
  background: rgba(13,13,15,0.55);
  color: var(--gold);
  font-size: 30px;
}

.erp-footer-title {
  margin: 0 0 4px;
  font-weight: 950;
  color: var(--text);
}

.erp-footer-copy {
  margin: 0;
  color: var(--gold);
  font-weight: 850;
}

@media (max-width: 900px) {
  .progress-layout { grid-template-columns: 1fr; }
  .progress-timeline { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .progress-finance-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .project-progress-mini { text-align: left; }
}

@media (max-width: 560px) {
  .progress-bar-row { grid-template-columns: 1fr; gap: 6px; }
  .progress-timeline { grid-template-columns: 1fr; }
  .progress-finance-grid { grid-template-columns: 1fr; }
}


/* Global Search */
.global-search {
  position: relative;
  flex: 1 1 420px;
  max-width: 520px;
}

.global-search input {
  margin: 0;
  padding-left: 44px;
  padding-right: 44px;
  border-radius: 999px;
  background: rgba(255,255,255,0.070) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.055), 0 12px 28px rgba(0,0,0,0.16);
}

.global-search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gold);
  font-weight: 900;
  pointer-events: none;
}

.global-search-shortcut {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--muted);
  font-size: 12px;
  pointer-events: none;
}

.global-search-results {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 10px);
  z-index: 120;
  max-height: 420px;
  overflow-y: auto;
  padding: 10px;
  background: rgba(13,13,15,0.96) !important;
  border: 1px solid rgba(214,168,79,0.24);
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.48);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.global-search-result {
  width: 100%;
  margin: 0 0 8px;
  padding: 12px 13px;
  display: block;
  text-align: left;
  background: rgba(255,255,255,0.050) !important;
  color: var(--text) !important;
  border: 1px solid var(--border);
  border-radius: 14px;
}

.global-search-result:hover {
  border-color: rgba(214,168,79,0.55);
  background: rgba(214,168,79,0.10) !important;
}

.global-search-result-title {
  display: block;
  color: var(--gold);
  font-weight: 950;
  margin-bottom: 3px;
}

.global-search-result-meta {
  display: block;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.global-search-empty {
  padding: 13px;
  color: var(--muted);
}

.section-title-icon {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  margin-right: 6px;
  border-radius: 10px;
  background: rgba(214,168,79,0.12);
  border: 1px solid rgba(214,168,79,0.20);
}


/* Navigation tabs */
.erp-nav {
  position: sticky;
  top: 92px;
  z-index: 24;
  display: flex !important;
  gap: 8px;
  margin: 0 0 16px;
  padding: 10px;
  overflow-x: auto;
  background: rgba(13,13,15,0.90) !important;
  backdrop-filter: blur(14px);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: 0 14px 30px rgba(0,0,0,0.24);
}

.erp-nav button {
  width: auto;
  min-width: max-content;
  margin: 0;
  padding: 10px 13px;
  background: rgba(255,255,255,0.055) !important;
  color: var(--text) !important;
  border: 1px solid var(--border);
  box-shadow: none;
}

.erp-nav button.active {
  background: linear-gradient(135deg, #d6a84f, #7a551d) !important;
  color: #101014 !important;
}

/* IMPORTANT: tab system */
.page-section {
  display: none !important;
}

.page-dashboard .dashboard-section,
.page-customers .customers-section,
.page-income-expenses .income-expenses-section,
.page-finance .finance-section,
.page-customer-invoices .customer-invoices-section,
.page-tasks .tasks-section,
.page-documents .documents-section,
.page-suppliers .suppliers-section,
.page-inventory .inventory-section,
.page-reports .reports-section,
.page-settings.settings-reports .reports-section,
.page-trash .trash-section,
.page-settings.settings-home .settings-section,
.page-settings.settings-tasks .settings-task-section,
.page-settings.settings-documents .settings-document-section,
.page-settings.settings-trash .settings-trash-section {
  display: block !important;
}

.settings-card {
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.settings-card:hover {
  transform: translateY(-2px);
  border-color: rgba(214,168,79,0.55);
}

.dashboard-welcome {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  flex-wrap: wrap;
  padding: 18px;
  background: linear-gradient(135deg, rgba(214,168,79,0.14), rgba(255,255,255,0.035)) !important;
  border: 1px solid rgba(214,168,79,0.22);
  border-radius: 22px;
  margin-bottom: 16px;
}

.dashboard-welcome h2 {
  margin-bottom: 8px;
  font-size: 24px;
}

.dashboard-welcome-date {
  color: var(--gold);
  font-weight: 900;
  margin-bottom: 8px;
}

.dashboard-welcome-time {
  min-width: 96px;
  text-align: right;
  color: var(--muted);
  font-weight: 800;
}

.dashboard-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 14px 0;
}

.dashboard-strip-item {
  padding: 13px 14px;
  background: rgba(255,255,255,0.045) !important;
  border: 1px solid var(--border);
  border-radius: 16px;
}

.dashboard-strip-item b {
  color: var(--gold);
}

@media (max-width: 900px) {
  .app { padding: 12px; }
  .top { align-items: flex-start; flex-direction: column; }
  .global-search { width: 100%; max-width: none; }
  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dashboard-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .card { padding: 16px; border-radius: 20px; }
  h1 { font-size: 21px; }
  h2 { font-size: 19px; }
}

@media (max-width: 560px) {
  .app { padding: 10px; }

  .top {
    position: relative !important;
    min-height: auto !important;
  }

  .top .brand {
    padding-right: 60px;
  }

  .global-search {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 46px !important;
    height: 46px;
    max-width: 46px !important;
    flex: 0 0 46px;
    z-index: 140;
  }

  .global-search input {
    width: 46px;
    height: 46px;
    min-height: 46px;
    padding: 0 !important;
    border-radius: 999px;
    color: transparent !important;
    caret-color: transparent;
    cursor: pointer;
  }

  .global-search input::placeholder {
    color: transparent !important;
  }

  .global-search-icon {
    left: 50%;
    font-size: 22px;
    transform: translate(-50%, -50%);
  }

  .global-search-shortcut {
    display: none !important;
  }

  .global-search:focus-within {
    position: fixed;
    inset: 12px;
    width: auto !important;
    height: auto;
    max-width: none !important;
    padding: 14px;
    background: rgba(13,13,15,0.985) !important;
    border: 1px solid rgba(214,168,79,0.28);
    border-radius: 22px;
    box-shadow: 0 28px 80px rgba(0,0,0,0.62);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  .global-search:focus-within input {
    width: 100%;
    height: auto;
    min-height: 52px;
    padding-left: 46px !important;
    padding-right: 14px !important;
    color: var(--text) !important;
    caret-color: var(--gold);
    cursor: text;
  }

  .global-search:focus-within input::placeholder {
    color: #8f8a82 !important;
  }

  .global-search:focus-within .global-search-icon {
    left: 30px;
    transform: translateY(-50%);
  }

  .global-search:focus-within .global-search-results {
    position: static;
    margin-top: 12px;
    max-height: calc(100vh - 110px);
  }

  .top {
    position: static !important;
    padding: 13px;
    border-radius: 18px;
  }

  .erp-nav {
    top: 0;
    border-radius: 16px;
    padding: 8px;
  }

  .erp-nav button {
    width: auto;
    min-width: max-content;
    padding: 9px 11px;
    font-size: 14px;
  }

  .grid { grid-template-columns: 1fr; }
  .dashboard-strip { grid-template-columns: 1fr; }
  .dashboard-welcome-time { text-align: left; }
  .brand { width: 100%; }

  .logo {
    width: 58px;
    height: 48px;
    flex-basis: 58px;
    font-size: 22px;
  }

  .card {
    margin: 12px 0;
    padding: 14px;
    border-radius: 18px;
  }

  .line {
    padding: 13px;
    border-radius: 16px;
  }

  input, select, textarea, button { font-size: 16px; }

  button {
    width: 100%;
    margin-right: 0;
  }
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0 16px;
  overflow: hidden;
  border-radius: 14px;
}

.report-table th,
.report-table td {
  padding: 10px 9px;
  border: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
  font-size: 14px;
}

.report-table th {
  color: var(--gold);
  background: rgba(214,168,79,0.10) !important;
}

.report-total-row td {
  font-weight: 900;
  color: var(--gold);
}

.report-muted {
  color: var(--muted);
}

.no-print-inline {
  display: inline-block;
}


.quick-create-fab {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 100;
  width: 68px;
  height: 68px;
  min-width: 68px;
  margin: 0;
  padding: 0;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  line-height: 1;
  box-shadow: 0 20px 44px rgba(0,0,0,0.48), 0 0 0 1px rgba(214,168,79,0.28);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.quick-create-fab:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 24px 54px rgba(0,0,0,0.56), 0 0 0 1px rgba(214,168,79,0.48);
}

.quick-create-fab.open {
  transform: rotate(45deg);
}

.quick-create-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(0,0,0,0.58);
  backdrop-filter: blur(5px);
  animation: quickFade 0.20s ease both;
}

.quick-create-panel {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 90;
  width: min(430px, 100%);
  height: 100vh;
  padding: 22px;
  overflow-y: auto;
  background: rgba(13,13,15,0.985) !important;
  border-left: 1px solid rgba(214,168,79,0.30);
  box-shadow: -26px 0 54px rgba(0,0,0,0.46);
  animation: quickSlide 0.24s ease both;
}

.quick-create-option {
  width: 100%;
  margin: 9px 0;
  padding: 15px;
  text-align: left;
  background: rgba(255,255,255,0.06) !important;
  color: var(--text) !important;
  border-color: var(--border);
}

.quick-create-option:hover {
  border-color: rgba(214,168,79,0.55);
}

.quick-return-card {
  border-color: rgba(214,168,79,0.45);
  background: linear-gradient(180deg, rgba(214,168,79,0.12), rgba(255,255,255,0.04)) !important;
}

@keyframes quickFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes quickSlide {
  from { transform: translateX(100%); opacity: 0.8; }
  to { transform: translateX(0); opacity: 1; }
}



@media (max-width: 560px) {
  .quick-create-fab {
    right: 15px;
    bottom: 15px;
    width: 62px;
    height: 62px;
    min-width: 62px;
    font-size: 32px;
  }

  .quick-create-panel {
    width: 100%;
    border-left: none;
    padding: 18px;
  }
}


/* Inventory ERP v1.0 */
.inventory-lines { display: grid; gap: 10px; margin: 12px 0; }
.inventory-material-row {
  display: grid;
  grid-template-columns: 1.25fr 0.75fr 0.7fr 0.85fr 1fr 0.45fr;
  gap: 8px;
  align-items: center;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: rgba(255,255,255,0.040) !important;
}
.inventory-material-row button { min-width: 44px; padding: 11px 12px; }
.inventory-toggle-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: rgba(255,255,255,0.045) !important;
}
.inventory-toggle-line input { width: auto; margin: 0; }
.inventory-movement { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.inventory-stock-number { font-size: 22px; font-weight: 950; color: var(--gold); }
@media (max-width: 900px) { .inventory-material-row { grid-template-columns: 1fr 1fr; } }
@media (max-width: 560px) { .inventory-material-row { grid-template-columns: 1fr; } }

@media print {
  body {
    background: white !important;
    color: #111 !important;
  }

  body * { visibility: hidden; }

  .print-area,
  .print-area * {
    visibility: visible;
    color: #111 !important;
  }

  .print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 22px;
    background: white !important;
    box-shadow: none;
    border: none;
    border-radius: 0;
  }

  .print-area button,
  .no-print,
  .no-print-inline,
  .top,
  .erp-nav { display: none !important; }

  .page-section { display: block !important; }
}
`;


export default function Home() {
  const [selectedUser, setSelectedUser] = useState('Mani Taulant');
  const [activePage, setActivePage] = useState('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState('');
  const [activeReportTab, setActiveReportTab] = useState('');
  const [selectedReportProjectId, setSelectedReportProjectId] = useState('');
  const [showProjectReport, setShowProjectReport] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickReturnToDashboard, setQuickReturnToDashboard] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  const [crews, setCrews] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [inventoryMovements, setInventoryMovements] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [supplierPayments, setSupplierPayments] = useState([]);

  const [selectedProject, setSelectedProject] = useState(null);
  const [activeProjectTab, setActiveProjectTab] = useState('overview');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedCustomerReport, setSelectedCustomerReport] = useState(null);
  const [selectedSupplierReport, setSelectedSupplierReport] = useState(null);
  const [openCustomerId, setOpenCustomerId] = useState(null);
  const [showPayments, setShowPayments] = useState(false);
  const [openSupplierId, setOpenSupplierId] = useState(null);
  
const [customerSearch, setCustomerSearch] = useState('');
const [projectSearch, setProjectSearch] = useState('');
const [taskSearch, setTaskSearch] = useState('');
const [supplierSearch, setSupplierSearch] = useState('');
const [customerInvoiceSearch, setCustomerInvoiceSearch] = useState('');
const [paymentCustomerSearch, setPaymentCustomerSearch] = useState('');
const [vatYear, setVatYear] = useState(String(new Date().getFullYear()));
const [vatQuarter, setVatQuarter] = useState('1');
  
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingCustomerInvoiceId, setEditingCustomerInvoiceId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingInventoryId, setEditingInventoryId] = useState(null);
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingDocumentId, setEditingDocumentId] = useState(null);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [editingSupplierInvoiceId, setEditingSupplierInvoiceId] = useState(null);
  const [editingSupplierPaymentId, setEditingSupplierPaymentId] = useState(null);

  const [newCustomer, setNewCustomer] = useState(INITIAL_CUSTOMER);
  const [newProject, setNewProject] = useState(INITIAL_PROJECT);
  const [newPayment, setNewPayment] = useState(INITIAL_PAYMENT);
  const [newCustomerInvoice, setNewCustomerInvoice] = useState(INITIAL_CUSTOMER_INVOICE);
  const [newExpense, setNewExpense] = useState(INITIAL_EXPENSE);
  const [newInventory, setNewInventory] = useState(INITIAL_INVENTORY);
  const [newQuote, setNewQuote] = useState(INITIAL_QUOTE);
  const [newTask, setNewTask] = useState(INITIAL_TASK);
  const [newDocument, setNewDocument] = useState(INITIAL_DOCUMENT);
  const [documentFile, setDocumentFile] = useState(null);
  const [newSupplier, setNewSupplier] = useState(INITIAL_SUPPLIER);
  const [newSupplierInvoice, setNewSupplierInvoice] = useState(INITIAL_SUPPLIER_INVOICE);
  const [supplierInvoiceHasMaterials, setSupplierInvoiceHasMaterials] = useState(false);
  const [supplierInvoiceMaterialLines, setSupplierInvoiceMaterialLines] = useState([]);
  const [openInventoryItemId, setOpenInventoryItemId] = useState(null);
  const [newSupplierPayment, setNewSupplierPayment] = useState(INITIAL_SUPPLIER_PAYMENT);

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleGlobalSearchShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setGlobalSearchOpen(true);
        setTimeout(() => document.getElementById('global-search-input')?.focus(), 40);
      }

      if (event.key === 'Escape') {
        setGlobalSearchOpen(false);
      }
    }

    window.addEventListener('keydown', handleGlobalSearchShortcut);
    return () => window.removeEventListener('keydown', handleGlobalSearchShortcut);
  }, []);

  async function refreshAll() {
    await Promise.all([
      loadCrews(),
      loadCustomers(),
      loadProjects(),
      loadPayments(),
      loadCustomerInvoices(),
      loadExpenses(),
      loadInventory(),
      loadInventoryMovements(),
      loadQuotes(),
      loadTasks(),
      loadDocuments(),
      loadSuppliers(),
      loadSupplierInvoices(),
      loadSupplierPayments()
    ]);
  }

  async function loadCrews() {
    const { data } = await supabase.from('crews').select('*').order('created_at', { ascending: false });
    setCrews(data || []);
  }

  async function loadCustomers() {
    try {
      const data = await getCustomers(supabase);
      setCustomers(data);
    } catch (error) {
      alert(error.message);
    }
  }

  async function loadProjects() {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    setProjects(data || []);
  }

  async function loadPayments() {
    const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    setPayments(data || []);
  }

  async function loadCustomerInvoices() {
    const { data } = await supabase.from('customer_invoices').select('*').order('invoice_date', { ascending: false });
    setCustomerInvoices(data || []);
  }

  async function loadExpenses() {
    const { data } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    setExpenses(data || []);
  }

  async function loadInventory() {
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    setInventory(data || []);
  }

  async function loadInventoryMovements() {
    const { data, error } = await supabase.from('inventory_movements').select('*').order('movement_date', { ascending: false });
    if (error) {
      setInventoryMovements([]);
      return;
    }
    setInventoryMovements(data || []);
  }

  async function loadQuotes() {
    const { data } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
    setQuotes(data || []);
  }

  async function loadTasks() {
    const { data } = await supabase.from('tasks').select('*').order('task_date', { ascending: true });
    setTasks(data || []);
  }

  async function loadDocuments() {
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    setDocuments(data || []);
  }

  async function loadSuppliers() {
    const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
    setSuppliers(data || []);
  }

  async function loadSupplierInvoices() {
    const { data } = await supabase.from('supplier_invoices').select('*').order('invoice_date', { ascending: false });
    setSupplierInvoices(data || []);
  }

  async function loadSupplierPayments() {
    const { data } = await supabase.from('supplier_payments').select('*').order('payment_date', { ascending: false });
    setSupplierPayments(data || []);
  }

  function getCustomerName(customerId) {
    return customers.find((customer) => customer.id === customerId)?.name || 'Χωρίς πελάτη';
  }

  function getCustomerAfm(customerId) {
    return customers.find((customer) => customer.id === customerId)?.afm || '-';
  }

  function getCustomerInvoices(customerId) {
    return customerInvoices.filter((invoice) => invoice.customer_id === customerId && isActiveItem(invoice));
  }

  function getProjectCustomerInvoices(projectId) {
    return customerInvoices.filter((invoice) => invoice.project_id === projectId && isActiveItem(invoice));
  }

  function getCustomerInvoicePayments(invoiceId) {
    return payments.filter((payment) => payment.customer_invoice_id === invoiceId && isActivePayment(payment));
  }

  function getCustomerInvoicePaid(invoiceId) {
    return getCustomerInvoicePayments(invoiceId)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  }

  function getCustomerInvoiceStatus(invoice) {
    const paid = getCustomerInvoicePaid(invoice.id);
    const receivable = Number(invoice.receivable_amount || 0);

    if (paid <= 0) return 'Απλήρωτο';
    if (paid < receivable) return 'Μερικώς πληρωμένο';
    return 'Εξοφλημένο';
  }



function getCustomerProjects(customerId) {
    return projects.filter((project) => project.customer_id === customerId && isActiveItem(project));
  }

  function getFilteredProjectsByCustomer(customerId) {
    if (!customerId) return [];
    return projects.filter((project) => project.customer_id === customerId && isActiveItem(project));
  }

  function getUnassignedProjects() {
    return projects.filter((project) => !project.customer_id && isActiveItem(project));
  }

  function getProjectTitle(projectId) {
    return projects.find((project) => project.id === projectId)?.title || 'Χωρίς έργο';
  }

  function getProjectPaid(projectId) {
    return payments
      .filter((payment) => payment.project_id === projectId && isActivePayment(payment))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  }

  function getProjectExpenses(projectId) {
    return expenses
      .filter((expense) => expense.project_id === projectId && isActiveItem(expense))
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }

  function getProjectQuotes(projectId) {
    return quotes.filter((quote) => quote.project_id === projectId && isActiveItem(quote));
  }

  function getProjectTasks(projectId) {
    return tasks.filter((task) => task.project_id === projectId && isActiveItem(task));
  }

  function getProjectDocuments(projectId) {
    return documents.filter((document) => document.project_id === projectId && isActiveItem(document));
  }

  function getProjectSupplierInvoices(projectId) {
    return supplierInvoices.filter((invoice) => invoice.project_id === projectId && isActiveItem(invoice));
  }

  function getSupplierName(supplierId) {
    return suppliers.find((supplier) => supplier.id === supplierId)?.name || 'Χωρίς προμηθευτή';
  }

  function getSupplierInvoices(supplierId) {
    return supplierInvoices.filter((invoice) => invoice.supplier_id === supplierId && isActiveItem(invoice));
  }

  function getSupplierPayments(supplierId) {
    return supplierPayments.filter((payment) => payment.supplier_id === supplierId && isActiveItem(payment));
  }

  function getSupplierInvoicePayments(invoiceId) {
    return supplierPayments.filter((payment) => payment.supplier_invoice_id === invoiceId && isActiveItem(payment));
  }

  function getSupplierInvoicePaid(invoiceId) {
    return getSupplierInvoicePayments(invoiceId)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  }

  function getSupplierInvoiceStatus(invoice) {
    const paid = getSupplierInvoicePaid(invoice.id);
    const total = Number(invoice.total_amount || 0);

    if (paid <= 0) return 'Απλήρωτο';
    if (paid < total) return 'Μερικώς πληρωμένο';
    return 'Εξοφλημένο';
  }

  function getInventoryItemName(itemId) {
    return inventory.find((item) => item.id === itemId)?.item_name || 'Υλικό';
  }

  function getInventoryItemUnit(itemId) {
    return inventory.find((item) => item.id === itemId)?.unit || inventory.find((item) => item.id === itemId)?.measure_unit || 'τεμ.';
  }

  function getInventoryItemMovements(itemId) {
    return inventoryMovements.filter((movement) => movement.item_id === itemId && isActiveItem(movement));
  }

  function getInventoryItemStock(itemId) {
    return getInventoryItemMovements(itemId).reduce((sum, movement) => {
      const quantity = Number(movement.quantity || 0);
      if (movement.movement_type === 'USE') return sum - quantity;
      if (movement.movement_type === 'RETURN') return sum + quantity;
      if (movement.movement_type === 'ADJUSTMENT') return sum + quantity;
      return sum + quantity;
    }, 0);
  }

  function getInventoryPurchases(itemId) {
    return getInventoryItemMovements(itemId)
      .filter((movement) => movement.movement_type === 'PURCHASE')
      .reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);
  }

  function getInventoryUses(itemId) {
    return getInventoryItemMovements(itemId)
      .filter((movement) => movement.movement_type === 'USE')
      .reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);
  }

  function addSupplierInvoiceMaterialLine() {
    setSupplierInvoiceMaterialLines([
      ...supplierInvoiceMaterialLines,
      { item_id: '', quantity: '', unit_price: '', destination: 'warehouse', notes: '' }
    ]);
  }

  function updateSupplierInvoiceMaterialLine(index, field, value) {
    setSupplierInvoiceMaterialLines(
      supplierInvoiceMaterialLines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line
      )
    );
  }

  function removeSupplierInvoiceMaterialLine(index) {
    setSupplierInvoiceMaterialLines(supplierInvoiceMaterialLines.filter((_, lineIndex) => lineIndex !== index));
  }


function getSupplierTotals(supplierId) {
    const totalInvoices = getSupplierInvoices(supplierId)
      .reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0);

    const totalPaid = getSupplierPayments(supplierId)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return {
      totalInvoices,
      totalPaid,
      balance: totalInvoices - totalPaid
    };
  }

  function getSupplierAnalytics(supplierId) {
    const invoices = getSupplierInvoices(supplierId);
    const totals = getSupplierTotals(supplierId);
    const invoiceCount = invoices.length;
    const averageInvoice = invoiceCount > 0 ? totals.totalInvoices / invoiceCount : 0;

    const sortedInvoices = [...invoices].sort((a, b) =>
      String(b.invoice_date || '').localeCompare(String(a.invoice_date || ''))
    );

    return {
      ...totals,
      invoiceCount,
      averageInvoice,
      lastPurchaseDate: sortedInvoices[0]?.invoice_date || '-'
    };
  }

  function supplierMatchesSearch(supplier) {
    const search = normalizeText(supplierSearch);
    if (!search) return true;

    const supplierInvoicesList = getSupplierInvoices(supplier.id);

    const supplierTextMatches = [
      supplier.name,
      supplier.afm,
      supplier.phone,
      supplier.email,
      supplier.address,
      supplier.notes
    ].some((value) => normalizeText(value).includes(search));

    const invoiceTextMatches = supplierInvoicesList.some((invoice) =>
      [
        invoice.invoice_number,
        invoice.description,
        invoice.invoice_date,
        invoice.total_amount,
        getProjectTitle(invoice.project_id)
      ].some((value) => normalizeText(value).includes(search))
    );

    return supplierTextMatches || invoiceTextMatches;
  }

  function getVisibleSuppliers() {
    return suppliers.filter(supplierMatchesSearch);
  }

  function customerInvoiceMatchesSearch(invoice) {
    const search = normalizeText(customerInvoiceSearch);
    if (!search) return true;

    return [
      getCustomerName(invoice.customer_id),
      getCustomerAfm(invoice.customer_id)
    ].some((value) => normalizeText(value).includes(search));
  }

  function getVisibleCustomerInvoices() {
    return customerInvoices.filter(isActiveItem).filter(customerInvoiceMatchesSearch);
  }

  function paymentCustomerMatchesSearch(customer) {
    const search = normalizeText(paymentCustomerSearch);
    if (!search) return true;

    return [
      customer.name,
      customer.afm
    ].some((value) => normalizeText(value).includes(search));
  }

  function getVisiblePaymentCustomers() {
    return customers.filter(isActiveItem).filter(paymentCustomerMatchesSearch);
  }

  function getProjectPayments(projectId) {
    return payments.filter((payment) => payment.project_id === projectId && isActivePayment(payment));
  }

  function getCustomerTotals(customerId) {
    const customerProjects = getCustomerProjects(customerId);
    const projectIds = customerProjects.map((project) => project.id);

    const agreed = customerProjects.reduce((sum, project) => sum + Number(project.agreed_amount || 0), 0);
    const paid = payments
      .filter((payment) => projectIds.includes(payment.project_id) && isActivePayment(payment))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const projectExpenses = expenses
      .filter((expense) => projectIds.includes(expense.project_id) && isActiveItem(expense))
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return { agreed, paid, expenses: projectExpenses, balance: agreed - projectExpenses, customerBalance: agreed - paid, currentProfit: paid - projectExpenses };
  }

  function getCustomerReportRows(customerId) {
    return getCustomerProjects(customerId).map((project) => {
      const agreed = Number(project.agreed_amount || 0);
      const paid = getProjectPaid(project.id);
      const projectExpenses = getProjectExpenses(project.id);

      return {
        project,
        agreed,
        paid,
        expenses: projectExpenses,
        balance: agreed - projectExpenses,
        customerBalance: agreed - paid,
        currentProfit: paid - projectExpenses,
        payments: getProjectPayments(project.id),
        projectExpensesList: expenses.filter((expense) => expense.project_id === project.id && isActiveItem(expense)),
        projectQuotes: getProjectQuotes(project.id),
        projectTasks: getProjectTasks(project.id),
        projectCustomerInvoices: getProjectCustomerInvoices(project.id),
        projectDocuments: getProjectDocuments(project.id),
        projectSupplierInvoices: getProjectSupplierInvoices(project.id)
      };
    });
  }


  function isActiveItem(item) {
    return !item?.is_deleted;
  }

  function isAutomaticInvoicePayment(payment) {
    return String(payment?.notes || '').includes('Αυτόματη πληρωμή από τιμολόγιο εσόδου');
  }

  function isActivePayment(payment) {
    return isActiveItem(payment) && !isAutomaticInvoicePayment(payment);
  }

  function getCustomerInvoiceBalance(invoice) {
    const receivable = Number(invoice?.receivable_amount || 0);
    const paid = getCustomerInvoicePaid(invoice?.id);
    return Math.max(0, receivable - paid);
  }

  function getAvailableCustomerInvoicesForPayment(customerId, projectId = '', selectedInvoiceId = '') {
    return getCustomerInvoices(customerId)
      .filter((invoice) => !projectId || invoice.project_id === projectId)
      .filter((invoice) => invoice.id === selectedInvoiceId || getCustomerInvoiceBalance(invoice) > 0);
  }

  function isDeletedItem(item) {
    return !!item?.is_deleted;
  }



  function projectMatchesSearch(project, searchValue) {
    const search = normalizeText(searchValue);
    if (!search) return true;

    return [
      project.title,
      project.area,
      project.address,
      project.status,
      getCustomerName(project.customer_id)
    ].some((value) => normalizeText(value).includes(search));
  }

  function customerMatchesSearch(customer) {
    const search = normalizeText(customerSearch);
    const customerTextMatches = !search || [
      customer.name,
      customer.afm,
      customer.phone,
      customer.area,
      customer.notes
    ].some((value) => normalizeText(value).includes(search));

    const projectTextMatches = !projectSearch || getCustomerProjects(customer.id)
      .some((project) => projectMatchesSearch(project, projectSearch));

    return customerTextMatches && projectTextMatches;
  }

  function getVisibleCustomerProjects(customerId) {
    return getCustomerProjects(customerId).filter((project) => projectMatchesSearch(project, projectSearch));
  }

  function taskMatchesSearch(task) {
    const search = normalizeText(taskSearch);
    if (!search) return true;

    return [
      task.title,
      task.status,
      task.notes,
      task.task_date,
      task.task_time,
      getProjectTitle(task.project_id)
    ].some((value) => normalizeText(value).includes(search));
  }

  function getVisibleTasks() {
    return tasks.filter(taskMatchesSearch);
  }


  function isCurrentMonth(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }






function getVatTotals(yearValue = vatYear, quarterValue = vatQuarter) {
    const { startDate, endDate } = getQuarterDates(yearValue, quarterValue);

    const outputVat = customerInvoices
      .filter((invoice) => isActiveItem(invoice) && isDateInRange(invoice.invoice_date, startDate, endDate))
      .reduce((sum, invoice) => sum + Number(invoice.vat_amount || 0), 0);

    const inputVat = supplierInvoices
      .filter((invoice) => isActiveItem(invoice) && isDateInRange(invoice.invoice_date, startDate, endDate))
      .reduce((sum, invoice) => sum + Number(invoice.vat_amount || 0), 0);

    return {
      startDate,
      endDate,
      outputVat,
      inputVat,
      payableVat: outputVat - inputVat
    };
  }

  function getCustomerOpenReceivables() {
    return customerInvoices
      .filter(isActiveItem)
      .reduce((sum, invoice) => {
        const receivable = Number(invoice.receivable_amount || 0);
        const paid = getCustomerInvoicePaid(invoice.id);
        return sum + Math.max(0, receivable - paid);
      }, 0);
  }

  function getSupplierOpenPayables() {
    return suppliers
      .filter(isActiveItem)
      .reduce((sum, supplier) => sum + Math.max(0, getSupplierTotals(supplier.id).balance), 0);
  }

  const dashboardStats = useMemo(() => {
    const monthlyIncome = payments.filter((payment) => isActivePayment(payment) && isCurrentMonth(payment.created_at))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const monthlyExpenses = expenses.filter((expense) => isActiveItem(expense) && isCurrentMonth(expense.created_at))
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    const monthlyProfit = monthlyIncome - monthlyExpenses;
    const activeProjects = projects.filter((project) => isActiveItem(project) && project.status === 'active').length;
    const completedProjects = projects.filter((project) => isActiveItem(project) && project.status === 'completed').length;
    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter((task) =>
      isActiveItem(task) && task.status !== 'completed' && task.task_date && task.task_date < today
    ).length;

    return { monthlyIncome, monthlyExpenses, monthlyProfit, activeProjects, completedProjects, overdueTasks };
  }, [payments, expenses, projects, tasks]);


  const riskStats = useMemo(() => {
    const riskyProjects = projects.filter(isActiveItem)
      .map((project) => {
        const agreed = Number(project.agreed_amount || 0);
        const projectExpenses = getProjectExpenses(project.id);
        const balance = agreed - projectExpenses;

        return {
          ...project,
          balance
        };
      })
      .filter((project) => project.balance < 0);

    const highBalanceProjects = projects.filter(isActiveItem)
      .map((project) => {
        const agreed = Number(project.agreed_amount || 0);
        const projectExpenses = getProjectExpenses(project.id);
        const balance = agreed - projectExpenses;

        return {
          ...project,
          balance
        };
      })
      .filter((project) => project.balance > 5000);

    return {
      riskyProjects,
      highBalanceProjects
    };
  }, [projects, payments, expenses]);

  const totals = useMemo(() => {
    const activeProjectsList = projects.filter(isActiveItem);
    const activePaymentsList = payments.filter(isActivePayment);
    const activeExpensesList = expenses.filter(isActiveItem);
    const activeInventoryList = inventory.filter(isActiveItem);
    const activeQuotesList = quotes.filter(isActiveItem);
    const activeTasksList = tasks.filter(isActiveItem);

    const totalProjects = activeProjectsList.length;
    const totalAgreed = activeProjectsList.reduce((sum, project) => sum + Number(project.agreed_amount || 0), 0);
    const totalPaid = activePaymentsList.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const totalExpenses = activeExpensesList.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const totalBalance = totalAgreed - totalExpenses;
    const lowStockCount = activeInventoryList.filter((item) => getInventoryItemStock(item.id) <= Number(item.min_quantity || 0)).length;
    const totalQuotes = activeQuotesList.reduce((sum, quote) => sum + Number(quote.payable || 0), 0);
    const pendingTasks = activeTasksList.filter((task) => task.status !== 'completed').length;
    return { totalProjects, totalAgreed, totalPaid, totalExpenses, totalBalance, lowStockCount, totalQuotes, pendingTasks };
  }, [projects, payments, expenses, inventory, inventoryMovements, quotes, tasks]);


  const businessStats = useMemo(() => {
    const customerOpenReceivables = getCustomerOpenReceivables();
    const supplierOpenPayables = getSupplierOpenPayables();
    const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
    const currentYear = String(new Date().getFullYear());
    const currentVat = getVatTotals(currentYear, String(currentQuarter));

    return {
      customerOpenReceivables,
      supplierOpenPayables,
      cashView: customerOpenReceivables - supplierOpenPayables,
      currentVat
    };
  }, [customerInvoices, payments, suppliers, supplierInvoices, supplierPayments]);


  const dashboardExtraStats = useMemo(() => {
    const today = formatLocalDate(new Date());

    const todayTasks = tasks.filter((task) =>
      isActiveItem(task) && task.task_date === today
    );

    const todayPayments = payments.filter((payment) =>
      isActivePayment(payment) && payment.payment_date === today
    );

    const todayExpenses = expenses.filter((expense) =>
      isActiveItem(expense) && String(expense.created_at || '').split('T')[0] === today
    );

    const todayInvoices = customerInvoices.filter((invoice) =>
      isActiveItem(invoice) && invoice.invoice_date === today
    );

    const todayIncome = todayPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const todayExpenseAmount = todayExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    const lowStockItems = inventory
      .filter((item) =>
        isActiveItem(item) && getInventoryItemStock(item.id) <= Number(item.min_quantity || 0)
      )
      .slice(0, 5);

    const topCustomers = customers
      .filter(isActiveItem)
      .map((customer) => ({
        customer,
        totals: getCustomerTotals(customer.id)
      }))
      .sort((a, b) => Number(b.totals.agreed || 0) - Number(a.totals.agreed || 0))
      .slice(0, 5);

    const topSuppliers = suppliers
      .filter(isActiveItem)
      .map((supplier) => ({
        supplier,
        analytics: getSupplierAnalytics(supplier.id)
      }))
      .sort((a, b) => Number(b.analytics.totalInvoices || 0) - Number(a.analytics.totalInvoices || 0))
      .slice(0, 5);

    const overdueTasksList = tasks
      .filter((task) =>
        isActiveItem(task) && task.status !== 'completed' && task.task_date && task.task_date < today
      )
      .slice(0, 5);

    const customersWithOpenBalance = customers
      .filter(isActiveItem)
      .map((customer) => ({ customer, balance: getCustomerTotals(customer.id).customerBalance }))
      .filter((item) => Number(item.balance || 0) > 0)
      .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0));

    const suppliersWithOpenBalance = suppliers
      .filter(isActiveItem)
      .map((supplier) => ({ supplier, balance: getSupplierTotals(supplier.id).balance }))
      .filter((item) => Number(item.balance || 0) > 0)
      .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0));

    return {
      today,
      todayTasks,
      todayPayments,
      todayExpenses,
      todayInvoices,
      todayIncome,
      todayExpenseAmount,
      lowStockItems,
      topCustomers,
      topSuppliers,
      overdueTasksList,
      customersWithOpenBalance,
      suppliersWithOpenBalance
    };
  }, [tasks, payments, expenses, customerInvoices, inventory, inventoryMovements, customers, suppliers, projects, supplierInvoices, supplierPayments]);


  const globalSearchResults = useMemo(() => {
    const search = normalizeText(globalSearch);
    if (!search || search.length < 2) return [];

    const results = [];

    customers.filter(isActiveItem).forEach((customer) => {
      const haystack = [
        customer.name,
        customer.afm,
        customer.phone,
        customer.area,
        customer.notes
      ].map(normalizeText).join(' ');

      if (haystack.includes(search)) {
        results.push({
          type: 'customer',
          icon: '👤',
          title: customer.name || 'Πελάτης',
          meta: `Πελάτης • ΑΦΜ ${customer.afm || '-'}${customer.area ? ` • ${customer.area}` : ''}`,
          action: () => {
            setActivePage('customers');
            setOpenCustomerId(customer.id);
            setSelectedProject(null);
          }
        });
      }
    });

    projects.filter(isActiveItem).forEach((project) => {
      const haystack = [
        project.title,
        project.area,
        project.address,
        project.status,
        getCustomerName(project.customer_id)
      ].map(normalizeText).join(' ');

      if (haystack.includes(search)) {
        results.push({
          type: 'project',
          icon: '🏗️',
          title: project.title || 'Έργο',
          meta: `Έργο • ${getCustomerName(project.customer_id)}${project.area ? ` • ${project.area}` : ''}`,
          action: () => {
            setActivePage('customers');
            setSelectedProject(project);
            setActiveProjectTab('overview');
          }
        });
      }
    });

    customerInvoices.filter(isActiveItem).forEach((invoice) => {
      const haystack = [
        invoice.invoice_number,
        invoice.description,
        invoice.invoice_date,
        getCustomerName(invoice.customer_id),
        getProjectTitle(invoice.project_id)
      ].map(normalizeText).join(' ');

      if (haystack.includes(search)) {
        results.push({
          type: 'customer-invoice',
          icon: '🧾',
          title: invoice.invoice_number ? `Τιμολόγιο ${invoice.invoice_number}` : 'Τιμολόγιο πελάτη',
          meta: `Τιμολόγιο Εσόδων • ${getCustomerName(invoice.customer_id)} • ${formatCurrency(invoice.total_amount)}`,
          action: () => {
            setActivePage('customer-invoices');
            setSelectedProject(null);
          }
        });
      }
    });

    suppliers.filter(isActiveItem).forEach((supplier) => {
      const haystack = [
        supplier.name,
        supplier.afm,
        supplier.phone,
        supplier.email,
        supplier.address,
        supplier.notes
      ].map(normalizeText).join(' ');

      if (haystack.includes(search)) {
        results.push({
          type: 'supplier',
          icon: '🚚',
          title: supplier.name || 'Προμηθευτής',
          meta: `Προμηθευτής • ΑΦΜ ${supplier.afm || '-'}`,
          action: () => {
            setActivePage('suppliers');
            setOpenSupplierId(supplier.id);
            setSelectedProject(null);
          }
        });
      }
    });

    supplierInvoices.filter(isActiveItem).forEach((invoice) => {
      const haystack = [
        invoice.invoice_number,
        invoice.description,
        invoice.invoice_date,
        getSupplierName(invoice.supplier_id),
        getProjectTitle(invoice.project_id)
      ].map(normalizeText).join(' ');

      if (haystack.includes(search)) {
        results.push({
          type: 'supplier-invoice',
          icon: '📄',
          title: invoice.invoice_number ? `Τιμολόγιο Προμηθευτή ${invoice.invoice_number}` : 'Τιμολόγιο προμηθευτή',
          meta: `Προμηθευτής • ${getSupplierName(invoice.supplier_id)} • ${formatCurrency(invoice.total_amount)}`,
          action: () => {
            setActivePage('suppliers');
            setOpenSupplierId(invoice.supplier_id);
            setSelectedProject(null);
          }
        });
      }
    });

    inventory.filter(isActiveItem).forEach((item) => {
      const haystack = [
        item.item_name,
        item.quantity,
        item.min_quantity,
        item.purchase_price
      ].map(normalizeText).join(' ');

      if (haystack.includes(search)) {
        results.push({
          type: 'inventory',
          icon: '📦',
          title: item.item_name || 'Υλικό',
          meta: `Αποθήκη • Υπόλοιπο ${getInventoryItemStock(item.id)} ${getInventoryItemUnit(item.id)}`,
          action: () => {
            setActivePage('inventory');
            setSelectedProject(null);
          }
        });
      }
    });

    tasks.filter(isActiveItem).forEach((task) => {
      const haystack = [
        task.title,
        task.status,
        task.notes,
        task.task_date,
        task.task_time,
        getProjectTitle(task.project_id)
      ].map(normalizeText).join(' ');

      if (haystack.includes(search)) {
        results.push({
          type: 'task',
          icon: '✅',
          title: task.title || 'Εργασία',
          meta: `Εργασία • ${getProjectTitle(task.project_id)} • ${formatDate(task.task_date)}`,
          action: () => {
            setActivePage('settings');
            setActiveSettingsTab('tasks');
            setSelectedProject(null);
          }
        });
      }
    });

    return results.slice(0, 10);
  }, [globalSearch, customers, projects, customerInvoices, suppliers, supplierInvoices, inventory, tasks]);

  function selectGlobalSearchResult(result) {
    result.action();
    setGlobalSearch('');
    setGlobalSearchOpen(false);
    setQuickReturnToDashboard(false);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80);
  }



async function saveCustomer() {
    if (!newCustomer.name.trim()) {
      alert('Βάλε όνομα πελάτη');
      return;
    }

    try {
      if (editingCustomerId) {
        await updateCustomer(supabase, editingCustomerId, newCustomer);
      } else {
        await createCustomer(supabase, newCustomer);
      }

      setNewCustomer(INITIAL_CUSTOMER);
      setEditingCustomerId(null);
      loadCustomers();
    } catch (error) {
      alert(error.message);
    }
  }

  async function saveProject() {
    if (!newProject.customer_id) {
      alert('Διάλεξε πελάτη για το έργο');
      return;
    }
    if (!newProject.title.trim()) {
      alert('Βάλε τίτλο έργου');
      return;
    }

    const payload = {
      customer_id: newProject.customer_id,
      title: newProject.title,
      address: newProject.address,
      area: newProject.area,
      agreed_amount: Number(newProject.agreed_amount || 0),
      status: newProject.status,
      job_type: 'invoice'
    };

    const query = editingProjectId
      ? supabase.from('projects').update(payload).eq('id', editingProjectId)
      : supabase.from('projects').insert([{ code: 'PRJ-' + Date.now(), ...payload }]);

    const { error } = await query;
    if (error) return alert(error.message);

    setNewProject(INITIAL_PROJECT);
    setEditingProjectId(null);
    loadProjects();
  }

  async function savePayment() {
    if (!newPayment.customer_id || !newPayment.project_id || !newPayment.amount) {
      alert('Διάλεξε πελάτη, έργο και βάλε ποσό πληρωμής');
      return;
    }

    const payload = {
      project_id: newPayment.project_id,
      customer_invoice_id: newPayment.customer_invoice_id || null,
      amount: Number(newPayment.amount || 0),
      payment_date: newPayment.payment_date || null,
      method: newPayment.method,
      payment_type: 'income',
      notes: newPayment.notes
    };

    const query = editingPaymentId
      ? supabase.from('payments').update(payload).eq('id', editingPaymentId)
      : supabase.from('payments').insert([payload]);

    const { error } = await query;
    if (error) return alert(error.message);

    setNewPayment(INITIAL_PAYMENT);
    setNewCustomerInvoice(INITIAL_CUSTOMER_INVOICE);
    setEditingPaymentId(null);
    setEditingCustomerInvoiceId(null);
    loadPayments();
  }

  async function saveCustomerInvoice() {
    if (!newCustomerInvoice.customer_id || !newCustomerInvoice.invoice_date || !newCustomerInvoice.net_amount) {
      alert('Διάλεξε πελάτη, ημερομηνία και καθαρή αξία τιμολογίου');
      return;
    }

    const { net, vat, withholding, total, receivable } = calculateCustomerInvoiceValues(newCustomerInvoice);

    const payload = {
      customer_id: newCustomerInvoice.customer_id,
      project_id: newCustomerInvoice.project_id || null,
      invoice_date: newCustomerInvoice.invoice_date,
      invoice_number: newCustomerInvoice.invoice_number,
      description: newCustomerInvoice.description,
      net_amount: net,
      vat_amount: vat,
      withholding_amount: withholding,
      total_amount: total,
      receivable_amount: receivable,
      is_paid_on_issue: false,
      payment_date: null,
      payment_method: null,
      notes: newCustomerInvoice.notes
    };

    let savedInvoiceId = editingCustomerInvoiceId;

    if (editingCustomerInvoiceId) {
      const { error } = await supabase
        .from('customer_invoices')
        .update(payload)
        .eq('id', editingCustomerInvoiceId);

      if (error) return alert(error.message);
    } else {
      const { data, error } = await supabase
        .from('customer_invoices')
        .insert([payload])
        .select()
        .single();

      if (error) return alert(error.message);
      savedInvoiceId = data.id;
    }

    // v1.0 Stable: το τιμολόγιο δεν δημιουργεί πληρωμή.
    // Αν υπάρχουν παλιές αυτόματες πληρωμές από την προηγούμενη λογική, τις απενεργοποιούμε.
    if (savedInvoiceId) {
      const { error: oldAutoPaymentError } = await supabase
        .from('payments')
        .update({ is_deleted: true })
        .eq('customer_invoice_id', savedInvoiceId)
        .ilike('notes', '%Αυτόματη πληρωμή από τιμολόγιο εσόδου%');

      if (oldAutoPaymentError) return alert(oldAutoPaymentError.message);
    }

    setNewCustomerInvoice(INITIAL_CUSTOMER_INVOICE);
    setEditingCustomerInvoiceId(null);
    await Promise.all([loadCustomerInvoices(), loadPayments()]);
  }

  async function saveExpense() {
    if (!newExpense.customer_id || !newExpense.project_id || !newExpense.title.trim() || !newExpense.amount) {
      alert('Διάλεξε πελάτη, έργο, τίτλο και ποσό εξόδου');
      return;
    }

    const payload = {
      project_id: newExpense.project_id,
      title: newExpense.title,
      amount: Number(newExpense.amount || 0),
      category: newExpense.category,
      notes: newExpense.notes
    };

    const query = editingExpenseId
      ? supabase.from('expenses').update(payload).eq('id', editingExpenseId)
      : supabase.from('expenses').insert([payload]);

    const { error } = await query;
    if (error) return alert(error.message);

    setNewExpense(INITIAL_EXPENSE);
    setEditingExpenseId(null);
    loadExpenses();
  }

  async function saveInventory() {
    if (!newInventory.item_name.trim()) {
      alert('Βάλε όνομα υλικού');
      return;
    }

    const payload = {
      item_name: newInventory.item_name,
      category: newInventory.category || '',
      unit: newInventory.unit || 'τεμ.',
      min_quantity: Number(newInventory.min_quantity || 0),
      purchase_price: Number(newInventory.purchase_price || 0),
      notes: newInventory.notes || ''
    };

    const query = editingInventoryId
      ? supabase.from('inventory').update(payload).eq('id', editingInventoryId)
      : supabase.from('inventory').insert([payload]);

    const { error } = await query;
    if (error) return alert(error.message);

    setNewInventory(INITIAL_INVENTORY);
    setEditingInventoryId(null);
    loadInventory();
  }

  async function saveQuote() {
    if (!newQuote.project_id || !newQuote.work_type.trim() || !newQuote.description.trim() || !newQuote.subtotal) {
      alert('Διάλεξε έργο, βάλε είδος εργασίας, περιγραφή και ποσό προσφοράς');
      return;
    }

    const { subtotal, vat, withholding, payable } = calculateQuoteValues(newQuote);

    const payload = {
      project_id: newQuote.project_id,
      work_type: newQuote.work_type,
      description: newQuote.description,
      subtotal,
      vat,
      withholding,
      payable,
      job_type: newQuote.job_type,
      status: newQuote.status || 'pending'
    };

    const query = editingQuoteId
      ? supabase.from('quotes').update(payload).eq('id', editingQuoteId)
      : supabase.from('quotes').insert([{ quote_number: 'Q-' + Date.now(), ...payload }]);

    const { error } = await query;
    if (error) return alert(error.message);

    setNewQuote(INITIAL_QUOTE);
    setEditingQuoteId(null);
    loadQuotes();
  }

  async function saveTask() {
    if (!newTask.project_id || !newTask.title.trim() || !newTask.task_date) {
      alert('Διάλεξε έργο, βάλε τίτλο και ημερομηνία');
      return;
    }

    const payload = {
      project_id: newTask.project_id,
      title: newTask.title,
      task_date: newTask.task_date,
      task_time: newTask.task_time || null,
      status: newTask.status,
      notes: newTask.notes
    };

    const query = editingTaskId
      ? supabase.from('tasks').update(payload).eq('id', editingTaskId)
      : supabase.from('tasks').insert([payload]);

    const { error } = await query;
    if (error) return alert(error.message);

    setNewTask(INITIAL_TASK);
    setNewDocument(INITIAL_DOCUMENT);
    setDocumentFile(null);
    setEditingTaskId(null);
    setEditingDocumentId(null);
    setEditingSupplierId(null);
    setEditingSupplierInvoiceId(null);
    setEditingSupplierPaymentId(null);
    loadTasks();
  }

  async function saveDocument() {
    if (!newDocument.customer_id || !newDocument.project_id || !newDocument.title.trim()) {
      alert('Διάλεξε πελάτη, έργο και βάλε τίτλο αρχείου');
      return;
    }

    let fileUrl = newDocument.file_url;

    if (documentFile) {
      const fileExt = documentFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${newDocument.project_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, documentFile);

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      fileUrl = data.publicUrl;
    }

    const payload = {
      project_id: newDocument.project_id,
      title: newDocument.title,
      document_type: newDocument.document_type,
      file_url: fileUrl,
      notes: newDocument.notes
    };

    const query = editingDocumentId
      ? supabase.from('documents').update(payload).eq('id', editingDocumentId)
      : supabase.from('documents').insert([payload]);

    const { error } = await query;
    if (error) return alert(error.message);

    setNewDocument(INITIAL_DOCUMENT);
    setDocumentFile(null);
    setDocumentFile(null);
    setEditingDocumentId(null);
    setEditingSupplierId(null);
    setEditingSupplierInvoiceId(null);
    setEditingSupplierPaymentId(null);
    loadDocuments();
  }

  async function saveSupplier() {
    if (!newSupplier.name.trim()) {
      alert('Βάλε όνομα / επωνυμία προμηθευτή');
      return;
    }

    const payload = {
      name: newSupplier.name,
      afm: newSupplier.afm,
      phone: newSupplier.phone,
      email: newSupplier.email,
      address: newSupplier.address,
      notes: newSupplier.notes
    };

    const query = editingSupplierId
      ? supabase.from('suppliers').update(payload).eq('id', editingSupplierId)
      : supabase.from('suppliers').insert([payload]);

    const { error } = await query;
    if (error) return alert(error.message);

    setNewSupplier(INITIAL_SUPPLIER);
    setEditingSupplierId(null);
    loadSuppliers();
  }

  async function saveSupplierInvoice() {
    if (!newSupplierInvoice.supplier_id || !newSupplierInvoice.invoice_date || !newSupplierInvoice.net_amount) {
      alert('Διάλεξε προμηθευτή, ημερομηνία και καθαρή αξία τιμολογίου');
      return;
    }

    const { net, vat, total } = calculateSupplierInvoiceValues(newSupplierInvoice);
    const supplierName = getSupplierName(newSupplierInvoice.supplier_id);

    const payload = {
      supplier_id: newSupplierInvoice.supplier_id,
      project_id: newSupplierInvoice.project_id || null,
      expense_category: newSupplierInvoice.expense_category || null,
      invoice_date: newSupplierInvoice.invoice_date,
      invoice_number: newSupplierInvoice.invoice_number,
      description: newSupplierInvoice.description,
      net_amount: net,
      vat_amount: vat,
      total_amount: total,
      notes: newSupplierInvoice.notes
    };

    let savedInvoiceId = editingSupplierInvoiceId;

    if (editingSupplierInvoiceId) {
      const { error } = await supabase
        .from('supplier_invoices')
        .update(payload)
        .eq('id', editingSupplierInvoiceId);

      if (error) return alert(error.message);
    } else {
      const { data, error } = await supabase
        .from('supplier_invoices')
        .insert([payload])
        .select()
        .single();

      if (error) return alert(error.message);
      savedInvoiceId = data.id;
    }

    const expensePayload = {
      project_id: newSupplierInvoice.project_id || null,
      title: `Τιμολόγιο προμηθευτή: ${supplierName}${newSupplierInvoice.invoice_number ? ` (${newSupplierInvoice.invoice_number})` : ''}`,
      amount: total,
      category: newSupplierInvoice.expense_category || 'Προμηθευτής',
      notes: newSupplierInvoice.description || newSupplierInvoice.notes || '',
      supplier_invoice_id: savedInvoiceId
    };

    const existingExpense = expenses.find((expense) => expense.supplier_invoice_id === savedInvoiceId);

    if (existingExpense) {
      const { error: expenseError } = await supabase
        .from('expenses')
        .update(expensePayload)
        .eq('id', existingExpense.id);

      if (expenseError) return alert(expenseError.message);
    } else {
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert([expensePayload]);

      if (expenseError) return alert(expenseError.message);
    }

    if (supplierInvoiceHasMaterials) {
      if (editingSupplierInvoiceId) {
        await supabase.from('inventory_movements').delete().eq('supplier_invoice_id', savedInvoiceId);
      }

      const materialMovements = supplierInvoiceMaterialLines
        .filter((line) => line.item_id && Number(line.quantity || 0) > 0)
        .map((line) => ({
          item_id: line.item_id,
          movement_date: newSupplierInvoice.invoice_date,
          movement_type: line.destination === 'project' ? 'USE' : 'PURCHASE',
          quantity: Number(line.quantity || 0),
          unit_price: Number(line.unit_price || 0),
          project_id: line.destination === 'project' ? (newSupplierInvoice.project_id || null) : null,
          supplier_id: newSupplierInvoice.supplier_id,
          supplier_invoice_id: savedInvoiceId,
          notes: line.destination === 'project'
            ? `Απευθείας χρήση στο έργο από τιμολόγιο προμηθευτή${newSupplierInvoice.invoice_number ? ` ${newSupplierInvoice.invoice_number}` : ''}`
            : `Αγορά υλικού από τιμολόγιο προμηθευτή${newSupplierInvoice.invoice_number ? ` ${newSupplierInvoice.invoice_number}` : ''}`
        }));

      if (materialMovements.length > 0) {
        const { error: movementError } = await supabase
          .from('inventory_movements')
          .insert(materialMovements);

        if (movementError) return alert(movementError.message);
      }
    }

    setNewSupplierInvoice(INITIAL_SUPPLIER_INVOICE);
    setSupplierInvoiceHasMaterials(false);
    setSupplierInvoiceMaterialLines([]);
    setEditingSupplierInvoiceId(null);
    await Promise.all([loadSupplierInvoices(), loadExpenses(), loadInventoryMovements()]);
  }

  async function saveSupplierPayment() {
    if (!newSupplierPayment.supplier_id || !newSupplierPayment.payment_date || !newSupplierPayment.amount) {
      alert('Διάλεξε προμηθευτή, ημερομηνία και ποσό πληρωμής');
      return;
    }

    const payload = {
      supplier_id: newSupplierPayment.supplier_id,
      supplier_invoice_id: newSupplierPayment.supplier_invoice_id || null,
      payment_date: newSupplierPayment.payment_date,
      amount: Number(newSupplierPayment.amount || 0),
      method: newSupplierPayment.method,
      notes: newSupplierPayment.notes
    };

    const query = editingSupplierPaymentId
      ? supabase.from('supplier_payments').update(payload).eq('id', editingSupplierPaymentId)
      : supabase.from('supplier_payments').insert([payload]);

    const { error } = await query;
    if (error) return alert(error.message);

    setNewSupplierPayment(INITIAL_SUPPLIER_PAYMENT);
    setEditingSupplierPaymentId(null);
    loadSupplierPayments();
  }

  function editCustomer(customer) {
    setNewCustomer({ name: customer.name || '', afm: customer.afm || '', phone: customer.phone || '', area: customer.area || '', notes: customer.notes || '' });
    setEditingCustomerId(customer.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editProject(project) {
    setNewProject({
      customer_id: project.customer_id || '',
      title: project.title || '',
      address: project.address || '',
      area: project.area || '',
      agreed_amount: String(project.agreed_amount || ''),
      status: project.status || 'active'
    });
    setEditingProjectId(project.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editPayment(payment) {
    const project = projects.find((item) => item.id === payment.project_id);

    setNewPayment({
      customer_id: project?.customer_id || '',
      project_id: payment.project_id || '',
      customer_invoice_id: payment.customer_invoice_id || '',
      amount: String(payment.amount || ''),
      payment_date: payment.payment_date || '',
      method: payment.method || 'Μετρητά',
      notes: payment.notes || ''
    });
    setEditingPaymentId(payment.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editCustomerInvoice(invoice) {
    setNewCustomerInvoice({
      customer_id: invoice.customer_id || '',
      project_id: invoice.project_id || '',
      invoice_date: invoice.invoice_date || '',
      invoice_number: invoice.invoice_number || '',
      description: invoice.description || '',
      net_amount: String(invoice.net_amount || ''),
      is_paid_on_issue: 'no',
      payment_date: '',
      payment_method: 'Τράπεζα',
      notes: invoice.notes || ''
    });
    setEditingCustomerInvoiceId(invoice.id);
    setActivePage('customer-invoices');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editExpense(expense) {
    const project = projects.find((item) => item.id === expense.project_id);

    setNewExpense({
      customer_id: project?.customer_id || '',
      project_id: expense.project_id || '',
      title: expense.title || '',
      amount: String(expense.amount || ''),
      category: expense.category || 'Υλικά',
      notes: expense.notes || ''
    });
    setEditingExpenseId(expense.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editInventory(item) {
    setNewInventory({
      item_name: item.item_name || '',
      category: item.category || '',
      unit: item.unit || item.measure_unit || 'τεμ.',
      min_quantity: String(item.min_quantity || ''),
      purchase_price: String(item.purchase_price || ''),
      notes: item.notes || ''
    });
    setEditingInventoryId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editQuote(quote) {
    setNewQuote({
      project_id: quote.project_id || '',
      work_type: quote.work_type || '',
      description: quote.description || '',
      subtotal: String(quote.subtotal || ''),
      job_type: quote.job_type || 'invoice',
      status: quote.status || 'pending'
    });
    setEditingQuoteId(quote.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editTask(task) {
    setNewTask({
      project_id: task.project_id || '',
      title: task.title || '',
      task_date: task.task_date || '',
      task_time: task.task_time || '',
      status: task.status || 'pending',
      notes: task.notes || ''
    });
    setEditingTaskId(task.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editDocument(document) {
    const project = projects.find((item) => item.id === document.project_id);

    setNewDocument({
      customer_id: project?.customer_id || '',
      project_id: document.project_id || '',
      title: document.title || '',
      document_type: document.document_type || 'Τιμολόγιο',
      file_url: document.file_url || '',
      notes: document.notes || ''
    });
    setDocumentFile(null);
    setEditingDocumentId(document.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editSupplier(supplier) {
    setNewSupplier({
      name: supplier.name || '',
      afm: supplier.afm || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || ''
    });
    setEditingSupplierId(supplier.id);
    setActivePage('suppliers');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editSupplierInvoice(invoice) {
    setNewSupplierInvoice({
      supplier_id: invoice.supplier_id || '',
      project_id: invoice.project_id || '',
      expense_category: invoice.expense_category || '',
      invoice_date: invoice.invoice_date || '',
      invoice_number: invoice.invoice_number || '',
      description: invoice.description || '',
      net_amount: String(invoice.net_amount || ''),
      vat_amount: String(invoice.vat_amount || ''),
      total_amount: String(invoice.total_amount || ''),
      notes: invoice.notes || ''
    });

    const invoiceMaterialMovements = inventoryMovements
      .filter((movement) => movement.supplier_invoice_id === invoice.id && isActiveItem(movement));

    setSupplierInvoiceHasMaterials(invoiceMaterialMovements.length > 0);
    setSupplierInvoiceMaterialLines(
      invoiceMaterialMovements.length > 0
        ? invoiceMaterialMovements.map((movement) => ({
            item_id: movement.item_id || '',
            quantity: String(movement.quantity || ''),
            unit_price: String(movement.unit_price || ''),
            destination: movement.movement_type === 'USE' ? 'project' : 'warehouse',
            notes: movement.notes || ''
          }))
        : []
    );

    setEditingSupplierInvoiceId(invoice.id);
    setActivePage('suppliers');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editSupplierPayment(payment) {
    setNewSupplierPayment({
      supplier_id: payment.supplier_id || '',
      supplier_invoice_id: payment.supplier_invoice_id || '',
      payment_date: payment.payment_date || '',
      amount: String(payment.amount || ''),
      method: payment.method || 'Τράπεζα',
      notes: payment.notes || ''
    });
    setEditingSupplierPaymentId(payment.id);
    setActivePage('suppliers');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdits() {
    setEditingCustomerId(null);
    setEditingProjectId(null);
    setEditingPaymentId(null);
    setEditingCustomerInvoiceId(null);
    setEditingExpenseId(null);
    setEditingInventoryId(null);
    setEditingQuoteId(null);
    setEditingTaskId(null);
    setEditingDocumentId(null);
    setEditingSupplierId(null);
    setEditingSupplierInvoiceId(null);
    setEditingSupplierPaymentId(null);
    setNewCustomer(INITIAL_CUSTOMER);
    setNewProject(INITIAL_PROJECT);
    setNewPayment(INITIAL_PAYMENT);
    setNewCustomerInvoice(INITIAL_CUSTOMER_INVOICE);
    setNewExpense(INITIAL_EXPENSE);
    setNewInventory(INITIAL_INVENTORY);
    setSupplierInvoiceHasMaterials(false);
    setSupplierInvoiceMaterialLines([]);
    setNewQuote(INITIAL_QUOTE);
    setNewTask(INITIAL_TASK);
    setNewDocument(INITIAL_DOCUMENT);
    setDocumentFile(null);
    setNewSupplier(INITIAL_SUPPLIER);
    setNewSupplierInvoice(INITIAL_SUPPLIER_INVOICE);
    setNewSupplierPayment(INITIAL_SUPPLIER_PAYMENT);
  }

  async function deleteItem(table, id) {
    const confirmDelete = confirm('Να μεταφερθεί στον Κάδο;');
    if (!confirmDelete) return;

    // Όταν σβήνεται τιμολόγιο προμηθευτή, σβήνουμε λογικά και τις κινήσεις αποθήκης του.
    // Έτσι δεν μένουν υλικά στην αποθήκη από διαγραμμένο τιμολόγιο.
    if (table === 'supplier_invoices') {
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .update({ is_deleted: true })
        .eq('supplier_invoice_id', id);

      if (movementError) return alert(movementError.message);
    }

    const { error } = await supabase.from(table).update({ is_deleted: true }).eq('id', id);
    if (error) return alert(error.message);

    if (selectedProject?.id === id) setSelectedProject(null);
    if (selectedQuote?.id === id) setSelectedQuote(null);
    if (selectedCustomerReport?.id === id) setSelectedCustomerReport(null);
    if (selectedSupplierReport?.id === id) setSelectedSupplierReport(null);

    refreshAll();
  }

  async function restoreItem(table, id) {
    // Αν επαναφέρεις τιμολόγιο προμηθευτή από τον Κάδο, επαναφέρουμε και τις κινήσεις αποθήκης του.
    if (table === 'supplier_invoices') {
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .update({ is_deleted: false })
        .eq('supplier_invoice_id', id);

      if (movementError) return alert(movementError.message);
    }

    const { error } = await supabase.from(table).update({ is_deleted: false }).eq('id', id);
    if (error) return alert(error.message);

    refreshAll();
  }

  async function permanentDeleteItem(table, id) {
    const confirmDelete = confirm('Οριστική διαγραφή; Δεν θα μπορείς να το επαναφέρεις.');
    if (!confirmDelete) return;

    if (table === 'customers') {
      const customerProjects = projects.filter((project) => project.customer_id === id);
      const projectIds = customerProjects.map((project) => project.id);

      for (const projectId of projectIds) {
        await supabase.from('payments').delete().eq('project_id', projectId);
        await supabase.from('customer_invoices').delete().eq('project_id', projectId);
        await supabase.from('expenses').delete().eq('project_id', projectId);
        await supabase.from('quotes').delete().eq('project_id', projectId);
        await supabase.from('tasks').delete().eq('project_id', projectId);
        await supabase.from('documents').delete().eq('project_id', projectId);
        await supabase.from('supplier_invoices').delete().eq('project_id', projectId);
      }

      await supabase.from('projects').delete().eq('customer_id', id);
    }

    if (table === 'projects') {
      await supabase.from('payments').delete().eq('project_id', id);
      await supabase.from('customer_invoices').delete().eq('project_id', id);
      await supabase.from('expenses').delete().eq('project_id', id);
      await supabase.from('quotes').delete().eq('project_id', id);
      await supabase.from('tasks').delete().eq('project_id', id);
      await supabase.from('documents').delete().eq('project_id', id);
      const projectSupplierInvoices = supplierInvoices.filter((invoice) => invoice.project_id === id);
      for (const invoice of projectSupplierInvoices) {
        await supabase.from('inventory_movements').delete().eq('supplier_invoice_id', invoice.id);
      }
      await supabase.from('inventory_movements').delete().eq('project_id', id);
      await supabase.from('supplier_invoices').delete().eq('project_id', id);
    }

    if (table === 'suppliers') {
      const invoicesToDelete = supplierInvoices.filter((invoice) => invoice.supplier_id === id);
      for (const invoice of invoicesToDelete) {
        await supabase.from('expenses').delete().eq('supplier_invoice_id', invoice.id);
        await supabase.from('inventory_movements').delete().eq('supplier_invoice_id', invoice.id);
      }

      await supabase.from('inventory_movements').delete().eq('supplier_id', id);
      await supabase.from('supplier_invoices').delete().eq('supplier_id', id);
      await supabase.from('supplier_payments').delete().eq('supplier_id', id);
    }

    if (table === 'supplier_invoices') {
      // Πρώτα διαγράφουμε τις κινήσεις αποθήκης, πριν διαγραφεί το τιμολόγιο.
      // Αλλιώς λόγω FK on delete set null μένουν ορφανές κινήσεις και φαίνονται ακόμα στην αποθήκη.
      await supabase.from('inventory_movements').delete().eq('supplier_invoice_id', id);
      await supabase.from('expenses').delete().eq('supplier_invoice_id', id);
      await supabase.from('supplier_payments').delete().eq('supplier_invoice_id', id);
    }

    if (table === 'customer_invoices') {
      await supabase.from('payments').update({ customer_invoice_id: null }).eq('customer_invoice_id', id);
    }

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) return alert(error.message);

    refreshAll();
  }




  function getProjectProgress(projectId) {
    const project = projects.find((item) => item.id === projectId);
    const agreed = Number(project?.agreed_amount || 0);
    const paid = getProjectPaid(projectId);

    if (!agreed) return 0;

    return Math.min(100, Math.round((paid / agreed) * 100));
  }

  function getProjectStatusLabel(status) {
    if (status === 'active') return '🟢 Ενεργό';
    if (status === 'pending') return '🟡 Εκκρεμεί';
    if (status === 'completed') return '🔵 Ολοκληρωμένο';
    if (status === 'problem') return '🔴 Πρόβλημα';
    return status || '-';
  }

  function getProjectStatusStyle(status) {
    if (status === 'active') return { borderColor: 'rgba(60, 200, 120, 0.55)' };
    if (status === 'pending') return { borderColor: 'rgba(255, 205, 80, 0.65)' };
    if (status === 'completed') return { borderColor: 'rgba(80, 150, 255, 0.65)' };
    if (status === 'problem') return { borderColor: 'rgba(255, 107, 95, 0.75)' };
    return {};
  }

  function loginUser() {
    const user = DEMO_USERS.find(
      (item) => item.email === loginForm.email && item.password === loginForm.password
    );

    if (!user) {
      alert('Λάθος email ή password');
      return;
    }

    setCurrentUser(user);
    setSelectedUser(user.name);
    setLoginForm({ email: '', password: '' });
  }

  function logoutUser() {
    setCurrentUser(null);
    setSelectedUser('Mani Taulant');
  }

  function goToQuickCreate(page, setup = () => {}) {
    setQuickCreateOpen(false);
    setQuickReturnToDashboard(true);
    cancelEdits();
    setup();
    setSelectedProject(null);
    setActivePage(page);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80);
  }

  function backToDashboardFromQuickCreate() {
    setQuickReturnToDashboard(false);
    cancelEdits();
    setSelectedProject(null);
    setActivePage('dashboard');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80);
  }

  if (!currentUser) {
    return (
      <main className={`app page-${activePage}`}>
        <style>{ERP_STYLES}</style>
        <section className="card login-card">
          <div className="brand">
            <div className="logo">TD</div>
            <div>
              <h1>T D MANI</h1>
              <p>ΟΙΚΟΔΟΜΙΚΕΣ ΕΡΓΑΣΙΕΣ</p>
            </div>
          </div>

          <h2>Σύνδεση ERP</h2>

          <input
            placeholder="Email"
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
          />

          <input
            placeholder="Password"
            type="password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
          />

          <button onClick={loginUser}>Σύνδεση</button>

          <hr />

          <p><b>Demo χρήστες:</b></p>
          <button onClick={() => setLoginForm({ email: 'eva@tdmani.gr', password: '1234' })}>
            👩 Εύα / Admin
          </button>
          <button onClick={() => setLoginForm({ email: 'mani@tdmani.gr', password: '1234' })}>
            👷 Mani / Admin
          </button>

          <small>Demo login για δοκιμή. Στο τελικό ERP θα το αλλάξουμε σε Supabase Auth.</small>
        </section>
      </main>
    );
  }


  if (selectedProject && activePage === 'customers') {
    const agreed = Number(selectedProject.agreed_amount || 0);
    const paid = getProjectPaid(selectedProject.id);
    const projectExpenses = getProjectExpenses(selectedProject.id);
    const customerBalance = agreed - paid;
    const currentProfit = paid - projectExpenses;
    const estimatedProfit = agreed - projectExpenses;
    const progress = getProjectProgress(selectedProject.id);
    const projectPaymentsList = getProjectPayments(selectedProject.id);
    const projectExpensesList = expenses.filter((expense) => expense.project_id === selectedProject.id && isActiveItem(expense));
    const projectCustomerInvoicesList = getProjectCustomerInvoices(selectedProject.id);
    const projectSupplierInvoicesList = getProjectSupplierInvoices(selectedProject.id);
    const projectQuotesList = getProjectQuotes(selectedProject.id);
    const projectTasksList = getProjectTasks(selectedProject.id);
    const projectDocumentsList = getProjectDocuments(selectedProject.id);
    const completedTasksCount = projectTasksList.filter((task) => task.status === 'completed').length;
    const taskProgress = projectTasksList.length ? Math.round((completedTasksCount / projectTasksList.length) * 100) : progress;
    const effectiveProgress = Math.max(0, Math.min(100, taskProgress || 0));
    const progressCategories = [
      { label: 'Προετοιμασία', icon: '📋', percent: Math.min(100, effectiveProgress + 18) },
      { label: 'Σκελετός', icon: '🏗️', percent: Math.min(100, effectiveProgress + 10) },
      { label: 'Τοιχοποιίες', icon: '🧱', percent: Math.min(100, effectiveProgress + 2) },
      { label: 'Ηλεκτρολογικά', icon: '⚡', percent: Math.max(0, effectiveProgress - 8) },
      { label: 'Υδραυλικά', icon: '💧', percent: Math.max(0, effectiveProgress - 15) },
      { label: 'Τελικές εργασίες', icon: '🔑', percent: Math.max(0, effectiveProgress - 28) }
    ];
    const projectStages = ['Μελέτη', 'Θεμελίωση', 'Σκελετός', 'Η/Μ', 'Τελειώματα', 'Παράδοση'].map((label, index) => {
      const threshold = (index + 1) * (100 / 6);
      const previousThreshold = index * (100 / 6);
      const done = effectiveProgress >= threshold;
      const current = effectiveProgress >= previousThreshold && effectiveProgress < threshold;
      return { label, done, current };
    });
    const lastActivityDate = [
      selectedProject.updated_at,
      ...projectTasksList.map((task) => task.updated_at || task.created_at || task.task_date),
      ...projectPaymentsList.map((payment) => payment.payment_date || payment.created_at),
      ...projectCustomerInvoicesList.map((invoice) => invoice.invoice_date || invoice.created_at),
      ...projectExpensesList.map((expense) => expense.created_at)
    ].filter(Boolean).sort().at(-1);

    return (
      <main className="app page-customers">
        <style>{ERP_STYLES}</style>

        <header className="top">
          <div className="brand">
            <div className="logo">TD</div>
            <div>
              <h1>T D MANI</h1>
              <p>Καρτέλα Έργου</p>
            </div>
          </div>

          <div>
            <p><b>{currentUser.name}</b></p>
            <small>{currentUser.role}</small>
            <br />
            <button onClick={logoutUser}>Αποσύνδεση</button>
          </div>
        </header>

        <section className="card project-hero-card no-print">
          <button onClick={() => setSelectedProject(null)}>← Πίσω στα έργα</button>

          <div className="project-hero-content">
            <div>
              <h2 className="project-hero-title">🏗️ {selectedProject.title}</h2>
              <p>Πελάτης: <b>{getCustomerName(selectedProject.customer_id)}</b> • ΑΦΜ: {getCustomerAfm(selectedProject.customer_id)}</p>
              <div className="project-hero-meta">
                <span className="project-pill">{getProjectStatusLabel(selectedProject.status)}</span>
                <span className="project-pill">📍 {selectedProject.area || '-'}</span>
                <span className="project-pill">🏠 {selectedProject.address || '-'}</span>
              </div>
            </div>
            <div className="project-progress-mini">
              <small>Πρόοδος εργασιών</small>
              <h2>{effectiveProgress}%</h2>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${effectiveProgress}%` }} />
              </div>
              <button onClick={() => setActiveProjectTab('progress')}>📈 Άνοιγμα προόδου</button>
            </div>
          </div>
        </section>

        <section className="card no-print">
          <h2>💰 Σύνοψη έργου</h2>
          <div className="grid">
            <div className="line"><p><b>{agreed}€</b></p><small>Συμφωνία</small></div>
            <div className="line"><p><b>{paid}€</b></p><small>Πληρωμές / Εισπράξεις</small></div>
            <div className="line"><p><b>{projectExpenses}€</b></p><small>Έξοδα</small></div>
            <div className={customerBalance > 0 ? 'line alert' : 'line'}><p><b>{customerBalance}€</b></p><small>Υπόλοιπο πελάτη</small></div>
            <div className={currentProfit < 0 ? 'line alert' : 'line'}><p><b>{currentProfit}€</b></p><small>Κέρδος μέχρι τώρα</small></div>
            <div className={estimatedProfit < 0 ? 'line alert' : 'line'}><p><b>{estimatedProfit}€</b></p><small>Εκτιμώμενο τελικό κέρδος</small></div>
          </div>

          <div className="line">
            <p>Progress πληρωμών: <b>{progress}%</b></p>
            <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.10)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(135deg, #d6a84f, #7a551d)' }} />
            </div>
          </div>
        </section>

        <section className="card no-print">
          <div className="erp-nav" style={{ position: 'static' }}>
            <button className={activeProjectTab === 'overview' ? 'active' : ''} onClick={() => setActiveProjectTab('overview')}>Στοιχεία</button>
            <button className={activeProjectTab === 'invoices' ? 'active' : ''} onClick={() => setActiveProjectTab('invoices')}>Τιμολόγια Εσόδων</button>
            <button className={activeProjectTab === 'payments' ? 'active' : ''} onClick={() => setActiveProjectTab('payments')}>Πληρωμές</button>
            <button className={activeProjectTab === 'expenses' ? 'active' : ''} onClick={() => setActiveProjectTab('expenses')}>Έξοδα</button>
            <button className={activeProjectTab === 'quotes' ? 'active' : ''} onClick={() => setActiveProjectTab('quotes')}>Προσφορές</button>
            <button className={activeProjectTab === 'tasks' ? 'active' : ''} onClick={() => setActiveProjectTab('tasks')}>Εργασίες</button>
            <button className={activeProjectTab === 'documents' ? 'active' : ''} onClick={() => setActiveProjectTab('documents')}>Έγγραφα</button>
            <button className={activeProjectTab === 'progress' ? 'active' : ''} onClick={() => setActiveProjectTab('progress')}>📈 Πρόοδος</button>
          </div>

          {activeProjectTab === 'overview' && (
            <div>
              <h3>Στοιχεία έργου</h3>
              <p><b>Τίτλος:</b> {selectedProject.title}</p>
              <p><b>Πελάτης:</b> {getCustomerName(selectedProject.customer_id)}</p>
              <p><b>ΑΦΜ:</b> {getCustomerAfm(selectedProject.customer_id)}</p>
              <p><b>Περιοχή:</b> {selectedProject.area || '-'}</p>
              <p><b>Διεύθυνση:</b> {selectedProject.address || '-'}</p>
              <p><b>Status:</b> {getProjectStatusLabel(selectedProject.status)}</p>
              <button onClick={() => editProject(selectedProject)}>✏️ Επεξεργασία έργου</button>
              <button onClick={() => window.print()}>📄 Export / Print PDF</button>
            </div>
          )}

          {activeProjectTab === 'invoices' && (
            <div>
              <h3>Τιμολόγια Εσόδων έργου</h3>
              {getProjectCustomerInvoices(selectedProject.id).length === 0 ? (
                <p>Δεν υπάρχουν τιμολόγια εσόδων για αυτό το έργο.</p>
              ) : (
                getProjectCustomerInvoices(selectedProject.id).map((invoice) => (
                  <div key={invoice.id} className="line">
                    <p><b>{invoice.invoice_number || 'Χωρίς αριθμό'} — {invoice.receivable_amount}€ σύνολο τιμολογίου</b></p>
                    <p>Ημερομηνία: {invoice.invoice_date || '-'}</p>
                    <p>Καθαρή: {invoice.net_amount || 0}€ | ΦΠΑ: {invoice.vat_amount || 0}€ | Παρακράτηση: {invoice.withholding_amount || 0}€</p>
                    <p>Πληρωμένα: {getCustomerInvoicePaid(invoice.id)}€</p>
                    <p>Status: <b>{getCustomerInvoiceStatus(invoice)}</b></p>
                    <button onClick={() => editCustomerInvoice(invoice)}>✏️ Επεξεργασία</button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeProjectTab === 'payments' && (
            <div>
              <h3>Πληρωμές έργου</h3>
              {getProjectPayments(selectedProject.id).length === 0 ? (
                <p>Δεν υπάρχουν πληρωμές για αυτό το έργο.</p>
              ) : (
                getProjectPayments(selectedProject.id).map((payment) => (
                  <div key={payment.id} className="line">
                    <p><b>{payment.amount}€</b> — {payment.method}</p>
                    <p>Ημερομηνία: {payment.payment_date || '-'}</p>
                    <p>Τιμολόγιο: {payment.customer_invoice_id ? (customerInvoices.find((invoice) => invoice.id === payment.customer_invoice_id)?.invoice_number || 'Συνδεδεμένο') : 'Χωρίς σύνδεση'}</p>
                    <small>{payment.notes}</small>
                    <button onClick={() => editPayment(payment)}>✏️ Επεξεργασία</button>
                    <button onClick={() => deleteItem('payments', payment.id)}>🗑 Διαγραφή πληρωμής</button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeProjectTab === 'expenses' && (
            <div>
              <h3>Έξοδα έργου</h3>
              {expenses.filter((expense) => expense.project_id === selectedProject.id && isActiveItem(expense)).length === 0 ? (
                <p>Δεν υπάρχουν έξοδα για αυτό το έργο.</p>
              ) : (
                expenses.filter((expense) => expense.project_id === selectedProject.id && isActiveItem(expense)).map((expense) => (
                  <div key={expense.id} className="line">
                    <p><b>{expense.title}</b> — {expense.amount}€</p>
                    <p>Κατηγορία: {expense.category || '-'}</p>
                    <small>{expense.notes}</small>
                    <button onClick={() => editExpense(expense)}>✏️ Επεξεργασία</button>
                    <button onClick={() => deleteItem('expenses', expense.id)}>🗑 Διαγραφή εξόδου</button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeProjectTab === 'quotes' && (
            <div>
              <h3>Προσφορές έργου</h3>
              {getProjectQuotes(selectedProject.id).length === 0 ? (
                <p>Δεν υπάρχουν προσφορές για αυτό το έργο.</p>
              ) : (
                getProjectQuotes(selectedProject.id).map((quote) => (
                  <div key={quote.id} className="line" onClick={() => setSelectedQuote(quote)}>
                    <p><b>{quote.work_type}</b></p>
                    <p>{quote.description}</p>
                    <p>{quote.payable}€</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeProjectTab === 'tasks' && (
            <div>
              <h3>Εργασίες έργου</h3>
              {getProjectTasks(selectedProject.id).length === 0 ? (
                <p>Δεν υπάρχουν tasks για αυτό το έργο.</p>
              ) : (
                getProjectTasks(selectedProject.id).map((task) => (
                  <div key={task.id} className={task.status === 'completed' ? 'line' : 'line alert'}>
                    <p><b>{task.title}</b></p>
                    <p>{task.task_date} {task.task_time || ''}</p>
                    <small>{task.status}</small>
                  </div>
                ))
              )}
            </div>
          )}

          {activeProjectTab === 'documents' && (
            <div>
              <h3>Αρχεία / Παραστατικά έργου</h3>
              {getProjectDocuments(selectedProject.id).length === 0 ? (
                <p>Δεν υπάρχουν αρχεία για αυτό το έργο.</p>
              ) : (
                getProjectDocuments(selectedProject.id).map((document) => (
                  <div key={document.id} className="line">
                    <p><b>{document.title}</b></p>
                    <p>{document.document_type}</p>
                    {document.file_url && (
                      <p><a href={document.file_url} target="_blank">Άνοιγμα αρχείου</a></p>
                    )}
                    <small>{document.notes}</small>
                    <button onClick={() => editDocument(document)}>✏️ Επεξεργασία</button>
                    <button onClick={() => deleteItem('documents', document.id)}>🗑 Διαγραφή αρχείου</button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeProjectTab === 'progress' && (
            <div className="progress-hero">
              <h2>📈 Πρόοδος Έργου</h2>
              <p><b>{selectedProject.title}</b> — {getCustomerName(selectedProject.customer_id)}</p>

              <div className="progress-layout">
                <div className="progress-ring-card">
                  <h3>Γενική πρόοδος</h3>
                  <div className="progress-ring-wrap">
                    <div className="progress-ring" style={{ '--value': effectiveProgress }}>
                      <div className="progress-ring-inner">
                        <div>
                          <div className="progress-ring-number">{effectiveProgress}%</div>
                          <div className="progress-ring-label">Ολοκληρωμένο</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p>Υπολογίζεται αυτόματα από τις ολοκληρωμένες εργασίες του έργου.</p>
                </div>

                <div className="progress-bars-card">
                  <h3>Πρόοδος ανά κατηγορία</h3>
                  {progressCategories.map((item) => (
                    <div key={item.label} className="progress-bar-row">
                      <div className="progress-bar-label">{item.icon} {item.label}</div>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${item.percent}%` }} />
                      </div>
                      <b>{item.percent}%</b>
                    </div>
                  ))}
                </div>

                <div className="progress-status-card">
                  <h3>Κατάσταση έργου</h3>
                  <p><span className="progress-status-pill">{getProjectStatusLabel(selectedProject.status)}</span></p>
                  <hr />
                  <p><b>Progress</b></p>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${effectiveProgress}%` }} />
                  </div>
                  <p style={{ marginTop: '10px' }}><b>{effectiveProgress}%</b></p>
                  <small>Τελευταία ενημέρωση: {formatDate(lastActivityDate || new Date().toISOString())}</small>
                </div>
              </div>

              <div className="progress-timeline-card" style={{ marginTop: '14px' }}>
                <h3>Στάδια έργου</h3>
                <div className="progress-timeline">
                  {projectStages.map((stage, index) => (
                    <div key={stage.label} className={stage.done ? 'progress-stage done' : stage.current ? 'progress-stage current' : 'progress-stage'}>
                      <div className="progress-stage-dot">{stage.done ? '✓' : index + 1}</div>
                      <p><b>{stage.label}</b></p>
                      <small>{stage.done ? 'Ολοκληρώθηκε' : stage.current ? 'Σε εξέλιξη' : 'Εκκρεμεί'}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="progress-finance-card" style={{ marginTop: '14px' }}>
                <h3>Οικονομική εικόνα</h3>
                <div className="progress-finance-grid">
                  <div className="line"><small>Συμφωνία</small><p><b>{formatCurrency(agreed)}</b></p></div>
                  <div className="line"><small>Εισπράξεις</small><p><b>{formatCurrency(paid)}</b></p></div>
                  <div className="line"><small>Έξοδα</small><p><b>{formatCurrency(projectExpenses)}</b></p></div>
                  <div className={estimatedProfit < 0 ? 'line alert' : 'line'}><small>Καθαρό κέρδος</small><p><b>{formatCurrency(estimatedProfit)}</b></p></div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="erp-footer-card no-print">
          <div className="erp-footer-icon">🏗️</div>
          <div>
            <p className="erp-footer-title">TD MANI ERP</p>
            <p className="erp-footer-copy">© Copyright EvaNinou</p>
          </div>
        </section>

        <section className="card print-area">
          <div className="pdf-header">
            <div className="logo pdf-logo">TD</div>
            <div>
              <h1>T D MANI</h1>
              <p>Αναφορά Έργου / Project Report</p>
              <small>Ημερομηνία αναφοράς: {formatDate(new Date().toISOString())}</small>
            </div>
          </div>

          <hr />

          <div className="report-block">
            <h2>{selectedProject.title}</h2>
            <div className="grid">
              <div className="line"><p><b>{getCustomerName(selectedProject.customer_id)}</b></p><small>Πελάτης</small></div>
              <div className="line"><p><b>{getCustomerAfm(selectedProject.customer_id)}</b></p><small>ΑΦΜ πελάτη</small></div>
              <div className="line"><p><b>{getProjectStatusLabel(selectedProject.status)}</b></p><small>Status</small></div>
              <div className="line"><p><b>{selectedProject.area || '-'}</b></p><small>Περιοχή</small></div>
            </div>
            <p><b>Διεύθυνση:</b> {selectedProject.address || '-'}</p>
            <p><b>Σημειώσεις:</b> {selectedProject.notes || '-'}</p>
          </div>

          <div className="report-block">
            <h3>Οικονομική εικόνα έργου</h3>
            <div className="grid">
              <div className="line"><p><b>{formatCurrency(agreed)}</b></p><small>Συμφωνία έργου</small></div>
              <div className="line"><p><b>{formatCurrency(paid)}</b></p><small>Συνολικές εισπράξεις</small></div>
              <div className="line"><p><b>{formatCurrency(projectExpenses)}</b></p><small>Συνολικά έξοδα</small></div>
              <div className={customerBalance > 0 ? 'line alert' : 'line'}><p><b>{formatCurrency(customerBalance)}</b></p><small>Υπόλοιπο πελάτη</small></div>
              <div className={currentProfit < 0 ? 'line alert' : 'line'}><p><b>{formatCurrency(currentProfit)}</b></p><small>Κέρδος μέχρι τώρα</small></div>
              <div className={estimatedProfit < 0 ? 'line alert' : 'line'}><p><b>{formatCurrency(estimatedProfit)}</b></p><small>Εκτιμώμενο τελικό κέρδος</small></div>
            </div>
          </div>

          <div className="report-block">
            <h3>Τιμολόγια εσόδων</h3>
            {projectCustomerInvoicesList.length === 0 ? (
              <p className="report-muted">Δεν υπάρχουν τιμολόγια εσόδων.</p>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Ημ/νία</th>
                    <th>Αριθμός</th>
                    <th>Περιγραφή</th>
                    <th>Καθαρή</th>
                    <th>ΦΠΑ</th>
                    <th>Παρακράτηση</th>
                    <th>Σύνολο τιμολογίου</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projectCustomerInvoicesList.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{formatDate(invoice.invoice_date)}</td>
                      <td>{invoice.invoice_number || '-'}</td>
                      <td>{invoice.description || '-'}</td>
                      <td>{formatCurrency(invoice.net_amount)}</td>
                      <td>{formatCurrency(invoice.vat_amount)}</td>
                      <td>{formatCurrency(invoice.withholding_amount)}</td>
                      <td>{formatCurrency(invoice.receivable_amount)}</td>
                      <td>{getCustomerInvoiceStatus(invoice)}</td>
                    </tr>
                  ))}
                  <tr className="report-total-row">
                    <td colSpan="6">Σύνολο τιμολογίων</td>
                    <td colSpan="2">{formatCurrency(projectCustomerInvoicesList.reduce((sum, invoice) => sum + Number(invoice.receivable_amount || 0), 0))}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div className="report-block">
            <h3>Εισπράξεις / πληρωμές πελάτη</h3>
            {projectPaymentsList.length === 0 ? (
              <p className="report-muted">Δεν υπάρχουν εισπράξεις.</p>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Ημ/νία</th>
                    <th>Ποσό</th>
                    <th>Τρόπος</th>
                    <th>Τιμολόγιο</th>
                    <th>Σημειώσεις</th>
                  </tr>
                </thead>
                <tbody>
                  {projectPaymentsList.map((payment) => (
                    <tr key={payment.id}>
                      <td>{formatDate(payment.payment_date)}</td>
                      <td>{formatCurrency(payment.amount)}</td>
                      <td>{payment.method || '-'}</td>
                      <td>{payment.customer_invoice_id ? (customerInvoices.find((invoice) => invoice.id === payment.customer_invoice_id)?.invoice_number || 'Συνδεδεμένο') : '-'}</td>
                      <td>{payment.notes || '-'}</td>
                    </tr>
                  ))}
                  <tr className="report-total-row">
                    <td>Σύνολο</td>
                    <td colSpan="4">{formatCurrency(paid)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div className="report-block">
            <h3>Έξοδα έργου</h3>
            {projectExpensesList.length === 0 ? (
              <p className="report-muted">Δεν υπάρχουν έξοδα.</p>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Τίτλος</th>
                    <th>Κατηγορία</th>
                    <th>Ποσό</th>
                    <th>Σημειώσεις</th>
                  </tr>
                </thead>
                <tbody>
                  {projectExpensesList.map((expense) => (
                    <tr key={expense.id}>
                      <td>{expense.title || '-'}</td>
                      <td>{expense.category || '-'}</td>
                      <td>{formatCurrency(expense.amount)}</td>
                      <td>{expense.notes || '-'}</td>
                    </tr>
                  ))}
                  <tr className="report-total-row">
                    <td colSpan="2">Σύνολο εξόδων</td>
                    <td colSpan="2">{formatCurrency(projectExpenses)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div className="report-block">
            <h3>Τιμολόγια προμηθευτών που συνδέονται με το έργο</h3>
            {projectSupplierInvoicesList.length === 0 ? (
              <p className="report-muted">Δεν υπάρχουν συνδεδεμένα τιμολόγια προμηθευτών.</p>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Προμηθευτής</th>
                    <th>Ημ/νία</th>
                    <th>Αριθμός</th>
                    <th>Περιγραφή</th>
                    <th>Καθαρή</th>
                    <th>ΦΠΑ</th>
                    <th>Σύνολο</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projectSupplierInvoicesList.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{getSupplierName(invoice.supplier_id)}</td>
                      <td>{formatDate(invoice.invoice_date)}</td>
                      <td>{invoice.invoice_number || '-'}</td>
                      <td>{invoice.description || '-'}</td>
                      <td>{formatCurrency(invoice.net_amount)}</td>
                      <td>{formatCurrency(invoice.vat_amount)}</td>
                      <td>{formatCurrency(invoice.total_amount)}</td>
                      <td>{getSupplierInvoiceStatus(invoice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="report-block">
            <h3>Προσφορές</h3>
            {projectQuotesList.length === 0 ? (
              <p className="report-muted">Δεν υπάρχουν προσφορές.</p>
            ) : (
              <table className="report-table">
                <thead>
                  <tr><th>Είδος εργασίας</th><th>Περιγραφή</th><th>Πληρωτέο</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {projectQuotesList.map((quote) => (
                    <tr key={quote.id}>
                      <td>{quote.work_type || '-'}</td>
                      <td>{quote.description || '-'}</td>
                      <td>{formatCurrency(quote.payable)}</td>
                      <td>{quote.status || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="report-block">
            <h3>Εργασίες</h3>
            {projectTasksList.length === 0 ? (
              <p className="report-muted">Δεν υπάρχουν tasks.</p>
            ) : (
              <table className="report-table">
                <thead>
                  <tr><th>Ημ/νία</th><th>Ώρα</th><th>Task</th><th>Status</th><th>Σημειώσεις</th></tr>
                </thead>
                <tbody>
                  {projectTasksList.map((task) => (
                    <tr key={task.id}>
                      <td>{formatDate(task.task_date)}</td>
                      <td>{task.task_time || '-'}</td>
                      <td>{task.title || '-'}</td>
                      <td>{task.status || '-'}</td>
                      <td>{task.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="report-block">
            <h3>Έγγραφα</h3>
            {projectDocumentsList.length === 0 ? (
              <p className="report-muted">Δεν υπάρχουν documents.</p>
            ) : (
              <table className="report-table">
                <thead>
                  <tr><th>Τίτλος</th><th>Τύπος</th><th>Link</th><th>Σημειώσεις</th></tr>
                </thead>
                <tbody>
                  {projectDocumentsList.map((document) => (
                    <tr key={document.id}>
                      <td>{document.title || '-'}</td>
                      <td>{document.document_type || '-'}</td>
                      <td>{document.file_url ? 'Υπάρχει αρχείο' : '-'}</td>
                      <td>{document.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="report-block">
            <h3>Τελική εικόνα έργου</h3>
            <div className={customerBalance > 0 ? 'line alert' : 'line'}>
              <p><b>{formatCurrency(customerBalance)}</b></p>
              <small>Υπόλοιπο πελάτη: Συμφωνία - εισπράξεις</small>
            </div>
            <div className={currentProfit < 0 ? 'line alert' : 'line'}>
              <p><b>{formatCurrency(currentProfit)}</b></p>
              <small>Κέρδος μέχρι τώρα: Εισπράξεις - έξοδα</small>
            </div>
            <div className={estimatedProfit < 0 ? 'line alert' : 'line'}>
              <p><b>{formatCurrency(estimatedProfit)}</b></p>
              <small>Εκτιμώμενο τελικό κέρδος: Συμφωνία - έξοδα</small>
            </div>
          </div>

          <button className="no-print-inline" onClick={() => window.print()}>📄 Export PDF Αναφοράς Έργου</button>
        </section>
      </main>
    );
  }


  if (selectedSupplierReport && activePage === 'suppliers') {
    const supplierTotals = getSupplierTotals(selectedSupplierReport.id);

    return (
      <main className="app page-suppliers">
        <style>{ERP_STYLES}</style>

        <section className="card print-area">
          <button onClick={() => setSelectedSupplierReport(null)}>← Πίσω στους προμηθευτές</button>

          <div className="pdf-header">
            <div className="logo pdf-logo">TD</div>
            <div>
              <h2>TD MANI</h2>
              <p><b>ΑΝΑΦΟΡΑ ΠΡΟΜΗΘΕΥΤΗ</b></p>
              <small>Πλάκες, Μήλος 84800 | 6944705508 | Manitaulant@yahoo.com</small>
            </div>
          </div>

          <hr />

          <h2>{selectedSupplierReport.name}</h2>
          <p><b>ΑΦΜ:</b> {selectedSupplierReport.afm || '-'}</p>
          <p><b>Τηλέφωνο:</b> {selectedSupplierReport.phone || '-'}</p>
          <p><b>Email:</b> {selectedSupplierReport.email || '-'}</p>
          <p><b>Διεύθυνση:</b> {selectedSupplierReport.address || '-'}</p>
          <p><b>Σημειώσεις:</b> {selectedSupplierReport.notes || '-'}</p>

          <hr />

          <h3>Σύνοψη</h3>
          <div className="grid">
            <div className="line"><p><b>{supplierTotals.totalInvoices}€</b></p><small>Σύνολο τιμολογίων</small></div>
            <div className="line"><p><b>{supplierTotals.totalPaid}€</b></p><small>Σύνολο πληρωμών</small></div>
            <div className={supplierTotals.balance > 0 ? 'line alert' : 'line'}><p><b>{supplierTotals.balance}€</b></p><small>Υπόλοιπο</small></div>
          </div>

          <hr />

          <h3>Τιμολόγια</h3>
          {getSupplierInvoices(selectedSupplierReport.id).length === 0 ? (
            <p>Δεν υπάρχουν τιμολόγια για αυτόν τον προμηθευτή.</p>
          ) : (
            getSupplierInvoices(selectedSupplierReport.id).map((invoice) => (
              <div key={invoice.id} className="report-block line">
                <p><b>{invoice.invoice_number || 'Χωρίς αριθμό'} — {invoice.total_amount || 0}€</b></p>
                <p>Ημερομηνία: {invoice.invoice_date || '-'}</p>
                <p>Έργο: {invoice.project_id ? getProjectTitle(invoice.project_id) : 'Χωρίς έργο / Γενικό έξοδο'}</p>
                <p>Κατηγορία: {invoice.expense_category || '-'}</p>
                <p>Καθαρή αξία: {invoice.net_amount || 0}€</p>
                <p>ΦΠΑ 24%: {invoice.vat_amount || 0}€</p>
                <p>Σύνολο: {invoice.total_amount || 0}€</p>
                <p>Πληρωμένα: {getSupplierInvoicePaid(invoice.id)}€</p>
                <p>Status: <b>{getSupplierInvoiceStatus(invoice)}</b></p>
                <p>Περιγραφή: {invoice.description || '-'}</p>
              </div>
            ))
          )}

          <h3>Πληρωμές</h3>
          {getSupplierPayments(selectedSupplierReport.id).length === 0 ? (
            <p>Δεν υπάρχουν πληρωμές για αυτόν τον προμηθευτή.</p>
          ) : (
            getSupplierPayments(selectedSupplierReport.id).map((payment) => (
              <div key={payment.id} className="line">
                <p><b>{payment.amount}€</b> — {payment.method}</p>
                <p>Ημερομηνία: {payment.payment_date || '-'}</p>
                <p>
                  Τιμολόγιο: {payment.supplier_invoice_id
                    ? (supplierInvoices.find((invoice) => invoice.id === payment.supplier_invoice_id)?.invoice_number || 'Συνδεδεμένο')
                    : 'Γενική πληρωμή'}
                </p>
                <small>{payment.notes}</small>
              </div>
            ))
          )}

          <hr />

          <p><b>Υπογραφή / Σφραγίδα</b></p>
          <p className="signature-line">T D MANI</p>

          <button onClick={() => window.print()}>Export / Print PDF</button>
          <button onClick={() => setSelectedSupplierReport(null)}>← Πίσω στους προμηθευτές</button>
        </section>
      </main>
    );
  }

  return (
    <main className={`app page-${activePage} ${activePage === 'settings' ? `settings-${activeSettingsTab || 'home'}` : ''} ${activePage === 'reports' ? `reports-${activeReportTab || 'home'}` : ''}`}>
      <style>{ERP_STYLES}</style>
      <header className="top">
        <div className="brand">
          <div className="logo">TD</div>
          <div>
            <h1>T D MANI</h1>
            <p>ΟΙΚΟΔΟΜΙΚΕΣ ΕΡΓΑΣΙΕΣ</p>
          </div>
        </div>

        <div className="global-search">
          <span className="global-search-icon">🔍</span>
          <input
            id="global-search-input"
            placeholder="Αναζήτηση σε πελάτες, έργα, τιμολόγια..."
            value={globalSearch}
            onFocus={() => setGlobalSearchOpen(true)}
            onChange={(e) => {
              setGlobalSearch(e.target.value);
              setGlobalSearchOpen(true);
            }}
          />
          <span className="global-search-shortcut">Ctrl K</span>

          {globalSearchOpen && globalSearch && (
            <div className="global-search-results">
              {globalSearchResults.length > 0 ? (
                globalSearchResults.map((result, index) => (
                  <button
                    key={`${result.type}-${index}`}
                    className="global-search-result"
                    onClick={() => selectGlobalSearchResult(result)}
                  >
                    <span className="global-search-result-title">{result.icon} {result.title}</span>
                    <span className="global-search-result-meta">{result.meta}</span>
                  </button>
                ))
              ) : (
                <div className="global-search-empty">Δεν βρέθηκαν αποτελέσματα.</div>
              )}
            </div>
          )}
        </div>

        <div>
          <p><b>{currentUser.name}</b></p>
          <small>{currentUser.role}</small>
          <br />
          <button onClick={logoutUser}>Αποσύνδεση</button>
        </div>
      </header>

      <nav className="erp-nav">
        <button className={activePage === 'dashboard' ? 'active' : ''} onClick={() => setActivePage('dashboard')}>🏠 Πίνακας Ελέγχου</button>
        <button className={activePage === 'customers' ? 'active' : ''} onClick={() => setActivePage('customers')}>👥 Πελάτες & Έργα</button>
        <button
          className={['income-expenses', 'finance', 'customer-invoices', 'suppliers', 'inventory'].includes(activePage) ? 'active' : ''}
          onClick={() => setActivePage('income-expenses')}
        >
          💶 Έσοδα / Έξοδα
        </button>
        <button className={activePage === 'settings' ? 'active' : ''} onClick={() => { setActivePage('settings'); setActiveSettingsTab(''); }}>⚙️ Ρυθμίσεις</button>
      </nav>

      {(editingCustomerId || editingProjectId || editingPaymentId || editingCustomerInvoiceId || editingExpenseId || editingInventoryId || editingQuoteId || editingTaskId || editingDocumentId || editingSupplierId || editingSupplierInvoiceId || editingSupplierPaymentId) && (
        <section className="card">
          <h2>✏️ Λειτουργία επεξεργασίας</h2>
          <p>Έχεις ανοίξει μια εγγραφή για αλλαγές. Κάνε τις αλλαγές στη φόρμα και πάτα αποθήκευση.</p>
          <button onClick={cancelEdits}>Ακύρωση επεξεργασίας</button>
        </section>
      )}

      <section className="card page-section income-expenses-section">
        <h2>💶 Έσοδα / Έξοδα</h2>
        <p>Διάλεξε οικονομική ενότητα για να συνεχίσεις.</p>
        <div className="grid">
          <div className="line settings-card" role="button" tabIndex={0} onClick={() => setActivePage('finance')} onKeyDown={(e) => e.key === 'Enter' && setActivePage('finance')}>
            <p><b>💰 Οικονομικά</b></p>
            <small>Εισπράξεις, έξοδα, ΦΠΑ και οικονομική εικόνα</small>
          </div>

          <div className="line settings-card" role="button" tabIndex={0} onClick={() => setActivePage('customer-invoices')} onKeyDown={(e) => e.key === 'Enter' && setActivePage('customer-invoices')}>
            <p><b>🧾 Τιμολόγια Εσόδων</b></p>
            <small>Τιμολόγια πελατών, παρακρατήσεις και εισπρακτέα</small>
          </div>

          <div className="line settings-card" role="button" tabIndex={0} onClick={() => setActivePage('suppliers')} onKeyDown={(e) => e.key === 'Enter' && setActivePage('suppliers')}>
            <p><b>🚚 Προμηθευτές</b></p>
            <small>Προμηθευτές, τιμολόγια εξόδων και πληρωμές</small>
          </div>

          <div className="line settings-card" role="button" tabIndex={0} onClick={() => setActivePage('inventory')} onKeyDown={(e) => e.key === 'Enter' && setActivePage('inventory')}>
            <p><b>📦 Αποθήκη</b></p>
            <small>Υλικά, ποσότητες και χαμηλό stock</small>
          </div>
        </div>
      </section>

      {quickReturnToDashboard && activePage !== 'dashboard' && (
        <section className="card quick-return-card no-print">
          <button onClick={backToDashboardFromQuickCreate}>← Πίσω στον Πίνακα Ελέγχου</button>
          <small>Άνοιξες αυτή τη φόρμα από το +.</small>
        </section>
      )}

      <Dashboard
        currentDateTime={currentDateTime}
        currentUser={currentUser}
        dashboardExtraStats={dashboardExtraStats}
        dashboardStats={dashboardStats}
        riskStats={riskStats}
        totals={totals}
        businessStats={businessStats}
        formatGreekLongDate={formatGreekLongDate}
        formatGreekTime={formatGreekTime}
        getGreeting={getGreeting}
        getFirstName={getFirstName}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getProjectTitle={getProjectTitle}
      />

      <section className="card page-section reports-section">
        <h2>📑 Αναφορές</h2>

        {activePage === 'settings' && activeReportTab === '' && (
          <button onClick={() => setActiveSettingsTab('')}>← Πίσω στις Ρυθμίσεις</button>
        )}

        {activeReportTab === '' && (
          <>
            <p>Διάλεξε ποια αναφορά θέλεις να ανοίξεις.</p>
            <div className="grid">
              <div className="line settings-card" role="button" tabIndex={0} onClick={() => setActiveReportTab('project')} onKeyDown={(e) => e.key === 'Enter' && setActiveReportTab('project')}>
                <p><b>📁 Αναφορά Έργου</b></p>
                <small>Στοιχεία έργου, εισπράξεις, έξοδα, τιμολόγια και κέρδος</small>
              </div>

              <div className="line settings-card" role="button" tabIndex={0} onClick={() => setActiveReportTab('customer')} onKeyDown={(e) => e.key === 'Enter' && setActiveReportTab('customer')}>
                <p><b>👤 Αναφορά Πελάτη</b></p>
                <small>Έργα πελάτη, πληρωμές και υπόλοιπα</small>
              </div>

              <div className="line settings-card" role="button" tabIndex={0} onClick={() => setActiveReportTab('supplier')} onKeyDown={(e) => e.key === 'Enter' && setActiveReportTab('supplier')}>
                <p><b>🚚 Αναφορά Προμηθευτή</b></p>
                <small>Τιμολόγια, πληρωμές και υπόλοιπο προμηθευτή</small>
              </div>

              <div className="line settings-card" role="button" tabIndex={0} onClick={() => setActiveReportTab('vat')} onKeyDown={(e) => e.key === 'Enter' && setActiveReportTab('vat')}>
                <p><b>💰 Αναφορά ΦΠΑ</b></p>
                <small>ΦΠΑ εσόδων, ΦΠΑ εξόδων και πληρωτέο ανά τρίμηνο</small>
              </div>

              <div className="line settings-card" role="button" tabIndex={0} onClick={() => setActiveReportTab('balances')} onKeyDown={(e) => e.key === 'Enter' && setActiveReportTab('balances')}>
                <p><b>📊 Ανοιχτά Υπόλοιπα</b></p>
                <small>Πελάτες που χρωστάνε και προμηθευτές που χρωστάμε</small>
              </div>
            </div>
          </>
        )}

        {activeReportTab !== '' && (
          <button
            onClick={() => {
              setActiveReportTab('');
              setShowProjectReport(false);
            }}
          >
            ← Πίσω στις Αναφορές
          </button>
        )}

        {activeReportTab === 'project' && (
          <div className="card">
            <h3>📁 Αναφορά Έργου</h3>
            <p>Διάλεξε έργο και το ERP θα δημιουργήσει αυτόματα την αναφορά από τα υπάρχοντα δεδομένα.</p>

            <select
              value={selectedReportProjectId}
              onChange={(e) => {
                setSelectedReportProjectId(e.target.value);
                setShowProjectReport(false);
              }}
            >
              <option value="">Διάλεξε έργο</option>
              {projects.filter(isActiveItem).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title} — {getCustomerName(project.customer_id)}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                if (!selectedReportProjectId) {
                  alert('Διάλεξε πρώτα έργο');
                  return;
                }
                setShowProjectReport(true);
              }}
            >
              Προβολή Αναφοράς
            </button>

            {showProjectReport && selectedReportProjectId && (() => {
              const reportProject = projects.find((project) => project.id === selectedReportProjectId);
              if (!reportProject) return <p>Δεν βρέθηκε το έργο.</p>;

              const agreed = Number(reportProject.agreed_amount || 0);
              const paid = getProjectPaid(reportProject.id);
              const projectExpenses = getProjectExpenses(reportProject.id);
              const customerBalance = agreed - paid;
              const currentProfit = paid - projectExpenses;
              const estimatedProfit = agreed - projectExpenses;
              const reportPayments = getProjectPayments(reportProject.id);
              const reportExpenses = expenses.filter((expense) => expense.project_id === reportProject.id && isActiveItem(expense));
              const reportCustomerInvoices = getProjectCustomerInvoices(reportProject.id);
              const reportSupplierInvoices = getProjectSupplierInvoices(reportProject.id);

              return (
                <div className="card print-area">
                  <div className="pdf-header">
                    <div className="logo pdf-logo">TD</div>
                    <div>
                      <h2>Αναφορά Έργου</h2>
                      <p><b>T D MANI</b> — ΟΙΚΟΔΟΜΙΚΕΣ ΕΡΓΑΣΙΕΣ</p>
                      <small>Ημερομηνία αναφοράς: {formatDate(new Date().toISOString())}</small>
                    </div>
                  </div>

                  <button className="no-print" onClick={() => window.print()}>
                    🖨 Export PDF
                  </button>

                  <hr />

                  <div className="report-block">
                    <h3>📁 Στοιχεία έργου</h3>
                    <div className="grid">
                      <div className="line"><p><b>{reportProject.title}</b></p><small>Έργο</small></div>
                      <div className="line"><p><b>{getCustomerName(reportProject.customer_id)}</b></p><small>Πελάτης</small></div>
                      <div className="line"><p><b>{getCustomerAfm(reportProject.customer_id)}</b></p><small>ΑΦΜ πελάτη</small></div>
                      <div className="line"><p><b>{getProjectStatusLabel(reportProject.status)}</b></p><small>Status</small></div>
                      <div className="line"><p><b>{reportProject.area || '-'}</b></p><small>Περιοχή</small></div>
                      <div className="line"><p><b>{reportProject.address || '-'}</b></p><small>Διεύθυνση</small></div>
                    </div>
                  </div>

                  <div className="report-block">
                    <h3>💰 Οικονομική εικόνα</h3>
                    <div className="grid">
                      <div className="line"><p><b>{formatCurrency(agreed)}</b></p><small>Συμφωνία έργου</small></div>
                      <div className="line"><p><b>{formatCurrency(paid)}</b></p><small>Συνολικές εισπράξεις</small></div>
                      <div className="line"><p><b>{formatCurrency(projectExpenses)}</b></p><small>Συνολικά έξοδα</small></div>
                      <div className={customerBalance > 0 ? 'line alert' : 'line'}><p><b>{formatCurrency(customerBalance)}</b></p><small>Υπόλοιπο πελάτη</small></div>
                      <div className={currentProfit < 0 ? 'line alert' : 'line'}><p><b>{formatCurrency(currentProfit)}</b></p><small>Κέρδος μέχρι τώρα</small></div>
                      <div className={estimatedProfit < 0 ? 'line alert' : 'line'}><p><b>{formatCurrency(estimatedProfit)}</b></p><small>Εκτιμώμενο τελικό κέρδος</small></div>
                    </div>
                  </div>

                  <div className="report-block">
                    <h3>🧾 Τιμολόγια εσόδων</h3>
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Ημερομηνία</th>
                          <th>Αριθμός</th>
                          <th>Περιγραφή</th>
                          <th>Καθαρή αξία</th>
                          <th>ΦΠΑ</th>
                          <th>Σύνολο</th>
                          <th>Σύνολο τιμολογίου</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportCustomerInvoices.length === 0 ? (
                          <tr><td colSpan="8">Δεν υπάρχουν τιμολόγια εσόδων.</td></tr>
                        ) : reportCustomerInvoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td>{formatDate(invoice.invoice_date)}</td>
                            <td>{invoice.invoice_number || '-'}</td>
                            <td>{invoice.description || '-'}</td>
                            <td>{formatCurrency(invoice.net_amount)}</td>
                            <td>{formatCurrency(invoice.vat_amount)}</td>
                            <td>{formatCurrency(invoice.total_amount)}</td>
                            <td>{formatCurrency(invoice.receivable_amount)}</td>
                            <td>{getCustomerInvoiceStatus(invoice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="report-block">
                    <h3>💳 Πληρωμές / Εισπράξεις</h3>
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Ημερομηνία</th>
                          <th>Ποσό</th>
                          <th>Τρόπος</th>
                          <th>Σημειώσεις</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportPayments.length === 0 ? (
                          <tr><td colSpan="4">Δεν υπάρχουν πληρωμές.</td></tr>
                        ) : reportPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td>{formatDate(payment.payment_date || payment.created_at)}</td>
                            <td>{formatCurrency(payment.amount)}</td>
                            <td>{payment.method || '-'}</td>
                            <td>{payment.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="report-block">
                    <h3>💸 Έξοδα έργου</h3>
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Τίτλος</th>
                          <th>Κατηγορία</th>
                          <th>Ποσό</th>
                          <th>Σημειώσεις</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportExpenses.length === 0 ? (
                          <tr><td colSpan="4">Δεν υπάρχουν έξοδα.</td></tr>
                        ) : reportExpenses.map((expense) => (
                          <tr key={expense.id}>
                            <td>{expense.title || '-'}</td>
                            <td>{expense.category || '-'}</td>
                            <td>{formatCurrency(expense.amount)}</td>
                            <td>{expense.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="report-block">
                    <h3>🚚 Τιμολόγια προμηθευτών</h3>
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Ημερομηνία</th>
                          <th>Προμηθευτής</th>
                          <th>Αριθμός</th>
                          <th>Περιγραφή</th>
                          <th>Καθαρή αξία</th>
                          <th>ΦΠΑ</th>
                          <th>Σύνολο</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportSupplierInvoices.length === 0 ? (
                          <tr><td colSpan="8">Δεν υπάρχουν τιμολόγια προμηθευτών.</td></tr>
                        ) : reportSupplierInvoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td>{formatDate(invoice.invoice_date)}</td>
                            <td>{getSupplierName(invoice.supplier_id)}</td>
                            <td>{invoice.invoice_number || '-'}</td>
                            <td>{invoice.description || '-'}</td>
                            <td>{formatCurrency(invoice.net_amount)}</td>
                            <td>{formatCurrency(invoice.vat_amount)}</td>
                            <td>{formatCurrency(invoice.total_amount)}</td>
                            <td>{getSupplierInvoiceStatus(invoice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="signature-line">
                    <small>TD MANI</small>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeReportTab === 'customer' && (
          <div className="card">
            <h3>👤 Αναφορά Πελάτη</h3>
            <p>Επόμενο βήμα: αναφορά πελάτη με όλα τα έργα, πληρωμές και υπόλοιπα.</p>
          </div>
        )}

        {activeReportTab === 'supplier' && (
          <div className="card">
            <h3>🚚 Αναφορά Προμηθευτή</h3>
            <p>Επόμενο βήμα: αναφορά προμηθευτή με τιμολόγια, πληρωμές και υπόλοιπο.</p>
          </div>
        )}

        {activeReportTab === 'vat' && (
          <div className="card">
            <h3>💰 Αναφορά ΦΠΑ</h3>
            <p>Επόμενο βήμα: αναφορά ΦΠΑ ανά τρίμηνο με ΦΠΑ εσόδων, ΦΠΑ εξόδων και πληρωτέο.</p>
          </div>
        )}

        {activeReportTab === 'balances' && (
          <div className="card">
            <h3>📊 Ανοιχτά Υπόλοιπα</h3>
            <p>Επόμενο βήμα: ανοιχτά υπόλοιπα πελατών και προμηθευτών.</p>
          </div>
        )}
      </section>

      <section className="card page-section settings-section">
        <h2>⚙️ Ρυθμίσεις</h2>
        <p>Διάλεξε ποια ενότητα θέλεις να ανοίξεις.</p>
        <div className="grid">
          <div className="line settings-card" role="button" tabIndex={0} onClick={() => setActiveSettingsTab('tasks')} onKeyDown={(e) => e.key === 'Enter' && setActiveSettingsTab('tasks')}>
            <p><b>✅ Εργασίες</b></p>
            <small>Tasks / ραντεβού ανά έργο</small>
          </div>
          <div className="line settings-card" role="button" tabIndex={0} onClick={() => setActiveSettingsTab('documents')} onKeyDown={(e) => e.key === 'Enter' && setActiveSettingsTab('documents')}>
            <p><b>📁 Έγγραφα</b></p>
            <small>Αρχεία και παραστατικά έργων</small>
          </div>
          <div className="line settings-card" role="button" tabIndex={0} onClick={() => { setActiveSettingsTab('reports'); setActiveReportTab(''); }} onKeyDown={(e) => e.key === 'Enter' && setActiveSettingsTab('reports')}>
            <p><b>📑 Αναφορές</b></p>
            <small>Αναφορές έργων, πελατών, προμηθευτών, ΦΠΑ και υπολοίπων</small>
          </div>

          <div className="line settings-card" role="button" tabIndex={0} onClick={() => setActiveSettingsTab('trash')} onKeyDown={(e) => e.key === 'Enter' && setActiveSettingsTab('trash')}>
            <p><b>🗑 Κάδος</b></p>
            <small>Επαναφορά ή οριστική διαγραφή</small>
          </div>
        </div>
      </section>

      <section className="card page-section tasks-section settings-task-section">
        {activePage === 'settings' && <button onClick={() => setActiveSettingsTab('')}>← Πίσω στις Ρυθμίσεις</button>}
        <h2>{editingTaskId ? 'Επεξεργασία Εργασίας / Ραντεβού' : 'Νέα Εργασία / Ραντεβού'}</h2>
        <select value={newTask.project_id} onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}>
          <option value="">Διάλεξε έργο</option>
          {projects.filter(isActiveItem).map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
        </select>
        <input placeholder="Τίτλος εργασίας / ραντεβού" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
        <input type="date" value={newTask.task_date} onChange={(e) => setNewTask({ ...newTask, task_date: e.target.value })} />
        <input type="time" value={newTask.task_time} onChange={(e) => setNewTask({ ...newTask, task_time: e.target.value })} />
        <select value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}>
          <option value="pending">Εκκρεμεί</option>
          <option value="in_progress">Σε εξέλιξη</option>
          <option value="completed">Ολοκληρώθηκε</option>
        </select>
        <textarea placeholder="Σημειώσεις" value={newTask.notes} onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })} />
        <button onClick={saveTask}>{editingTaskId ? 'Αποθήκευση αλλαγών εργασίας' : 'Αποθήκευση εργασίας'}</button>
      </section>

      <section className="card page-section tasks-section settings-task-section">
        <h2>✅ Εργασίες / Ραντεβού</h2>

        <input
          placeholder="Αναζήτηση εργασίας / έργου / κατάστασης..."
          value={taskSearch}
          onChange={(e) => setTaskSearch(e.target.value)}
        />

        {tasks.filter(isActiveItem).length === 0 ? (
          <p>Δεν υπάρχουν εργασίες ακόμα.</p>
        ) : getVisibleTasks().length === 0 ? (
          <p>Δεν βρέθηκαν εργασίες με αυτή την αναζήτηση.</p>
        ) : (
          getVisibleTasks().map((task) => (
            <div key={task.id} className={task.status === 'completed' ? 'line' : 'line alert'}>
              <p><b>{task.title}</b></p>
              <p>Έργο: {getProjectTitle(task.project_id)}</p>
              <p>Ημερομηνία: {task.task_date} {task.task_time || ''}</p>
              <p>Status: {task.status}</p>
              <small>{task.notes}</small>
              <button onClick={() => editTask(task)}>✏️ Επεξεργασία</button>
              <button onClick={() => deleteItem('tasks', task.id)}>🗑 Διαγραφή εργασίας</button>
            </div>
          ))
        )}
      </section>

      <section className="card page-section documents-section settings-document-section">
        {activePage === 'settings' && <button onClick={() => setActiveSettingsTab('')}>← Πίσω στις Ρυθμίσεις</button>}
        <h2>{editingDocumentId ? 'Επεξεργασία Αρχείου / Παραστατικού' : 'Νέο Αρχείο / Παραστατικό'}</h2>

        <select
          value={newDocument.customer_id}
          onChange={(e) => setNewDocument({ ...newDocument, customer_id: e.target.value, project_id: '' })}
        >
          <option value="">Διάλεξε πελάτη</option>
          {customers.filter(isActiveItem).map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>

        <select value={newDocument.project_id} onChange={(e) => setNewDocument({ ...newDocument, project_id: e.target.value })}>
          <option value="">Διάλεξε έργο πελάτη</option>
          {getFilteredProjectsByCustomer(newDocument.customer_id).map((project) => (
            <option key={project.id} value={project.id}>{project.title}</option>
          ))}
        </select>

        <input placeholder="Τίτλος αρχείου" value={newDocument.title} onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })} />

        <select value={newDocument.document_type} onChange={(e) => setNewDocument({ ...newDocument, document_type: e.target.value })}>
          <option value="Τιμολόγιο">Τιμολόγιο</option>
          <option value="Απόδειξη">Απόδειξη</option>
          <option value="Σύμβαση">Σύμβαση</option>
          <option value="Φωτογραφία έργου">Φωτογραφία έργου</option>
          <option value="Άλλο">Άλλο</option>
        </select>

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
        />

        <input
          placeholder="Ή βάλε link αρχείου / φωτογραφίας"
          value={newDocument.file_url}
          onChange={(e) => setNewDocument({ ...newDocument, file_url: e.target.value })}
        />

        <textarea placeholder="Σημειώσεις" value={newDocument.notes} onChange={(e) => setNewDocument({ ...newDocument, notes: e.target.value })} />

        <button onClick={saveDocument}>{editingDocumentId ? 'Αποθήκευση αλλαγών αρχείου' : 'Αποθήκευση αρχείου'}</button>
      </section>

      <Customers
        editingCustomerId={editingCustomerId}
        newCustomer={newCustomer}
        setNewCustomer={setNewCustomer}
        saveCustomer={saveCustomer}
        editingProjectId={editingProjectId}
        newProject={newProject}
        setNewProject={setNewProject}
        customers={customers}
        isActiveItem={isActiveItem}
        saveProject={saveProject}
        customerSearch={customerSearch}
        setCustomerSearch={setCustomerSearch}
        projectSearch={projectSearch}
        setProjectSearch={setProjectSearch}
        customerMatchesSearch={customerMatchesSearch}
        getVisibleCustomerProjects={getVisibleCustomerProjects}
        getCustomerTotals={getCustomerTotals}
        openCustomerId={openCustomerId}
        setOpenCustomerId={setOpenCustomerId}
        getCustomerProjects={getCustomerProjects}
        setSelectedCustomerReport={setSelectedCustomerReport}
        editCustomer={editCustomer}
        deleteItem={deleteItem}
        getProjectPaid={getProjectPaid}
        getProjectExpenses={getProjectExpenses}
        getCustomerName={getCustomerName}
        getProjectStatusStyle={getProjectStatusStyle}
        getProjectStatusLabel={getProjectStatusLabel}
        getProjectProgress={getProjectProgress}
        setSelectedProject={setSelectedProject}
        setActiveProjectTab={setActiveProjectTab}
        editProject={editProject}
        selectedProject={selectedProject}
        getCustomerAfm={getCustomerAfm}
        getProjectCustomerInvoices={getProjectCustomerInvoices}
        getCustomerInvoicePaid={getCustomerInvoicePaid}
        getCustomerInvoiceStatus={getCustomerInvoiceStatus}
        getProjectPayments={getProjectPayments}
        editPayment={editPayment}
        expenses={expenses}
        editExpense={editExpense}
        getProjectQuotes={getProjectQuotes}
        setSelectedQuote={setSelectedQuote}
        getProjectTasks={getProjectTasks}
        getProjectDocuments={getProjectDocuments}
        editDocument={editDocument}
      />


      <section className="card page-section customer-invoices-section">
        <button onClick={() => setActivePage('income-expenses')}>← Πίσω στα Έσοδα / Έξοδα</button>
        <h2>{editingCustomerInvoiceId ? 'Επεξεργασία Τιμολογίου Εσόδου' : 'Νέο Τιμολόγιο Εσόδου'}</h2>

        <select
          value={newCustomerInvoice.customer_id}
          onChange={(e) => setNewCustomerInvoice({ ...newCustomerInvoice, customer_id: e.target.value, project_id: '' })}
        >
          <option value="">Διάλεξε πελάτη</option>
          {customers.filter(isActiveItem).map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name} — ΑΦΜ: {customer.afm || '-'}</option>
          ))}
        </select>

        <select value={newCustomerInvoice.project_id} onChange={(e) => setNewCustomerInvoice({ ...newCustomerInvoice, project_id: e.target.value })}>
          <option value="">Χωρίς έργο / Γενικό έσοδο</option>
          {getFilteredProjectsByCustomer(newCustomerInvoice.customer_id).map((project) => (
            <option key={project.id} value={project.id}>{project.title}</option>
          ))}
        </select>

        <input type="date" value={newCustomerInvoice.invoice_date} onChange={(e) => setNewCustomerInvoice({ ...newCustomerInvoice, invoice_date: e.target.value })} />
        <input placeholder="Αριθμός τιμολογίου" value={newCustomerInvoice.invoice_number} onChange={(e) => setNewCustomerInvoice({ ...newCustomerInvoice, invoice_number: e.target.value })} />
        <textarea placeholder="Περιγραφή" value={newCustomerInvoice.description} onChange={(e) => setNewCustomerInvoice({ ...newCustomerInvoice, description: e.target.value })} />
        <input placeholder="Καθαρή αξία" value={newCustomerInvoice.net_amount} onChange={(e) => setNewCustomerInvoice({ ...newCustomerInvoice, net_amount: e.target.value })} />

        <div className="line">
          <p>ΦΠΑ 24%: <b>{calculateCustomerInvoiceValues(newCustomerInvoice).vat}€</b></p>
          <p>Παρακράτηση 3%: <b>{calculateCustomerInvoiceValues(newCustomerInvoice).withholding}€</b></p>
          <p>Σύνολο τιμολογίου: <b>{calculateCustomerInvoiceValues(newCustomerInvoice).total}€</b></p>
          <p>Πληρωτέο / σύνολο τιμολογίου: <b>{calculateCustomerInvoiceValues(newCustomerInvoice).receivable}€</b></p>
        </div>

        <small>Το τιμολόγιο δεν δημιουργεί αυτόματη είσπραξη. Οι πληρωμές καταχωρούνται μόνο από τη Νέα Πληρωμή / Είσπραξη.</small>

        <textarea placeholder="Σημειώσεις" value={newCustomerInvoice.notes} onChange={(e) => setNewCustomerInvoice({ ...newCustomerInvoice, notes: e.target.value })} />

        <button onClick={saveCustomerInvoice}>{editingCustomerInvoiceId ? 'Αποθήκευση αλλαγών τιμολογίου' : 'Αποθήκευση τιμολογίου'}</button>
      </section>

      <section className="card page-section customer-invoices-section">
        <h2>Τιμολόγια Εσόδων</h2>

        <input
          placeholder="Αναζήτηση με ΑΦΜ ή όνομα πελάτη..."
          value={customerInvoiceSearch}
          onChange={(e) => setCustomerInvoiceSearch(e.target.value)}
        />

        {customerInvoices.filter(isActiveItem).length === 0 ? (
          <p>Δεν υπάρχουν τιμολόγια εσόδων ακόμα.</p>
        ) : getVisibleCustomerInvoices().length === 0 ? (
          <p>Δεν βρέθηκαν τιμολόγια με αυτή την αναζήτηση.</p>
        ) : (
          getVisibleCustomerInvoices().map((invoice) => (
            <div key={invoice.id} className={getCustomerInvoiceStatus(invoice) === 'Εξοφλημένο' ? 'line' : 'line alert'}>
              <p><b>{invoice.invoice_number || 'Χωρίς αριθμό'} — {invoice.receivable_amount}€ σύνολο τιμολογίου</b></p>
              <p>Πελάτης: {getCustomerName(invoice.customer_id)} — ΑΦΜ: {getCustomerAfm(invoice.customer_id)}</p>
              <p>Έργο: {invoice.project_id ? getProjectTitle(invoice.project_id) : 'Χωρίς έργο / Γενικό έσοδο'}</p>
              <p>Ημερομηνία: {invoice.invoice_date || '-'}</p>
              <p>Καθαρή: {invoice.net_amount || 0}€ | ΦΠΑ: {invoice.vat_amount || 0}€ | Παρακράτηση: {invoice.withholding_amount || 0}€</p>
              <p>Σύνολο: {invoice.total_amount || 0}€</p>
              <p>Πληρωμένα: {getCustomerInvoicePaid(invoice.id)}€</p>
              <p>Status: <b>{getCustomerInvoiceStatus(invoice)}</b></p>
              <small>{invoice.description || invoice.notes}</small>
              <button onClick={() => editCustomerInvoice(invoice)}>✏️ Επεξεργασία</button>
              <button onClick={() => deleteItem('customer_invoices', invoice.id)}>🗑 Διαγραφή τιμολογίου</button>
            </div>
          ))
        )}
      </section>


      <section className="card page-section finance-section">
        <button onClick={() => setActivePage('income-expenses')}>← Πίσω στα Έσοδα / Έξοδα</button>
        <h2>🧾 Υπολογισμός ΦΠΑ τριμήνου</h2>
        <p>Υπολογίζει: ΦΠΑ εσόδων από τιμολόγια εσόδων μείον ΦΠΑ εξόδων από τιμολόγια προμηθευτών.</p>

        <select value={vatYear} onChange={(e) => setVatYear(e.target.value)}>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
          <option value="2028">2028</option>
        </select>

        <select value={vatQuarter} onChange={(e) => setVatQuarter(e.target.value)}>
          <option value="1">Α' τρίμηνο: Ιανουάριος - Μάρτιος</option>
          <option value="2">Β' τρίμηνο: Απρίλιος - Ιούνιος</option>
          <option value="3">Γ' τρίμηνο: Ιούλιος - Σεπτέμβριος</option>
          <option value="4">Δ' τρίμηνο: Οκτώβριος - Δεκέμβριος</option>
        </select>

        <div className="grid">
          <div className="line">
            <p><b>{getVatTotals().outputVat}€</b></p>
            <small>ΦΠΑ εσόδων</small>
          </div>

          <div className="line">
            <p><b>{getVatTotals().inputVat}€</b></p>
            <small>ΦΠΑ εξόδων</small>
          </div>

          <div className={getVatTotals().payableVat > 0 ? 'line alert' : 'line'}>
            <p><b>{getVatTotals().payableVat}€</b></p>
            <small>{getVatTotals().payableVat >= 0 ? 'Πληρωτέο ΦΠΑ' : 'Πιστωτικό ΦΠΑ'}</small>
          </div>

          <div className="line">
            <p><b>{getVatTotals().startDate} έως {getVatTotals().endDate}</b></p>
            <small>Περίοδος</small>
          </div>
        </div>

        <small>Είναι εργαλείο εσωτερικής εκτίμησης. Ο τελικός έλεγχος γίνεται από τον λογιστή.</small>
      </section>

      <section className="card page-section finance-section">
        <h2>{editingPaymentId ? 'Επεξεργασία Πληρωμής' : 'Νέα Πληρωμή'}</h2>
        <input
          placeholder="Αναζήτηση πελάτη με ΑΦΜ ή όνομα..."
          value={paymentCustomerSearch}
          onChange={(e) => setPaymentCustomerSearch(e.target.value)}
        />

        <select
          value={newPayment.customer_id}
          onChange={(e) => setNewPayment({ ...newPayment, customer_id: e.target.value, project_id: '', customer_invoice_id: '' })}
        >
          <option value="">Διάλεξε πελάτη</option>
          {getVisiblePaymentCustomers().map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name} — ΑΦΜ: {customer.afm || '-'}</option>
          ))}
        </select>

        <select value={newPayment.project_id} onChange={(e) => setNewPayment({ ...newPayment, project_id: e.target.value, customer_invoice_id: '' })}>
          <option value="">Διάλεξε έργο πελάτη</option>
          {getFilteredProjectsByCustomer(newPayment.customer_id).map((project) => (
            <option key={project.id} value={project.id}>{project.title}</option>
          ))}
        </select>

        <select
          value={newPayment.customer_invoice_id || ''}
          onChange={(e) => setNewPayment({ ...newPayment, customer_invoice_id: e.target.value })}
        >
          <option value="">Χωρίς τιμολόγιο / Προκαταβολή</option>
          {getAvailableCustomerInvoicesForPayment(newPayment.customer_id, newPayment.project_id, newPayment.customer_invoice_id).map((invoice) => (
            <option key={invoice.id} value={invoice.id}>
              {invoice.invoice_number || 'Χωρίς αριθμό'} — Υπόλοιπο {formatCurrency(getCustomerInvoiceBalance(invoice))} — {invoice.invoice_date || '-'}
            </option>
          ))}
        </select>

        {newPayment.customer_id && (
          <small>Άφησέ το «Χωρίς τιμολόγιο / Προκαταβολή» όταν η είσπραξη έγινε πριν κοπεί το τιμολόγιο. Όταν κοπεί το τιμολόγιο, μπορείς να επεξεργαστείς την πληρωμή και να τη συνδέσεις.</small>
        )}

        <input placeholder="Ποσό πληρωμής" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} />

        <input
          type="date"
          value={newPayment.payment_date}
          onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
        />

        <select value={newPayment.method} onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}>
          <option value="Μετρητά">Μετρητά</option>
          <option value="Τράπεζα">Τράπεζα</option>
          <option value="IRIS">IRIS</option>
          <option value="POS">POS</option>
          <option value="Επιταγή">Επιταγή</option>
        </select>
        <textarea placeholder="Σημειώσεις" value={newPayment.notes} onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })} />
        <button onClick={savePayment}>{editingPaymentId ? 'Αποθήκευση αλλαγών πληρωμής' : 'Αποθήκευση πληρωμής'}</button>
      </section>

      <section className="card page-section finance-section">
        <h2>{editingQuoteId ? 'Επεξεργασία Προσφοράς' : 'Νέα Προσφορά'}</h2>
        <select value={newQuote.project_id} onChange={(e) => setNewQuote({ ...newQuote, project_id: e.target.value })}>
          <option value="">Διάλεξε έργο</option>
          {projects.filter(isActiveItem).map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
        </select>
        <input placeholder="Είδος εργασίας" value={newQuote.work_type} onChange={(e) => setNewQuote({ ...newQuote, work_type: e.target.value })} />
        <textarea placeholder="Περιγραφή προσφοράς" value={newQuote.description} onChange={(e) => setNewQuote({ ...newQuote, description: e.target.value })} />
        <input placeholder="Καθαρή αξία" value={newQuote.subtotal} onChange={(e) => setNewQuote({ ...newQuote, subtotal: e.target.value })} />
        <select value={newQuote.job_type} onChange={(e) => setNewQuote({ ...newQuote, job_type: e.target.value })}>
          <option value="invoice">Τιμολόγιο με ΦΠΑ / Παρακράτηση</option>
          <option value="cash">Μετρητά χωρίς ΦΠΑ</option>
        </select>
        <select value={newQuote.status} onChange={(e) => setNewQuote({ ...newQuote, status: e.target.value })}>
          <option value="pending">Εκκρεμεί</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={saveQuote}>{editingQuoteId ? 'Αποθήκευση αλλαγών προσφοράς' : 'Αποθήκευση προσφοράς'}</button>
      </section>

      <section className="card page-section finance-section">
        <h2>Προσφορές</h2>
        {quotes.filter(isActiveItem).length === 0 ? <p>Δεν υπάρχουν προσφορές ακόμα.</p> : quotes.filter(isActiveItem).map((quote) => (
          <div key={quote.id} className="line" onClick={() => setSelectedQuote(quote)}>
            <p><b>{quote.description}</b></p>
            <p>Έργο: {getProjectTitle(quote.project_id)}</p>
            <p>Είδος εργασίας: {quote.work_type}</p>
            <p>Καθαρή αξία: {quote.subtotal}€</p>
            <p>ΦΠΑ: {quote.vat}€</p>
            <p>Παρακράτηση: {quote.withholding}€</p>
            <p><b>Πληρωτέο: {quote.payable}€</b></p>
            <small>{quote.quote_number} — {quote.job_type} — {quote.status}</small>
            <button onClick={(e) => { e.stopPropagation(); editQuote(quote); }}>✏️ Επεξεργασία</button>
            <button onClick={(e) => { e.stopPropagation(); deleteItem('quotes', quote.id); }}>🗑 Διαγραφή</button>
          </div>
        ))}
      </section>

      {selectedQuote && (
        <section className="card print-area page-section finance-section">
          <div className="pdf-header">
            <div className="logo pdf-logo">TD</div>
            <div>
              <h2>TD MANI</h2>
              <p><b>ΟΙΚΟΔΟΜΙΚΕΣ ΕΡΓΑΣΙΕΣ</b></p>
              <small>Πλάκες, Μήλος 84800 | 6944705508 | Manitaulant@yahoo.com</small>
            </div>
          </div>
          <hr />
          <h2>Προσφορά</h2>
          <p><b>Αριθμός:</b> {selectedQuote.quote_number}</p>
          <p><b>Έργο:</b> {getProjectTitle(selectedQuote.project_id)}</p>
          <p><b>Είδος εργασίας:</b> {selectedQuote.work_type}</p>
          <p><b>Περιγραφή:</b> {selectedQuote.description}</p>
          <hr />
          <p>Καθαρή αξία: {selectedQuote.subtotal}€</p>
          <p>ΦΠΑ 24%: {selectedQuote.vat}€</p>
          <p>Παρακράτηση 3%: {selectedQuote.withholding}€</p>
          <p><b>Πληρωτέο: {selectedQuote.payable}€</b></p>
          <hr />
          <p><b>Υπογραφή / Σφραγίδα</b></p>
          <p className="signature-line">T D MANI</p>
          <button onClick={() => window.print()}>Export / Print PDF</button>
          <button onClick={() => setSelectedQuote(null)}>Κλείσιμο preview</button>
        </section>
      )}

      {selectedCustomerReport && (
        <section className="card print-area page-section customers-section">
          <div className="pdf-header">
            <div className="logo pdf-logo">TD</div>
            <div>
              <h2>TD MANI</h2>
              <p><b>ΑΝΑΦΟΡΑ ΠΕΛΑΤΗ</b></p>
              <small>Πλάκες, Μήλος 84800 | 6944705508 | Manitaulant@yahoo.com</small>
            </div>
          </div>

          <hr />

          <h2>{selectedCustomerReport.name}</h2>
          <p><b>ΑΦΜ:</b> {selectedCustomerReport.afm || '-'}</p>
          <p><b>Τηλέφωνο:</b> {selectedCustomerReport.phone || '-'}</p>
          <p><b>Περιοχή:</b> {selectedCustomerReport.area || '-'}</p>
          <p><b>Σημειώσεις:</b> {selectedCustomerReport.notes || '-'}</p>

          <hr />

          <h3>Σύνολα πελάτη</h3>
          <p>Συμφωνημένα: {getCustomerTotals(selectedCustomerReport.id).agreed}€</p>
          <p>Πληρωμένα: {getCustomerTotals(selectedCustomerReport.id).paid}€</p>
          <p>Έξοδα: {getCustomerTotals(selectedCustomerReport.id).expenses}€</p>
          <p><b>Εκτιμώμενο κέρδος: {getCustomerTotals(selectedCustomerReport.id).balance}€</b></p>

          <hr />

          <h3>Έργα πελάτη</h3>
          {getCustomerReportRows(selectedCustomerReport.id).length === 0 ? (
            <p>Δεν υπάρχουν έργα για αυτόν τον πελάτη.</p>
          ) : (
            getCustomerReportRows(selectedCustomerReport.id).map((row) => (
              <div key={row.project.id} className="report-block">
                <h3>{row.project.title}</h3>
                <p><b>Περιοχή:</b> {row.project.area || '-'}</p>
                <p><b>Διεύθυνση:</b> {row.project.address || '-'}</p>
                <p><b>Status:</b> {row.project.status}</p>
                <p>Συμφωνία: {row.agreed}€</p>
                <p>Πληρωμές: {row.paid}€</p>
                <p>Έξοδα: {row.expenses}€</p>
                <p><b>Εκτιμώμενο κέρδος έργου: {row.balance}€</b></p>

                <h4>Τιμολόγια Εσόδων</h4>
                {row.projectCustomerInvoices.length === 0 ? (
                  <p>Δεν υπάρχουν τιμολόγια εσόδων.</p>
                ) : (
                  row.projectCustomerInvoices.map((invoice) => (
                    <p key={invoice.id}>• {invoice.invoice_date || '-'} — {invoice.invoice_number || '-'} — {invoice.receivable_amount}€ — {getCustomerInvoiceStatus(invoice)}</p>
                  ))
                )}

                <h4>Πληρωμές</h4>
                {row.payments.filter(isActivePayment).length === 0 ? (
                  <p>Δεν υπάρχουν πληρωμές.</p>
                ) : (
                  row.payments.filter(isActivePayment).map((payment) => (
                    <p key={payment.id}>• {payment.payment_date || '-'} — {payment.amount}€ — {payment.method} {payment.notes ? `(${payment.notes})` : ''}</p>
                  ))
                )}

                <h4>Έξοδα</h4>
                {row.projectExpensesList.length === 0 ? (
                  <p>Δεν υπάρχουν έξοδα.</p>
                ) : (
                  row.projectExpensesList.map((expense) => (
                    <p key={expense.id}>• {expense.title} — {expense.amount}€ — {expense.category}</p>
                  ))
                )}

                <h4>Προσφορές</h4>
                {row.projectQuotes.length === 0 ? (
                  <p>Δεν υπάρχουν προσφορές.</p>
                ) : (
                  row.projectQuotes.map((quote) => (
                    <p key={quote.id}>• {quote.quote_number} — {quote.work_type} — {quote.payable}€ — {quote.status}</p>
                  ))
                )}

                <h4>Tasks</h4>
                {row.projectTasks.length === 0 ? (
                  <p>Δεν υπάρχουν tasks.</p>
                ) : (
                  row.projectTasks.map((task) => (
                    <p key={task.id}>• {task.task_date} {task.task_time || ''} — {task.title} — {task.status}</p>
                  ))
                )}

                <h4>Αρχεία / Παραστατικά</h4>
                {row.projectDocuments.length === 0 ? (
                  <p>Δεν υπάρχουν αρχεία.</p>
                ) : (
                  row.projectDocuments.map((document) => (
                    <p key={document.id}>• {document.document_type} — {document.title}</p>
                  ))
                )}

                <hr />
              </div>
            ))
          )}

          <p><b>Υπογραφή / Σφραγίδα</b></p>
          <p className="signature-line">T D MANI</p>

          <button onClick={() => window.print()}>Export / Print PDF</button>
          <button onClick={() => setSelectedCustomerReport(null)}>Κλείσιμο αναφοράς</button>
        </section>
      )}

      <section className="card page-section finance-section">
        <h2>{editingExpenseId ? 'Επεξεργασία Εξόδου' : 'Νέο Έξοδο'}</h2>
        <select
          value={newExpense.customer_id}
          onChange={(e) => setNewExpense({ ...newExpense, customer_id: e.target.value, project_id: '' })}
        >
          <option value="">Διάλεξε πελάτη</option>
          {customers.filter(isActiveItem).map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>

        <select value={newExpense.project_id} onChange={(e) => setNewExpense({ ...newExpense, project_id: e.target.value })}>
          <option value="">Διάλεξε έργο πελάτη</option>
          {getFilteredProjectsByCustomer(newExpense.customer_id).map((project) => (
            <option key={project.id} value={project.id}>{project.title}</option>
          ))}
        </select>

        <input placeholder="Τίτλος εξόδου" value={newExpense.title} onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })} />
        <input placeholder="Ποσό εξόδου" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
        <select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}>
          <option value="Υλικά">Υλικά</option>
          <option value="Συνεργείο">Συνεργείο</option>
          <option value="Μεταφορικά">Μεταφορικά</option>
          <option value="Άλλο">Άλλο</option>
        </select>
        <textarea placeholder="Σημειώσεις" value={newExpense.notes} onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })} />
        <button onClick={saveExpense}>{editingExpenseId ? 'Αποθήκευση αλλαγών εξόδου' : 'Αποθήκευση εξόδου'}</button>
      </section>


      <section className="card page-section suppliers-section">
        <button onClick={() => setActivePage('income-expenses')}>← Πίσω στα Έσοδα / Έξοδα</button>
        <h2>{editingSupplierId ? 'Επεξεργασία Προμηθευτή' : 'Νέος Προμηθευτής'}</h2>

        <input placeholder="Ονοματεπώνυμο / Επωνυμία" value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
        <input placeholder="ΑΦΜ" value={newSupplier.afm} onChange={(e) => setNewSupplier({ ...newSupplier, afm: e.target.value })} />
        <input placeholder="Τηλέφωνο" value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
        <input placeholder="Email" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} />
        <input placeholder="Διεύθυνση" value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} />
        <textarea placeholder="Σημειώσεις" value={newSupplier.notes} onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })} />

        <button onClick={saveSupplier}>{editingSupplierId ? 'Αποθήκευση αλλαγών προμηθευτή' : 'Αποθήκευση προμηθευτή'}</button>
      </section>

      <section className="card page-section suppliers-section">
        <h2>{editingSupplierInvoiceId ? 'Επεξεργασία Τιμολογίου Προμηθευτή' : 'Νέο Τιμολόγιο Προμηθευτή'}</h2>

        <select value={newSupplierInvoice.supplier_id} onChange={(e) => setNewSupplierInvoice({ ...newSupplierInvoice, supplier_id: e.target.value })}>
          <option value="">Διάλεξε προμηθευτή</option>
          {suppliers.filter(isActiveItem).map((supplier) => (
            <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
          ))}
        </select>

        <select value={newSupplierInvoice.project_id} onChange={(e) => setNewSupplierInvoice({ ...newSupplierInvoice, project_id: e.target.value })}>
          <option value="">Χωρίς έργο / Γενικό έξοδο</option>
          {projects.filter(isActiveItem).map((project) => (
            <option key={project.id} value={project.id}>{project.title}</option>
          ))}
        </select>

        <select value={newSupplierInvoice.expense_category} onChange={(e) => setNewSupplierInvoice({ ...newSupplierInvoice, expense_category: e.target.value })}>
          <option value="">Χωρίς κατηγορία εξόδου</option>
          <option value="Υλικά">Υλικά</option>
          <option value="Εργατικά">Εργατικά</option>
          <option value="Μεταφορικά">Μεταφορικά</option>
          <option value="Εξοπλισμός">Εξοπλισμός</option>
          <option value="Καύσιμα">Καύσιμα</option>
          <option value="Ενοίκιο">Ενοίκιο</option>
          <option value="ΔΕΗ / Νερό / Internet">ΔΕΗ / Νερό / Internet</option>
          <option value="Γενικά έξοδα">Γενικά έξοδα</option>
        </select>

        <input type="date" value={newSupplierInvoice.invoice_date} onChange={(e) => setNewSupplierInvoice({ ...newSupplierInvoice, invoice_date: e.target.value })} />
        <input placeholder="Αριθμός τιμολογίου" value={newSupplierInvoice.invoice_number} onChange={(e) => setNewSupplierInvoice({ ...newSupplierInvoice, invoice_number: e.target.value })} />
        <textarea placeholder="Περιγραφή" value={newSupplierInvoice.description} onChange={(e) => setNewSupplierInvoice({ ...newSupplierInvoice, description: e.target.value })} />
        <input placeholder="Καθαρή αξία" value={newSupplierInvoice.net_amount} onChange={(e) => setNewSupplierInvoice({ ...newSupplierInvoice, net_amount: e.target.value })} />

        <div className="line">
          <p>ΦΠΑ 24%: <b>{calculateSupplierInvoiceValues(newSupplierInvoice).vat}€</b></p>
          <p>Σύνολο: <b>{calculateSupplierInvoiceValues(newSupplierInvoice).total}€</b></p>
          <small>Το τιμολόγιο θα περαστεί αυτόματα και στα έξοδα του έργου.</small>
        </div>

        <label className="inventory-toggle-line">
          <input
            type="checkbox"
            checked={supplierInvoiceHasMaterials}
            onChange={(e) => {
              setSupplierInvoiceHasMaterials(e.target.checked);
              if (e.target.checked && supplierInvoiceMaterialLines.length === 0) {
                setSupplierInvoiceMaterialLines([{ item_id: '', quantity: '', unit_price: '', destination: 'warehouse', notes: '' }]);
              }
            }}
          />
          <span><b>Περιέχει υλικά αποθήκης</b><br /><small>Περνάς μόνο τις γραμμές που θέλεις να επηρεάσουν την αποθήκη ή το έργο.</small></span>
        </label>

        {supplierInvoiceHasMaterials && (
          <div className="line">
            <h3>Γραμμές υλικών</h3>
            <div className="inventory-lines">
              {supplierInvoiceMaterialLines.map((line, index) => (
                <div key={index} className="inventory-material-row">
                  <select value={line.item_id} onChange={(e) => updateSupplierInvoiceMaterialLine(index, 'item_id', e.target.value)}>
                    <option value="">Διάλεξε υλικό</option>
                    {inventory.filter(isActiveItem).map((item) => (
                      <option key={item.id} value={item.id}>{item.item_name}</option>
                    ))}
                  </select>
                  <input placeholder="Ποσότητα" value={line.quantity} onChange={(e) => updateSupplierInvoiceMaterialLine(index, 'quantity', e.target.value)} />
                  <input placeholder="Τιμή μον." value={line.unit_price} onChange={(e) => updateSupplierInvoiceMaterialLine(index, 'unit_price', e.target.value)} />
                  <p><small>Μονάδα</small><br /><b>{line.item_id ? getInventoryItemUnit(line.item_id) : '-'}</b></p>
                  <select value={line.destination} onChange={(e) => updateSupplierInvoiceMaterialLine(index, 'destination', e.target.value)}>
                    <option value="warehouse">Ενημέρωση αποθήκης</option>
                    <option value="project">Απευθείας στο έργο</option>
                  </select>
                  <button onClick={() => removeSupplierInvoiceMaterialLine(index)}>×</button>
                </div>
              ))}
            </div>
            <button onClick={addSupplierInvoiceMaterialLine}>+ Προσθήκη γραμμής υλικού</button>
            <small>Οι γραμμές “Ενημέρωση αποθήκης” αυξάνουν το υπόλοιπο. Οι γραμμές “Απευθείας στο έργο” χρεώνονται στο έργο χωρίς να μπουν στην αποθήκη.</small>
          </div>
        )}

        <textarea placeholder="Σημειώσεις" value={newSupplierInvoice.notes} onChange={(e) => setNewSupplierInvoice({ ...newSupplierInvoice, notes: e.target.value })} />

        <button onClick={saveSupplierInvoice}>{editingSupplierInvoiceId ? 'Αποθήκευση αλλαγών τιμολογίου' : 'Αποθήκευση τιμολογίου'}</button>
      </section>

      <section className="card page-section suppliers-section">
        <h2>{editingSupplierPaymentId ? 'Επεξεργασία Πληρωμής Προμηθευτή' : 'Νέα Πληρωμή Προμηθευτή'}</h2>

        <select
          value={newSupplierPayment.supplier_id}
          onChange={(e) => setNewSupplierPayment({ ...newSupplierPayment, supplier_id: e.target.value, supplier_invoice_id: '' })}
        >
          <option value="">Διάλεξε προμηθευτή</option>
          {suppliers.filter(isActiveItem).map((supplier) => (
            <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
          ))}
        </select>

        <select
          value={newSupplierPayment.supplier_invoice_id || ''}
          onChange={(e) => setNewSupplierPayment({ ...newSupplierPayment, supplier_invoice_id: e.target.value })}
        >
          <option value="">Σύνδεση με τιμολόγιο (προαιρετικό)</option>
          {getSupplierInvoices(newSupplierPayment.supplier_id).map((invoice) => (
            <option key={invoice.id} value={invoice.id}>
              {invoice.invoice_number || 'Χωρίς αριθμό'} — {invoice.total_amount}€ — {invoice.invoice_date || '-'}
            </option>
          ))}
        </select>

        <input type="date" value={newSupplierPayment.payment_date} onChange={(e) => setNewSupplierPayment({ ...newSupplierPayment, payment_date: e.target.value })} />
        <input placeholder="Ποσό πληρωμής" value={newSupplierPayment.amount} onChange={(e) => setNewSupplierPayment({ ...newSupplierPayment, amount: e.target.value })} />
        <select value={newSupplierPayment.method} onChange={(e) => setNewSupplierPayment({ ...newSupplierPayment, method: e.target.value })}>
          <option value="Τράπεζα">Τράπεζα</option>
          <option value="Μετρητά">Μετρητά</option>
          <option value="IRIS">IRIS</option>
          <option value="POS">POS</option>
          <option value="Επιταγή">Επιταγή</option>
        </select>
        <textarea placeholder="Σημειώσεις" value={newSupplierPayment.notes} onChange={(e) => setNewSupplierPayment({ ...newSupplierPayment, notes: e.target.value })} />

        <button onClick={saveSupplierPayment}>{editingSupplierPaymentId ? 'Αποθήκευση αλλαγών πληρωμής' : 'Αποθήκευση πληρωμής'}</button>
      </section>

      <section className="card page-section suppliers-section">
        <h2>Προμηθευτές</h2>

        <input
          placeholder="Αναζήτηση με ΑΦΜ / όνομα / αριθμό τιμολογίου..."
          value={supplierSearch}
          onChange={(e) => setSupplierSearch(e.target.value)}
        />

        {suppliers.filter(isActiveItem).length === 0 ? (
          <p>Δεν υπάρχουν προμηθευτές ακόμα.</p>
        ) : getVisibleSuppliers().filter(isActiveItem).length === 0 ? (
          <p>Δεν βρέθηκαν προμηθευτές ή τιμολόγια με αυτή την αναζήτηση.</p>
        ) : (
          getVisibleSuppliers().filter(isActiveItem).map((supplier) => {
            const totals = getSupplierTotals(supplier.id);
            const analytics = getSupplierAnalytics(supplier.id);
            const isOpen = openSupplierId === supplier.id;

            return (
              <div key={supplier.id} className={totals.balance > 0 ? 'line alert' : 'line'}>
                <div onClick={() => setOpenSupplierId(isOpen ? null : supplier.id)}>
                  <p><b>{isOpen ? '▼' : '▶'} {supplier.name}</b></p>
                  <p>ΑΦΜ: {supplier.afm || '-'}</p>
                  <p>Τηλέφωνο: {supplier.phone || '-'}</p>
                  <p>Email: {supplier.email || '-'}</p>
                  <p>Συνολικές αγορές: {analytics.totalInvoices}€</p>
                  <p>Πληρωμένα: {analytics.totalPaid}€</p>
                  <p><b>Υπόλοιπο: {analytics.balance}€</b></p>
                  <p>Αριθμός τιμολογίων: {analytics.invoiceCount}</p>
                  <p>Μέση αξία τιμολογίου: {analytics.averageInvoice.toFixed(2)}€</p>
                  <p>Τελευταία αγορά: {analytics.lastPurchaseDate}</p>
                  <small>{supplier.notes}</small>
                </div>

                <button onClick={() => setSelectedSupplierReport(supplier)}>📄 Export PDF Αναφορά</button>
                <button onClick={() => editSupplier(supplier)}>✏️ Επεξεργασία προμηθευτή</button>
                <button onClick={() => deleteItem('suppliers', supplier.id)}>🗑 Διαγραφή προμηθευτή</button>

                {isOpen && (
                  <div>
                    <h3>Τιμολόγια Προμηθευτή</h3>
                    {getSupplierInvoices(supplier.id).length === 0 ? (
                      <p>Δεν υπάρχουν τιμολόγια.</p>
                    ) : (
                      getSupplierInvoices(supplier.id).map((invoice) => (
                        <div key={invoice.id} className="line">
                          <p><b>{invoice.invoice_number || 'Χωρίς αριθμό'} — {invoice.total_amount}€</b></p>
                          <p>Ημερομηνία: {invoice.invoice_date || '-'}</p>
                          <p>Έργο: {invoice.project_id ? getProjectTitle(invoice.project_id) : 'Χωρίς έργο / Γενικό έξοδο'}</p>
                          <p>Κατηγορία εξόδου: {invoice.expense_category || '-'}</p>
                          <p>Περιγραφή: {invoice.description || '-'}</p>
                          <p>Καθαρή αξία: {invoice.net_amount || 0}€ | ΦΠΑ 24%: {invoice.vat_amount || 0}€</p>
                          <p>Πληρωμένα στο τιμολόγιο: {getSupplierInvoicePaid(invoice.id)}€</p>
                          <p>Status: <b>{getSupplierInvoiceStatus(invoice)}</b></p>
                          <small>{invoice.notes}</small>
                          <button onClick={() => editSupplierInvoice(invoice)}>✏️ Επεξεργασία τιμολογίου</button>
                          <button onClick={() => deleteItem('supplier_invoices', invoice.id)}>🗑 Διαγραφή τιμολογίου</button>
                        </div>
                      ))
                    )}

                    <h3>Πληρωμές Προμηθευτή</h3>
                    {getSupplierPayments(supplier.id).length === 0 ? (
                      <p>Δεν υπάρχουν πληρωμές.</p>
                    ) : (
                      getSupplierPayments(supplier.id).map((payment) => (
                        <div key={payment.id} className="line">
                          <p><b>{payment.amount}€</b> — {payment.method}</p>
                          <p>Ημερομηνία: {payment.payment_date || '-'}</p>
                          <p>Τιμολόγιο: {payment.supplier_invoice_id ? (supplierInvoices.find((invoice) => invoice.id === payment.supplier_invoice_id)?.invoice_number || 'Συνδεδεμένο') : 'Γενική πληρωμή'}</p>
                          <small>{payment.notes}</small>
                          <button onClick={() => editSupplierPayment(payment)}>✏️ Επεξεργασία πληρωμής</button>
                          <button onClick={() => deleteItem('supplier_payments', payment.id)}>🗑 Διαγραφή πληρωμής</button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>


      <section className="card page-section inventory-section">
        <button onClick={() => setActivePage('income-expenses')}>← Πίσω στα Έσοδα / Έξοδα</button>
        <h2>{editingInventoryId ? 'Επεξεργασία Υλικού' : 'Νέο Υλικό'}</h2>
        <input placeholder="Υλικό" value={newInventory.item_name} onChange={(e) => setNewInventory({ ...newInventory, item_name: e.target.value })} />
        <input placeholder="Κατηγορία π.χ. Τσιμέντα, Σίδερα, Πλακάκια" value={newInventory.category || ''} onChange={(e) => setNewInventory({ ...newInventory, category: e.target.value })} />
        <input placeholder="Μονάδα μέτρησης π.χ. σακιά, kg, τεμ." value={newInventory.unit || ''} onChange={(e) => setNewInventory({ ...newInventory, unit: e.target.value })} />
        <input placeholder="Ελάχιστο απόθεμα" value={newInventory.min_quantity} onChange={(e) => setNewInventory({ ...newInventory, min_quantity: e.target.value })} />
        <input placeholder="Ενδεικτική τιμή αγοράς" value={newInventory.purchase_price} onChange={(e) => setNewInventory({ ...newInventory, purchase_price: e.target.value })} />
        <textarea placeholder="Σημειώσεις" value={newInventory.notes || ''} onChange={(e) => setNewInventory({ ...newInventory, notes: e.target.value })} />
        <small>Η ποσότητα δεν αλλάζει χειροκίνητα. Υπολογίζεται αυτόματα από τις κινήσεις αποθήκης.</small>
        <button onClick={saveInventory}>{editingInventoryId ? 'Αποθήκευση αλλαγών υλικού' : 'Αποθήκευση υλικού'}</button>
      </section>



      <section className="card page-section documents-section settings-document-section">
        <h2>Αρχεία / Παραστατικά</h2>
        {documents.filter(isActiveItem).length === 0 ? (
          <p>Δεν υπάρχουν αρχεία ακόμα.</p>
        ) : (
          documents.filter(isActiveItem).map((document) => (
            <div key={document.id} className="line">
              <p><b>{document.title}</b></p>
              <p>Έργο: {getProjectTitle(document.project_id)}</p>
              <p>Τύπος: {document.document_type}</p>
              {document.file_url && (
                <p><a href={document.file_url} target="_blank">Άνοιγμα αρχείου</a></p>
              )}
              <small>{document.notes}</small>
              <button onClick={() => editDocument(document)}>✏️ Επεξεργασία</button>
              <button onClick={() => deleteItem('documents', document.id)}>🗑 Διαγραφή αρχείου</button>
            </div>
          ))
        )}
      </section>

      <section className="card page-section inventory-section">
        <h2>Αποθήκη</h2>
        {inventory.filter(isActiveItem).length === 0 ? <p>Δεν υπάρχουν υλικά ακόμα.</p> : inventory.filter(isActiveItem).map((item) => {
          const stock = getInventoryItemStock(item.id);
          const purchases = getInventoryPurchases(item.id);
          const uses = getInventoryUses(item.id);
          const unit = getInventoryItemUnit(item.id);
          const lowStock = stock <= Number(item.min_quantity || 0);
          const itemMovements = getInventoryItemMovements(item.id);

          return (
            <div key={item.id} className={lowStock ? 'line alert' : 'line'}>
              <p><b>{item.item_name}</b></p>
              <p>Υπόλοιπο: <b>{stock} {unit}</b></p>
              <p>Αγορές: {purchases} {unit} — Χρήσεις σε έργα: {uses} {unit}</p>
              <p>Ελάχιστο: {item.min_quantity || 0} {unit}</p>
              <p>Τιμή αγοράς: {item.purchase_price || 0}€</p>
              {lowStock && <p><b>⚠️ Χαμηλό απόθεμα</b></p>}

              {itemMovements.length > 0 && (
                <div className="inventory-movements">
                  <h4>Κινήσεις</h4>
                  {itemMovements.slice(0, 6).map((movement) => (
                    <div key={movement.id} className="inventory-movement">
                      <span>{formatDate(movement.movement_date)} — {movement.movement_type === 'USE' ? 'Χρήση σε έργο' : movement.movement_type === 'PURCHASE' ? 'Αγορά' : movement.movement_type}</span>
                      <b>{movement.movement_type === 'USE' ? '-' : '+'}{movement.quantity} {unit}</b>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => editInventory(item)}>✏️ Επεξεργασία</button>
              <button onClick={() => deleteItem('inventory', item.id)}>🗑 Διαγραφή υλικού</button>
            </div>
          );
        })}
      </section>

      <section className="card page-section finance-section">
        <h2 onClick={() => setShowPayments(!showPayments)}>
          💰 Πληρωμές {showPayments ? '▲' : '▼'}
        </h2>

        {showPayments && (
          <>
            {payments.filter(isActivePayment).length === 0 ? (
              <p>Δεν υπάρχουν πληρωμές ακόμα.</p>
            ) : (
              payments.filter(isActivePayment).map((payment) => (
                <div key={payment.id} className="line">
                  <p><b>{payment.amount}€</b> — {payment.method}</p>
                  <p>Έργο: {getProjectTitle(payment.project_id)}</p>
                  <p>Τιμολόγιο: {payment.customer_invoice_id ? (customerInvoices.find((invoice) => invoice.id === payment.customer_invoice_id)?.invoice_number || 'Συνδεδεμένο') : 'Χωρίς σύνδεση'}</p>
                  <p>Ημερομηνία: {payment.payment_date || '-'}</p>
                  <small>{payment.notes}</small>
                  <button onClick={() => editPayment(payment)}>✏️ Επεξεργασία</button>
                  <button onClick={() => deleteItem('payments', payment.id)}>🗑 Διαγραφή πληρωμής</button>
                </div>
              ))
            )}
          </>
        )}
      </section>

      <section className="card page-section trash-section settings-trash-section">
        {activePage === 'settings' && <button onClick={() => setActiveSettingsTab('')}>← Πίσω στις Ρυθμίσεις</button>}
        <h2>🗑 Κάδος</h2>
        <p>Εδώ εμφανίζονται όσα έχουν διαγραφεί προσωρινά. Μπορείς να τα επαναφέρεις ή να τα διαγράψεις οριστικά.</p>

        <h3>Πελάτες</h3>
        {customers.filter(isDeletedItem).length === 0 ? (
          <p>Δεν υπάρχουν διαγραμμένοι πελάτες.</p>
        ) : (
          customers.filter(isDeletedItem).map((customer) => (
            <div key={customer.id} className="line">
              <p><b>{customer.name}</b></p>
              <p>ΑΦΜ/Τηλ: {customer.phone || '-'}</p>
              <button onClick={() => restoreItem('customers', customer.id)}>↩️ Επαναφορά</button>
              <button onClick={() => permanentDeleteItem('customers', customer.id)}>❌ Οριστική διαγραφή</button>
            </div>
          ))
        )}

        <h3>Έργα</h3>
        {projects.filter(isDeletedItem).length === 0 ? (
          <p>Δεν υπάρχουν διαγραμμένα έργα.</p>
        ) : (
          projects.filter(isDeletedItem).map((project) => (
            <div key={project.id} className="line">
              <p><b>{project.title}</b></p>
              <p>Πελάτης: {getCustomerName(project.customer_id)}</p>
              <button onClick={() => restoreItem('projects', project.id)}>↩️ Επαναφορά</button>
              <button onClick={() => permanentDeleteItem('projects', project.id)}>❌ Οριστική διαγραφή</button>
            </div>
          ))
        )}

        <h3>Τιμολόγια Εσόδων</h3>
        {customerInvoices.filter(isDeletedItem).length === 0 ? (
          <p>Δεν υπάρχουν διαγραμμένα τιμολόγια εσόδων.</p>
        ) : (
          customerInvoices.filter(isDeletedItem).map((invoice) => (
            <div key={invoice.id} className="line">
              <p><b>{invoice.invoice_number || 'Χωρίς αριθμό'} — {invoice.receivable_amount}€</b></p>
              <p>Πελάτης: {getCustomerName(invoice.customer_id)} — ΑΦΜ: {getCustomerAfm(invoice.customer_id)}</p>
              <button onClick={() => restoreItem('customer_invoices', invoice.id)}>↩️ Επαναφορά</button>
              <button onClick={() => permanentDeleteItem('customer_invoices', invoice.id)}>❌ Οριστική διαγραφή</button>
            </div>
          ))
        )}

        <h3>Προμηθευτές</h3>
        {suppliers.filter(isDeletedItem).length === 0 ? (
          <p>Δεν υπάρχουν διαγραμμένοι προμηθευτές.</p>
        ) : (
          suppliers.filter(isDeletedItem).map((supplier) => (
            <div key={supplier.id} className="line">
              <p><b>{supplier.name}</b></p>
              <p>ΑΦΜ: {supplier.afm || '-'}</p>
              <button onClick={() => restoreItem('suppliers', supplier.id)}>↩️ Επαναφορά</button>
              <button onClick={() => permanentDeleteItem('suppliers', supplier.id)}>❌ Οριστική διαγραφή</button>
            </div>
          ))
        )}

        <h3>Τιμολόγια Προμηθευτών</h3>
        {supplierInvoices.filter(isDeletedItem).length === 0 ? (
          <p>Δεν υπάρχουν διαγραμμένα τιμολόγια προμηθευτών.</p>
        ) : (
          supplierInvoices.filter(isDeletedItem).map((invoice) => (
            <div key={invoice.id} className="line">
              <p><b>{getSupplierName(invoice.supplier_id)} — {invoice.total_amount}€</b></p>
              <p>Τιμολόγιο: {invoice.invoice_number || '-'}</p>
              <p>Έργο: {getProjectTitle(invoice.project_id)}</p>
              <button onClick={() => restoreItem('supplier_invoices', invoice.id)}>↩️ Επαναφορά</button>
              <button onClick={() => permanentDeleteItem('supplier_invoices', invoice.id)}>❌ Οριστική διαγραφή</button>
            </div>
          ))
        )}

        <h3>Πληρωμές / Έξοδα / Αρχεία</h3>
        {[...payments.filter(isDeletedItem), ...expenses.filter(isDeletedItem), ...documents.filter(isDeletedItem), ...supplierPayments.filter(isDeletedItem)].length === 0 ? (
          <p>Δεν υπάρχουν άλλες διαγραμμένες εγγραφές.</p>
        ) : (
          <>
            {payments.filter(isDeletedItem).map((payment) => (
              <div key={payment.id} className="line">
                <p><b>Πληρωμή πελάτη: {payment.amount}€</b></p>
                <p>Έργο: {getProjectTitle(payment.project_id)}</p>
                <button onClick={() => restoreItem('payments', payment.id)}>↩️ Επαναφορά</button>
                <button onClick={() => permanentDeleteItem('payments', payment.id)}>❌ Οριστική διαγραφή</button>
              </div>
            ))}

            {expenses.filter(isDeletedItem).map((expense) => (
              <div key={expense.id} className="line">
                <p><b>Έξοδο: {expense.title}</b></p>
                <p>{expense.amount}€ — {expense.category}</p>
                <button onClick={() => restoreItem('expenses', expense.id)}>↩️ Επαναφορά</button>
                <button onClick={() => permanentDeleteItem('expenses', expense.id)}>❌ Οριστική διαγραφή</button>
              </div>
            ))}

            {supplierPayments.filter(isDeletedItem).map((payment) => (
              <div key={payment.id} className="line">
                <p><b>Πληρωμή προμηθευτή: {payment.amount}€</b></p>
                <p>Προμηθευτής: {getSupplierName(payment.supplier_id)}</p>
                <button onClick={() => restoreItem('supplier_payments', payment.id)}>↩️ Επαναφορά</button>
                <button onClick={() => permanentDeleteItem('supplier_payments', payment.id)}>❌ Οριστική διαγραφή</button>
              </div>
            ))}

            {documents.filter(isDeletedItem).map((document) => (
              <div key={document.id} className="line">
                <p><b>Αρχείο: {document.title}</b></p>
                <p>Έργο: {getProjectTitle(document.project_id)}</p>
                <button onClick={() => restoreItem('documents', document.id)}>↩️ Επαναφορά</button>
                <button onClick={() => permanentDeleteItem('documents', document.id)}>❌ Οριστική διαγραφή</button>
              </div>
            ))}
          </>
        )}
      </section>


      {currentUser && !selectedProject && (
        <>
          {quickCreateOpen && (
            <>
              <div className="quick-create-backdrop no-print" onClick={() => setQuickCreateOpen(false)} />
              <aside className="quick-create-panel no-print">
                <h2>➕ Νέα Καταχώριση</h2>
                <p>Διάλεξε τι θέλεις να καταχωρήσεις.</p>

                <button
                  className="quick-create-option"
                  onClick={() => goToQuickCreate('customers', () => {
                    setNewCustomer(INITIAL_CUSTOMER);
                    setEditingCustomerId(null);
                  })}
                >
                  👤 Νέος Πελάτης<br />
                  <small>Άνοιγμα φόρμας πελάτη</small>
                </button>

                <button
                  className="quick-create-option"
                  onClick={() => goToQuickCreate('customers', () => {
                    setNewProject(INITIAL_PROJECT);
                    setEditingProjectId(null);
                  })}
                >
                  🏗️ Νέο Έργο<br />
                  <small>Άνοιγμα φόρμας έργου</small>
                </button>

                <button
                  className="quick-create-option"
                  onClick={() => goToQuickCreate('customer-invoices', () => {
                    setNewCustomerInvoice(INITIAL_CUSTOMER_INVOICE);
                    setEditingCustomerInvoiceId(null);
                  })}
                >
                  🧾 Νέο Τιμολόγιο Πελάτη<br />
                  <small>Έσοδο, ΦΠΑ, παρακράτηση και εισπρακτέο</small>
                </button>

                <button
                  className="quick-create-option"
                  onClick={() => goToQuickCreate('finance', () => {
                    setNewPayment(INITIAL_PAYMENT);
                    setEditingPaymentId(null);
                    setShowPayments(true);
                  })}
                >
                  💰 Νέα Είσπραξη<br />
                  <small>Καταχώριση πληρωμής πελάτη</small>
                </button>

                <button
                  className="quick-create-option"
                  onClick={() => goToQuickCreate('suppliers', () => {
                    setNewSupplierInvoice(INITIAL_SUPPLIER_INVOICE);
                    setEditingSupplierInvoiceId(null);
                    setOpenSupplierId(null);
                  })}
                >
                  🚚 Νέο Τιμολόγιο Προμηθευτή<br />
                  <small>Έξοδο έργου, ΦΠΑ εισροών και υπόλοιπο προμηθευτή</small>
                </button>

                <button
                  className="quick-create-option"
                  onClick={() => goToQuickCreate('suppliers', () => {
                    setNewSupplierPayment(INITIAL_SUPPLIER_PAYMENT);
                    setEditingSupplierPaymentId(null);
                    setOpenSupplierId(null);
                  })}
                >
                  💳 Νέα Πληρωμή Προμηθευτή<br />
                  <small>Καταχώριση πληρωμής προς προμηθευτή</small>
                </button>

                <hr />
                <small>Πάτα ξανά το + για κλείσιμο.</small>
              </aside>
            </>
          )}

          <button
            className={quickCreateOpen ? 'quick-create-fab open no-print' : 'quick-create-fab no-print'}
            onClick={() => setQuickCreateOpen(!quickCreateOpen)}
            aria-label="Νέα καταχώριση"
          >
            +
          </button>
        </>
      )}

    </main>
  );
}
