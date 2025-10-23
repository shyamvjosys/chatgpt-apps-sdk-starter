# MCP Tools Reference Guide

Quick reference for all available MCP tools in the Josys Employee Provisioning Server.

## 🔍 Tool 1: search_employee

**Purpose**: Find employees by name, email, or ID

**Input**:
```json
{
  "query": "abhijith"
}
```

**ChatGPT Examples**:
- "Search for employee john"
- "Find user with email priyesh.thankachan@josys.com"
- "Look up user ID P0001"

**Returns**: Employee profiles with service counts

---

## 🔐 Tool 2: get_service_access

**Purpose**: See who has access to a specific service

**Input**:
```json
{
  "serviceName": "Slack",
  "statusFilter": "Activated"  // optional
}
```

**ChatGPT Examples**:
- "Who has access to Slack?"
- "Show me all GitHub users"
- "List active AWS users"
- "Show invited users for Microsoft 365"

**Status Filters**: Activated, Invited, Deactivated, Deleted, Disabled

**Returns**: User list with access status

---

## 📋 Tool 3: check_provisioning_status

**Purpose**: View all services for a specific employee

**Input**:
```json
{
  "identifier": "priyesh.thankachan@josys.com"
}
```

**ChatGPT Examples**:
- "Show provisioning status for abhijith.s@josys.com"
- "What services does P0001 have access to?"
- "Check Tomoyo Fujita's service access"

**Returns**: Complete service breakdown with status summary

---

## 📊 Tool 4: get_location_stats

**Purpose**: Analyze employees and services by location

**Input**:
```json
{
  "locationCode": "4"  // optional - leave empty for all
}
```

**ChatGPT Examples**:
- "Show location statistics"
- "What are the stats for location code 4?"
- "Which location has the most employees?"

**Returns**: Location cards with employee counts and top services

---

## ⚠️ Tool 5: audit_deleted_users

**Purpose**: Find security issues with deleted users

**Input**:
```json
{}
```

**ChatGPT Examples**:
- "Run an offboarding audit"
- "Find deleted users with active services"
- "Show me security issues"
- "Check for compliance violations"

**Returns**: List of deleted users still having active/invited services

---

## 📈 Tool 6: get_compliance_dashboard

**Purpose**: Overview of provisioning health

**Input**:
```json
{}
```

**ChatGPT Examples**:
- "Show me the compliance dashboard"
- "What's our provisioning health?"
- "How many security issues do we have?"
- "Show top services by usage"

**Returns**: Comprehensive dashboard with metrics and issues

---

## 👥 Tool 7: get_users_by_role

**Purpose**: List users with a specific role

**Input**:
```json
{
  "role": "IT Admin"
}
```

**ChatGPT Examples**:
- "Show all IT Admin users"
- "List IT User accounts"
- "Who are the administrators?"

**Returns**: User cards with service details

---

## 📝 Tool 8: list_services

**Purpose**: Get complete service inventory

**Input**:
```json
{}
```

**ChatGPT Examples**:
- "List all services"
- "What services are tracked?"
- "Show me the service inventory"

**Returns**: Text list of all 55 services

---

## 🎯 Common Workflows

### Security Audit Workflow
1. Run `audit_deleted_users` to find issues
2. For each issue, use `check_provisioning_status` to see details
3. Review compliance with `get_compliance_dashboard`

### Employee Onboarding
1. Use `search_employee` to find the new hire
2. Check `check_provisioning_status` for current access
3. Compare with `get_users_by_role` to see what others have

### Service Access Review
1. Use `get_service_access` for the service in question
2. Filter by status to see invited/deactivated users
3. Cross-reference with `get_location_stats` for location-based patterns

### Department Analysis
1. Use `get_location_stats` for the department's location
2. Use `get_users_by_role` to filter by role
3. Use `get_service_access` to check specific tool usage

---

## 💡 Tips

- **Search is fuzzy**: Partial names work (e.g., "abhi" finds "Abhijith")
- **Case insensitive**: "slack" and "Slack" both work
- **Multiple identifiers**: Email, user ID, or full name all work for employee lookup
- **Real-time data**: All tools read from the CSV file directly
- **Widget rendering**: All tools (except list_services) render interactive widgets in ChatGPT

---

## 🔗 Integration

### MCP Endpoint
- **Local**: `http://localhost:3000/mcp`
- **Production**: `https://your-domain.com/mcp`

### Adding to ChatGPT
1. Go to ChatGPT Settings
2. Navigate to Connectors
3. Click "Create"
4. Add your MCP server URL
5. All 8 tools will be available immediately

---

## 📊 Data Overview

- **911** total employees
- **754** active employees
- **157** deleted employees
- **55** services tracked
- **44** security issues identified

Last updated: October 23, 2024

