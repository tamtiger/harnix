# Enterprise domain briefs

Reference catalog of domain architecture baselines, regulatory landscapes, typical core modules, and integration benchmarks across 10 industries (this page: pharma, e-commerce, banking, insurance, logistics; the rest: `domain-briefs-operations`).

## 1. Pharma (B2B Distribution & B2C Retail)
- **Actors**: B2B Buyer (Institution), B2B Vendor/Distributor, B2C Patient, Licensed Pharmacist, Platform Admin.
- **Channels**: ToB Buyer Web/App, ToC Consumer App/Mini-Program, Vendor Back-office PC, Pharmacist Portal (Web/Tablet), Admin Portal.
- **Core Modules**: 01. Identity & Access, 02. Catalog & Search, 03. Inventory & Warehouse (cold-chain), 04. Order & Cart, 05. Payment & Settlement, 06. Quotation/Tender, 07. Customer & Org, 08. Promotion, 09. Health Services, 10. Prescription (Rx), 11. Compliance & Audit, 12. BI & Reporting, 13. Finance & e-Invoice.
- **Regulatory**: CN: NMPA, MLPS 2.0, PIPL, Goldentax; VN: Bộ Y Tế / DAV, Decree 13/2023, GDT e-invoice; US: FDA, DEA, HIPAA; EU: EMA, GDPR.
- **Benchmark**: BFF ratio 15%, Core effort split ~60%, BFF 15%, Infra 15%, Frontend 10%.

## 2. E-commerce (Multi-vendor Marketplace)
- **Actors**: Consumer, Marketplace Seller, Operations Team, Customer Support, Logistics Driver.
- **Channels**: Mobile App (iOS/Android), Responsive Web, Seller Center Web, Admin Dashboard, Warehouse Scanner PDA.
- **Core Modules**: Identity, Product Catalog, Search & Recommendations, Shopping Cart, Checkout & Promotion Engine, Payment Gateway, Order Management (OMS), Inventory & Fulfillment, Vendor Management, Customer Review & Ratings, Customer Service.
- **Regulatory**: PCI-DSS for payments, GDPR / regional data privacy, consumer protection and electronic transaction laws.
- **Benchmark**: BFF ratio 15%, Core effort split ~65%, BFF 15%, Infra 10%, Frontend 10%.

## 3. Banking & Digital Financial Channels
- **Actors**: Retail Customer, Corporate Client, Branch Teller, Relationship Manager, Compliance/AML Officer.
- **Channels**: Mobile Banking App, Corporate Internet Banking, ATM/Kiosk Interface, Internal Teller Portal.
- **Core Modules**: Customer Identity & KYC/eKYC, Account Management, Fund Transfer & Payments, Bill Pay & Top-up, Cards Management, Lending & Credit Assessment, Wealth & Deposits, AML & Fraud Detection, Notification Engine, Audit & General Ledger.
- **Regulatory**: Central Bank regulations (SBV, Fed, ECB), AML/CFT guidelines, PCI-DSS Level 1, Open Banking standards (PSD2).
- **Benchmark**: BFF ratio 10–12%, Core effort split ~70%, BFF 12%, Infra 10%, Frontend 8%.

## 4. Insurance (Life & Non-Life)
- **Actors**: Policyholder, Insurance Agent/Broker, Underwriter, Claims Adjuster, Actuary.
- **Channels**: Customer Portal/App, Agent Mobile Portal, Underwriter Desktop, Claims Assessment Tablet.
- **Core Modules**: Product Configurator, Quotation & Rating Engine, Policy Administration, Underwriting Workflow, Billing & Premium Collection, Claims Processing, Agent Commission & Hierarchy, Reinsurance, Regulatory Reporting.
- **Benchmark**: BFF ratio 10–12%, Core effort split ~70%, BFF 12%, Infra 10%, Frontend 8%.

## 5. Logistics & Freight Forwarding
- **Actors**: Shipper, Consignee, Fleet Driver, Dispatcher, Customs Broker, Warehouse Supervisor.
- **Channels**: Shipper Web Booking, Driver Mobile App, Dispatcher Console, WMS Handheld Scanner.
- **Core Modules**: Rate Quoting & Booking, Order Dispatch, Route Optimization, Real-time Track & Trace, Fleet & Asset Management, Cross-dock & Warehouse Management, Billing & Invoicing, Customs Documentation.
- **Benchmark**: BFF ratio 15–20%, Core effort split ~60%, BFF 18%, Infra 12%, Frontend 10%.
