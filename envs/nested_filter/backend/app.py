# Nested-filter environment backend.
# Per-widget standalone FastAPI backend for the nested-filter environment.
from __future__ import annotations

import argparse
import datetime
import json
import os
import sqlite3
import sys
from pathlib import Path
from typing import Any

from fastapi import Body, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
import uvicorn

WIDGET_DIR = Path(__file__).parent.parent
DATA_DIR = WIDGET_DIR / "backend" / "data"
FRONTEND_BASE = WIDGET_DIR / "frontend"


def _safe_path(base: Path, *parts: str) -> Path | None:
    """Resolve ``base``/``parts`` and return it only if it stays inside ``base``.

    Prevents path traversal: any ``..`` or absolute component that escapes ``base``
    yields ``None``.
    """
    base_real = os.path.realpath(base)
    target_real = os.path.realpath(os.path.join(base_real, *(str(p) for p in parts)))
    if target_real == base_real or target_real.startswith(base_real + os.sep):
        return Path(target_real)
    return None

# ---------------------------------------------------------------------------
# Load all envs for this widget at startup
# ---------------------------------------------------------------------------
ENVS: dict[str, dict] = {}
SEEDS: dict[str, list[dict]] = {}
BACKENDS: dict[str, dict] = {}
# Only the shipped release tasks are exposed by this env (loaded from
# tasks/test_tasks.jsonl below). Task-generation data (tasks_factory.json) is not shipped.
SHIPPED_TASKS: dict[str, list[dict]] = {}

for env_dir in sorted(DATA_DIR.iterdir()) if DATA_DIR.exists() else []:
    if not env_dir.is_dir():
        continue
    edj = env_dir / "env_data.json"
    if not edj.exists():
        continue
    env = json.loads(edj.read_text())
    eid = env["env_id"]
    ENVS[eid] = env
    sdj = env_dir / "seed_data.json"
    if sdj.exists():
        SEEDS[eid] = json.loads(sdj.read_text())
    bj = env_dir / "backend.json"
    if bj.exists():
        BACKENDS[eid] = json.loads(bj.read_text())

# Load the shipped release tasks (grouped by env_id) — the single source of truth
# for what this env serves and grades.
_ship_file = WIDGET_DIR / "tasks" / "test_tasks.jsonl"
if _ship_file.exists():
    for _line in _ship_file.read_text().splitlines():
        _line = _line.strip()
        if not _line:
            continue
        try:
            _t = json.loads(_line)
        except Exception:
            continue
        _eid = _t.get("env_id", "")
        if _eid:
            SHIPPED_TASKS.setdefault(_eid, []).append(_t)


def _esc(s: Any) -> str:
    s = "" if s is None else str(s)
    return (s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
             .replace('"',"&quot;").replace("'","&#39;"))


# ---------------------------------------------------------------------------
# Filter / verification logic (copied verbatim from env_server.py)
# ---------------------------------------------------------------------------
def apply_filter(env: dict, filter_state: dict) -> list[dict]:
    """Apply filter_state to the env's seed_data, return filtered items."""
    items = list(SEEDS.get(env["env_id"], []))
    spec = BACKENDS.get(env["env_id"], {}).get("filter_spec", {})
    ftype = spec.get("type", "generic")

    # Checkbox / multi-select facets
    facet_cols = ["brand", "condition", "color", "category", "property_type"]
    for col in facet_cols:
        vals = filter_state.get(col) or filter_state.get(col + "s")
        if vals:
            if isinstance(vals, str):
                vals = [vals]
            vals_set = set(str(v).lower() for v in vals)
            items = [i for i in items if str(i.get(col, "")).lower() in vals_set]

    # min_price / max_price (range)
    if filter_state.get("min_price") is not None:
        try:
            mn = int(filter_state["min_price"])
            items = [i for i in items if (i.get("price") or 0) >= mn]
        except (TypeError, ValueError):
            pass
    if filter_state.get("max_price") is not None:
        try:
            mx = int(filter_state["max_price"])
            items = [i for i in items if (i.get("price") or 99999999) <= mx]
        except (TypeError, ValueError):
            pass

    # max_rent (alias)
    if filter_state.get("max_rent") is not None:
        try:
            mx = int(filter_state["max_rent"])
            items = [i for i in items if (i.get("price") or 99999999) <= mx]
        except (TypeError, ValueError):
            pass

    # min_beds, min_baths (>=)
    for fname, item_col in [("min_beds", "beds"), ("min_baths", "baths")]:
        if filter_state.get(fname) is not None:
            try:
                mn = int(filter_state[fname])
                if mn > 0:
                    items = [i for i in items if (i.get(item_col) or 0) >= mn]
            except (TypeError, ValueError):
                pass

    # min_sqft
    if filter_state.get("min_sqft") is not None:
        try:
            mn = int(filter_state["min_sqft"])
            items = [i for i in items if (i.get("sqft") or 0) >= mn]
        except (TypeError, ValueError):
            pass

    # min_lot (acres)
    if filter_state.get("min_lot") is not None:
        try:
            mn = float(filter_state["min_lot"])
            items = [i for i in items if (i.get("lot_acres") or 0) >= mn]
        except (TypeError, ValueError):
            pass

    # Boolean flag facets
    for flag in ["in_stock", "free_shipping", "pet_friendly", "has_garage", "is_new", "price_reduced"]:
        if filter_state.get(flag):
            items = [i for i in items if i.get(flag) is True]

    # Rating min
    if filter_state.get("rating_min"):
        try:
            mn = float(filter_state["rating_min"][0] if isinstance(filter_state["rating_min"], list) else filter_state["rating_min"])
            items = [i for i in items if (i.get("rating") or 0) >= mn]
        except (TypeError, ValueError, IndexError):
            pass

    return items
def _parse_ref_state(ref_state: str) -> list[dict]:
    """Parse a `reference_state_change` string like
    "filter_state: max_price=60, min_beds=4; filter_state: brand=[Samsung]"
    into a list of dicts, one per goal."""
    out = []
    if not ref_state:
        return out
    for chunk in ref_state.split(";"):
        chunk = chunk.strip()
        if chunk.startswith("filter_state:"):
            chunk = chunk[len("filter_state:"):].strip()
        d = {}
        # split on top-level commas only (commas inside [...] belong to list values)
        pairs, depth, buf = [], 0, ""
        for ch in chunk:
            if ch == "[":
                depth += 1; buf += ch
            elif ch == "]":
                depth -= 1; buf += ch
            elif ch == "," and depth == 0:
                pairs.append(buf); buf = ""
            else:
                buf += ch
        if buf.strip():
            pairs.append(buf)
        for pair in pairs:
            pair = pair.strip()
            if "=" not in pair:
                continue
            k, v = pair.split("=", 1)
            k = k.strip(); v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                v = [s.strip() for s in v[1:-1].split(",") if s.strip()]
            else:
                try: v = int(v)
                except ValueError:
                    try: v = float(v)
                    except ValueError: pass
            d[k] = v
        if d:
            out.append(d)
    return out
def _match_state(submitted: dict, expected: dict) -> tuple[int, int, list[str]]:
    """Returns (n_matched, n_expected, misses_list)."""
    matches = 0
    misses = []
    for k, ev in expected.items():
        sv = submitted.get(k)
        if sv is None:
            misses.append(f"missing '{k}' (expected {ev})")
            continue
        # Lists: check membership intersection
        if isinstance(ev, list):
            sv_list = sv if isinstance(sv, list) else [sv]
            if any(str(x).lower() in [str(y).lower() for y in sv_list] for x in ev):
                matches += 1; continue
            misses.append(f"'{k}' got {sv!r} but expected {ev!r}")
            continue
        # Numeric
        try:
            if abs(float(sv) - float(ev)) < 1e-6:
                matches += 1; continue
        except (TypeError, ValueError):
            pass
        # Normalized scalar equality (handles bool true vs "True", 1 vs "1", etc.)
        if not isinstance(sv, (list, dict)) and not isinstance(ev, (list, dict)):
            if str(sv).strip().lower() == str(ev).strip().lower():
                matches += 1; continue
        # String substring (case-insensitive)
        if isinstance(ev, str) and isinstance(sv, (str, list)):
            sv_str = sv if isinstance(sv, str) else " ".join(map(str, sv))
            if ev.lower() in sv_str.lower() or sv_str.lower() in ev.lower():
                matches += 1; continue
        if sv == ev:
            matches += 1; continue
        misses.append(f"'{k}' got {sv!r} but expected {ev!r}")
    return matches, len(expected), misses
def _match_answer(submitted_answer: str, ref_answer: str) -> tuple[bool, str]:
    """Loose match: tokenize ref_answer key terms (numbers, quoted strings),
    require they all appear in the submitted answer."""
    if not submitted_answer:
        return False, "no answer submitted"
    sub = submitted_answer.lower()
    import re
    # Extract key tokens: numbers, $X, quoted strings, ratings
    tokens = []
    for m in re.finditer(r"'([^']+)'|\"([^\"]+)\"|\$[\d,]+(?:\.\d+)?|\d+(?:\.\d+)?\s*(?:stars?|reviews?|BR|BA|sqft|/night|listings|tokens)|\d+", ref_answer):
        t = m.group(0).strip().lower().strip("'\"")
        if t and len(t) > 1:
            tokens.append(t)
    if not tokens:
        # fallback: any substring
        if ref_answer.lower() in sub or sub in ref_answer.lower():
            return True, "loose-substring match"
        return False, f"no tokens matched"
    missing = [t for t in tokens if t not in sub]
    n_match = len(tokens) - len(missing)
    if n_match >= max(1, len(tokens) * 0.6):  # 60% of tokens
        return True, f"✅ matched {n_match}/{len(tokens)} key tokens"
    return False, f"❌ matched {n_match}/{len(tokens)} key tokens ({', '.join(missing[:3])} missing)"
def verify_submission_v2(env: dict, filter_state: dict, answer: str, task_id: str | None) -> dict:
    """Verify against EITHER reference_state_change (write) AND/OR reference_answer (read).
    Returns dict with satisfies_state, satisfies_answer, overall, message, task_type."""
    if not task_id:
        return {
            "satisfies_state": False, "satisfies_answer": False,
            "overall": False, "task_type": "(none)",
            "message": "No task_id — submission recorded for inspection only.",
            "expected_state": None, "expected_answer": None,
        }
    # Look up in factory tasks first, then fall back to backend.json
    factory = SHIPPED_TASKS.get(env["env_id"], [])
    task = next((t for t in factory if t["id"] == task_id), None)
    if task:
        task_type = task.get("task_type", "write")
        ref_state = task.get("reference_state_change", "")
        ref_answer = task.get("reference_answer", "")
        # Verify state
        sat_state = True
        state_msg = ""
        if "write" in task_type:
            expected_states = _parse_ref_state(ref_state)
            if expected_states:
                results = []
                for exp in expected_states:
                    n_m, n_e, _ = _match_state(filter_state, exp)
                    results.append((n_m, n_e))
                total_match = sum(r[0] for r in results)
                total_exp = sum(r[1] for r in results) or 1
                sat_state = (total_match == total_exp)
                state_msg = f"state {total_match}/{total_exp}"
        # Verify answer
        sat_ans = True
        ans_msg = ""
        if "read" in task_type:
            if ref_answer:
                sat_ans, ans_msg = _match_answer(answer or "", ref_answer)
        overall = (sat_state if "write" in task_type else True) and (sat_ans if "read" in task_type else True)
        msg_parts = []
        if "write" in task_type:
            msg_parts.append(("✅" if sat_state else "⏳") + " " + state_msg)
        if "read" in task_type:
            msg_parts.append(("✅" if sat_ans else "⏳") + " " + ans_msg)
        message = " | ".join(msg_parts) or "no verification rules"
        return {
            "satisfies_state": sat_state, "satisfies_answer": sat_ans,
            "overall": overall, "task_type": task_type,
            "message": message,
            "expected_state": ref_state, "expected_answer": ref_answer,
        }

    # Fall back to legacy backend.json schema
    tasks = BACKENDS.get(env["env_id"], {}).get("tasks", [])
    legacy = next((t for t in tasks if t["task_id"] == task_id), None)
    if not legacy:
        return {
            "satisfies_state": False, "satisfies_answer": False,
            "overall": False, "task_type": "(unknown)",
            "message": f"Task {task_id} not found.",
            "expected_state": None, "expected_answer": None,
        }
    expected = legacy.get("expected_filter_state", {})
    n_m, n_e, misses = _match_state(filter_state, expected)
    ok = (n_m == n_e)
    return {
        "satisfies_state": ok, "satisfies_answer": True, "overall": ok,
        "task_type": "write (legacy)",
        "message": ("✅ Satisfies " + str(n_e) + " constraints" if ok else "⏳ " + str(n_m) + "/" + str(n_e) + " · " + "; ".join(misses[:2])),
        "expected_state": str(expected), "expected_answer": "",
    }
def render_result_card_html(item: dict, card_style: str = "ecommerce") -> str:
    """Render a result card in the style appropriate for the theme."""
    initial = _esc(item.get("image_initial") or (item["title"][0] if item.get("title") else "?"))
    title = _esc(item.get("title", "Item #" + str(item.get("id", "?"))))
    price_text = f'${item.get("price", ""):,}' if item.get("price") else ""
    img_url = item.get("image_url", "")
    img_alt = _esc(item.get("image_alt", title))
    iid = int(item.get("id", 0) or 0)
    def _img(css_class, fallback_html):
        if img_url:
            return f'<div class="{css_class}" style="background-image:url(\'{_esc(img_url)}\');background-size:cover;background-position:center">{fallback_html if False else ""}</div>'
        return f'<div class="{css_class}">{fallback_html}</div>'

    def _stars_html(r):
        try: r = float(r)
        except: r = 4.0
        full = int(r)
        half = 1 if (r - full) >= 0.5 else 0
        empty = 5 - full - half
        return ("★" * full) + ("⯨" if half else "") + ("☆" * empty)

    if card_style == "listing-row":
        # Real estate listing row — Realtor.com / Zillow / Redfin style
        beds = item.get("beds","?"); baths = item.get("baths","?"); sqft = item.get("sqft","")
        sqft_fmt = f'{sqft:,}' if isinstance(sqft, int) else sqft
        loc = _esc(item.get("city", ""))
        ptype = _esc(item.get("property_type", "Single-Family"))
        iid = item.get("id", 0) or 0
        dom = (iid * 3) % 45 + 1
        brokers = ["Echo Realty","Echo Partners","Echo Group Realty","Echo Max Realty","Echo Prestige","Echo Home Services"]
        broker = brokers[iid % len(brokers)]
        status_tags = []
        if item.get("is_new"): status_tags.append(('NEW', 'new'))
        if item.get("price_reduced"): status_tags.append(('Price Reduced', 'reduced'))
        if iid % 7 == 0: status_tags.append(('Pending', 'pending'))
        if item.get("pet_friendly"): status_tags.append(('Pet-Friendly', 'pet'))
        if iid % 5 == 0: status_tags.append(('Open House Sat', 'open'))
        tags_html = "".join(f'<span class="lstg-tag lstg-tag-{cls}">{_esc(lbl)}</span>' for lbl, cls in status_tags)
        photo_overlay = (f'<span class="lstg-photo-tag">{_esc(status_tags[0][0])}</span>' if status_tags else '')
        return f'''<div class="lstg-row">
          <div class="lstg-photo-wrap">
            {_img("lstg-photo", "🏠")}
            {photo_overlay}
            <button class="lstg-heart" title="Save">♡</button>
            <span class="lstg-dom">{dom} days on EchoHomes</span>
          </div>
          <div class="lstg-body">
            <div class="lstg-top">
              <div>
                <div class="lstg-price">{price_text}</div>
                <div class="lstg-stats">{beds} bd · {baths} ba · {sqft_fmt} sqft</div>
                <div class="lstg-addr">{title}</div>
                <div class="lstg-city">{loc}</div>
              </div>
              <span class="lstg-ptype">{ptype}</span>
            </div>
            <div class="lstg-tags">{tags_html}</div>
            <div class="lstg-foot">
              <span class="lstg-broker">Listed by <b>{_esc(broker)}</b> · {(dom % 9) + 1} days ago</span>
              <button class="lstg-tour">Schedule Tour</button>
            </div>
          </div>
        </div>'''

    if card_style == "apt-card":
        # Apartments.com / HotPads style
        beds = item.get("beds","?"); baths = item.get("baths","?"); sqft = item.get("sqft","")
        sqft_fmt = f'{sqft:,}' if isinstance(sqft, int) else sqft
        meta = f'{beds} BR · {baths} BA · {sqft_fmt} sqft'
        iid = item.get("id", 0) or 0
        ptype = _esc(item.get("property_type", "Apartment"))
        loc = _esc(item.get("city", ""))
        # amenity icons
        amenities = []
        if item.get("pet_friendly"): amenities.append(("🐾","Pet"))
        if item.get("has_garage"): amenities.append(("🚗","Parking"))
        if iid % 2 == 0: amenities.append(("🏊","Pool"))
        if iid % 3 == 0: amenities.append(("💪","Gym"))
        amenities.append(("🧺","W/D"))
        if iid % 4 == 0: amenities.append(("❄","A/C"))
        amen_html = "".join(f'<span class="apt-amen" title="{_esc(l)}">{i}</span>' for i,l in amenities[:5])
        avail_label = "Available Now" if iid % 3 != 0 else "Move-in Dec 1"
        avail_cls = "now" if iid % 3 != 0 else "soon"
        return f'''<div class="apt-card">
          <div class="apt-photo-wrap">
            {_img("apt-photo", "🏢")}
            <span class="apt-avail apt-avail-{avail_cls}">{avail_label}</span>
          </div>
          <div class="apt-body">
            <div class="apt-rent-row">
              <span class="apt-rent">{price_text}<span class="apt-mo">/mo</span></span>
              <span class="apt-ptype">{ptype}</span>
            </div>
            <div class="apt-name">{title}</div>
            <div class="apt-loc">📍 {loc}</div>
            <div class="apt-meta">{meta}</div>
            <div class="apt-amens">{amen_html}</div>
            <button class="apt-tour">Schedule Tour</button>
          </div>
        </div>'''

    if card_style == "stays-photo":
        # Airbnb style — large photo dominant
        rating = item.get("rating") or round(4.6 + ((item.get("id",0) % 5) * 0.07), 2)
        iid = item.get("id", 0) or 0
        reviews = 40 + (iid * 23) % 380
        city = _esc(item.get("city", "Westside, Austin"))
        # placeholder date range
        months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        m = months[iid % 12]
        d1 = (iid * 3) % 24 + 1; d2 = d1 + 6
        nights = 6
        try:
            nightly = int(item.get("price") or 0)
        except (TypeError, ValueError):
            nightly = 0
        total = nightly * nights
        total_text = f'${total:,} total' if total else ''
        return f'''<div class="stays-card">
          <div class="stays-photo-wrap">
            {_img("stays-photo", initial)}
            <button class="stays-heart" title="Save">♡</button>
            <span class="stays-badge">Guest favorite</span>
          </div>
          <div class="stays-info">
            <div class="stays-top">
              <div class="stays-name">{title}</div>
              <div class="stays-rate">★ {rating}</div>
            </div>
            <div class="stays-loc">📍 {city}</div>
            <div class="stays-sub">Superhost · {reviews} reviews</div>
            <div class="stays-dates">{m} {d1} – {d2}</div>
            <div class="stays-price"><b>{price_text}</b> night <span class="stays-total">· {total_text}</span></div>
          </div>
        </div>'''

    if card_style == "hotel-card":
        # Booking.com / Marriott style
        rating = item.get("rating") or round(7.8 + ((item.get("id",0) % 18) * 0.07), 1)
        iid = item.get("id", 0) or 0
        reviews = 200 + (iid * 87) % 2400
        score_word = "Exceptional" if rating >= 9 else "Excellent" if rating >= 8.5 else "Very Good" if rating >= 8 else "Good"
        stars = "★" * (3 + (iid % 3))  # 3-5 stars
        dist = round(0.4 + (iid % 9) * 0.3, 1)
        try:
            nightly = int(item.get("price") or 0)
        except (TypeError, ValueError):
            nightly = 0
        total = nightly * 7
        amenities = []
        if iid % 2 == 0: amenities.append(("📶","Free WiFi"))
        if iid % 3 != 0: amenities.append(("🍳","Breakfast"))
        if iid % 2 != 0: amenities.append(("🏊","Pool"))
        if iid % 4 == 0: amenities.append(("🚗","Parking"))
        amenities.append(("❄","A/C"))
        amen_html = "".join(f'<span class="hotel-amen">{i} {_esc(l)}</span>' for i,l in amenities[:4])
        urgency = '<span class="hotel-urgent">Only 2 rooms left!</span>' if iid % 3 == 0 else ''
        return f'''<div class="hotel-card">
          {_img("hotel-photo", "🏨")}
          <div class="hotel-body">
            <div class="hotel-head">
              <div>
                <div class="hotel-name">{title}</div>
                <div class="hotel-stars">{stars}</div>
                <div class="hotel-loc">📍 {_esc(item.get("city", ""))} · {dist} km from center</div>
              </div>
              <div class="hotel-score">
                <span class="hotel-score-word">{score_word}</span>
                <span class="hotel-score-num">{rating}</span>
                <span class="hotel-score-rev">{reviews:,} reviews</span>
              </div>
            </div>
            <div class="hotel-amens">{amen_html}</div>
            {urgency}
            <div class="hotel-foot">
              <div class="hotel-price-block">
                <div class="hotel-price">{price_text}<span class="hotel-night"> / night</span></div>
                <div class="hotel-total">${total:,} total for 7 nights</div>
              </div>
              <button class="hotel-reserve">Reserve</button>
            </div>
          </div>
        </div>'''

    if card_style == "game-tile":
        discount = (iid % 4 - 1) * 15
        price_val = item.get("price") or 0
        old_price = int(price_val * 100 / (100 - discount)) if discount > 0 and price_val else None
        disc_html = f'<div class="disc-tag">-{discount}%</div>' if discount > 0 else ''
        old_html = f'<span class="game-old">${old_price}</span>' if old_price else ''
        review_count = (iid * 137) % 9000 + 200
        rating = item.get("rating") or 4
        review_label = "Overwhelmingly Positive" if rating >= 4.5 else ("Very Positive" if rating >= 4 else ("Mostly Positive" if rating >= 3.5 else "Mixed"))
        return f'''<div class="game-tile">
          {_img("game-photo", "▶")}
          {disc_html}
          <div class="game-name">{title}</div>
          <div class="game-meta">{_esc(item.get("category", "Game"))}{(" · " + _esc(item.get("brand", ""))) if item.get("brand") else ""}</div>
          <div class="game-price-block">{old_html}<span class="game-price">{price_text or "Free"}</span></div>
          <div class="game-reviews">★ {rating} · <b>{review_label}</b> ({review_count:,})</div>
        </div>'''

    if card_style == "game-row":
        rating = item.get("rating") or 4
        stars = int(rating * 1000 + (iid * 37 % 800))
        forks = int(rating * 250 + (iid * 13 % 200))
        days_ago = (iid % 30) + 1
        languages = [
            ("Python", "#3572A5"), ("JavaScript", "#f1e05a"), ("TypeScript", "#3178c6"),
            ("Go", "#00ADD8"), ("Rust", "#dea584"), ("C++", "#f34b7d"), ("Ruby", "#701516"),
        ]
        lang_name, lang_color = languages[iid % len(languages)]
        topic_pool = ["ml", "agentic", "stable", "cli", "framework", "research", "fast", "async", "open-source"]
        topics = [topic_pool[(iid + i) % len(topic_pool)] for i in range(3)]
        topics_html = "".join(f'<span class="gh-topic">{_esc(tp)}</span>' for tp in topics)
        owner = _esc(item.get("brand", "user")).lower().replace(" ", "-")
        license_name = _esc(item.get("color", "MIT"))
        return f'''<div class="gh-row">
          {_img("gh-icon", "📦")}
          <div class="gh-body">
            <div class="gh-name">{owner} / <b>{title}</b></div>
            <div class="gh-desc">{_esc(item.get("category", "Open-source tool"))} — production-ready {_esc(item.get("condition", "stable"))} release</div>
            <div class="gh-topics">{topics_html}</div>
            <div class="gh-meta">
              <span><span class="gh-lang-dot" style="background:{lang_color}"></span>{lang_name}</span>
              <span>⭐ {stars:,}</span>
              <span>🍴 {forks:,}</span>
              <span>⚖ {license_name}</span>
              <span>Updated {days_ago} day{'s' if days_ago != 1 else ''} ago</span>
            </div>
          </div>
          <button class="gh-star-btn">☆ Star</button>
        </div>'''

    if card_style == "pet-card":
        breed = item.get("brand") or "Mixed"
        age = (iid % 8) + 1
        sex = "Female" if iid % 2 == 0 else "Male"
        fixed = "Spayed" if sex == "Female" else "Neutered"
        distance = round((iid * 0.37) % 12 + 0.4, 1)
        tags = []
        if iid % 2: tags.append("Good w/ cats")
        if iid % 3: tags.append("Good w/ kids")
        if iid % 5 == 0: tags.append("House-trained")
        if iid % 4 == 0: tags.append("Energetic")
        tags_html = "".join(f'<span class="pet-tag">{_esc(t)}</span>' for t in tags)
        return f'''<div class="pet-card">
          {_img("pet-photo", "🐕")}
          <div class="pet-heart">♥</div>
          <div class="pet-body">
            <div class="pet-name">{title}</div>
            <div class="pet-meta">{age} yr · {_esc(breed)} · {sex} · {fixed}</div>
            <div class="pet-loc">📍 {_esc(item.get("city", "Local shelter"))}</div>
            <div class="pet-dist">Distance: {distance} miles</div>
            <div class="pet-tags">{tags_html}</div>
          </div>
        </div>'''

    if card_style == "event-tile":
        months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
        dows = ["MON","TUE","WED","THU","FRI","SAT","SUN"]
        m = months[iid % 12]
        d = (iid % 28) + 1
        dow = dows[iid % 7]
        time_str = f"{(iid % 11) + 7}:{['00','30'][iid % 2]} PM"
        attending = (iid * 73) % 4800 + 120
        is_free = (iid % 5 == 0) or not price_text
        price_html = f'<div class="event-price-tag free">Free</div>' if is_free else f'<div class="event-price-tag">{price_text}</div>'
        venue = _esc(item.get("brand") or item.get("city", "Venue"))
        return f'''<div class="event-tile">
          {_img("event-photo", "")}
          <div class="event-date">
            <div class="event-month">{m}</div>
            <div class="event-day">{d}</div>
            <div class="event-dow">{dow}</div>
          </div>
          {price_html}
          <div class="event-heart">♥</div>
          <div class="event-body">
            <div class="event-name">{title}</div>
            <div class="event-meta">{dow.title()}, {m} {d} · {time_str}</div>
            <div class="event-venue">{venue} · {_esc(item.get("city", ""))}</div>
            <div class="event-attending">👥 {attending:,} attending</div>
          </div>
        </div>'''

    if card_style == "job-row":
        iid = item.get("id", 0) or 0
        applicants = 6 + (iid * 7) % 90
        match = 60 + (iid * 13) % 40
        posted_days = (iid % 14)
        posted_text = "Just posted" if posted_days == 0 else (f"{posted_days}d ago")
        remote = "Remote-friendly" if iid % 2 == 0 else "On-site"
        is_verified = iid % 3 != 0
        salary_max = (item.get("price") or 0) + 15000 + (iid % 5) * 4000
        salary_range = f'${item.get("price"):,} – ${salary_max:,} /yr' if item.get("price") else 'Salary not disclosed'
        logo_inner = (
            f'<div class="job-logo" style="background-image:url(\'{_esc(img_url)}\');background-size:cover;background-position:center"></div>'
            if img_url else f'<div class="job-logo">{initial}</div>'
        )
        verified = ' <span class="job-verified" title="Verified employer">✓</span>' if is_verified else ''
        match_badge = f'<span class="job-match">{match}% match</span>' if match >= 75 else ''
        return f'''<div class="job-row">
          {logo_inner}
          <div class="job-body">
            <div class="job-title-row">
              <a class="job-title">{title}</a>
              {match_badge}
            </div>
            <div class="job-co">{_esc(item.get("brand", "Company"))}{verified} · <span class="job-rating">★ 4.{(iid%9)+1}</span></div>
            <div class="job-meta">📍 {_esc(item.get("city", "Remote"))} · {_esc(item.get("category", "Full-time"))} · {remote}</div>
            <div class="job-salary">💰 {salary_range}</div>
            <div class="job-foot">
              <span class="job-posted">🕒 {posted_text}</span>
              <span class="job-urgent">👥 {applicants} applicants in last 24h</span>
              <span class="job-easy">⚡ Easy apply</span>
            </div>
          </div>
          <div class="job-actions">
            <button class="job-save" title="Save">♡</button>
            <button class="job-apply">Apply now</button>
          </div>
        </div>'''

    if card_style == "flight-row":
        iid = item.get("id", 0) or 0
        airline = _esc(item.get("airline", "Aerolink"))
        dep_time = _esc(item.get("departure_time") or item.get("arrival_time", "08:15"))
        # synthesize a plausible arrival time for display
        try:
            h, mn = dep_time.split(":")
            dur = item.get("duration", "1h 30m")
            dh = int((dur.split("h")[0] or "1"))
            arr_h = (int(h) + dh) % 24
            arr_time = f"{arr_h:02d}:{mn}"
        except Exception:
            arr_time = "09:45"
        from_code = _esc(item.get("from_code", "KUL"))
        to_code = _esc(item.get("to_code", "LGK"))
        from_name = _esc(item.get("from_name", ""))
        to_name = _esc(item.get("to_name", ""))
        duration = _esc(item.get("duration", "1h 30m"))
        stops = _esc(item.get("stops", "nonstop"))
        aircraft = ["Airbus A320","Boeing 737-800","Airbus A321neo","Boeing 787-9","Airbus A330"][iid % 5]
        on_time = 78 + (iid * 7) % 20
        cheap_badge = '<span class="ft-badge ft-cheap">Lowest price</span>' if iid % 6 == 0 else ''
        ontime_badge = f'<span class="ft-badge ft-ontime">On time {on_time}%</span>'
        return f'''<div class="flight-row">
          <div class="flight-airline">
            <div class="ft-logo">✈</div>
            <div>
              <div class="ft-airname">{airline}</div>
              <div class="ft-flightno">{airline[:2].upper()} {1000 + (iid*37) % 8999}</div>
            </div>
          </div>
          <div class="flight-times">
            <div class="ft-end">
              <div class="ft-time">{dep_time}</div>
              <div class="ft-code">{from_code}</div>
              <div class="ft-city">{from_name}</div>
            </div>
            <div class="ft-mid">
              <div class="ft-dur">{duration}</div>
              <div class="ft-line"><span></span></div>
              <div class="ft-stops">{stops}</div>
            </div>
            <div class="ft-end">
              <div class="ft-time">{arr_time}</div>
              <div class="ft-code">{to_code}</div>
              <div class="ft-city">{to_name}</div>
            </div>
          </div>
          <div class="flight-extras">
            <div class="ft-aircraft">{aircraft} · Economy</div>
            <div class="ft-icons">🧳 🍽 📶 💺</div>
            <div class="ft-badges">{cheap_badge}{ontime_badge}</div>
          </div>
          <div class="flight-actions">
            <div class="flight-price">{price_text}</div>
            <div class="ft-per">per passenger</div>
            <button class="flight-book">Select</button>
          </div>
        </div>'''

    if card_style == "tile":
        rating = item.get("rating")
        rating_text = f' · ★ {rating}' if rating else ''
        price_val = item.get("price") or 0
        show_was = iid % 3 == 0 and price_val
        was_html = f'<span class="tile-was">${int(price_val * 1.3):,}</span>' if show_was else ''
        ship_html = '<div class="tile-ship">FREE shipping</div>' if iid % 2 == 0 else ''
        swatch_colors = ["#222", "#c44", "#5a8ec9", "#d6c28a", "#5e8c5e"]
        swatches_html = ""
        if iid % 4 in (0, 2):
            count = (iid % 3) + 2
            swatches_html = '<div class="tile-swatches">' + "".join(
                f'<span class="tile-swatch" style="background:{swatch_colors[(iid + k) % len(swatch_colors)]}"></span>'
                for k in range(count)
            ) + '</div>'
        brand_html = f'<span class="tile-brand">{_esc(item.get("brand"))}</span>' if item.get("brand") else ''
        return f'''<div class="tile-card">
          {_img("tile-photo", initial)}
          <div class="tile-heart">♥</div>
          {brand_html}
          <div class="tile-name">{title}</div>
          <div class="tile-price-row"><span class="tile-price">{price_text}</span>{was_html}</div>
          <div class="tile-meta">By {_esc(item.get("brand", "Seller"))}{rating_text}</div>
          {swatches_html}
          {ship_html}
        </div>'''

    if card_style == "article-row":
        iid = item.get("id", 0) or 0
        topic = _esc(item.get("color") or item.get("category") or "Science")
        comments = 12 + (iid * 17) % 240
        read_min = 3 + (iid % 8)
        days_ago = 1 + (iid % 21)
        author = _esc(item.get("brand") or "Staff Writer")
        cat = _esc(item.get("category") or "Research")
        summaries = [
            "Researchers report a new technique that improves measurement precision by roughly an order of magnitude, with implications for quantum sensing and next-generation interferometry.",
            "A multi-institution team has published evidence that may reshape how the community thinks about this long-standing problem, prompting follow-up experiments already underway at three facilities.",
            "The findings, peer-reviewed and released this week, push the boundary of what has been observed so far and challenge several widely held assumptions in the field.",
            "Using a novel apparatus described in the paper, the group demonstrates a phenomenon previously thought to require far more exotic conditions.",
        ]
        summary = summaries[iid % len(summaries)]
        thumb = (
            f'<div class="article-thumb" style="background-image:url(\'{_esc(img_url)}\');background-size:cover;background-position:center"></div>'
            if img_url else f'<div class="article-thumb-fb">{initial}</div>'
        )
        return f'''<div class="article-row">
          <div class="article-main">
            <div class="article-tagrow"><span class="article-topic">{topic}</span> · <span class="article-cat">{cat}</span></div>
            <a class="article-title">{title}</a>
            <div class="article-summary">{summary}</div>
            <div class="article-meta">
              <span>By {author}</span>
              <span>· {days_ago}d ago</span>
              <span>· {read_min} min read</span>
            </div>
            <div class="article-actions">
              <a class="article-action">💬 Comments ({comments})</a>
              <a class="article-action">🔖 Bookmark</a>
              <a class="article-action">↗ Share</a>
            </div>
          </div>
          {thumb}
        </div>'''

    if card_style == "calc-result":
        iid = item.get("id", 0) or 0
        principal = item.get("price") or (5000 + iid * 1500)
        years = 5 + (iid % 20)
        rate = 4 + (iid % 8)
        final = int(principal * ((1 + rate/100) ** years))
        scenario = title or f"Scenario {iid}"
        return f'''<div class="calc-scenario">
          <div class="cs-head">
            <div class="cs-name">{_esc(scenario)}</div>
            <span class="cs-tag">Saved</span>
          </div>
          <div class="cs-total">${final:,}</div>
          <div class="cs-sub">Projected value after {years} yrs · {rate}% APY</div>
          <div class="cs-kv"><span>Principal</span><b>${principal:,}</b></div>
          <div class="cs-kv"><span>Compounding</span><b>Quarterly</b></div>
          <div class="cs-actions">
            <button class="cs-btn">Edit</button>
            <button class="cs-btn">Duplicate</button>
            <button class="cs-btn ghost">Delete</button>
          </div>
        </div>'''

    # Default ecommerce (BestBuy / Amazon style)
    rating = item.get("rating") or 4.3
    stars_html = _stars_html(rating)
    reviews_count = (iid * 137) % 4800 + 47
    price_val = item.get("price") or 0
    discount_pct = (iid % 4) * 5
    was_html = ""
    save_html = ""
    if discount_pct > 0 and price_val:
        was_val = int(price_val * 100 / (100 - discount_pct))
        save_amt = was_val - price_val
        was_html = f'<span class="result-was">${was_val:,}</span>'
        save_html = f'<span class="result-save">Save ${save_amt:,}</span>'
    brand_html = f'<div class="result-brand">{_esc(item.get("brand"))}</div>' if item.get("brand") else ""
    cat_html = f'<div class="result-meta">{_esc(item.get("category"))}</div>' if item.get("category") else ""
    tags = []
    if item.get("free_shipping") or iid % 2 == 0:
        tags.append(('ship', 'FREE Shipping'))
    if iid % 3 == 0:
        tags.append(('', 'Prime'))
    if item.get("in_stock") is True or iid % 5 != 0:
        tags.append(('stock', 'In Stock'))
    if item.get("is_new"):
        tags.append(('', 'NEW'))
    tags_html = ('<div class="result-tags">' + "".join(
        f'<span class="result-tag {cls}">{_esc(label)}</span>' for cls, label in tags
    ) + '</div>') if tags else ''
    return f'''<div class="result-card">
      {_img("result-thumb", initial)}
      <div class="result-body">
        {brand_html}
        <div class="result-name">{title}</div>
        {cat_html}
        <div class="result-rating-row"><span class="result-stars">{stars_html}</span> <span>{rating}</span> <span class="result-reviews">({reviews_count:,})</span></div>
        <div class="result-price-row">{was_html}<span class="result-price">{price_text}</span>{save_html}</div>
        {tags_html}
        <button class="result-cta">Add to Cart</button>
      </div>
    </div>'''


# ---------------------------------------------------------------------------
# App + DB
# ---------------------------------------------------------------------------
_db_path: str = ""
_active_task_id: str = ""
_active_env_id: str = ""

app = FastAPI(title=f"NF widget backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def init_db(db_path: str):
    conn = sqlite3.connect(db_path)
    # DROP + CREATE — guarantee fresh schema regardless of what was in seed.db
    conn.execute("DROP TABLE IF EXISTS submissions")
    conn.execute(
        """
        CREATE TABLE submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            env_id TEXT NOT NULL,
            task_id TEXT,
            timestamp TEXT NOT NULL,
            filter_state_str TEXT,
            filter_state_json TEXT,
            answer TEXT,
            expected_state_json TEXT,
            satisfies INTEGER DEFAULT 0
        )
        """
    )
    conn.commit()
    conn.close()


def _flatten_filter_state(fs: dict) -> str:
    """Render filter_state as `key1=val1, key2=[a, b]` so sqldiff INSERTs are
    legible to the LLM verifier (matches the ref_state_change format).

    Empty values (None, empty list, empty string) are skipped so they don't
    add noise to the diff (which would confuse the LLM judge).
    """
    if not isinstance(fs, dict) or not fs:
        return ""
    parts = []
    for k, v in fs.items():
        if v is None:
            continue
        if isinstance(v, list):
            if not v:
                continue
            parts.append(f"{k}=[{', '.join(str(x) for x in v)}]")
        elif isinstance(v, str):
            if not v:
                continue
            parts.append(f"{k}={v}")
        else:
            parts.append(f"{k}={v}")
    return "filter_state: " + ", ".join(parts) if parts else ""


def db_conn() -> sqlite3.Connection:
    return sqlite3.connect(_db_path)


# ---------------------------------------------------------------------------
# Routes — match what the frontend HTML expects (/env/<env_id>/api/...)
# ---------------------------------------------------------------------------
@app.get("/", response_class=HTMLResponse)
def root():
    eid = _active_env_id
    if not eid:
        return HTMLResponse("<h1>No active env</h1>", status_code=500)
    fp = FRONTEND_BASE / eid / "index.html"
    if not fp.exists():
        return HTMLResponse(f"<h1>Frontend not found: {eid}</h1>", status_code=404)
    return HTMLResponse(fp.read_text())


@app.get("/env/{env_id}", response_class=HTMLResponse)
def env_root(env_id: str):
    fp = _safe_path(FRONTEND_BASE, env_id, "index.html")
    if fp is None or not fp.exists():
        raise HTTPException(404, f"Frontend not found: {env_id}")
    return HTMLResponse(fp.read_text())


@app.get("/browse", response_class=HTMLResponse)
def browse():
    """Landing page that lists every widget scenario (grouped by family) with links —
    a datepicker-style click-through. Does not affect the eval `/` (active-task) flow."""
    from collections import defaultdict
    fam: dict[str, list[str]] = defaultdict(list)
    for eid in sorted(ENVS):
        fam[eid.split("_")[0]].append(eid)
    rows = []
    for f in sorted(fam):
        tiles = "".join(
            f'<a class="tile" href="/env/{e}">{e}<span>{len(SHIPPED_TASKS.get(e, []))} tasks</span></a>'
            for e in sorted(fam[f])
        )
        rows.append(f'<div class="fam"><h2>{f}</h2><div class="grid">{tiles}</div></div>')
    page = (
        "<!doctype html><meta charset=utf-8><title>Nested-Filter — Browse</title>"
        "<style>body{font-family:-apple-system,Segoe UI,Arial,sans-serif;margin:24px;background:#f6f8fa}"
        "h1{font-size:22px}h2{font-size:15px;margin:18px 0 6px;color:#0b6bcb}"
        ".grid{display:flex;flex-wrap:wrap;gap:8px}"
        ".tile{display:flex;flex-direction:column;padding:8px 12px;background:#fff;border:1px solid #d0d7de;"
        "border-radius:8px;text-decoration:none;color:#1f2430;font-size:13px}"
        ".tile span{font-size:11px;color:#57606a}.tile:hover{border-color:#0b6bcb}</style>"
        f"<h1>Nested-Filter — {len(ENVS)} widget scenarios (click to open)</h1>" + "".join(rows)
    )
    return HTMLResponse(page)






def _render_hard_review_nf(hard_name, src_name, title, graded_note):
    import json as _json
    from collections import Counter
    root = WIDGET_DIR
    p = root / "tasks" / hard_name
    if not p.is_file():
        return HTMLResponse(f"<h1>{hard_name} not found</h1>", status_code=404)
    rows = [_json.loads(l) for l in p.read_text().splitlines() if l.strip()]
    src = {}
    sp = root / "tasks" / src_name
    if sp.is_file():
        for l in sp.read_text().splitlines():
            if l.strip():
                r = _json.loads(l); src[r["id"]] = r.get("goal", "")

    def esc(s):
        return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    color = {"derivation": "#cf222e", "budget": "#8250df", "framing": "#0969da",
             "synonym": "#1a7f37", "paraphrase": "#9a6700", "verbatim": "#57606a",
             "first_person": "#0969da"}
    trs = []
    for i, r in enumerate(rows, 1):
        tid = r["id"]; env_id = r.get("env_id", ""); mode = r.get("_hard_mode", "")
        before = src.get(r.get("_source_id", ""), "")
        canon = _json.dumps(r.get("canonical_filter_state", {}), ensure_ascii=False)
        trs.append(
            f'<tr data-txt="{esc((r.get("goal","")+" "+before+" "+env_id+" "+r.get("widget_category","")+" "+mode).lower())}">'
            f'<td class=idx>{i}</td>'
            f'<td class=tid><code>{esc(tid)}</code></td>'
            f'<td class=before>{esc(before)}</td>'
            f'<td class=goal>{esc(r.get("goal",""))}</td>'
            f'<td><span class=b style="background:{color.get(mode,"#57606a")}">{esc(mode)}</span></td>'
            f'<td>{esc(r.get("widget_category",""))}</td>'
            f'<td class=exp><code>{esc(canon)}</code></td>'
            f'<td><a class=open href="/env/{env_id}?task_id={tid}" target=_blank>open &#9658;</a></td></tr>'
        )
    modec = Counter(r.get("_hard_mode", "?") for r in rows)
    summary = (f"<b>{len(rows)}</b> hard in-dist tasks (literal handoff -> derived/natural) &nbsp;·&nbsp; "
               + ", ".join(f"{k} {v}" for k, v in modec.most_common())
               + f" &nbsp;·&nbsp; grader byte-identical · {graded_note}")
    page = (
        "<!doctype html><meta charset=utf-8><title>" + esc(title) + "</title>"
        "<style>body{font-family:-apple-system,Segoe UI,Arial,sans-serif;margin:20px;background:#f6f8fa;color:#1f2430}"
        "h1{font-size:20px;margin:0 0 4px}.meta{color:#57606a;font-size:13px;margin-bottom:12px}"
        "#q{width:360px;padding:7px 10px;border:1px solid #d0d7de;border-radius:8px;font-size:13px;margin-bottom:10px}"
        "table{border-collapse:collapse;width:100%;background:#fff;font-size:13px}"
        "th,td{border:1px solid #eaeef2;padding:6px 9px;text-align:left;vertical-align:top}"
        "th{background:#f0f3f6;position:sticky;top:0;font-size:12px}.idx{color:#8b949e;width:30px}"
        ".tid code{font-size:11px}.before{max-width:300px;color:#8b949e}.goal{max-width:380px}"
        ".exp code{background:#eef;padding:1px 5px;border-radius:4px;font-size:11px}"
        ".b{color:#fff;padding:1px 7px;border-radius:10px;font-size:11px}"
        "a.open{color:#0b6bcb;font-weight:600;text-decoration:none;white-space:nowrap}tr:hover{background:#fbfdff}</style>"
        f"<h1>{esc(title)} (<code>{hard_name}</code>)</h1>"
        f"<div class=meta>{summary}</div>"
        "<input id=q placeholder='filter by goal / before / scenario / family / mode …' oninput=\"var v=this.value.toLowerCase();document.querySelectorAll('tbody tr').forEach(function(r){r.style.display=r.dataset.txt.indexOf(v)>-1?'':'none';});\">"
        "<table><thead><tr><th>#</th><th>id</th><th>before (source goal)</th><th>after (hard goal)</th><th>mode</th><th>family</th><th>canonical filter_state</th><th></th></tr></thead>"
        f"<tbody>{''.join(trs)}</tbody></table>"
    )
    return HTMLResponse(page)


@app.post("/env/{env_id}/api/filter")
def env_filter(env_id: str, body: dict = Body(...)) -> JSONResponse:
    if env_id not in ENVS:
        raise HTTPException(404, f"Env {env_id} not found")
    filter_state = body.get("filter_state", {})
    results = apply_filter(ENVS[env_id], filter_state)
    card_style = ENVS[env_id].get("theme_card", "ecommerce")
    try:
        html_cards = "".join(render_result_card_html(r, card_style) for r in results[:24])
    except Exception:
        html_cards = ""
    return JSONResponse({
        "env_id": env_id,
        "applied": filter_state,
        "results": results,
        "count": len(results),
        "html_cards": html_cards,
    })


@app.post("/env/{env_id}/api/submit")
def env_submit(env_id: str, body: dict = Body(...)) -> JSONResponse:
    if env_id not in ENVS:
        raise HTTPException(404, f"Env {env_id} not found")
    filter_state = body.get("filter_state", {})
    answer = body.get("answer", "")
    task_id = body.get("task_id") or _active_task_id
    res = verify_submission_v2(ENVS[env_id], filter_state, answer, task_id)
    # Strategy: maintain a single CURRENT row per task_id reflecting the agent's
    # latest state. Plus track BEST_SO_FAR row that previously satisfied, so an
    # accidental overwrite doesn't invalidate a once-satisfying submit.
    try:
        with db_conn() as c:
            # Always upsert "CURRENT" row
            c.execute("DELETE FROM submissions WHERE task_id = ? AND timestamp LIKE 'CURRENT%'", (task_id,))
            c.execute(
                "INSERT INTO submissions(env_id, task_id, timestamp, filter_state_str, filter_state_json, answer, expected_state_json, satisfies) VALUES(?,?,?,?,?,?,?,?)",
                (
                    env_id,
                    task_id,
                    f"CURRENT-{datetime.datetime.utcnow().isoformat()}",
                    _flatten_filter_state(filter_state),
                    json.dumps(filter_state),
                    answer,
                    json.dumps({
                        "expected_state": res["expected_state"],
                        "expected_answer": res["expected_answer"],
                    }),
                    int(res["overall"]),
                ),
            )
            # If satisfies, also write a BEST_SO_FAR sentinel
            if res["overall"]:
                c.execute("DELETE FROM submissions WHERE task_id = ? AND timestamp LIKE 'BEST%'", (task_id,))
                c.execute(
                    "INSERT INTO submissions(env_id, task_id, timestamp, filter_state_str, filter_state_json, answer, expected_state_json, satisfies) VALUES(?,?,?,?,?,?,?,?)",
                    (
                        env_id,
                        task_id,
                        f"BEST-{datetime.datetime.utcnow().isoformat()}",
                        _flatten_filter_state(filter_state),
                        json.dumps(filter_state),
                        answer,
                        json.dumps({
                            "expected_state": res["expected_state"],
                            "expected_answer": res["expected_answer"],
                        }),
                        1,
                    ),
                )
            c.commit()
    except Exception as e:
        print(f"DB write failed: {e}", file=sys.stderr)
    return JSONResponse({
        "env_id": env_id,
        "task_id": task_id,
        "filter_state": filter_state,
        "answer": answer,
        "task_type": res["task_type"],
        "expected_state": res["expected_state"],
        "expected_answer": res["expected_answer"],
        "satisfies_state": res["satisfies_state"],
        "satisfies_answer": res["satisfies_answer"],
        "satisfies": res["overall"],
        "message": res["message"],
        "results_count": len(apply_filter(ENVS[env_id], filter_state)),
    })


@app.get("/env/{env_id}/api/tasks")
def env_tasks(env_id: str) -> JSONResponse:
    if env_id not in ENVS:
        raise HTTPException(404, f"Env {env_id} not found")
    return JSONResponse({"env_id": env_id, "tasks": SHIPPED_TASKS.get(env_id, [])})


@app.get("/env/{env_id}/api/task/{task_id}")
def env_task(env_id: str, task_id: str) -> JSONResponse:
    if env_id not in ENVS:
        raise HTTPException(404, f"Env {env_id} not found")
    for t in SHIPPED_TASKS.get(env_id, []):
        if t.get("id") == task_id or t.get("task_id") == task_id:
            return JSONResponse(t)
    raise HTTPException(404, f"Task {task_id} not in {env_id}")


@app.get("/env/{env_id}/api/seed")
def env_seed(env_id: str) -> JSONResponse:
    if env_id not in ENVS:
        raise HTTPException(404, f"Env {env_id} not found")
    return JSONResponse({"env_id": env_id, "items": SEEDS.get(env_id, [])})


def _render_task_list() -> str:
    """Datepicker-style flat listing of every task across all scenarios, with
    per-task pass status from the submissions table. Served by the catch-all
    for any unmatched path (e.g. /review)."""
    satisfied: set[str] = set()
    attempted: set[str] = set()
    try:
        with db_conn() as c:
            for tid, sat in c.execute(
                "SELECT task_id, MAX(satisfies) FROM submissions GROUP BY task_id"
            ).fetchall():
                if tid is None:
                    continue
                attempted.add(tid)
                if sat:
                    satisfied.add(tid)
    except Exception:
        pass

    families: dict[str, list[dict]] = {}
    for eid in sorted(ENVS):
        for t in SHIPPED_TASKS.get(eid, []):
            families.setdefault(eid.split("_")[0], []).append(t)

    total = passed = tried = pending = 0
    body_rows = []
    for fam in sorted(families):
        for t in sorted(families[fam], key=lambda x: str(x.get("id", ""))):
            tid = str(t.get("id", ""))
            eid = str(t.get("env_id", ""))
            widget = str(t.get("widget_id", "") or t.get("widget_category", "") or "")
            goal = str(t.get("goal") or "")
            ttype = str(t.get("task_type", "") or "")
            diff = str(t.get("difficulty", "") or "")
            total += 1
            if tid in satisfied:
                cls, label = "c", "pass"
                passed += 1
            elif tid in attempted:
                cls, label = "f", "attempted"
                tried += 1
            else:
                cls, label = "p", "pending"
                pending += 1
            txt = _esc((tid + " " + fam + " " + widget + " " + goal + " " + label).lower())
            body_rows.append(
                '<tr class="' + cls + '" data-txt="' + txt + '">'
                + '<td><span class="dot d' + cls + '"></span><code>' + _esc(tid) + '</code></td>'
                + '<td>' + _esc(fam) + '</td><td>' + _esc(widget) + '</td>'
                + '<td class="goal">' + _esc(goal) + '</td>'
                + '<td>' + _esc(ttype) + '</td><td>' + _esc(diff) + '</td>'
                + '<td>' + label + '</td>'
                + '<td><a class="open" href="/env/' + _esc(eid) + '?task_id=' + _esc(tid)
                + '" target="_blank">open &#9658;</a></td></tr>'
            )

    css = (
        "<style>"
        ":root{--bg:#0f172a;--card:#1e293b;--text:#e2e8f0;--accent:#38bdf8;--muted:#94a3b8;--green:#22c55e;--red:#ef4444}"
        "*{margin:0;padding:0;box-sizing:border-box}"
        "body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:32px;max-width:1200px;margin:0 auto}"
        "h1{color:var(--accent);margin-bottom:4px;font-size:1.6rem}"
        ".sub{color:var(--muted);margin-bottom:20px;font-size:.85rem}"
        ".nav{margin-bottom:18px;display:flex;gap:12px}"
        ".nav a{color:var(--accent);font-size:.8rem;text-decoration:none;border:1px solid #334155;padding:4px 12px;border-radius:6px}"
        ".nav a:hover{background:#1e293b}"
        ".bar{display:flex;gap:28px;margin-bottom:18px;padding:14px 22px;background:var(--card);border-radius:10px;align-items:center;flex-wrap:wrap}"
        ".s-num{font-size:1.7rem;font-weight:700;color:var(--accent);line-height:1}"
        ".s-label{font-size:.68rem;color:var(--muted);margin-top:2px;text-transform:uppercase;letter-spacing:.5px}"
        "input#q{width:100%;margin-bottom:14px;padding:8px 12px;background:var(--card);border:1px solid #334155;border-radius:8px;color:var(--text);font-size:.85rem}"
        "table{width:100%;border-collapse:collapse;background:var(--card);border-radius:10px;overflow:hidden}"
        "th{padding:8px 12px;text-align:left;font-size:.73rem;color:var(--muted);font-weight:600;background:#162032;border-bottom:1px solid #334155}"
        "td{padding:7px 12px;font-size:.82rem;border-bottom:1px solid #1a2332;vertical-align:top}"
        "code{font-size:11px}.goal{max-width:460px;color:#cbd5e1}"
        "tr.p td{color:#64748b}tr.c{background:rgba(34,197,94,.06)}tr.f{background:rgba(239,68,68,.06)}"
        ".dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px}"
        ".dc{background:var(--green)}.df{background:var(--red)}.dp{background:rgba(148,163,184,.4)}"
        "a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}"
        "</style>"
    )
    summary = (
        '<div class="bar">'
        + '<div><div class="s-num">' + str(total) + '</div><div class="s-label">tasks</div></div>'
        + '<div><div class="s-num">' + str(len(ENVS)) + '</div><div class="s-label">scenarios</div></div>'
        + '<div><div class="s-num">' + str(passed) + '</div><div class="s-label">pass</div></div>'
        + '<div><div class="s-num">' + str(tried) + '</div><div class="s-label">attempted</div></div>'
        + '<div><div class="s-num">' + str(pending) + '</div><div class="s-label">pending</div></div>'
        + '</div>'
    )
    filt = (
        "<input id=q placeholder='filter by id / family / widget / goal / status …' "
        "oninput=\"var v=this.value.toLowerCase();document.querySelectorAll('tbody tr')"
        ".forEach(function(r){r.style.display=r.dataset.txt.indexOf(v)>-1?'':'none';});\">"
    )
    table = (
        "<table><thead><tr><th>task id</th><th>family</th><th>widget</th><th>goal</th>"
        "<th>type</th><th>difficulty</th><th>status</th><th></th></tr></thead><tbody>"
        + "".join(body_rows) + "</tbody></table>"
    )
    return (
        "<!DOCTYPE html><html lang=en><head><meta charset=UTF-8>"
        "<meta name=viewport content='width=device-width,initial-scale=1'>"
        "<title>Nested-Filter — Tasks</title>" + css + "</head><body>"
        "<h1>Nested-Filter — Tasks</h1>"
        "<div class=sub>" + str(total) + " tasks across " + str(len(ENVS))
        + " widget scenarios · pass status is live from this run's submissions</div>"
        "<div class=nav><a href='/browse'>Scenario browse</a></div>"
        + summary + filt + table
        + "</body></html>"
    )


@app.get("/{full_path:path}", response_class=HTMLResponse)
def serve_catch_all(full_path: str):
    """Datepicker-style fallback: any unmatched path (e.g. /review) renders the
    flat task listing. The specific routes declared above take precedence."""
    return HTMLResponse(_render_task_list())


# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--port", type=int, default=5500)
    parser.add_argument("--db", type=str, default="")
    parser.add_argument("--task", type=str, required=True)
    args = parser.parse_args()

    global _db_path, _active_task_id, _active_env_id
    _active_task_id = args.task
    # Derive env_id from task_id e.g. "W01_E01_T001" → "W01_E01"
    parts = _active_task_id.split("_")
    if len(parts) >= 2:
        _active_env_id = "_".join(parts[:2])
    if _active_env_id not in ENVS:
        print(f"Warning: env_id {_active_env_id} not found in ENVS, available: {list(ENVS.keys())[:5]}...", file=sys.stderr)

    _db_path = args.db if args.db else str(WIDGET_DIR / "seed.db")
    init_db(_db_path)

    print(f"Backend: task={_active_task_id} env={_active_env_id} db={_db_path} port={args.port}")
    uvicorn.run(app, host=args.host, port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
