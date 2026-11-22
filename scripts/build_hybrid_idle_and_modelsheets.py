import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FRAME_W = 400
FRAME_H = 500
GROUND_CONTACT_Y = 475 # Exact pixel row where soles of shoes make contact with ground floor
NUM_IDLE_FRAMES = 10   # 10 frames at 8 FPS = 1.25s smooth fighting idle loop

def make_model_sheet(base_img_path, portrait_path, name, title, palette, is_p1=True, out_path="model_sheet.png"):
    sheet_w, sheet_h = 1400, 800
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (12, 16, 26, 255))
    draw = ImageDraw.Draw(sheet)

    # Grid background pattern
    for x in range(0, sheet_w, 40):
        draw.line([(x, 0), (x, sheet_h)], fill=(18, 24, 38, 255), width=1)
    for y in range(0, sheet_h, 40):
        draw.line([(0, y), (sheet_w, y)], fill=(18, 24, 38, 255), width=1)

    # Border & Header Bar
    accent_color = (0, 229, 255) if is_p1 else (255, 26, 75)
    draw.rectangle([(20, 20), (sheet_w - 20, sheet_h - 20)], outline=accent_color, width=2)
    draw.rectangle([(20, 20), (sheet_w - 20, 90)], fill=(18, 24, 40, 255))
    draw.line([(20, 90), (sheet_w - 20, 90)], fill=accent_color, width=2)

    # Header Text
    draw.text((45, 32), f"ARENA X  //  CHARACTER ANIMATION MODEL SHEET", fill=(140, 160, 190), font=None)
    draw.text((45, 52), f"{name.upper()} — {title.upper()}", fill=(255, 255, 255), font=None)

    # Panel 1: Full Body High-Resolution Neutral Fighting Stance
    draw.rectangle([(50, 120), (550, 750)], fill=(15, 20, 32, 220), outline=(40, 50, 75), width=1)
    draw.text((65, 130), "STANCE REFERENCE // 3/4 FIGHTING GUARD", fill=accent_color, font=None)

    if os.path.exists(base_img_path):
        base_raw = Image.open(base_img_path).convert("RGBA")
        bw, bh = base_raw.size
        target_h = 560
        scale = target_h / float(bh)
        target_w = int(bw * scale)
        base_scaled = base_raw.resize((target_w, target_h), Image.Resampling.LANCZOS)
        paste_x = 50 + (500 - target_w) // 2
        paste_y = 120 + (630 - target_h) // 2 + 10
        sheet.paste(base_scaled, (paste_x, paste_y), base_scaled)

    # Panel 2: Close-up Portrait & Expression
    draw.rectangle([(580, 120), (950, 420)], fill=(15, 20, 32, 220), outline=(40, 50, 75), width=1)
    draw.text((595, 130), "PORTRAIT // FACIAL ANATOMY & HAIR", fill=accent_color, font=None)

    if os.path.exists(portrait_path):
        port = Image.open(portrait_path).convert("RGBA")
        port_scaled = port.resize((240, 240), Image.Resampling.LANCZOS)
        sheet.paste(port_scaled, (645, 160), port_scaled)

    # Panel 3: Color Palette & Shader Breakdown
    draw.rectangle([(580, 450), (950, 750)], fill=(15, 20, 32, 220), outline=(40, 50, 75), width=1)
    draw.text((595, 460), "COLOR SCHEME & EMISSIVE PALETTE", fill=accent_color, font=None)

    swatch_y = 495
    for color_name, hex_val, rgb in palette:
        draw.rectangle([(600, swatch_y), (650, swatch_y + 36)], fill=rgb, outline=(255, 255, 255, 120), width=1)
        draw.text((665, swatch_y + 4), f"{color_name}", fill=(240, 245, 255), font=None)
        draw.text((665, swatch_y + 20), f"{hex_val}  //  RGB{rgb}", fill=(130, 150, 180), font=None)
        swatch_y += 48

    # Panel 4: Physical & Proportions Spec
    draw.rectangle([(980, 120), (1350, 750)], fill=(15, 20, 32, 220), outline=(40, 50, 75), width=1)
    draw.text((995, 130), "PROPORTIONS & HITBOX SPEC", fill=accent_color, font=None)

    specs = [
        ("Base Canvas", "400 x 500 px"),
        ("Render Scale", "0.58 in Phaser 2D"),
        ("Ground Anchor", "y = 475 px (Soles)"),
        ("Height Ratio", "7.2 Heads (Heroic Anime)"),
        ("Head Anchor", "0.02 - 0.26 Height"),
        ("Torso Anchor", "0.23 - 0.58 Height"),
        ("Leg Anchor", "0.54 - 0.95 Height"),
        ("Idle Duration", "1.25s (10 Frames @ 8 FPS)"),
        ("Hurtbox Width", "80 px"),
        ("Hurtbox Height", "190 px"),
        ("Facing Bias", "Right (+1)" if is_p1 else "Left (-1)"),
        ("Shadow Radius", "52 x 15 px (Decoupled)")
    ]

    spec_y = 170
    for label, val in specs:
        draw.text((1000, spec_y), label, fill=(130, 150, 180), font=None)
        draw.text((1160, spec_y), val, fill=(255, 255, 255), font=None)
        draw.line([(1000, spec_y + 22), (1330, spec_y + 22)], fill=(25, 32, 48), width=1)
        spec_y += 44

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    sheet.save(out_path, "PNG")
    print(f"Saved model sheet: {out_path}")
    return sheet


def build_ten_frame_idle(base_sprite_path, out_dir, is_p1=True):
    os.makedirs(out_dir, exist_ok=True)
    base_raw = Image.open(base_sprite_path).convert('RGBA')
    bw_raw, bh_raw = base_raw.size

    target_h = 450
    scale = target_h / float(bh_raw)
    target_w = int(bw_raw * scale)
    base = base_raw.resize((target_w, target_h), Image.Resampling.LANCZOS)
    bw, bh = base.size

    base_frame = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    pos_x = (FRAME_W - bw) // 2
    pos_y = GROUND_CONTACT_Y - bh
    base_frame.paste(base, (pos_x, pos_y), base)

    # Segment anatomical layers
    head_box = (pos_x + int(bw * 0.32), pos_y + int(bh * 0.02),
                pos_x + int(bw * 0.68), pos_y + int(bh * 0.26))
    head_img = base_frame.crop(head_box)

    torso_box = (pos_x + int(bw * 0.28), pos_y + int(bh * 0.23),
                 pos_x + int(bw * 0.72), pos_y + int(bh * 0.58))
    torso_img = base_frame.crop(torso_box)

    lead_arm_box = (pos_x + int(bw * 0.52), pos_y + int(bh * 0.26),
                    pos_x + int(bw * 0.95), pos_y + int(bh * 0.56)) if is_p1 else \
                   (pos_x + int(bw * 0.05), pos_y + int(bh * 0.26),
                    pos_x + int(bw * 0.48), pos_y + int(bh * 0.56))
    lead_arm_img = base_frame.crop(lead_arm_box)

    rear_arm_box = (pos_x + int(bw * 0.10), pos_y + int(bh * 0.26),
                    pos_x + int(bw * 0.48), pos_y + int(bh * 0.56)) if is_p1 else \
                   (pos_x + int(bw * 0.52), pos_y + int(bh * 0.26),
                    pos_x + int(bw * 0.90), pos_y + int(bh * 0.56))
    rear_arm_img = base_frame.crop(rear_arm_box)

    lead_leg_box = (pos_x + int(bw * 0.45), pos_y + int(bh * 0.54),
                    pos_x + int(bw * 0.95), GROUND_CONTACT_Y) if is_p1 else \
                   (pos_x + int(bw * 0.05), pos_y + int(bh * 0.54),
                    pos_x + int(bw * 0.55), GROUND_CONTACT_Y)
    lead_leg_img = base_frame.crop(lead_leg_box)

    rear_leg_box = (pos_x + int(bw * 0.08), pos_y + int(bh * 0.54),
                    pos_x + int(bw * 0.55), GROUND_CONTACT_Y) if is_p1 else \
                   (pos_x + int(bw * 0.45), pos_y + int(bh * 0.54),
                    pos_x + int(bw * 0.92), GROUND_CONTACT_Y)
    rear_leg_img = base_frame.crop(rear_leg_box)

    frames = []
    blink_frames = []

    # 10-Frame Breathing / Idle Loop Generation
    for i in range(NUM_IDLE_FRAMES):
        t = (i / float(NUM_IDLE_FRAMES)) * math.pi * 2

        # 1. Torso: smooth sine ease upward 3px at apex, backward tilt on inhale
        torso_dy = int(-math.sin(t) * 3.5)
        tilt_angle = math.sin(t) * 1.2 # slight backward tilt at inhale
        
        # Slight chest width expansion on inhale (+2px)
        chest_expand_w = int(math.sin(t) * 2) if math.sin(t) > 0 else 0
        cur_torso = torso_img
        if chest_expand_w > 0:
            cur_torso = torso_img.resize((torso_img.width + chest_expand_w, torso_img.height), Image.Resampling.BILINEAR)

        # 2. Hands & Guard: delayed by 3 frames (lead) and 4.5 frames (rear)
        lead_phase = t - (3.0 / NUM_IDLE_FRAMES) * math.pi * 2
        rear_phase = t - (4.5 / NUM_IDLE_FRAMES) * math.pi * 2
        lead_dy = int(-math.sin(lead_phase) * 2.5)
        lead_dx = int(math.cos(lead_phase) * 1.5) * (1 if is_p1 else -1)
        rear_dy = int(-math.sin(rear_phase) * 2.0)

        # 3. Head: trails torso by 1 frame (subtle nod)
        head_phase = t - (1.0 / NUM_IDLE_FRAMES) * math.pi * 2
        head_dy = int(-math.sin(head_phase) * 3.0)

        # 4. Knees: subtle flexion (1px downward on exhale frames)
        knee_dy = int(max(0, math.sin(t + math.pi)) * 1.5)

        # Assemble Frame
        f = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))

        # Back layers
        f.paste(rear_arm_img, (rear_arm_box[0], rear_arm_box[1] + rear_dy), rear_arm_img)
        f.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
        f.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1] + knee_dy // 2), lead_leg_img)

        # Mid layers (Torso & Head)
        torso_x = torso_box[0] - chest_expand_w // 2
        f.paste(cur_torso, (torso_x, torso_box[1] + torso_dy), cur_torso)
        f.paste(head_img, (head_box[0], head_box[1] + head_dy), head_img)

        # Front layer (Lead guard arm)
        f.paste(lead_arm_img, (lead_arm_box[0] + lead_dx, lead_arm_box[1] + lead_dy), lead_arm_img)
        frames.append(f)

        # Blink variant: eyes closed on frame 4
        f_blink = f.copy()
        if i in (4, 5):
            # Draw subtle closed anime eye crease on face
            eye_draw = ImageDraw.Draw(f_blink)
            eye_y = head_box[1] + head_dy + int(head_img.height * 0.44)
            eye_x_center = head_box[0] + int(head_img.width * 0.50)
            eye_draw.line([(eye_x_center - 10, eye_y), (eye_x_center - 2, eye_y + 1)], fill=(30, 20, 25, 230), width=2)
            eye_draw.line([(eye_x_center + 3, eye_y + 1), (eye_x_center + 11, eye_y)], fill=(30, 20, 25, 230), width=2)
        blink_frames.append(f_blink)

    # Stitch into horizontal sprite strips
    idle_strip = Image.new('RGBA', (FRAME_W * NUM_IDLE_FRAMES, FRAME_H), (0, 0, 0, 0))
    idle_blink_strip = Image.new('RGBA', (FRAME_W * NUM_IDLE_FRAMES, FRAME_H), (0, 0, 0, 0))

    for idx, frame in enumerate(frames):
        idle_strip.paste(frame, (idx * FRAME_W, 0))
        idle_blink_strip.paste(blink_frames[idx], (idx * FRAME_W, 0))

    out_idle = os.path.join(out_dir, 'Idle.png')
    out_blink = os.path.join(out_dir, 'Idle_Blink.png')
    idle_strip.save(out_idle, 'PNG')
    idle_blink_strip.save(out_blink, 'PNG')
    print(f"Saved 10-frame idle strip: {out_idle} ({idle_strip.size})")

    # Save animated GIF preview (125ms per frame = 8 FPS)
    gif_path = os.path.join(out_dir, 'idle_preview.gif')
    frames[0].save(
        gif_path,
        save_all=True,
        append_images=frames[1:],
        duration=125,
        loop=0,
        disposal=2
    )
    print(f"Saved GIF preview: {gif_path}")
    return frames, gif_path

if __name__ == "__main__":
    # 1. Kai Palettes & Model Sheet
    kai_palette = [
        ("Jacket Cobalt Navy", "#0055ff", (0, 85, 255)),
        ("Radiant Energy Cyan", "#00e5ff", (0, 229, 255)),
        ("Combat Dark Charcoal", "#121520", (18, 21, 32)),
        ("Highlight White Piping", "#f0f6ff", (240, 246, 255)),
        ("Piercing Cobalt Eye", "#1ad1ff", (26, 209, 255)),
    ]
    make_model_sheet(
        "public/assets/sprites/kai_idle.png",
        "public/assets/sprites/portrait_kai.png",
        "Kai",
        "Crimson Striker (P1)",
        kai_palette,
        is_p1=True,
        out_path="public/assets/fighters/kai/references/kai_model_sheet.png"
    )

    # 2. Shadow Palettes & Model Sheet
    shadow_palette = [
        ("Trench Coat Deep Red", "#ff1a4b", (255, 26, 75)),
        ("Void Amethyst Energy", "#ba68c8", (186, 104, 200)),
        ("Abyssal Black Vest", "#0d0f18", (13, 15, 24)),
        ("Silver-White Undercut", "#e6e8f0", (230, 232, 240)),
        ("Intense Crimson Eye", "#ff003c", (255, 0, 60)),
    ]
    make_model_sheet(
        "public/assets/sprites/shadow_idle.png",
        "public/assets/sprites/portrait_shadow.png",
        "Shadow",
        "Shadow Fighter (P2)",
        shadow_palette,
        is_p1=False,
        out_path="public/assets/fighters/shadow/references/shadow_model_sheet.png"
    )

    # 3. Generate Kai 10-Frame Idle
    print("\n--- Generating Kai 10-Frame Idle Animation ---")
    build_ten_frame_idle(
        "public/assets/sprites/kai_idle.png",
        "public/assets/sprites/p1",
        is_p1=True
    )
    # Also save in fighters/kai/idle/
    build_ten_frame_idle(
        "public/assets/sprites/kai_idle.png",
        "public/assets/fighters/kai/idle",
        is_p1=True
    )

    # 4. Generate Shadow 10-Frame Idle
    print("\n--- Generating Shadow 10-Frame Idle Animation ---")
    build_ten_frame_idle(
        "public/assets/sprites/shadow_idle.png",
        "public/assets/sprites/p2",
        is_p1=False
    )
    # Also save in fighters/shadow/idle/
    build_ten_frame_idle(
        "public/assets/sprites/shadow_idle.png",
        "public/assets/fighters/shadow/idle",
        is_p1=False
    )
