#!/usr/bin/env python3
"""
[Q]uantelix — Stripe Webhook
Handles subscription lifecycle: create, update, cancel, downgrade
"""

import json
import sqlite3
import os
from pathlib import Path

DB_DIR = Path.home() / ".quantelix"
DB_PATH = DB_DIR / "subscriptions.db"


def init_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS subscriptions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            plan TEXT NOT NULL CHECK(plan IN ('free', 'pro', 'team', 'enterprise')),
            stripe_customer_id TEXT,
            stripe_subscription_id TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            current_period_start INTEGER,
            current_period_end INTEGER,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            UNIQUE(user_id)
        );
        
        CREATE TABLE IF NOT EXISTS usage_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            metric TEXT NOT NULL,
            value INTEGER NOT NULL DEFAULT 0,
            period_start INTEGER NOT NULL,
            period_end INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        );
    """)
    conn.commit()
    conn.close()


def handle_checkout(data: dict):
    """Handle successful checkout — provision access"""
    user_id = data.get("client_reference_id", "unknown")
    plan = data.get("metadata", {}).get("plan", "free")
    customer_id = data.get("customer", "unknown")
    subscription_id = data.get("subscription", "unknown")

    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("""
        INSERT OR REPLACE INTO subscriptions 
        (id, user_id, plan, stripe_customer_id, stripe_subscription_id, status, current_period_start, current_period_end, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
    """, (subscription_id, user_id, plan, customer_id, subscription_id,
          data.get("created", 0), data.get("current_period_end", 0),
          data.get("created", 0), data.get("created", 0)))
    conn.commit()
    conn.close()
    print(f"[Billing] Provisioned {plan} for {user_id}")


def handle_subscription_update(data: dict):
    """Handle subscription update — change plan, cancel, etc."""
    subscription_id = data.get("id", "unknown")
    status = data.get("status", "active")
    plan = data.get("items", {}).get("data", [{}])[0].get("price", {}).get("metadata", {}).get("plan", "free")

    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("""
        UPDATE subscriptions SET status = ?, plan = ?, updated_at = ? WHERE stripe_subscription_id = ?
    """, (status, plan, data.get("updated", 0), subscription_id))
    conn.commit()
    conn.close()
    print(f"[Billing] Updated subscription {subscription_id} to {plan} ({status})")


def handle_invoice(data: dict):
    """Handle invoice — update usage limits"""
    subscription_id = data.get("subscription", "unknown")
    amount = data.get("amount_paid", 0)
    status = data.get("status", "unknown")
    print(f"[Billing] Invoice {status}: ${amount / 100:.2f} for {subscription_id}")


def webhook_handler(event_type: str, data: dict):
    handlers = {
        "checkout.session.completed": handle_checkout,
        "customer.subscription.updated": handle_subscription_update,
        "customer.subscription.deleted": lambda d: handle_subscription_update({**d, "status": "canceled"}),
        "invoice.paid": handle_invoice,
        "invoice.payment_failed": lambda d: print(f"[Billing] Payment failed: {d.get('subscription', 'unknown')}"),
    }

    handler = handlers.get(event_type)
    if handler:
        handler(data)
    else:
        print(f"[Billing] Unhandled event: {event_type}")


def get_subscription(user_id: str) -> dict:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM subscriptions WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else {"plan": "free", "status": "active"}


def check_usage_limit(user_id: str, metric: str) -> bool:
    """Check if user has exceeded their plan's usage limit"""
    sub = get_subscription(user_id)
    limits = {
        "free": {"messages": 50, "tokens": 100000, "agents": 1},
        "pro": {"messages": 10000, "tokens": 5000000, "agents": 10},
        "team": {"messages": 100000, "tokens": 50000000, "agents": 100},
        "enterprise": {"messages": 999999999, "tokens": 999999999, "agents": 9999},
    }

    limit = limits.get(sub["plan"], limits["free"]).get(metric, 999999999)

    conn = sqlite3.connect(str(DB_PATH))
    current = conn.execute(
        "SELECT COALESCE(SUM(value), 0) FROM usage_records WHERE user_id = ? AND metric = ? AND period_end > ?",
        (user_id, metric, int(__import__("time").time()))
    ).fetchone()[0]
    conn.close()

    return current < limit


init_db()
