# 🚨 DEVELOPMENT LOCATION REMINDER 🚨

## You Are Here (Correct):
```
/home/kkells/datagraph.city/mcp-server/
```

This is the **SOURCE OF TRUTH** for development.

---

## DO NOT EDIT There (Wrong):
```
/home/kkells/datagraph-city-mcp-server/
```

That is a **SYNC TARGET** only. Changes there will be overwritten.

---

## Simple Workflow

1. **Edit files HERE** in `/home/kkells/datagraph.city/mcp-server/`
2. **Commit** to `kevinkells/datagraph.city` repo
3. **Test** - Changes are live in Claude Desktop immediately after commit
4. **Sync** to public repo when ready: `cd /home/kkells/datagraph.city && ./scripts/sync-mcp-to-public.sh`

---

**If you're editing `/home/kkells/datagraph-city-mcp-server/`, you're in the WRONG place!**

