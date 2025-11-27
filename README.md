# FarmBakeGo (Internal Platform)

Proprietary bakery operations platform.

## Planned Modules
- Product & Media Manager
- Inventory & Production Batches
- Order & Channel Sync
- Pricing & Promotions
- Label / Packaging Generator
- Analytics & Reports
- Public Site Sync Adapter

## Current Components
- Image renamer utility
- Product data seed

## Planned Stack
Backend: FastAPI + PostgreSQL  
Frontend: React + TypeScript  
Tasks: Celery + Redis  
Storage: S3-compatible bucket

## Dev Setup
1. python -m venv .venv && source .venv/bin/activate
2. pip install -r requirements.txt
3. pre-commit install
4. pre-commit run --all-files

**INTERNAL ONLY.**

© 2025 FarmBakeGo. All rights reserved.
