# Product Requirements Document: Verification Diagnostics & Structured Findings

## Overview

Nâng cấp cơ chế verification của Harnix để tự động trích xuất failure context chi tiết vào trường `findings` của `EvidenceRecordV2` theo phong cách Superpowers, giúp các vòng lặp debug giải quyết lỗi chính xác.

## Acceptance Criteria

### AC `ac-structured-findings-capture`
Cơ chế verification capture đầy đủ failure context, exit code và stderr vào mảng structured findings trên EvidenceRecordV2 khi check thất bại.

### AC `ac-checks-reporting-findings`
Lệnh public `harnix checks` và stage-owner `harnix-check` báo cáo chi tiết các findings hỗ trợ stage `harnix-debug`.

### AC `ac-diagnostics-unit-tests`
Toàn bộ test suite cho findings và verification diagnostics đều pass sạch sẽ.
