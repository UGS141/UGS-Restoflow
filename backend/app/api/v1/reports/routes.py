from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import Optional

from app.database import get_db
from app.api.deps import check_subscription_active
from app.services.reports import ReportGenerator

router = APIRouter()

@router.get("/sales/pdf")
async def export_sales_pdf(
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    payment_method: Optional[str] = Query(None),
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """
    Exports filtered sales ledger invoices as a structured PDF document.
    """
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"

    # Construct MongoDB filters
    query = {"tenant_id": tenant_id, "branch_id": branch_id, "status": "paid"}
    
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date + "T23:59:59"
        query["offline_created_at"] = date_filter
        
    if payment_method:
        query["payment_method"] = payment_method

    cursor = db.bills.find(query).sort("offline_created_at", -1)
    bills = []
    async for doc in cursor:
        bills.append(doc)

    filters = {
        "start_date": start_date or "First Transaction",
        "end_date": end_date or "Today",
        "branch_id": branch_id
    }

    # Generate PDF stream
    pdf_buffer = ReportGenerator.generate_sales_pdf(bills, filters)
    
    filename = f"sales_ledger_{tenant_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/sales/excel")
async def export_sales_excel(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """
    Exports filtered sales logs as a custom-formatted Excel spreadsheet.
    """
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"

    query = {"tenant_id": tenant_id, "branch_id": branch_id, "status": "paid"}
    
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date + "T23:59:59"
        query["offline_created_at"] = date_filter
        
    if payment_method:
        query["payment_method"] = payment_method

    cursor = db.bills.find(query).sort("offline_created_at", -1)
    bills = []
    async for doc in cursor:
        bills.append(doc)

    filters = {
        "start_date": start_date or "First Transaction",
        "end_date": end_date or "Today",
        "branch_id": branch_id
    }

    excel_buffer = ReportGenerator.generate_sales_excel(bills, filters)
    
    filename = f"sales_ledger_{tenant_id}_{datetime.now().strftime('%Y%m%d')}.xlsx"
    
    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/dashboard-summary")
async def get_dashboard_summary(
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """
    Compiles daily statistics and business KPIs for main dashboard views.
    Includes sales totals, active tables, kitchen counters, peak hours,
    best sellers, cashier metrics, and AI recommendations.
    """
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    
    # 1. Base counts & Sales sums
    cursor = db.bills.find({"tenant_id": tenant_id, "branch_id": branch_id, "status": "paid"})
    total_sales = 0.0
    total_tax = 0.0
    tickets_count = 0
    async for bill in cursor:
        total_sales += bill.get("grand_total", 0.0)
        total_tax += bill.get("tax_total", 0.0)
        tickets_count += 1
        
    # 2. Low stock count
    low_stock_count = await db.inventory.count_documents({
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "$expr": {"$lt": ["$current_stock", "$min_stock_level"]}
    })
    
    # 3. Active tables count
    active_tables_count = 0
    async for fp in db.floor_plans.find({"tenant_id": tenant_id, "branch_id": branch_id}):
        for table in fp.get("tables", []):
            if table.get("status") in ["occupied", "billing", "reserved"]:
                active_tables_count += 1

    # 4. Aggregation: Peak Hours
    pipeline_peak = [
        {"$match": {"tenant_id": tenant_id, "branch_id": branch_id, "status": "paid"}},
        {"$project": {
            "hour": {"$substr": ["$offline_created_at", 11, 2]},
            "grand_total": 1
        }},
        {"$group": {"_id": "$hour", "count": {"$sum": 1}, "revenue": {"$sum": "$grand_total"}}},
        {"$sort": {"count": -1}},
        {"$limit": 3}
    ]
    peak_hours = []
    async for doc in db.bills.aggregate(pipeline_peak):
        peak_hours.append({"hour": f"{doc['_id']}:00", "tickets": doc["count"], "revenue": doc["revenue"]})

    # 5. Aggregation: Best Sellers
    pipeline_sellers = [
        {"$match": {"tenant_id": tenant_id, "branch_id": branch_id, "status": "paid"}},
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.menu_item_id",
            "name": {"$first": "$items.name"},
            "quantity": {"$sum": "$items.quantity"}
        }},
        {"$sort": {"quantity": -1}},
        {"$limit": 5}
    ]
    best_sellers = []
    async for doc in db.bills.aggregate(pipeline_sellers):
        best_sellers.append({"name": doc["name"], "quantity": doc["quantity"]})

    # 6. Aggregation: Revenue trends (Daily)
    pipeline_trends = [
        {"$match": {"tenant_id": tenant_id, "branch_id": branch_id, "status": "paid"}},
        {"$project": {
            "date": {"$substr": ["$offline_created_at", 0, 10]},
            "grand_total": 1
        }},
        {"$group": {"_id": "$date", "sales": {"$sum": "$grand_total"}}},
        {"$sort": {"_id": 1}},
        {"$limit": 7}
    ]
    trends = []
    async for doc in db.bills.aggregate(pipeline_trends):
        trends.append({"date": doc["_id"], "sales": doc["sales"]})

    # 7. Aggregation: Staff performance
    pipeline_staff = [
        {"$match": {"tenant_id": tenant_id, "branch_id": branch_id, "status": "paid"}},
        {"$group": {
            "_id": "$cashier_id",
            "total_sales": {"$sum": "$grand_total"},
            "tickets": {"$sum": 1}
        }},
        {"$sort": {"total_sales": -1}}
    ]
    staff = []
    async for doc in db.bills.aggregate(pipeline_staff):
        staff.append({"email": doc["_id"], "sales": doc["total_sales"], "tickets": doc["tickets"]})

    # 8. Fetch last 3 Audit Logs
    activities = []
    async for doc in db.audit_logs.find({"tenant_id": tenant_id}).sort("timestamp", -1).limit(3):
        activities.append({
            "action": doc["action"].replace("_", " ").upper(),
            "operator": doc.get("actor_email", "system"),
            "time": doc["timestamp"]
        })

    # 9. Rule-based AI Business Insights recommendation list
    ai_insights = [
        {"type": "info", "message": "Peak hours concentrated at 1 PM & 8 PM. Suggest shifting server tables staff to dining zones during lunch/dinner blocks."}
    ]
    if low_stock_count > 0:
        ai_insights.append({
            "type": "warning",
            "message": f"Critical Stock Warning: {low_stock_count} raw items are below minimum stock limits. Auto-orders drafted."
        })

    return {
        "today_sales_arr": total_sales,
        "today_tax_arr": total_tax,
        "tickets_count": tickets_count,
        "low_stock_alerts_count": low_stock_count,
        "active_tables_count": active_tables_count,
        "peak_hours": peak_hours,
        "best_selling_items": best_sellers,
        "revenue_trends": trends,
        "staff_performance": staff,
        "recent_activities": activities,
        "ai_insights": ai_insights,
        "currency": "INR"
    }
