# AquaPulse

<p align="center">
  <strong>Open-source aquaculture management system for stock tracking, health monitoring, feeding, and water quality management.</strong>
</p>

<p align="center">
  A practical platform for fish farms, hatcheries, shrimp farms, and aquatic operations that want structured digital workflows instead of notebook chaos and spreadsheet archaeology.
</p>

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Goals](#goals)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [Suggested Open-Source Stack](#suggested-open-source-stack)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Use Cases](#use-cases)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Contributing](#contributing)
- [Documentation](#documentation)
- [License](#license)
- [Future Scope](#future-scope)
- [Project Status](#project-status)

---

## Overview

**AquaPulse** is an open-source aquaculture management platform built to help aquatic farms manage daily operations in one place.

It is designed for teams that need a cleaner way to handle:

- stock and batch records
- pond or tank tracking
- fish health observations
- feeding logs
- water quality monitoring
- mortality and treatment entries
- staff workflows and reporting

The project aims to replace fragmented systems with a single structured platform built entirely using open-source technologies.

---

## Problem Statement

Many aquaculture operations still depend on a mix of paper registers, Excel files, chat messages, and human memory. That combination is brave, traditional, and wildly unsafe for operations.

This usually creates problems such as:

- duplicate or missing records
- poor traceability of stock movement
- delayed response to health issues
- inconsistent feeding logs
- weak historical analysis
- lack of role-based accountability
- difficulty generating useful reports

AquaPulse is intended to bring order to this watery circus.

---

## Goals

The main goals of AquaPulse are to:

- digitize aquaculture operations end-to-end
- centralize farm records in one system
- improve stock visibility and batch traceability
- maintain reliable health and mortality logs
- monitor feeding and water quality consistently
- reduce manual errors and repeated work
- support reporting, analytics, and better decisions
- remain fully open-source and self-hostable

---

## Key Features

### 1. Stock Management

Manage the lifecycle of fish or aquatic stock with structured records.

**Capabilities:**
- create and manage ponds, tanks, cages, or culture units
- add stock batches with species, source, quantity, and stocking date
- track transfers between units
- monitor current stock availability
- maintain historical batch movement records

---

### 2. Health Monitoring

Track observations, symptoms, treatments, and disease-related events.

**Capabilities:**
- log health observations by pond, tank, or batch
- record symptoms and probable causes
- store treatment details and medication history
- track disease events over time
- maintain health history for reference and auditing

---

### 3. Feeding Management

Record what was planned, what was actually fed, and where reality politely disobeyed the schedule.

**Capabilities:**
- create feeding plans and schedules
- log feed type and quantity
- record feeding time and frequency
- compare planned vs actual feed usage
- support consumption trend analysis

---

### 4. Water Quality Monitoring

Maintain structured records of critical water parameters.

**Typical parameters:**
- temperature
- pH
- dissolved oxygen
- ammonia
- turbidity
- salinity
- nitrate / nitrite
- alkalinity

**Capabilities:**
- record parameter readings by time and location
- view parameter history
- detect anomalies and trends
- support intervention decisions

---

### 5. Mortality and Treatment Logs

Capture important events that directly affect farm performance.

**Capabilities:**
- log mortality count and suspected cause
- record treatment actions
- maintain unit-wise mortality history
- associate treatments with health events
- support loss analysis and operational review

---

### 6. Farm Operations and Daily Workflow

Support routine work beyond just biological data.

**Capabilities:**
- daily activity logs
- staff task tracking
- operational checklists
- incident reporting
- supervisor verification workflows

---

### 7. Reporting and Dashboarding

Turn raw entries into useful information instead of decorative database compost.

**Capabilities:**
- stock summary reports
- mortality reports
- feed usage reports
- health event history
- treatment logs
- water quality trends
- dashboard-level summaries for managers and stakeholders

---

## User Roles

AquaPulse can support role-based access control depending on deployment scope.

### Admin
- manage users and permissions
- configure farms, ponds, tanks, and master data
- access all system reports and settings

### Farm Manager
- monitor overall farm operations
- review stock, feeding, health, and water records
- assign responsibilities
- review reports and trends

### Supervisor
- verify day-to-day data entry
- monitor pond- or unit-level activities
- review incidents and task completion

### Field Staff / Operator
- enter feeding records
- log water parameters
- record health observations
- update mortality and treatment entries

### Viewer / Stakeholder
- read-only access to summaries, dashboards, and reports

---

## Suggested Open-Source Stack

This project is intended to use **open-source tools only**.

### Frontend
- React
- Next.js or Vite
- Tailwind CSS

### Backend
Choose one of the following:
- Node.js + Express
- Python + FastAPI
- Python + Django

### Database
- PostgreSQL
- MariaDB or MySQL as alternatives

### Authentication
- Keycloak
- Authentik
- self-hosted JWT-based auth service

### Mobile / Field Access
- Progressive Web App (PWA)
- optional Flutter app in later phases

### Deployment
- Docker
- Docker Compose
- Kubernetes for larger deployments

### Monitoring and Logging
- Grafana
- Prometheus
- Loki

### File Storage
- MinIO
- local object or file storage depending on deployment size

---

## Project Structure

A possible starter structure:

```bash
aquapulse/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   ├── app/
│   ├── requirements.txt / package.json
│   └── tests/
├── database/
│   ├── migrations/
│   └── seed/
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── product/
│   └── deployment/
├── docker/
│   ├── frontend/
│   └── backend/
├── scripts/
├── .env.example
├── docker-compose.yml
├── LICENSE
└── README.md
