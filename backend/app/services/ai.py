from abc import ABC, abstractmethod
from typing import List, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger("ugs_restoflow")

class AIProvider(ABC):
    """
    Abstract Base Class defining the contract for AI intelligence providers in UGS-Restoflow.
    Allows swappable engines (Rule-based, Gemini, OpenAI) without changing business logic.
    """
    @abstractmethod
    async def predict_stock_requirements(self, sales_history: List[Dict[str, Any]], inventory_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Predicts inventory stock level requirements based on historical sale velocity."""
        pass

    @abstractmethod
    async def recommend_menu_pricing(self, sales_history: List[Dict[str, Any]], menu_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Recommends menu price adjustments based on item demand and sales volume."""
        pass

    @abstractmethod
    async def predict_peak_hours(self, sales_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Identifies high-traffic times based on historical invoice timestamps."""
        pass

    @abstractmethod
    async def suggest_promotions(self, sales_history: List[Dict[str, Any]], menu_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Suggests combo packages or discounts for slow-moving inventory items."""
        pass


class RuleBasedAIProvider(AIProvider):
    """
    Phase 1 AI Provider: Utilizes mathematical statistics, moving averages,
    and business rule heuristics to generate forecasts without paid API dependencies.
    """
    async def predict_stock_requirements(self, sales_history: List[Dict[str, Any]], inventory_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        logger.info("Executing Rule-based Stock Prediction...")
        # Step 1: Calculate aggregate quantity sold per menu item
        item_sales_volume = {}
        for bill in sales_history:
            for item in bill.get("items", []):
                item_id = item.get("menu_item_id")
                qty = item.get("quantity", 0)
                item_sales_volume[item_id] = item_sales_volume.get(item_id, 0) + qty
                
        # Step 2: Predict stock requirements based on volume and reorder points
        predictions = []
        for item in inventory_items:
            item_id = item.get("id")
            current_stock = item.get("current_stock", 0)
            avg_sold = item_sales_volume.get(item_id, 0)
            
            # Simple heuristic: Recommend stocking 2x the sales volume if current stock is low
            recommended_stock = max(avg_sold * 1.5, item.get("min_stock_level", 10))
            needs_reorder = current_stock < recommended_stock
            
            predictions.append({
                "item_id": item_id,
                "name": item.get("name"),
                "current_stock": current_stock,
                "recommended_stock": int(recommended_stock),
                "suggested_purchase_qty": int(max(0, recommended_stock - current_stock)) if needs_reorder else 0,
                "action_required": needs_reorder
            })
        return predictions

    async def recommend_menu_pricing(self, sales_history: List[Dict[str, Any]], menu_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        logger.info("Executing Rule-based Pricing Optimization...")
        item_counts = {}
        total_bills = len(sales_history) or 1
        
        for bill in sales_history:
            for item in bill.get("items", []):
                item_id = item.get("menu_item_id")
                item_counts[item_id] = item_counts.get(item_id, 0) + item.get("quantity", 0)

        recommendations = []
        for item in menu_items:
            item_id = item.get("id")
            sold_count = item_counts.get(item_id, 0)
            current_price = item.get("price", 0)
            
            popularity_ratio = sold_count / total_bills
            
            # Heuristics:
            # - Popular items (>30% of orders): suggest a small price increase (+5%)
            # - Slow items (<5% of orders): suggest a price reduction (-10%)
            if popularity_ratio > 0.3:
                suggested_price = round(current_price * 1.05, 2)
                reason = "High popularity and frequency in sales tickets."
            elif popularity_ratio < 0.05 and sold_count > 0:
                suggested_price = round(current_price * 0.90, 2)
                reason = "Slow-moving item. Price cut may stimulate sales volume."
            else:
                suggested_price = current_price
                reason = "Stable demand. Maintain current pricing."
                
            recommendations.append({
                "menu_item_id": item_id,
                "name": item.get("name"),
                "current_price": current_price,
                "suggested_price": suggested_price,
                "reason": reason
            })
        return recommendations

    async def predict_peak_hours(self, sales_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        logger.info("Executing Rule-based Peak Hour Analysis...")
        hour_counts = {h: 0 for h in range(24)}
        revenue_by_hour = {h: 0.0 for h in range(24)}
        
        for bill in sales_history:
            time_str = bill.get("offline_created_at") or bill.get("synced_at")
            if not time_str:
                continue
            try:
                if isinstance(time_str, datetime):
                    dt = time_str
                else:
                    dt = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
                hour = dt.hour
                hour_counts[hour] += 1
                revenue_by_hour[hour] += bill.get("grand_total", 0.0)
            except Exception:
                pass
                
        sorted_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)
        peak_hours = [h for h, count in sorted_hours[:3] if count > 0]
        
        return {
            "peak_hours_utc": peak_hours,
            "hourly_tickets": hour_counts,
            "hourly_revenue": revenue_by_hour,
            "recommendation": f"Staff reinforcement advised during peak hours: {', '.join([f'{h:02d}:00' for h in peak_hours])}."
        }

    async def suggest_promotions(self, sales_history: List[Dict[str, Any]], menu_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        logger.info("Executing Rule-based Promotion Recommender...")
        item_counts = {}
        for bill in sales_history:
            for item in bill.get("items", []):
                item_id = item.get("menu_item_id")
                item_counts[item_id] = item_counts.get(item_id, 0) + item.get("quantity", 0)
                
        # Find the slowest items and the most popular items to recommend a bundle
        sorted_items = sorted(menu_items, key=lambda x: item_counts.get(x.get("id"), 0))
        
        promotions = []
        if len(sorted_items) >= 2:
            slowest = sorted_items[0]
            most_popular = sorted_items[-1]
            
            promotions.append({
                "title": f"Happy Hour Bundle: {most_popular.get('name')} + {slowest.get('name')}",
                "discount_percent": 15,
                "reason": f"Bundle slow-moving item '{slowest.get('name')}' with bestseller '{most_popular.get('name')}' to clear stock."
            })
        return promotions


class GeminiAIProvider(AIProvider):
    """
    Phase 2 AI Provider: Leverages Google Gemini API to analyze sales records,
    predict inventory demand shifts, optimize prices, and draft natural language summaries.
    """
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def predict_stock_requirements(self, sales_history: List[Dict[str, Any]], inventory_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        logger.info("Executing Gemini-based Stock Forecasting...")
        # Template placeholder for Gemini SDK integration
        # In production: Use google-genai to generate predictions based on JSON input
        return [{"status": "gemini_provider_active", "data": "Pending model invocation payload"}]

    async def recommend_menu_pricing(self, sales_history: List[Dict[str, Any]], menu_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        logger.info("Executing Gemini-based Pricing Optimizations...")
        return []

    async def predict_peak_hours(self, sales_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        logger.info("Executing Gemini-based Peak Hour analysis...")
        return {}

    async def suggest_promotions(self, sales_history: List[Dict[str, Any]], menu_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        logger.info("Executing Gemini-based Promotion Recommendations...")
        return []


def get_ai_provider(provider_type: str = "rule_based", api_key: str = None) -> AIProvider:
    """
    Factory function providing the concrete AI engine.
    Allows hot-swapping provider dependencies at runtime.
    """
    if provider_type == "gemini" and api_key:
        return GeminiAIProvider(api_key=api_key)
    return RuleBasedAIProvider()
