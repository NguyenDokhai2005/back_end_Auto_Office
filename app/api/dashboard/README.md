# Dashboard APIs

Backend APIs for Dashboard UI.

## 📁 Structure

```
dashboard/
├── stats/              # Dashboard statistics
├── recent/             # Recent activity
├── analytics/          # Analytics data for charts
└── top-workflows/      # Top performing workflows
```

## 🚀 Quick Test

```bash
# Get token first
TOKEN="your-access-token"

# Test all APIs
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/dashboard/stats
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/dashboard/recent
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/dashboard/analytics
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/dashboard/top-workflows
```

## 📚 Documentation

- **Full API Docs:** `/doc/DASHBOARD_API.md`
- **Quick Start:** `/doc/DASHBOARD_QUICKSTART.md`
- **Test Page:** `http://localhost:3000/test-dashboard-api.html`

## ✅ Status

All APIs are production-ready and tested.
