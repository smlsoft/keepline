# Customer + Group Redesign — LINE Only

**Date:** 2026-03-30
**Status:** Approved

## Goal

Redesign customer tracking to properly identify users across DM and group chats using LINE userId, remove Facebook/Instagram support entirely, and add group membership tracking for CRM.

## Key Decisions

- **LINE only** — remove all FB/IG webhook, API, and UI code
- **Match by `lineUserId`** — not by display name (current bug)
- **Auto merge** — same userId in DM + group = same customer automatically
- **AI silent in groups** — collect data + analyze only, no auto-reply
- **Group membership** — track which groups each customer belongs to with stats
- **Combined chat view** — customer detail shows DM + group messages together

## Database Schema

### customers collection

```javascript
{
  _id: ObjectId,

  // Identity — match by lineUserId (unique)
  lineUserId: "U1234abc...",     // PRIMARY KEY for matching
  name: "จืดสนิท",               // display name from LINE API
  avatarUrl: "https://...",
  statusMessage: "...",

  // CRM fields (manual entry)
  firstName: "", lastName: "",
  phone: "", email: "", company: "",
  address: "", notes: "",
  customTags: [],
  dealValue: 0, expectedCloseDate: null,
  assignedTo: [],

  // Auto fields (AI analysis)
  tags: ["สนใจสินค้า"],
  pipelineStage: "new",   // new|interested|quoting|negotiating|closed_won|closed_lost|following_up
  lastSentiment: { score: 70, level: "green", reason: "..." },
  lastPurchaseIntent: { score: 40, level: "yellow", reason: "..." },

  // Rooms — every sourceId this customer has chatted in (DM + groups)
  rooms: ["U1234abc...", "C5678def...", "C9012ghi..."],

  // Group membership — details per group
  groups: [
    {
      sourceId: "C5678def...",
      groupName: "กลุ่มขาย",
      messageCount: 15,
      lastActiveAt: Date
    }
  ],

  totalMessages: 25,
  createdAt: Date, updatedAt: Date
}

// Index: { lineUserId: 1 } unique
```

### groups_meta collection

```javascript
{
  sourceId: "C5678def...",        // LINE groupId
  groupName: "กลุ่มขาย A",
  sourceType: "group",            // "group" | "user"
  memberCount: 5,                 // count of members who have spoken
  members: ["U1234...", "U5678..."],  // lineUserIds of members
  lastMessageAt: Date,
  createdAt: Date, updatedAt: Date
}
```

### messages collection

```javascript
{
  sourceId: "C5678def...",        // groupId or userId (chat room)
  role: "user",                   // "user" | "assistant"
  userName: "จืดสนิท",
  userId: "U1234abc...",          // lineUserId of sender
  content: "สวัสดี",
  messageType: "text",            // text|image|video|audio|sticker|location|file
  // media fields (imageUrl, videoUrl, audioUrl, file, sticker, location)
  createdAt: Date
}

// Removed: platform field (LINE only now)
```

## Message Flow

```
LINE Webhook (/webhook)
  │
  ├─ source.type === "user" (DM)
  │   sourceId = source.userId
  │   lineUserId = source.userId
  │
  └─ source.type === "group"
      sourceId = source.groupId
      lineUserId = source.userId (individual sender)
  │
  ▼
1. saveMsg() — save message with userId field
2. upsert groups_meta (if group)
   - $addToSet members: lineUserId
   - update memberCount, groupName
3. upsert customer (match by lineUserId)
   - $addToSet rooms: sourceId
   - if group → $addToSet groups: { sourceId, groupName }
   - update groups[].messageCount, lastActiveAt
   - update name, avatarUrl from LINE API
4. analyzeChat() — AI skill analysis (sentiment, tags, pipeline)
5. updateRoomAnalytics()
  │
  ▼
DM → AI replies normally
Group → NO reply, data collection only
```

## Dashboard Changes

### CRM Page

- Add "กลุ่ม" column showing group badges
- Click group badge → navigate to group page
- Remove platform filter tabs

### Customer Detail Page

- Add "กลุ่มที่อยู่" section with group list + stats
- Combined chat view: DM + group messages sorted by time
- Each message bubble shows badge: `DM` or group name
- Remove platform badges

### Chat List Page

- Remove platform tabs (LINE/FB/IG)
- Replace platform badge with `กลุ่ม`/`DM` badge
- Show sourceType indicator

### Pages/Code to Remove

- `/webhook/meta` endpoint
- Meta webhook handler (Facebook + Instagram)
- Meta API code (Graph API, page tokens, etc.)
- `FB_PAGE_ACCESS_TOKEN`, `FB_APP_SECRET`, `FB_VERIFY_TOKEN` env vars
- Dashboard: Meta/FB/IG setup in connections page
- Dashboard: Meta/FB/IG setup in guide page
- Dashboard: Platform filter tabs
- Dashboard: Platform badges → replace with group/DM badges
- `platform` field from messages, groups_meta
- `platformIds` from customers → replace with `lineUserId`

## Files Affected

### proxy/index.js (Agent)
- Customer upsert: `name` match → `lineUserId` match
- Group message handler: add member tracking + customer group membership
- Group message: skip AI reply
- Remove: Meta webhook handler, Meta API functions
- Remove: `platform` from saveMsg, groups_meta

### seaandhilldashboard/
- `src/app/crm/page.tsx` — add groups column
- `src/app/customer/[id]/page.tsx` — add groups section + combined chat with room badges
- `src/app/chat/page.tsx` — remove platform tabs, add group/DM badge
- `src/app/inbox/page.tsx` — remove platform tabs
- `src/app/connections/page.tsx` — remove Meta setup
- `src/app/guide/page.tsx` — remove Meta setup instructions
- `src/app/api/customers/` — update queries for lineUserId
- `src/app/api/chat-list/route.ts` — remove platform filter, add sourceType
- `src/app/api/groups/route.ts` — add members field

### Config files
- `.env.example` — remove FB/IG env vars
- `CLAUDE.md` — update multi-platform references to LINE only
