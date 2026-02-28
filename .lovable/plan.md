

# AutoTab – Zero-Manual-Input Student Budgeting App

## Overview
A hackathon-ready budgeting app for UK university students that minimizes manual entry through receipt scanning (AI-powered with Cloud, manual fallback without), e-receipt text parsing, and automatic subscription detection. Data stored in localStorage for simplicity.

---

## 1. Dashboard (Home Page)
The main hub showing financial overview at a glance, styled in a clean fintech aesthetic (Monzo/Revolut-inspired).

- **Top section**: Large monthly spend total + remaining budget display with a progress bar
- **Middle section**: Category breakdown as a pie/bar chart (using Recharts) with weekly/monthly toggle
- **Bottom section**: Scrollable transaction list, sortable by date or category
- **Dark/light mode toggle** in the header

## 2. Receipt Scanner
A dedicated page/modal to upload receipt images or PDFs.

- Upload area with drag-and-drop support
- **With Lovable Cloud**: AI extracts merchant, date, amount, and currency via an edge function calling Lovable AI (Gemini) with the receipt image
- **Without Cloud (fallback)**: Pre-filled form where user enters merchant, date, amount manually after uploading
- Auto-categorization into the 9 student categories (Tuition, Rent, Utilities, Transport, Social/Nights Out, Food & Groceries, Subscriptions, Shopping, Other)
- Extracted data shown for user confirmation before adding to transactions

## 3. E-Receipt Parser
A simple paste-text area for email receipts.

- User pastes email receipt text
- **With Cloud**: AI extracts merchant, date, amount from the text
- **Without Cloud**: Basic regex parsing attempts extraction, with manual edit fallback
- Auto-categorized and added to transaction list after confirmation

## 4. Budget Setup
Simple settings page for student financial info.

- Input monthly income and monthly budget
- Pre-configured UK student spending categories
- Smart alerts: "You've spent 40% of your social budget in week 1" displayed as toast notifications on the dashboard

## 5. Subscription Detection
Automatic detection logic running on the transaction list.

- Scans for same merchant appearing 2+ times with similar amounts at roughly monthly intervals
- Dedicated subscriptions section on the dashboard showing:
  - Active subscriptions list with merchant, amount, and next expected date
  - Monthly subscription total and yearly projection
  - "Cancel Reminder" toggle per subscription

## 6. Add Online Purchase (Manual Entry)
Since we're skipping the Chrome extension, a quick-add form accessible from the dashboard.

- Simple form: merchant name, amount, date, category
- One-tap entry for common merchants

## 7. Design & UX
- Clean, minimal fintech design with generous whitespace
- Dark and light mode with system preference detection
- Mobile-responsive layout
- Color-coded categories throughout
- GBP as default currency

## Tech Approach
- **Frontend**: React + TypeScript + Tailwind + shadcn/ui + Recharts for charts
- **Storage**: localStorage for all transaction and budget data
- **AI (optional)**: Lovable Cloud + edge function for receipt/e-receipt parsing when available
- **No database required** – everything runs client-side for the hackathon demo

