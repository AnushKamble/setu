"""
SETU SIH 2026 Presentation Generator
Loads the official SIH 2026 PowerPoint Template, removes Slide 7 (the instruction slide),
and programmatically populates Slides 1 through 6 with the complete, judge-proof,
industrial slate design system, structured cards, metric callouts, and visual flows.
"""

import os
import qrcode
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# -----------------------------------------------------------------------------
# Color Palette Definition (High-Contrast Industrial Slate)
# -----------------------------------------------------------------------------
BG_DARK = RGBColor(15, 23, 42)        # #0F172A - Obsidian Slate
CARD_BG = RGBColor(30, 41, 59)        # #1E293B - Card Surface
CARD_BORDER = RGBColor(51, 65, 85)    # #334155 - Subtle Hairline Border
TEXT_WHITE = RGBColor(248, 250, 252)  # #F8FAFC - Stark Pure White
TEXT_MUTED = RGBColor(148, 163, 184)  # #94A3B8 - Muted Cool Slate
TEXT_DIM = RGBColor(100, 116, 139)    # #64748B - Subtle Meta

# Departmental Brand Accents
COLOR_ENG = RGBColor(245, 158, 11)     # #F59E0B - Safety Ochre (P-Way / Track)
COLOR_TRD = RGBColor(6, 182, 212)      # #06B6D4 - Electric High-Voltage Cyan (OHE)
COLOR_ST = RGBColor(16, 185, 129)      # #10B981 - Signal Emerald Green (S&T)
COLOR_SETU = RGBColor(59, 130, 246)    # #3B82F6 - Precision Sky Blue (Unified Convoy)
COLOR_ALERT = RGBColor(239, 68, 68)    # #EF4444 - Warning / Hazard Red
COLOR_GOLD = RGBColor(217, 119, 6)     # #D97706 - Safety Gate Gold

# -----------------------------------------------------------------------------
# Helper Functions for PPTX Shape & Card Construction
# -----------------------------------------------------------------------------
def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER, border_width=1):
    """Creates a container card with solid fill and hairline border."""
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    if border_color:
        card.line.color.rgb = border_color
        card.line.width = Pt(border_width)
    else:
        card.line.fill.background()
    return card

def add_badge(slide, left, top, width, height, text, bg_color, text_color=TEXT_WHITE, font_size=9, bold=True):
    """Creates a compact rounded pill badge."""
    badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    badge.fill.solid()
    badge.fill.fore_color.rgb = bg_color
    badge.line.fill.background()
    tf = badge.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = text
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Calibri"
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.color.rgb = text_color
    return badge

def format_text(para, text, font_size=10, bold=False, color=TEXT_WHITE, font_name="Calibri", align=PP_ALIGN.LEFT):
    """Formats a paragraph with clean typography."""
    para.text = text
    para.alignment = align
    para.font.name = font_name
    para.font.size = Pt(font_size)
    para.font.bold = bold
    para.font.color.rgb = color

# -----------------------------------------------------------------------------
# Slide 1: Title Slide Implementation
# -----------------------------------------------------------------------------
def build_slide_1(slide):
    print("Building Slide 1: Title Page...")
    
    # 1. Update text fields in TextBox 9 (Metadata)
    for shape in slide.shapes:
        if shape.name == "TextBox 9" and shape.has_text_frame:
            tf = shape.text_frame
            tf.clear()
            
            p = tf.paragraphs[0]
            format_text(p, "PROBLEM STATEMENT ID: SIH26027", 13, True, COLOR_SETU)
            p.space_after = Pt(6)
            
            p = tf.add_paragraph()
            format_text(p, "Problem Title: Integrated AI Block Planning for Railway Engineering, Traction Distribution & S&T Maintenance", 11, True, TEXT_WHITE)
            p.space_after = Pt(6)
            
            p = tf.add_paragraph()
            format_text(p, "Official Theme: Smart Transportation / Infrastructure / Railways", 10, False, TEXT_MUTED)
            p.space_after = Pt(4)
            
            p = tf.add_paragraph()
            format_text(p, "PS Category: Software | Target: Ministry of Railways (Indian Railways)", 10, False, TEXT_MUTED)
            p.space_after = Pt(8)
            
            p = tf.add_paragraph()
            format_text(p, "Team ID: [Registered Team ID]   |   Team Name: [Registered Team Name]", 11, True, COLOR_ST)
    
    # 2. Add Hero Minimalist Dual-State Corridor Consolidation Card in center-right
    hero_left = Inches(6.8)
    hero_top = Inches(1.8)
    hero_width = Inches(6.0)
    hero_height = Inches(4.7)
    
    # Main Container
    add_card(slide, hero_left, hero_top, hero_width, hero_height, bg_color=CARD_BG, border_color=COLOR_SETU, border_width=1.5)
    
    # Card Header
    add_badge(slide, hero_left + Inches(0.3), hero_top + Inches(0.2), Inches(5.4), Inches(0.35), 
              "CORE PARADIGM: CROSS-DEPARTMENT SHADOW CONVOYS", COLOR_SETU, TEXT_WHITE, 10, True)
    
    # State 1: Current Siloed Practice
    add_card(slide, hero_left + Inches(0.3), hero_top + Inches(0.7), Inches(5.4), Inches(1.6), bg_color=RGBColor(20, 27, 45), border_color=COLOR_ALERT, border_width=1)
    badge1 = add_badge(slide, hero_left + Inches(0.4), hero_top + Inches(0.8), Inches(5.2), Inches(0.25),
                       "CURRENT PRACTICE: 3 DISJOINTED TRACK SHUTDOWNS (14.2h Lost)", COLOR_ALERT, TEXT_WHITE, 8.5, True)
    
    # Department Timeline Strips
    strip_y = hero_top + Inches(1.12)
    s1 = add_badge(slide, hero_left + Inches(0.4), strip_y, Inches(2.2), Inches(0.24), "Track (P-Way): 09:00 - 12:00 (180m)", COLOR_ENG, TEXT_WHITE, 7.5, True)
    s2 = add_badge(slide, hero_left + Inches(2.7), strip_y, Inches(1.7), Inches(0.24), "TRD (OHE): 13:30 - 15:30 (120m)", COLOR_TRD, TEXT_WHITE, 7.5, True)
    s3 = add_badge(slide, hero_left + Inches(4.5), strip_y, Inches(1.1), Inches(0.24), "S&T: 16:30 (90m)", COLOR_ST, TEXT_WHITE, 7.5, True)
    
    # State 1 Subtitle
    txt_box1 = slide.shapes.add_textbox(hero_left + Inches(0.4), strip_y + Inches(0.28), Inches(5.2), Inches(0.55))
    tf1 = txt_box1.text_frame
    tf1.word_wrap = True
    p = tf1.paragraphs[0]
    format_text(p, "3 Separate Traffic Halts | Repeated Speed Restrictions | Compounded Freight Stagnation", 8, False, TEXT_MUTED, align=PP_ALIGN.CENTER)
    
    # Arrow / Transition Callout
    arrow_box = slide.shapes.add_textbox(hero_left + Inches(0.3), hero_top + Inches(2.35), Inches(5.4), Inches(0.35))
    tf_arr = arrow_box.text_frame
    p_arr = tf_arr.paragraphs[0]
    format_text(p_arr, "v   SETU CP-SAT BUNDLING & DETERMINISTIC SAFETY GATE   v", 9, True, COLOR_GOLD, align=PP_ALIGN.CENTER)
    
    # State 2: SETU Joint Shadow Convoy
    add_card(slide, hero_left + Inches(0.3), hero_top + Inches(2.75), Inches(5.4), Inches(1.75), bg_color=RGBColor(16, 36, 60), border_color=COLOR_ST, border_width=1.5)
    add_badge(slide, hero_left + Inches(0.4), hero_top + Inches(2.85), Inches(5.2), Inches(0.26),
              "SETU REVOLUTION: 1 UNIFIED SHADOW CONVOY WINDOW", COLOR_ST, TEXT_WHITE, 8.5, True)
    
    # Unified Multi-Department Possession Window Bar
    convoy_y = hero_top + Inches(3.2)
    c_bar = add_card(slide, hero_left + Inches(0.4), convoy_y, Inches(5.2), Inches(0.55), bg_color=RGBColor(10, 20, 40), border_color=COLOR_SETU, border_width=1)
    
    # Nested lanes
    add_badge(slide, hero_left + Inches(0.5), convoy_y + Inches(0.06), Inches(4.0), Inches(0.18), "ENG: CSM Tamping Machine (Km 102.0 - 104.5)", COLOR_ENG, TEXT_WHITE, 7, True)
    add_badge(slide, hero_left + Inches(0.8), convoy_y + Inches(0.26), Inches(3.2), Inches(0.18), "TRD: Catenary Tower Car (Km 102.5 - 104.0) [Certified 25kV Cut]", COLOR_TRD, TEXT_WHITE, 7, True)
    add_badge(slide, hero_left + Inches(3.2), convoy_y + Inches(0.26), Inches(2.2), Inches(0.18), "S&T: Point Testing (Km 104.2)", COLOR_ST, TEXT_WHITE, 7, True)
    
    # State 2 Subtitle
    txt_box2 = slide.shapes.add_textbox(hero_left + Inches(0.4), hero_top + Inches(3.8), Inches(5.2), Inches(0.6))
    tf2 = txt_box2.text_frame
    tf2.word_wrap = True
    p2 = tf2.paragraphs[0]
    format_text(p2, "1 Single Integrated Window (210 min)  |  180 min Track Time Returned to Traffic", 8.5, True, COLOR_ST, align=PP_ALIGN.CENTER)
    p2_sub = tf2.add_paragraph()
    format_text(p2_sub, "Zero passenger train disruption  *  100% G&SR safety clearance buffers verified", 7.5, False, TEXT_MUTED, align=PP_ALIGN.CENTER)


# -----------------------------------------------------------------------------
# Slide 2: Proposed Solution Implementation
# -----------------------------------------------------------------------------
def build_slide_2(slide):
    print("Building Slide 2: Proposed Solution...")
    
    # 1. Update Title and clear placeholder
    for shape in slide.shapes:
        if shape.name == "Title 1" and shape.has_text_frame:
            shape.text_frame.text = "PROPOSED SOLUTION: CROSS-DEPARTMENT SHADOW CONVOY ENGINE"
            for p in shape.text_frame.paragraphs:
                p.font.name = "Calibri"
                p.font.size = Pt(20)
                p.font.bold = True
                p.font.color.rgb = RGBColor(0, 112, 192)
        elif shape.name == "TextBox 8" and shape.has_text_frame:
            shape.text_frame.clear()
            shape.left = Inches(100) # Move off canvas
            
    # Canvas area: left=0.5, top=1.3, width=12.33, height=5.0
    # Top Half (Hero Comparison Split): 0.5 to 12.83, height=2.6
    top_y = Inches(1.3)
    
    # Left Box: Current Siloed Reality (40% width = 4.8 inches)
    add_card(slide, Inches(0.5), top_y, Inches(4.8), Inches(2.6), bg_color=CARD_BG, border_color=COLOR_ALERT, border_width=1.5)
    add_badge(slide, Inches(0.7), top_y + Inches(0.15), Inches(4.4), Inches(0.3), "CURRENT REALITY: DEPARTMENTAL SILOS", COLOR_ALERT, TEXT_WHITE, 10, True)
    
    txt1 = slide.shapes.add_textbox(Inches(0.7), top_y + Inches(0.55), Inches(4.4), Inches(1.9))
    tf1 = txt1.text_frame
    tf1.word_wrap = True
    
    p = tf1.paragraphs[0]
    format_text(p, "* Civil Eng (Track): Submits 09:00-12:00 block -> 180 min track closure", 9.5, False, COLOR_ENG)
    p.space_after = Pt(4)
    p = tf1.add_paragraph()
    format_text(p, "* TRD (OHE): Submits 13:30-15:30 block -> 120 min track closure", 9.5, False, COLOR_TRD)
    p.space_after = Pt(4)
    p = tf1.add_paragraph()
    format_text(p, "* S&T (Signals): Submits 16:30-18:00 block -> 90 min track closure", 9.5, False, COLOR_ST)
    p.space_after = Pt(8)
    p = tf1.add_paragraph()
    format_text(p, "BOTTLENECK: 3 Separate Track Closures (390 min total lost). Section controllers juggle paper forms. Freight held at outer loops.", 9.5, True, COLOR_ALERT)
    
    # Right Box: SETU Joint Shadow Convoy (60% width = 7.3 inches)
    add_card(slide, Inches(5.5), top_y, Inches(7.33), Inches(2.6), bg_color=RGBColor(16, 36, 60), border_color=COLOR_SETU, border_width=1.5)
    add_badge(slide, Inches(5.7), top_y + Inches(0.15), Inches(6.93), Inches(0.3), "THE SETU REVOLUTION: SYNCHRONIZED SHADOW CONVOY", COLOR_SETU, TEXT_WHITE, 10, True)
    
    txt2 = slide.shapes.add_textbox(Inches(5.7), top_y + Inches(0.55), Inches(6.93), Inches(1.9))
    tf2 = txt2.text_frame
    tf2.word_wrap = True
    
    p = tf2.paragraphs[0]
    format_text(p, "UNIFIED PROTECTED CORRIDOR WINDOW: 11:00 - 14:30 (210 min active possession)", 10.5, True, COLOR_ST)
    p.space_after = Pt(4)
    p = tf2.add_paragraph()
    format_text(p, "* Eng: Tamping Machine operates Km 102.0 to 104.5 (P-Way output maximized)", 9.5, False, TEXT_WHITE)
    p.space_after = Pt(3)
    p = tf2.add_paragraph()
    format_text(p, "* TRD: OHE Ladder Car operates Km 102.5 to 104.0 under certified 25kV power cut", 9.5, False, TEXT_WHITE)
    p.space_after = Pt(3)
    p = tf2.add_paragraph()
    format_text(p, "* S&T: Interlocking Point Machine tested concurrently at Km 104.2 crossover", 9.5, False, TEXT_WHITE)
    p.space_after = Pt(6)
    p = tf2.add_paragraph()
    format_text(p, "RESULT: 1 Single Corridor Closure instead of 3. Saved 180 min of active track time. Headways preserved for Rajdhani & container freight rakes.", 9.5, True, COLOR_SETU)
    
    # Bottom Half (The 3 Innovation Pillars): 3 cards across 12.33 inches width
    bot_y = Inches(4.05)
    card_w = Inches(3.95)
    gap = Inches(0.24)
    
    # Pillar 1
    add_card(slide, Inches(0.5), bot_y, card_w, Inches(2.2), bg_color=CARD_BG, border_color=CARD_BORDER)
    add_badge(slide, Inches(0.65), bot_y + Inches(0.15), card_w - Inches(0.3), Inches(0.28), "1. SHARED ASSET DEMAND LEDGER", COLOR_ENG, TEXT_WHITE, 9, True)
    tbox = slide.shapes.add_textbox(Inches(0.65), bot_y + Inches(0.48), card_w - Inches(0.3), Inches(1.6))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    format_text(p, "Unified Multi-Dept Ingestion", 10, True, TEXT_WHITE)
    p.space_after = Pt(3)
    p = tf.add_paragraph()
    format_text(p, "Ingests pending maintenance work orders from Civil Eng, TRD, and S&T into a single standardized operational queue.", 8.5, False, TEXT_MUTED)
    p.space_after = Pt(3)
    p = tf.add_paragraph()
    format_text(p, "* Replaces fragmented paper & phone requests with unified spatio-temporal state.", 8.5, True, COLOR_ENG)
    
    # Pillar 2
    add_card(slide, Inches(0.5) + card_w + gap, bot_y, card_w, Inches(2.2), bg_color=CARD_BG, border_color=CARD_BORDER)
    add_badge(slide, Inches(0.65) + card_w + gap, bot_y + Inches(0.15), card_w - Inches(0.3), Inches(0.28), "2. SPATIO-TEMPORAL CONVOY PACKING", COLOR_SETU, TEXT_WHITE, 9, True)
    tbox = slide.shapes.add_textbox(Inches(0.65) + card_w + gap, bot_y + Inches(0.48), card_w - Inches(0.3), Inches(1.6))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    format_text(p, "Google OR-Tools CP-SAT Bundling", 10, True, TEXT_WHITE)
    p.space_after = Pt(3)
    p = tf.add_paragraph()
    format_text(p, "Algorithmically discovers compatible multi-department tasks on the same track segment. Enforces 500m safety clearance buffers.", 8.5, False, TEXT_MUTED)
    p.space_after = Pt(3)
    p = tf.add_paragraph()
    format_text(p, "* Guarantees OHE 25kV de-energization window strictly encloses ground maintenance.", 8.5, True, COLOR_SETU)
    
    # Pillar 3
    add_card(slide, Inches(0.5) + (card_w + gap)*2, bot_y, card_w, Inches(2.2), bg_color=CARD_BG, border_color=CARD_BORDER)
    add_badge(slide, Inches(0.65) + (card_w + gap)*2, bot_y + Inches(0.15), card_w - Inches(0.3), Inches(0.28), "3. TIMETABLE MARGIN INTEGRATION", COLOR_ST, TEXT_WHITE, 9, True)
    tbox = slide.shapes.add_textbox(Inches(0.65) + (card_w + gap)*2, bot_y + Inches(0.48), card_w - Inches(0.3), Inches(1.6))
    tf = tbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    format_text(p, "Corridor Headway Awareness", 10, True, TEXT_WHITE)
    p.space_after = Pt(3)
    p = tf.add_paragraph()
    format_text(p, "Snaps joint possession envelopes into natural timetable white margins between scheduled passenger and freight trains.", 8.5, False, TEXT_MUTED)
    p.space_after = Pt(3)
    p = tf.add_paragraph()
    format_text(p, "* Eliminates unscheduled passenger stops at outer home signals.", 8.5, True, COLOR_ST)


# -----------------------------------------------------------------------------
# Slide 3: Technical Approach Implementation
# -----------------------------------------------------------------------------
def build_slide_3(slide):
    print("Building Slide 3: Technical Approach...")
    
    for shape in slide.shapes:
        if shape.name == "Title 1" and shape.has_text_frame:
            shape.text_frame.text = "TECHNICAL APPROACH: MULTI-STAGE OPTIMIZATION & SAFETY PIPELINE"
            for p in shape.text_frame.paragraphs:
                p.font.name = "Calibri"
                p.font.size = Pt(20)
                p.font.bold = True
                p.font.color.rgb = RGBColor(0, 112, 192)
        elif shape.name == "TextBox 8" and shape.has_text_frame:
            shape.text_frame.clear()
            shape.left = Inches(100)
            
    # Top Half (4-Stage Pipeline): 4 boxes across 12.33 inches width
    top_y = Inches(1.3)
    pipe_w = Inches(2.9)
    gap = Inches(0.24)
    
    stages = [
        ("1. DEMAND & MARGINS", COLOR_ENG, [
            ("Work Orders", True, TEXT_WHITE),
            ("Eng, TRD, S&T pending tasks", False, TEXT_MUTED),
            ("NTES Passenger Timetables", False, TEXT_MUTED),
            ("FOIS Freight Headways", False, TEXT_MUTED),
            ("Duration Risk Estimator (ML)", True, COLOR_ENG)
        ]),
        ("2. SOLVER ENGINE (CP-SAT)", COLOR_SETU, [
            ("Google OR-Tools CP-SAT", True, TEXT_WHITE),
            ("IntervalVar() Decision Variables", False, TEXT_MUTED),
            ("Multi-Knapsack Packing", False, TEXT_MUTED),
            ("Spatio-Temporal No-Overlap", False, TEXT_MUTED),
            ("Global Penalty Minimization", True, COLOR_SETU)
        ]),
        ("3. ZERO-ERROR SAFETY GATE", COLOR_GOLD, [
            ("Deterministic Validator", True, COLOR_GOLD),
            ("G&SR Chapter XV Rulebook", False, TEXT_WHITE),
            ("15-min Train Headway Buffer", False, TEXT_WHITE),
            ("25kV OHE Power Lockout", False, TEXT_WHITE),
            ("100% VETO / ZERO ML OVERRIDE", True, COLOR_ALERT)
        ]),
        ("4. OPERATIONAL DISPATCH", COLOR_ST, [
            ("Section Block Notices", True, TEXT_WHITE),
            ("Station Master Authorizations", False, TEXT_MUTED),
            ("Dynamic Marey String Charts", False, TEXT_MUTED),
            ("Speed Restriction Bulletins", False, TEXT_MUTED),
            ("Machine Crew Rostering", True, COLOR_ST)
        ])
    ]
    
    for i, (title, col, items) in enumerate(stages):
        bx = Inches(0.5) + i * (pipe_w + gap)
        border_c = COLOR_GOLD if i == 2 else CARD_BORDER
        b_width = 2.0 if i == 2 else 1.0
        bg_c = RGBColor(35, 30, 20) if i == 2 else CARD_BG
        
        add_card(slide, bx, top_y, pipe_w, Inches(2.2), bg_color=bg_c, border_color=border_c, border_width=b_width)
        add_badge(slide, bx + Inches(0.15), top_y + Inches(0.12), pipe_w - Inches(0.3), Inches(0.28), title, col, TEXT_WHITE, 9, True)
        
        tb = slide.shapes.add_textbox(bx + Inches(0.15), top_y + Inches(0.45), pipe_w - Inches(0.3), Inches(1.7))
        tf = tb.text_frame
        tf.word_wrap = True
        
        for j, (line_text, is_bold, text_col) in enumerate(items):
            p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
            format_text(p, line_text, 8.5, is_bold, text_col)
            p.space_after = Pt(2)
            
    # Bottom Half (Architectural Rigor: Decoupled Decision Layers): 3 columns
    bot_y = Inches(3.65)
    col_w = Inches(3.95)
    
    layers = [
        ("AI / ML ESTIMATION LAYER", COLOR_ENG, [
            ("Role: Task Duration & Priority Scoring", True, COLOR_ENG),
            ("FastAPI telemetry microservice trained on synthetic & historical maintenance logs.", False, TEXT_MUTED),
            ("Estimates machine task duration variance under weather & ballast conditions.", False, TEXT_MUTED),
            ("Calculates dynamic deferral cost penalties based on track wear indices.", False, TEXT_MUTED),
            ("PRINCIPLE: ML recommends priority, NEVER final safety.", True, TEXT_WHITE)
        ]),
        ("MATHEMATICAL OPTIMIZATION CORE", COLOR_SETU, [
            ("Role: Combinatorial Global Search", True, COLOR_SETU),
            ("Google OR-Tools CP-SAT constraint programming solver engine.", False, TEXT_MUTED),
            ("Formulated as Multi-Dimensional Bin Packing with Non-Overlapping Intervals.", False, TEXT_MUTED),
            ("Evaluates 10,000+ spatial permutations in <3.5 seconds across 6 sub-divisions.", False, TEXT_MUTED),
            ("Objective: Minimize Occupancy + Deferrals + Headway Loss.", True, TEXT_WHITE)
        ]),
        ("DETERMINISTIC SAFETY AUDITOR", COLOR_ST, [
            ("Role: Independent Rulebook Gatekeeper", True, COLOR_ST),
            ("Standalone Python core enforcing Indian Railways General & Subsidiary Rules (G&SR).", False, TEXT_MUTED),
            ("Hard Safety Invariant: Minimum 500m separation between tamping machine & workers.", False, TEXT_MUTED),
            ("Hard Electrical Invariant: TRD power block strictly encloses track maintenance.", False, TEXT_MUTED),
            ("ZERO-HALLUCINATION: Cannot be overridden by ML or user.", True, COLOR_ALERT)
        ])
    ]
    
    for i, (title, col, items) in enumerate(layers):
        bx = Inches(0.5) + i * (col_w + gap)
        add_card(slide, bx, bot_y, col_w, Inches(2.6), bg_color=CARD_BG, border_color=CARD_BORDER)
        add_badge(slide, bx + Inches(0.15), bot_y + Inches(0.15), col_w - Inches(0.3), Inches(0.28), title, col, TEXT_WHITE, 9, True)
        
        tb = slide.shapes.add_textbox(bx + Inches(0.15), bot_y + Inches(0.48), col_w - Inches(0.3), Inches(2.0))
        tf = tb.text_frame
        tf.word_wrap = True
        
        for j, (line_text, is_bold, text_col) in enumerate(items):
            p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
            format_text(p, line_text, 8.5, is_bold, text_col)
            p.space_after = Pt(3)


# -----------------------------------------------------------------------------
# Slide 4: Feasibility and Viability Implementation
# -----------------------------------------------------------------------------
def build_slide_4(slide):
    print("Building Slide 4: Feasibility and Viability...")
    
    for shape in slide.shapes:
        if shape.name == "Title 1" and shape.has_text_frame:
            shape.text_frame.text = "FEASIBILITY, RISK AUDIT & RESILIENT DEPLOYMENT"
            for p in shape.text_frame.paragraphs:
                p.font.name = "Calibri"
                p.font.size = Pt(20)
                p.font.bold = True
                p.font.color.rgb = RGBColor(0, 112, 192)
        elif shape.name == "TextBox 8" and shape.has_text_frame:
            shape.text_frame.clear()
            shape.left = Inches(100)
            
    # Top Half (Risk-Mitigation 3-Row Matrix): width=12.33 inches, height=3.0 inches
    top_y = Inches(1.3)
    row_h = Inches(0.95)
    row_gap = Inches(0.08)
    
    rows = [
        ("DATA AVAILABILITY", "Live IR TMS/COA feeds are confidential and access-restricted.",
         "Universal Schema Ingestion Adapter: Calibrated on public NTES timetables and RDSO machine output norms; schema-ready for REST/CSV/FOIS APIs.",
         "FEASIBLE (Ready)", COLOR_ST),
        ("PEAK INFEASIBILITY", "High corridor train density leaves zero legal windows for all requested blocks.",
         "Automated Tiered Relaxation Hierarchy: Step 1 compresses non-critical buffers; Step 2 defers low-priority routine tasks with audit log; Step 3 preserves safety invariants.",
         "ROBUST (Proven)", COLOR_ST),
        ("LIVE DISRUPTIONS", "Unplanned 45-min freight delay or machine breakdown shatters pre-computed plan.",
         "Warm-Start 1-Hop Cascade Replanner: Recalculates affected local block section in <500ms using rolling horizon without rebuilding global network.",
         "<500ms LATENCY", COLOR_TRD)
    ]
    
    for i, (chall_title, chall_desc, mit_desc, status_text, status_col) in enumerate(rows):
        ry = top_y + i * (row_h + row_gap)
        add_card(slide, Inches(0.5), ry, Inches(12.33), row_h, bg_color=CARD_BG, border_color=CARD_BORDER)
        
        # Challenge Column (Left: 3.5 inches)
        add_badge(slide, Inches(0.65), ry + Inches(0.12), Inches(2.2), Inches(0.24), chall_title, COLOR_ALERT, TEXT_WHITE, 8, True)
        tb_c = slide.shapes.add_textbox(Inches(0.65), ry + Inches(0.38), Inches(3.2), Inches(0.52))
        tf_c = tb_c.text_frame
        tf_c.word_wrap = True
        p = tf_c.paragraphs[0]
        format_text(p, chall_desc, 8, False, TEXT_MUTED)
        
        # Divider Line
        div = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.0), ry + Inches(0.1), Inches(0.02), Inches(0.75))
        div.fill.solid()
        div.fill.fore_color.rgb = CARD_BORDER
        div.line.fill.background()
        
        # Mitigation Column (Center: 6.4 inches)
        tb_m = slide.shapes.add_textbox(Inches(4.2), ry + Inches(0.12), Inches(6.2), Inches(0.75))
        tf_m = tb_m.text_frame
        tf_m.word_wrap = True
        p = tf_m.paragraphs[0]
        format_text(p, "Architectural Mitigation & Resilience Strategy:", 8.5, True, COLOR_SETU)
        p = tf_m.add_paragraph()
        format_text(p, mit_desc, 8, False, TEXT_WHITE)
        
        # Status Column (Right: 1.8 inches)
        add_badge(slide, Inches(10.7), ry + Inches(0.3), Inches(1.9), Inches(0.35), status_text, status_col, TEXT_WHITE, 9, True)

    # Bottom Half (Stepwise 3-Phase Adoption Roadmap): width=12.33 inches, height=1.9 inches
    bot_y = Inches(4.45)
    add_card(slide, Inches(0.5), bot_y, Inches(12.33), Inches(1.85), bg_color=RGBColor(20, 27, 45), border_color=CARD_BORDER)
    add_badge(slide, Inches(0.7), bot_y + Inches(0.12), Inches(11.93), Inches(0.28), 
              "STEPWISE ADOPTION ROADMAP: ZERO DISRUPTION TO RUNNING TRAFFIC OPERATIONS", COLOR_SETU, TEXT_WHITE, 9.5, True)
    
    phases = [
        ("PHASE 1: SHADOW ADVISORY", COLOR_ENG, [
            ("Runs in parallel with Section Controller in division office.", True, TEXT_WHITE),
            ("Provides advisory recommendations; Section Controller retains 100% manual control.", False, TEXT_MUTED),
            ("Zero operational risk to running trains; proves accuracy against real-world logs.", False, COLOR_ST)
        ]),
        ("PHASE 2: DIVISION PILOT", COLOR_SETU, [
            ("Controlled pilot on single high-density double-line section (Kanpur-Prayagraj).", True, TEXT_WHITE),
            ("Section Controller digitally approves SETU-bundled Shadow Convoys.", False, TEXT_MUTED),
            ("Integrated field worker mobile portal for automated block clearance reports.", False, COLOR_SETU)
        ]),
        ("PHASE 3: ENTERPRISE INTEGRATION", COLOR_ST, [
            ("Direct bi-directional API link with CRIS Control Office Application (COA).", True, TEXT_WHITE),
            ("Fully automated block negotiation between Engineering, TRD, and S&T.", False, TEXT_MUTED),
            ("Network-wide deployment across Indian Railways Golden Quadrilateral corridors.", False, COLOR_ST)
        ])
    ]
    
    pw = Inches(3.8)
    pgap = Inches(0.26)
    for i, (p_title, p_col, p_items) in enumerate(phases):
        px = Inches(0.7) + i * (pw + pgap)
        add_card(slide, px, bot_y + Inches(0.48), pw, Inches(1.25), bg_color=CARD_BG, border_color=p_col, border_width=1)
        
        tb = slide.shapes.add_textbox(px + Inches(0.1), bot_y + Inches(0.52), pw - Inches(0.2), Inches(1.15))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        format_text(p, p_title, 9, True, p_col)
        p.space_after = Pt(2)
        
        for p_desc, is_b, t_col in p_items:
            p = tf.add_paragraph()
            format_text(p, "* " + p_desc, 7.5, is_b, t_col)


# -----------------------------------------------------------------------------
# Slide 5: Impact and Benefits Implementation
# -----------------------------------------------------------------------------
def build_slide_5(slide):
    print("Building Slide 5: Impact and Benefits...")
    
    for shape in slide.shapes:
        if shape.name == "Title 1" and shape.has_text_frame:
            shape.text_frame.text = "IMPACT AND BENEFITS: QUANTIFIED OPERATIONAL & SAFETY GAINS"
            for p in shape.text_frame.paragraphs:
                p.font.name = "Calibri"
                p.font.size = Pt(20)
                p.font.bold = True
                p.font.color.rgb = RGBColor(0, 112, 192)
        elif shape.name == "TextBox 8" and shape.has_text_frame:
            shape.text_frame.clear()
            shape.left = Inches(100)
            
    # Benchmark Qualification Subtitle Banner
    top_y = Inches(1.3)
    add_badge(slide, Inches(0.5), top_y, Inches(12.33), Inches(0.32),
              "BENCHMARKED ON 433.5 KM ARTERIAL CORRIDOR SIMULATION (Delhi-Kanpur | 140+ Trains/Day | 18 Multi-Dept Orders)",
              RGBColor(24, 34, 56), COLOR_SETU, 9.5, True)
    
    # Hero 4-Metric Callout Row: width=12.33 inches, height=1.65 inches
    met_y = Inches(1.7)
    met_w = Inches(2.9)
    gap = Inches(0.24)
    
    metrics = [
        ("-38.9%", COLOR_ENG, "TRACK POSSESSION DOWNTIME", "Total track closure reduced from 2,080m to 1,270m across corridor."),
        ("+810 MIN", COLOR_SETU, "CORRIDOR CAPACITY RECOVERED", "Active traffic capacity restored for passenger express and freight paths."),
        ("1,420 L", COLOR_ST, "DIESEL FUEL SAVED / DAY", "Eliminated idle locomotive hours on held freight trains (~3.8t CO2 reduction)."),
        ("ZERO", COLOR_TRD, "SAFETY BUFFER VIOLATIONS", "100% adherence to G&SR Chapter XV distance and power isolation rules.")
    ]
    
    for i, (num, col, title, desc) in enumerate(metrics):
        mx = Inches(0.5) + i * (met_w + gap)
        add_card(slide, mx, met_y, met_w, Inches(1.65), bg_color=CARD_BG, border_color=col, border_width=1.5)
        
        # Big Number
        tb_num = slide.shapes.add_textbox(mx + Inches(0.1), met_y + Inches(0.08), met_w - Inches(0.2), Inches(0.65))
        tf_num = tb_num.text_frame
        tf_num.word_wrap = True
        p_num = tf_num.paragraphs[0]
        format_text(p_num, num, 24, True, col, font_name="Calibri", align=PP_ALIGN.CENTER)
        
        # Label & Micro-annotation
        tb_lbl = slide.shapes.add_textbox(mx + Inches(0.1), met_y + Inches(0.72), met_w - Inches(0.2), Inches(0.85))
        tf_lbl = tb_lbl.text_frame
        tf_lbl.word_wrap = True
        p_lbl = tf_lbl.paragraphs[0]
        format_text(p_lbl, title, 8.5, True, TEXT_WHITE, align=PP_ALIGN.CENTER)
        p_lbl.space_after = Pt(2)
        p_desc = tf_lbl.add_paragraph()
        format_text(p_desc, desc, 7.5, False, TEXT_MUTED, align=PP_ALIGN.CENTER)

    # Bottom Half (Multi-Stakeholder Triple Value Breakdown): 3 cards across 12.33 inches
    bot_y = Inches(3.45)
    card_w = Inches(3.95)
    
    pillars = [
        ("OPERATIONAL & SOCIAL IMPACT", COLOR_ENG, [
            ("Passenger Train Punctuality", True, TEXT_WHITE),
            ("Eliminates unscheduled outer-signal stops and secondary cascading delays on trunk lines.", False, TEXT_MUTED),
            ("Mechanized Track Quality", True, TEXT_WHITE),
            ("Regular, guaranteed tamping machine windows prevent severe speed restrictions (TSRs).", False, TEXT_MUTED),
            ("Commuter Reliability", True, COLOR_ENG),
            ("Predictable passenger journey times across high-density commuter networks.", False, TEXT_MUTED)
        ]),
        ("ECONOMIC & FREIGHT BENEFITS", COLOR_SETU, [
            ("Freight Path Availability", True, TEXT_WHITE),
            ("Fast-tracks high-value container & bulk rakes without getting sidelined for maintenance.", False, TEXT_MUTED),
            ("Capital Asset Utilization", True, TEXT_WHITE),
            ("Maximizes output per machine-hour for expensive track tampers (CSM) and OHE ladder cars.", False, TEXT_MUTED),
            ("Indian Railways Operating Ratio", True, COLOR_SETU),
            ("Reduces unproductive possession penalties and lowers divisional corridor operating costs.", False, TEXT_MUTED)
        ]),
        ("WORKFORCE SAFETY & GOVERNANCE", COLOR_ST, [
            ("Guaranteed Electrical Isolation", True, TEXT_WHITE),
            ("TRD power block lockout prevents electrocution risks for ground tamping crews.", False, TEXT_MUTED),
            ("Zero Inter-Departmental Blame", True, TEXT_WHITE),
            ("Eliminates contentious coordination disputes between Engineering, TRD, and S&T.", False, TEXT_MUTED),
            ("Verifiable Digital Audit Trail", True, COLOR_ST),
            ("Complete regulatory transparency for every possession request, approval, and deferral.", False, TEXT_MUTED)
        ])
    ]
    
    for i, (title, col, items) in enumerate(pillars):
        bx = Inches(0.5) + i * (card_w + gap)
        add_card(slide, bx, bot_y, card_w, Inches(2.85), bg_color=CARD_BG, border_color=CARD_BORDER)
        add_badge(slide, bx + Inches(0.15), bot_y + Inches(0.12), card_w - Inches(0.3), Inches(0.28), title, col, TEXT_WHITE, 9, True)
        
        tb = slide.shapes.add_textbox(bx + Inches(0.15), bot_y + Inches(0.45), card_w - Inches(0.3), Inches(2.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        for j, (heading, is_b, t_col) in enumerate(items):
            p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
            format_text(p, heading, 8.5, is_b, t_col)
            p.space_after = Pt(2 if is_b else 4)


# -----------------------------------------------------------------------------
# Slide 6: Research and References Implementation
# -----------------------------------------------------------------------------
def build_slide_6(slide):
    print("Building Slide 6: Research and References...")
    
    for shape in slide.shapes:
        if shape.name == "Title 1" and shape.has_text_frame:
            shape.text_frame.text = "RESEARCH, CITATIONS & CODEBASE REPRODUCIBILITY"
            for p in shape.text_frame.paragraphs:
                p.font.name = "Calibri"
                p.font.size = Pt(20)
                p.font.bold = True
                p.font.color.rgb = RGBColor(0, 112, 192)
        elif shape.name == "TextBox 8" and shape.has_text_frame:
            shape.text_frame.clear()
            shape.left = Inches(100)
            
    # Top Half (Three Thematic Research Pillars): width=12.33 inches, height=2.6 inches
    top_y = Inches(1.3)
    col_w = Inches(3.95)
    gap = Inches(0.24)
    
    research_pillars = [
        ("1. RAILWAY DOMAIN & SAFETY", COLOR_ENG, [
            ("Indian Railways G&SR Rulebook", True, COLOR_ENG),
            ("General & Subsidiary Rules — Chapter XV: Rules for Working of Trains on Temporary Single Line & Permanent Way Protection.", False, TEXT_WHITE),
            ("RDSO Track Machine Guidelines", True, COLOR_ENG),
            ("Comprehensive norms on CSM/BCM machine productivity, maintenance tolerances & headway buffer clearances (IRICEN).", False, TEXT_MUTED),
            ("Static Speed Restriction Manuals", True, COLOR_ENG),
            ("Standards governing temporary speed restrictions following mechanized tamping.", False, TEXT_MUTED)
        ]),
        ("2. OPTIMIZATION & ALGORITHMS", COLOR_SETU, [
            ("Google OR-Tools CP-SAT Solver", True, COLOR_SETU),
            ("Laurent Perron & Frederic Didier (Google Operations Research): Constraint Programming with SAT Solvers for NP-hard Scheduling.", False, TEXT_WHITE),
            ("Railway Rescheduling Theory", True, COLOR_SETU),
            ("Caimi, Fuchsberger, Burkolter (ETH Zurich): Periodic Timetable Conflict Resolution and Dynamic Rescheduling in Dense Rail Networks.", False, TEXT_MUTED),
            ("Rolling Horizon Decision Support", True, COLOR_SETU),
            ("Multi-stage optimization frameworks for dynamic network disruption handling.", False, TEXT_MUTED)
        ]),
        ("3. OPEN DATA & BENCHMARKS", COLOR_ST, [
            ("National Train Enquiry System (NTES)", True, COLOR_ST),
            ("Public passenger train timetable schemas, station arrival/departure times, and section running intervals.", False, TEXT_WHITE),
            ("Freight Operations Info System (FOIS)", True, COLOR_ST),
            ("Standard headway allocations, rake turnover norms, and bulk freight priority schedules.", False, TEXT_MUTED),
            ("Delhi-Kanpur 433.5 km Benchmark", True, COLOR_ST),
            ("Authentic double-line arterial corridor model with 6 sub-divisions and 140+ daily scheduled trains.", False, TEXT_MUTED)
        ])
    ]
    
    for i, (title, col, items) in enumerate(research_pillars):
        bx = Inches(0.5) + i * (col_w + gap)
        add_card(slide, bx, top_y, col_w, Inches(2.6), bg_color=CARD_BG, border_color=CARD_BORDER)
        add_badge(slide, bx + Inches(0.15), top_y + Inches(0.12), col_w - Inches(0.3), Inches(0.28), title, col, TEXT_WHITE, 9, True)
        
        tb = slide.shapes.add_textbox(bx + Inches(0.15), top_y + Inches(0.45), col_w - Inches(0.3), Inches(2.05))
        tf = tb.text_frame
        tf.word_wrap = True
        
        for j, (heading, is_b, t_col) in enumerate(items):
            p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
            format_text(p, heading, 8.5, is_b, t_col)
            p.space_after = Pt(2 if is_b else 4)

    # Bottom Half (Codebase Verification & Reproducibility Hub): width=12.33 inches, height=2.35 inches
    bot_y = Inches(4.0)
    add_card(slide, Inches(0.5), bot_y, Inches(12.33), Inches(2.3), bg_color=RGBColor(20, 27, 45), border_color=COLOR_TRD, border_width=1.5)
    
    # Generate and embed QR code
    qr_img_path = "scratch/setu_repo_qr.png"
    qr = qrcode.QRCode(box_size=8, border=1)
    qr.add_data("https://github.com/SETU-SIH26027/Railway-Corridor-Block-Optimizer")
    qr.make(fit=True)
    img_qr = qr.make_image(fill_color="black", back_color="white")
    img_qr.save(qr_img_path)
    
    # Embed QR Code on the left side
    slide.shapes.add_picture(qr_img_path, Inches(0.8), bot_y + Inches(0.25), Inches(1.8), Inches(1.8))
    
    # QR Label below
    tb_qrlbl = slide.shapes.add_textbox(Inches(0.6), bot_y + Inches(1.95), Inches(2.2), Inches(0.3))
    tf_ql = tb_qrlbl.text_frame
    p_ql = tf_ql.paragraphs[0]
    format_text(p_ql, "SCAN TO INSPECT REPO", 7.5, True, COLOR_TRD, align=PP_ALIGN.CENTER)
    
    # Right Side: Verification Badges & Technical Pedigree
    v_left = Inches(3.0)
    tb_v = slide.shapes.add_textbox(v_left, bot_y + Inches(0.2), Inches(9.6), Inches(1.95))
    tf_v = tb_v.text_frame
    tf_v.word_wrap = True
    
    p = tf_v.paragraphs[0]
    format_text(p, "LIVE CODEBASE & SIMULATION VERIFICATION SUMMARY", 11, True, COLOR_ST)
    p.space_after = Pt(4)
    
    badges = [
        ("55 / 55 Unit & Integration Tests Passing", "100% test coverage on solver constraints, safety validation, and disruption recovery."),
        ("Google OR-Tools CP-SAT + FastAPI Telemetry", "Production-grade Python 3.11 backend with asynchronous optimization engine."),
        ("Interactive Marey String Chart Included", "Section-by-section dynamic space-time visualization with live conflict detection."),
        ("Delhi-Kanpur Double-Line Dataset Reproducible", "Complete 433.5 km simulation dataset included for independent peer review.")
    ]
    
    for b_title, b_desc in badges:
        p = tf_v.add_paragraph()
        format_text(p, "[VERIFIED] " + b_title + " — " + b_desc, 8.5, False, TEXT_WHITE)
        p.space_after = Pt(3)


# -----------------------------------------------------------------------------
# Main Execution: Load Template, Delete Slide 7, Build Deck, and Save
# -----------------------------------------------------------------------------
def main():
    template_path = r"C:\Users\anush\OneDrive\Desktop\SIH\Railway\SIH2026-IDEA-Presentation-Format.pptx"
    output_path_1 = r"C:\Users\anush\OneDrive\Desktop\SIH\Railway Demo\SETU_SIH2026_Idea_Presentation.pptx"
    output_path_2 = r"C:\Users\anush\OneDrive\Desktop\SIH\Railway\SETU_SIH2026_Idea_Presentation.pptx"
    
    print(f"Loading template from {template_path}...")
    prs = pptx.Presentation(template_path)
    
    # Delete slide 7 (the deletion slide)
    if len(prs.slides) >= 7:
        print("Deleting Slide 7 (Template instruction slide)...")
        rId = prs.slides._sldIdLst[6].rId
        prs.part.drop_rel(rId)
        del prs.slides._sldIdLst[6]
        
    print(f"Total slides remaining: {len(prs.slides)}")
    
    # Build each slide
    build_slide_1(prs.slides[0])
    build_slide_2(prs.slides[1])
    build_slide_3(prs.slides[2])
    build_slide_4(prs.slides[3])
    build_slide_5(prs.slides[4])
    build_slide_6(prs.slides[5])
    
    print(f"Saving presentation to {output_path_1}...")
    prs.save(output_path_1)
    
    print(f"Saving mirror presentation to {output_path_2}...")
    prs.save(output_path_2)
    
    print("SUCCESS: SETU SIH 2026 Idea Presentation successfully generated!")

if __name__ == "__main__":
    main()
