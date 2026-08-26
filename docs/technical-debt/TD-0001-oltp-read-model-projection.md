# Technical Debt 0001: OLTP Read Model Projection Performance Optimization

- **ID**: TD-0001
- **Title**: Analytics Read Model Projection Optimization
- **Priority**: Medium
- **Owner**: Backend Architecture Team
- **Target Release**: School OS v1.2
- **Status**: Registered

## Description
Saat ini query Executive Workspace di `/dashboard/analytics` dikalkulasi via SQL join pada tabel operasional. Meskipun telah di-index dengan baik, pemisahan murni ke tabel proyeksi `analytics_school_overview` perlu dilakukan sebelum beban siswa melebihi 10.000 aktif.
