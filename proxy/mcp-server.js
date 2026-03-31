/**
 * Keep Line MCP Server — Read-Only
 * ให้ AI ภายนอกเข้ามาอ่านข้อมูลจาก Keep Line ผ่าน MCP Protocol (SSE transport)
 *
 * Endpoint:
 *   GET  /mcp/sse       — SSE stream (server → client)
 *   POST /mcp/messages  — JSON-RPC messages (client → server)
 */

const { randomUUID } = require("crypto");

// ─── Tool Definitions (Read-Only) ───

const TOOLS = [
  {
    name: "list_customers",
    description: "ดึงรายชื่อลูกค้าทั้งหมด สามารถค้นหาด้วยชื่อ กรองตาม pipeline stage, sentiment ได้",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "ค้นหาชื่อลูกค้า" },
        pipelineStage: { type: "string", description: "กรองตาม stage: new/interested/quoted/negotiating/won/lost/follow_up" },
        sentiment: { type: "string", description: "กรองตาม sentiment: positive/neutral/negative" },
        limit: { type: "number", description: "จำนวนสูงสุด (default 50)" },
        skip: { type: "number", description: "ข้ามกี่รายการ (pagination)" },
      },
    },
  },
  {
    name: "get_customer",
    description: "ดึงรายละเอียดลูกค้า 1 คน รวมข้อมูลทั้งหมด (tags, pipeline, sentiment, rooms, groups)",
    inputSchema: {
      type: "object",
      properties: {
        customerId: { type: "string", description: "lineUserId หรือ _id ของลูกค้า" },
      },
      required: ["customerId"],
    },
  },
  {
    name: "get_customer_history",
    description: "ดึงประวัติแชททั้งหมดของลูกค้า 1 คน เรียงตามเวลา",
    inputSchema: {
      type: "object",
      properties: {
        customerId: { type: "string", description: "lineUserId ของลูกค้า" },
        limit: { type: "number", description: "จำนวนข้อความสูงสุด (default 100)" },
        since: { type: "string", description: "ดึงตั้งแต่วันที่ (ISO format)" },
      },
      required: ["customerId"],
    },
  },
  {
    name: "search_messages",
    description: "ค้นหาข้อความทั้งระบบ ด้วย keyword หรือ sourceId",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "คำค้นหาในเนื้อหาข้อความ" },
        sourceId: { type: "string", description: "กรองตาม sourceId (ห้องแชท)" },
        limit: { type: "number", description: "จำนวนสูงสุด (default 50)" },
      },
    },
  },
  {
    name: "list_rooms",
    description: "ดึงรายการห้องแชท/กลุ่มทั้งหมด พร้อมข้อความล่าสุดและจำนวนข้อความ",
    inputSchema: {
      type: "object",
      properties: {
        sourceType: { type: "string", description: "กรอง: user (DM) หรือ group" },
        limit: { type: "number", description: "จำนวนสูงสุด (default 50)" },
      },
    },
  },
  {
    name: "get_analytics",
    description: "ดึงสถิติภาพรวม: จำนวนลูกค้า, ข้อความ, sentiment, pipeline, ยอดขาย",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_documents",
    description: "ดึงรายการเอกสารที่ AI จำแนกแล้ว กรองตามประเภท/สถานะ",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "หมวด: accounting/document/image" },
        subCategory: { type: "string", description: "ประเภทย่อย: slip/quotation/invoice/receipt/id_card ฯลฯ" },
        status: { type: "string", description: "สถานะ: pending/confirmed/rejected" },
        limit: { type: "number", description: "จำนวนสูงสุด (default 50)" },
      },
    },
  },
  {
    name: "list_payments",
    description: "ดึงรายการเงินเข้า/สลิป กรองตามสถานะ",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "สถานะ: pending/confirmed/rejected" },
        limit: { type: "number", description: "จำนวนสูงสุด (default 50)" },
      },
    },
  },
  {
    name: "list_appointments",
    description: "ดึงนัดหมายทั้งหมด กรองตามสถานะ/ประเภท/วันที่",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "สถานะ: scheduled/confirmed/in_progress/completed/cancelled/no_show" },
        type: { type: "string", description: "ประเภท: site_visit/consulting/delivery/installation/meeting/follow_up/other" },
        from: { type: "string", description: "ตั้งแต่วันที่ (ISO)" },
        to: { type: "string", description: "ถึงวันที่ (ISO)" },
        limit: { type: "number", description: "จำนวนสูงสุด (default 50)" },
      },
    },
  },
  {
    name: "list_staff",
    description: "ดึงรายชื่อพนักงานทั้งหมด พร้อมสถานะ/แผนก/บทบาท",
    inputSchema: {
      type: "object",
      properties: {
        department: { type: "string", description: "กรองตามแผนก" },
        status: { type: "string", description: "active หรือ inactive" },
      },
    },
  },
  {
    name: "get_kpi",
    description: "ดึง KPI ภาพรวม: จำนวนแชท, เวลาตอบเฉลี่ย, อัตราปิดการขาย, ลูกค้าเสี่ยงหลุด",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_knowledge_base",
    description: "ดึงบทความฐานความรู้ทั้งหมด (สินค้า, โปรโมชั่น, FAQ, นโยบาย)",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "หมวด: product/promotion/policy/faq" },
      },
    },
  },
  {
    name: "list_tasks",
    description: "ดึงงานติดตามลูกค้า กรองตามสถานะ/ความสำคัญ",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "pending หรือ completed" },
        priority: { type: "string", description: "high/normal/low" },
        limit: { type: "number", description: "จำนวนสูงสุด (default 50)" },
      },
    },
  },
  {
    name: "list_ai_advice",
    description: "ดึงคำแนะนำจาก AI Advisor ทั้งหมด (13 บทบาท)",
    inputSchema: {
      type: "object",
      properties: {
        role: { type: "string", description: "บทบาท AI: problem_solver/sales_hunter/team_coach/health_monitor/daily_report ฯลฯ" },
        limit: { type: "number", description: "จำนวนสูงสุด (default 20)" },
      },
    },
  },
  {
    name: "get_ai_costs",
    description: "ดึงสรุปค่าใช้จ่าย AI: วันนี้, เดือนนี้, แยกตาม provider/feature",
    inputSchema: {
      type: "object",
      properties: {
        period: { type: "string", description: "today/week/month (default today)" },
      },
    },
  },
  {
    name: "list_tax_deadlines",
    description: "ดึงปฏิทินภาษี/งานบัญชี กรองตามเดือน/สถานะ",
    inputSchema: {
      type: "object",
      properties: {
        period: { type: "string", description: "เดือน เช่น 2026-03" },
        status: { type: "string", description: "pending/in_progress/completed/overdue" },
      },
    },
  },
  {
    name: "list_alerts",
    description: "ดึงการแจ้งเตือนทั้งหมด (critical/warning/opportunity)",
    inputSchema: {
      type: "object",
      properties: {
        severity: { type: "string", description: "critical/warning/info/opportunity" },
        limit: { type: "number", description: "จำนวนสูงสุด (default 30)" },
      },
    },
  },
];

// ─── Tool Handlers ───

async function handleTool(name, args, db) {
  const limit = Math.min(args.limit || 50, 200);
  const skip = args.skip || 0;

  switch (name) {
    case "list_customers": {
      const filter = {};
      if (args.search) filter.name = { $regex: args.search, $options: "i" };
      if (args.pipelineStage) filter.pipelineStage = args.pipelineStage;
      if (args.sentiment) filter.sentiment = args.sentiment;
      const docs = await db.collection("customers").find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).toArray();
      const total = await db.collection("customers").countDocuments(filter);
      return { total, count: docs.length, customers: docs.map(d => ({ ...d, _id: d._id.toString() })) };
    }

    case "get_customer": {
      const c = await db.collection("customers").findOne({
        $or: [{ lineUserId: args.customerId }, { _id: args.customerId }],
      });
      if (!c) return { error: "Customer not found" };
      const msgCount = await db.collection("messages").countDocuments({ userId: c.lineUserId });
      const skills = await db.collection("user_skills").find({ userId: c.lineUserId }).toArray();
      return { ...c, _id: c._id.toString(), messageCount: msgCount, skills };
    }

    case "get_customer_history": {
      const filter = { userId: args.customerId };
      if (args.since) filter.createdAt = { $gte: new Date(args.since) };
      const msgs = await db.collection("messages").find(filter).sort({ createdAt: 1 }).limit(Math.min(args.limit || 100, 500)).toArray();
      return { count: msgs.length, messages: msgs.map(m => ({ ...m, _id: m._id.toString() })) };
    }

    case "search_messages": {
      const filter = {};
      if (args.keyword) filter.content = { $regex: args.keyword, $options: "i" };
      if (args.sourceId) filter.sourceId = args.sourceId;
      const msgs = await db.collection("messages").find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
      return { count: msgs.length, messages: msgs.map(m => ({ ...m, _id: m._id.toString() })) };
    }

    case "list_rooms": {
      const filter = {};
      if (args.sourceType) filter.sourceType = args.sourceType;
      const rooms = await db.collection("groups_meta").find(filter).sort({ lastMessageAt: -1 }).limit(limit).toArray();
      return { count: rooms.length, rooms: rooms.map(r => ({ ...r, _id: r._id.toString() })) };
    }

    case "get_analytics": {
      const [customers, messages, rooms, payments] = await Promise.all([
        db.collection("customers").countDocuments(),
        db.collection("messages").countDocuments(),
        db.collection("groups_meta").countDocuments(),
        db.collection("payments").countDocuments(),
      ]);
      const pipeline = await db.collection("customers").aggregate([
        { $group: { _id: "$pipelineStage", count: { $sum: 1 } } },
      ]).toArray();
      const sentiment = await db.collection("chat_analytics").aggregate([
        { $group: { _id: "$sentiment", count: { $sum: 1 } } },
      ]).toArray();
      const paymentStats = await db.collection("payments").aggregate([
        { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } },
      ]).toArray();
      return { customers, messages, rooms, payments, pipeline, sentiment, paymentStats };
    }

    case "list_documents": {
      const filter = {};
      if (args.category) filter.category = args.category;
      if (args.subCategory) filter.subCategory = args.subCategory;
      if (args.status) filter.status = args.status;
      const docs = await db.collection("documents").find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
      return { count: docs.length, documents: docs.map(d => ({ ...d, _id: d._id.toString() })) };
    }

    case "list_payments": {
      const filter = {};
      if (args.status) filter.status = args.status;
      const docs = await db.collection("payments").find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
      return { count: docs.length, payments: docs.map(d => ({ ...d, _id: d._id.toString() })) };
    }

    case "list_appointments": {
      const filter = {};
      if (args.status) filter.status = args.status;
      if (args.type) filter.type = args.type;
      if (args.from || args.to) {
        filter.startDate = {};
        if (args.from) filter.startDate.$gte = new Date(args.from);
        if (args.to) filter.startDate.$lte = new Date(args.to);
      }
      const docs = await db.collection("appointments").find(filter).sort({ startDate: 1 }).limit(limit).toArray();
      return { count: docs.length, appointments: docs.map(d => ({ ...d, _id: d._id.toString() })) };
    }

    case "list_staff": {
      const filter = {};
      if (args.department) filter.department = args.department;
      if (args.status) filter.status = args.status;
      const docs = await db.collection("staff").find(filter).sort({ name: 1 }).toArray();
      return { count: docs.length, staff: docs.map(d => ({ ...d, _id: d._id.toString() })) };
    }

    case "get_kpi": {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 86400000);
      const [totalCustomers, totalMessages, todayMessages, weekMessages, staffCount] = await Promise.all([
        db.collection("customers").countDocuments(),
        db.collection("messages").countDocuments(),
        db.collection("messages").countDocuments({ createdAt: { $gte: today } }),
        db.collection("messages").countDocuments({ createdAt: { $gte: weekAgo } }),
        db.collection("staff").countDocuments({ status: "active" }),
      ]);
      const churnRisk = await db.collection("customers").countDocuments({
        lastMessageAt: { $lt: new Date(now.getTime() - 7 * 86400000) },
      });
      const pipelineWon = await db.collection("customers").countDocuments({ pipelineStage: "won" });
      const pipelineTotal = await db.collection("customers").countDocuments({ pipelineStage: { $exists: true } });
      return {
        totalCustomers, totalMessages, todayMessages, weekMessages, staffCount,
        churnRisk, conversionRate: pipelineTotal > 0 ? Math.round((pipelineWon / pipelineTotal) * 100) : 0,
      };
    }

    case "list_knowledge_base": {
      const filter = {};
      if (args.category) filter.category = args.category;
      const docs = await db.collection("knowledge_base").find(filter).sort({ updatedAt: -1 }).toArray();
      const articles = await db.collection("kb_articles").find(filter).sort({ updatedAt: -1 }).toArray();
      return { count: docs.length + articles.length, items: [...docs, ...articles].map(d => ({ ...d, _id: d._id.toString() })) };
    }

    case "list_tasks": {
      const filter = {};
      if (args.status) filter.status = args.status;
      if (args.priority) filter.priority = args.priority;
      const docs = await db.collection("tasks").find(filter).sort({ dueDate: 1 }).limit(limit).toArray();
      return { count: docs.length, tasks: docs.map(d => ({ ...d, _id: d._id.toString() })) };
    }

    case "list_ai_advice": {
      const filter = {};
      if (args.role) filter.role = args.role;
      const docs = await db.collection("ai_advice").find(filter).sort({ createdAt: -1 }).limit(Math.min(args.limit || 20, 50)).toArray();
      return { count: docs.length, advice: docs.map(d => ({ ...d, _id: d._id.toString() })) };
    }

    case "get_ai_costs": {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let since;
      switch (args.period) {
        case "week": since = new Date(today.getTime() - 7 * 86400000); break;
        case "month": since = new Date(now.getFullYear(), now.getMonth(), 1); break;
        default: since = today;
      }
      const costs = await db.collection("ai_costs").aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: {
          _id: { provider: "$provider", feature: "$feature" },
          calls: { $sum: 1 },
          totalTokens: { $sum: { $add: ["$inputTokens", "$outputTokens"] } },
          totalCost: { $sum: "$cost" },
        }},
      ]).toArray();
      const totalCost = costs.reduce((s, c) => s + (c.totalCost || 0), 0);
      const totalCalls = costs.reduce((s, c) => s + c.calls, 0);
      return { period: args.period || "today", since, totalCost, totalCalls, breakdown: costs };
    }

    case "list_tax_deadlines": {
      const filter = {};
      if (args.period) filter.period = args.period;
      if (args.status) filter.status = args.status;
      const docs = await db.collection("work_items").find(filter).sort({ dueDate: 1 }).limit(limit).toArray();
      return { count: docs.length, items: docs.map(d => ({ ...d, _id: d._id.toString() })) };
    }

    case "list_alerts": {
      const filter = {};
      if (args.severity) filter.severity = args.severity;
      const docs = await db.collection("alerts").find(filter).sort({ createdAt: -1 }).limit(Math.min(args.limit || 30, 100)).toArray();
      return { count: docs.length, alerts: docs.map(d => ({ ...d, _id: d._id.toString() })) };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── MCP SSE Transport ───

function setupMCPServer(app, getDB) {
  const sessions = new Map(); // sessionId → { res, messageQueue }

  const SERVER_INFO = {
    name: "keepline",
    version: "1.0.0",
    description: "Keep Line MCP Server — Read-Only access to CRM data (customers, messages, documents, payments, appointments, staff, KPI, AI advice)",
  };

  // SSE endpoint — server → client
  app.get("/mcp/sse", (req, res) => {
    const sessionId = randomUUID();

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    // Send endpoint URL for client to POST messages
    const messagesUrl = `${req.protocol}://${req.get("host")}/mcp/messages?sessionId=${sessionId}`;
    res.write(`event: endpoint\ndata: ${messagesUrl}\n\n`);

    sessions.set(sessionId, { res, alive: true });
    console.log(`[MCP] Session ${sessionId} connected (${sessions.size} active)`);

    // Keep alive
    const heartbeat = setInterval(() => {
      if (sessions.has(sessionId)) {
        res.write(": heartbeat\n\n");
      }
    }, 30000);

    req.on("close", () => {
      sessions.delete(sessionId);
      clearInterval(heartbeat);
      console.log(`[MCP] Session ${sessionId} disconnected (${sessions.size} active)`);
    });
  });

  // Messages endpoint — client → server (JSON-RPC)
  const express = require("express");
  app.post("/mcp/messages", express.json(), async (req, res) => {
    const sessionId = req.query.sessionId;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const message = req.body;
    const { id, method, params } = message;

    let response;

    try {
      switch (method) {
        case "initialize":
          response = {
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: { tools: {} },
              serverInfo: { name: SERVER_INFO.name, version: SERVER_INFO.version },
            },
          };
          break;

        case "notifications/initialized":
          // No response needed for notifications
          res.json({ ok: true });
          return;

        case "tools/list":
          response = {
            jsonrpc: "2.0",
            id,
            result: { tools: TOOLS },
          };
          break;

        case "tools/call": {
          const { name, arguments: args } = params;
          const db = await getDB();
          if (!db) {
            response = {
              jsonrpc: "2.0",
              id,
              error: { code: -32603, message: "Database not connected" },
            };
            break;
          }
          const result = await handleTool(name, args || {}, db);
          response = {
            jsonrpc: "2.0",
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            },
          };
          break;
        }

        case "ping":
          response = { jsonrpc: "2.0", id, result: {} };
          break;

        default:
          response = {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method not found: ${method}` },
          };
      }
    } catch (err) {
      console.error(`[MCP] Error handling ${method}:`, err.message);
      response = {
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message: err.message },
      };
    }

    // Send response via SSE
    if (response && session.alive) {
      session.res.write(`event: message\ndata: ${JSON.stringify(response)}\n\n`);
    }

    res.json({ ok: true });
  });

  // Info endpoint
  app.get("/mcp", (req, res) => {
    res.json({
      ...SERVER_INFO,
      transport: "sse",
      endpoints: {
        sse: "/mcp/sse",
        messages: "/mcp/messages",
      },
      tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
      note: "Read-Only MCP Server — ไม่สามารถแก้ไขข้อมูลได้ ดูข้อมูลอย่างเดียว",
    });
  });

  console.log(`[MCP Server] Registered ${TOOLS.length} read-only tools`);
}

module.exports = { setupMCPServer };
