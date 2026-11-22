import os
import json
import math
from PIL import Image, ImageDraw, ImageFilter

FRAME_W = 400
FRAME_H = 500
GROUND_CONTACT_Y = 475 # Exact pixel row where soles of shoes make contact with ground floor

def build_complete_hybrid_suite(base_sprite_path, out_sprites_dir, fighter_root_dir, is_p1=True):
    # Setup directories
    os.makedirs(out_sprites_dir, exist_ok=True)
    dirs = {
        "movement": os.path.join(fighter_root_dir, "movement"),
        "attacks": os.path.join(fighter_root_dir, "attacks"),
        "reactions": os.path.join(fighter_root_dir, "reactions"),
        "specials": os.path.join(fighter_root_dir, "specials"),
        "victory": os.path.join(fighter_root_dir, "victory"),
        "atlases": os.path.join(fighter_root_dir, "atlases"),
    }
    for d in dirs.values():
        os.makedirs(d, exist_ok=True)

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

    dir_sign = 1 if is_p1 else -1
    accent_rgb = (0, 229, 255) if is_p1 else (255, 26, 75)
    aura_rgb = (0, 140, 255) if is_p1 else (186, 104, 200)

    atlas_data = {
        "character": "Kai" if is_p1 else "Shadow",
        "frameWidth": FRAME_W,
        "frameHeight": FRAME_H,
        "groundAnchorY": GROUND_CONTACT_Y,
        "scale": 0.58,
        "animations": {}
    }

    def save_strip(img, name, category, frames_max, frame_rate=10, loop=False):
        # Save to legacy sprites dir
        legacy_path = os.path.join(out_sprites_dir, f"{name}.png")
        img.save(legacy_path, "PNG")

        # Save to categorized dir
        cat_dir = dirs[category]
        cat_path = os.path.join(cat_dir, f"{name}.png")
        img.save(cat_path, "PNG")

        atlas_data["animations"][name] = {
            "name": name,
            "category": category,
            "image": f"{name}.png",
            "framesMax": frames_max,
            "frameRate": frame_rate,
            "loop": loop,
            "frameWidth": FRAME_W,
            "frameHeight": FRAME_H
        }

    # ==============================================================
    # 1. WALK FORWARD & BACKWARD (8 frames: fluid martial arts stride)
    # ==============================================================
    walk_strip = Image.new('RGBA', (FRAME_W * 8, FRAME_H), (0, 0, 0, 0))
    walk_bwd_strip = Image.new('RGBA', (FRAME_W * 8, FRAME_H), (0, 0, 0, 0))
    for i in range(8):
        f = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
        t = (i / 8.0) * math.pi * 2
        stride_lead = int(math.sin(t) * 26 * dir_sign)
        stride_rear = int(-math.sin(t) * 26 * dir_sign)
        arm_swing = int(math.sin(t) * 18 * dir_sign)
        bob_y = int(abs(math.sin(t * 2)) * 5)

        f.paste(rear_arm_img, (rear_arm_box[0] - arm_swing, rear_arm_box[1] + bob_y), rear_arm_img)
        f.paste(rear_leg_img, (rear_leg_box[0] + stride_rear, rear_leg_box[1] + bob_y // 2), rear_leg_img)
        f.paste(lead_leg_img, (lead_leg_box[0] + stride_lead, lead_leg_box[1] - bob_y // 2), lead_leg_img)
        f.paste(torso_img, (torso_box[0], torso_box[1] + bob_y), torso_img)
        f.paste(head_img, (head_box[0], head_box[1] + bob_y), head_img)
        f.paste(lead_arm_img, (lead_arm_box[0] + arm_swing, lead_arm_box[1] + bob_y), lead_arm_img)
        walk_strip.paste(f, (i * FRAME_W, 0))
        walk_bwd_strip.paste(f, ((7 - i) * FRAME_W, 0))

    save_strip(walk_strip, "Walk", "movement", 8, frame_rate=10, loop=True)
    save_strip(walk_strip, "Walk_Fwd", "movement", 8, frame_rate=10, loop=True)
    save_strip(walk_bwd_strip, "Walk_Bwd", "movement", 8, frame_rate=8, loop=True)

    # ==============================================================
    # 2. RUN (8 frames: dynamic forward sprint with body lean)
    # ==============================================================
    run_strip = Image.new('RGBA', (FRAME_W * 8, FRAME_H), (0, 0, 0, 0))
    for i in range(8):
        f = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
        t = (i / 8.0) * math.pi * 2
        stride_lead = int(math.sin(t) * 42 * dir_sign)
        stride_rear = int(-math.sin(t) * 42 * dir_sign)
        arm_swing = int(math.sin(t) * 32 * dir_sign)
        bob_y = int(abs(math.sin(t * 2)) * 8)
        forward_lean = 10 * dir_sign

        f.paste(rear_arm_img, (rear_arm_box[0] - arm_swing + forward_lean, rear_arm_box[1] + bob_y), rear_arm_img)
        f.paste(rear_leg_img, (rear_leg_box[0] + stride_rear, rear_leg_box[1] + bob_y // 2), rear_leg_img)
        f.paste(lead_leg_img, (lead_leg_box[0] + stride_lead, lead_leg_box[1] - bob_y // 2), lead_leg_img)
        f.paste(torso_img, (torso_box[0] + forward_lean, torso_box[1] + bob_y), torso_img)
        f.paste(head_img, (head_box[0] + forward_lean + 4 * dir_sign, head_box[1] + bob_y), head_img)
        f.paste(lead_arm_img, (lead_arm_box[0] + arm_swing + forward_lean, lead_arm_box[1] + bob_y), lead_arm_img)
        run_strip.paste(f, (i * FRAME_W, 0))

    save_strip(run_strip, "Run", "movement", 8, frame_rate=13, loop=True)

    # ==============================================================
    # 3. JUMP & FALL
    # ==============================================================
    jump_strip = Image.new('RGBA', (FRAME_W * 3, FRAME_H), (0, 0, 0, 0))
    f0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0)) # Squat anticipation
    f0.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] + 18), rear_leg_img)
    f0.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1] + 18), lead_leg_img)
    f0.paste(torso_img, (torso_box[0], torso_box[1] + 22), torso_img)
    f0.paste(head_img, (head_box[0], head_box[1] + 22), head_img)
    f0.paste(lead_arm_img, (lead_arm_box[0] - 10 * dir_sign, lead_arm_box[1] + 26), lead_arm_img)
    jump_strip.paste(f0, (0, 0))

    f1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0)) # Airborne rise
    f1.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] - 42), rear_leg_img)
    f1.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1] - 52), lead_leg_img)
    f1.paste(torso_img, (torso_box[0], torso_box[1] - 46), torso_img)
    f1.paste(head_img, (head_box[0], head_box[1] - 50), head_img)
    f1.paste(lead_arm_img, (lead_arm_box[0] + 15 * dir_sign, lead_arm_box[1] - 56), lead_arm_img)
    jump_strip.paste(f1, (FRAME_W, 0))

    f2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0)) # Apex float
    f2.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] - 32), rear_leg_img)
    f2.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1] - 36), lead_leg_img)
    f2.paste(torso_img, (torso_box[0], torso_box[1] - 36), torso_img)
    f2.paste(head_img, (head_box[0], head_box[1] - 38), head_img)
    f2.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1] - 42), lead_arm_img)
    jump_strip.paste(f2, (FRAME_W * 2, 0))
    save_strip(jump_strip, "Jump", "movement", 3, frame_rate=8, loop=False)

    fall_strip = Image.new('RGBA', (FRAME_W * 2, FRAME_H), (0, 0, 0, 0))
    f_fall0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_fall0.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] - 18), rear_leg_img)
    f_fall0.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1] - 12), lead_leg_img)
    f_fall0.paste(torso_img, (torso_box[0], torso_box[1] - 15), torso_img)
    f_fall0.paste(head_img, (head_box[0], head_box[1] - 16), head_img)
    f_fall0.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1] - 22), lead_arm_img)
    fall_strip.paste(f_fall0, (0, 0))

    f_fall1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_fall1.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] - 6), rear_leg_img)
    f_fall1.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1] - 4), lead_leg_img)
    f_fall1.paste(torso_img, (torso_box[0], torso_box[1] - 6), torso_img)
    f_fall1.paste(head_img, (head_box[0], head_box[1] - 8), head_img)
    f_fall1.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1] - 10), lead_arm_img)
    fall_strip.paste(f_fall1, (FRAME_W, 0))
    save_strip(fall_strip, "Fall", "movement", 2, frame_rate=6, loop=False)

    # ==============================================================
    # 4. CROUCH
    # ==============================================================
    crouch_strip = Image.new('RGBA', (FRAME_W * 2, FRAME_H), (0, 0, 0, 0))
    leg_sq = lead_leg_img.resize((lead_leg_img.width + 15, int(lead_leg_img.height * 0.8)), Image.Resampling.BILINEAR)
    f_c0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_c0.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] + 35), rear_leg_img)
    f_c0.paste(leg_sq, (lead_leg_box[0], GROUND_CONTACT_Y - leg_sq.height), leg_sq)
    f_c0.paste(torso_img, (torso_box[0], torso_box[1] + 40), torso_img)
    f_c0.paste(head_img, (head_box[0], head_box[1] + 40), head_img)
    f_c0.paste(lead_arm_img, (lead_arm_box[0] + 10 * dir_sign, lead_arm_box[1] + 35), lead_arm_img)
    crouch_strip.paste(f_c0, (0, 0))

    leg_deep = lead_leg_img.resize((lead_leg_img.width + 30, int(lead_leg_img.height * 0.65)), Image.Resampling.BILINEAR)
    f_c1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_c1.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] + 60), rear_leg_img)
    f_c1.paste(leg_deep, (lead_leg_box[0], GROUND_CONTACT_Y - leg_deep.height), leg_deep)
    f_c1.paste(torso_img, (torso_box[0], torso_box[1] + 75), torso_img)
    f_c1.paste(head_img, (head_box[0], head_box[1] + 75), head_img)
    f_c1.paste(lead_arm_img, (lead_arm_box[0] + 15 * dir_sign, lead_arm_box[1] + 65), lead_arm_img)
    crouch_strip.paste(f_c1, (FRAME_W, 0))
    save_strip(crouch_strip, "Crouch", "movement", 2, frame_rate=8, loop=False)

    # ==============================================================
    # 5. PUNCH LIGHT (Snappy Jab with Impact Star)
    # ==============================================================
    pj_strip = Image.new('RGBA', (FRAME_W * 3, FRAME_H), (0, 0, 0, 0))
    f_pj0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_pj0.paste(rear_leg_img, (rear_leg_box[0] - 5 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_pj0.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
    f_pj0.paste(torso_img, (torso_box[0] - 10 * dir_sign, torso_box[1]), torso_img)
    f_pj0.paste(head_img, (head_box[0] - 8 * dir_sign, head_box[1]), head_img)
    f_pj0.paste(lead_arm_img, (lead_arm_box[0] - 15 * dir_sign, lead_arm_box[1]), lead_arm_img)
    pj_strip.paste(f_pj0, (0, 0))

    f_pj1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_pj1.paste(rear_leg_img, (rear_leg_box[0] - 10 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_pj1.paste(lead_leg_img, (lead_leg_box[0] + 15 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_pj1.paste(torso_img, (torso_box[0] + 15 * dir_sign, torso_box[1]), torso_img)
    f_pj1.paste(head_img, (head_box[0] + 12 * dir_sign, head_box[1]), head_img)
    arm_jab = lead_arm_img.resize((int(lead_arm_img.width * 1.3), lead_arm_img.height), Image.Resampling.BILINEAR)
    f_pj1.paste(arm_jab, (lead_arm_box[0] + 45 * dir_sign, lead_arm_box[1] - 5), arm_jab)
    draw_pj = ImageDraw.Draw(f_pj1)
    fx = lead_arm_box[0] + 45 * dir_sign + (arm_jab.width - 10 if is_p1 else 10)
    fy = lead_arm_box[1] + arm_jab.height // 2
    draw_pj.ellipse([fx - 16, fy - 16, fx + 16, fy + 16], fill=(*accent_rgb, 190), outline=(255, 255, 255, 220), width=2)
    pj_strip.paste(f_pj1, (FRAME_W, 0))

    f_pj2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_pj2.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_pj2.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
    f_pj2.paste(torso_img, (torso_box[0], torso_box[1]), torso_img)
    f_pj2.paste(head_img, (head_box[0], head_box[1]), head_img)
    f_pj2.paste(lead_arm_img, (lead_arm_box[0] + 10 * dir_sign, lead_arm_box[1]), lead_arm_img)
    pj_strip.paste(f_pj2, (FRAME_W * 2, 0))
    save_strip(pj_strip, "Punch_Light", "attacks", 3, frame_rate=18, loop=False)

    # ==============================================================
    # 6. ATTACK1 (Heavy Martial Arts Strike - 5 frames)
    # ==============================================================
    atk1_strip = Image.new('RGBA', (FRAME_W * 5, FRAME_H), (0, 0, 0, 0))
    f_atk1_0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0)) # Windup
    f_atk1_0.paste(rear_leg_img, (rear_leg_box[0] - 10 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_atk1_0.paste(lead_leg_img, (lead_leg_box[0] - 5 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_atk1_0.paste(torso_img, (torso_box[0] - 22 * dir_sign, torso_box[1] + 5), torso_img)
    f_atk1_0.paste(head_img, (head_box[0] - 18 * dir_sign, head_box[1] + 5), head_img)
    f_atk1_0.paste(lead_arm_img, (lead_arm_box[0] - 35 * dir_sign, lead_arm_box[1] + 12), lead_arm_img)
    atk1_strip.paste(f_atk1_0, (0, 0))

    f_atk1_1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0)) # Lunge
    f_atk1_1.paste(rear_leg_img, (rear_leg_box[0] - 18 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_atk1_1.paste(lead_leg_img, (lead_leg_box[0] + 10 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_atk1_1.paste(torso_img, (torso_box[0] + 15 * dir_sign, torso_box[1]), torso_img)
    f_atk1_1.paste(head_img, (head_box[0] + 12 * dir_sign, head_box[1]), head_img)
    arm_smear = lead_arm_img.resize((int(lead_arm_img.width * 1.25), lead_arm_img.height), Image.Resampling.BILINEAR)
    f_atk1_1.paste(arm_smear, (lead_arm_box[0] + 35 * dir_sign, lead_arm_box[1] - 5), arm_smear)
    atk1_strip.paste(f_atk1_1, (FRAME_W, 0))

    f_atk1_2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0)) # Impact
    f_atk1_2.paste(rear_leg_img, (rear_leg_box[0] - 25 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_atk1_2.paste(lead_leg_img, (lead_leg_box[0] + 25 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_atk1_2.paste(torso_img, (torso_box[0] + 30 * dir_sign, torso_box[1]), torso_img)
    f_atk1_2.paste(head_img, (head_box[0] + 24 * dir_sign, head_box[1]), head_img)
    arm_lock = lead_arm_img.resize((int(lead_arm_img.width * 1.45), lead_arm_img.height), Image.Resampling.BILINEAR)
    f_atk1_2.paste(arm_lock, (lead_arm_box[0] + 65 * dir_sign, lead_arm_box[1] - 10), arm_lock)
    draw2 = ImageDraw.Draw(f_atk1_2)
    fx = lead_arm_box[0] + 65 * dir_sign + (arm_lock.width - 15 if is_p1 else 15)
    fy = lead_arm_box[1] + arm_lock.height // 2 - 5
    draw2.ellipse([fx - 32, fy - 32, fx + 32, fy + 32], fill=(*accent_rgb, 180), outline=(255, 255, 255, 240), width=3)
    atk1_strip.paste(f_atk1_2, (FRAME_W * 2, 0))

    f_atk1_3 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0)) # Follow-through
    f_atk1_3.paste(rear_leg_img, (rear_leg_box[0] - 20 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_atk1_3.paste(lead_leg_img, (lead_leg_box[0] + 20 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_atk1_3.paste(torso_img, (torso_box[0] + 22 * dir_sign, torso_box[1]), torso_img)
    f_atk1_3.paste(head_img, (head_box[0] + 18 * dir_sign, head_box[1]), head_img)
    f_atk1_3.paste(arm_lock, (lead_arm_box[0] + 50 * dir_sign, lead_arm_box[1] - 5), arm_lock)
    atk1_strip.paste(f_atk1_3, (FRAME_W * 3, 0))

    f_atk1_4 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0)) # Recovery
    f_atk1_4.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_atk1_4.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
    f_atk1_4.paste(torso_img, (torso_box[0] + 5 * dir_sign, torso_box[1]), torso_img)
    f_atk1_4.paste(head_img, (head_box[0] + 5 * dir_sign, head_box[1]), head_img)
    f_atk1_4.paste(lead_arm_img, (lead_arm_box[0] + 10 * dir_sign, lead_arm_box[1]), lead_arm_img)
    atk1_strip.paste(f_atk1_4, (FRAME_W * 4, 0))
    save_strip(atk1_strip, "Attack1", "attacks", 5, frame_rate=15, loop=False)

    # ==============================================================
    # 7. UPPERCUT (4 frames)
    # ==============================================================
    up_strip = Image.new('RGBA', (FRAME_W * 4, FRAME_H), (0, 0, 0, 0))
    f_up0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_up0.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] + 15), rear_leg_img)
    f_up0.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1] + 15), lead_leg_img)
    f_up0.paste(torso_img, (torso_box[0], torso_box[1] + 20), torso_img)
    f_up0.paste(head_img, (head_box[0], head_box[1] + 20), head_img)
    f_up0.paste(lead_arm_img, (lead_arm_box[0] - 15 * dir_sign, lead_arm_box[1] + 45), lead_arm_img)
    up_strip.paste(f_up0, (0, 0))

    f_up1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_up1.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_up1.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
    f_up1.paste(torso_img, (torso_box[0] + 15 * dir_sign, torso_box[1] - 25), torso_img)
    f_up1.paste(head_img, (head_box[0] + 15 * dir_sign, head_box[1] - 30), head_img)
    arm_up = lead_arm_img.rotate(85 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
    f_up1.paste(arm_up, (lead_arm_box[0] + 20 * dir_sign, lead_arm_box[1] - 90), arm_up)
    draw_up = ImageDraw.Draw(f_up1)
    ux = lead_arm_box[0] + 30 * dir_sign + arm_up.width // 2
    uy = lead_arm_box[1] - 90
    draw_up.ellipse([ux - 24, uy - 34, ux + 24, uy + 14], fill=(*accent_rgb, 200), outline=(255, 255, 255, 255), width=3)
    up_strip.paste(f_up1, (FRAME_W, 0))

    f_up2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_up2.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_up2.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
    f_up2.paste(torso_img, (torso_box[0] + 10 * dir_sign, torso_box[1] - 15), torso_img)
    f_up2.paste(head_img, (head_box[0] + 10 * dir_sign, head_box[1] - 20), head_img)
    f_up2.paste(arm_up, (lead_arm_box[0] + 15 * dir_sign, lead_arm_box[1] - 65), arm_up)
    up_strip.paste(f_up2, (FRAME_W * 2, 0))

    f_up3 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_up3.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_up3.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
    f_up3.paste(torso_img, (torso_box[0], torso_box[1]), torso_img)
    f_up3.paste(head_img, (head_box[0], head_box[1]), head_img)
    f_up3.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1]), lead_arm_img)
    up_strip.paste(f_up3, (FRAME_W * 3, 0))
    save_strip(up_strip, "Uppercut", "attacks", 4, frame_rate=14, loop=False)

    # ==============================================================
    # 8. KICK LIGHT & KICK LOW & KICK HEAVY
    # ==============================================================
    kl_strip = Image.new('RGBA', (FRAME_W * 3, FRAME_H), (0, 0, 0, 0))
    f_kl0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_kl0.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    cham_l = lead_leg_img.resize((lead_leg_img.width, int(lead_leg_img.height * 0.7)), Image.Resampling.BILINEAR)
    f_kl0.paste(cham_l, (lead_leg_box[0] - 10 * dir_sign, lead_leg_box[1] - 35), cham_l)
    f_kl0.paste(torso_img, (torso_box[0], torso_box[1]), torso_img)
    f_kl0.paste(head_img, (head_box[0], head_box[1]), head_img)
    f_kl0.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1]), lead_arm_img)
    kl_strip.paste(f_kl0, (0, 0))

    f_kl1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_kl1.paste(rear_leg_img, (rear_leg_box[0] - 15 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_kl1.paste(torso_img, (torso_box[0] - 10 * dir_sign, torso_box[1] + 5), torso_img)
    f_kl1.paste(head_img, (head_box[0] - 8 * dir_sign, head_box[1] + 5), head_img)
    f_kl1.paste(lead_arm_img, (lead_arm_box[0] - 20 * dir_sign, lead_arm_box[1] + 10), lead_arm_img)
    leg_ext = lead_leg_img.rotate(-70 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
    f_kl1.paste(leg_ext, (lead_leg_box[0] + 25 * dir_sign, lead_leg_box[1] - 80), leg_ext)
    kl_strip.paste(f_kl1, (FRAME_W, 0))

    f_kl2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_kl2.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_kl2.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
    f_kl2.paste(torso_img, (torso_box[0], torso_box[1]), torso_img)
    f_kl2.paste(head_img, (head_box[0], head_box[1]), head_img)
    f_kl2.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1]), lead_arm_img)
    kl_strip.paste(f_kl2, (FRAME_W * 2, 0))
    save_strip(kl_strip, "Kick_Light", "attacks", 3, frame_rate=16, loop=False)

    kh_strip = Image.new('RGBA', (FRAME_W * 4, FRAME_H), (0, 0, 0, 0))
    kh_strip.paste(f_kl0, (0, 0))
    f_kh1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_kh1.paste(rear_leg_img, (rear_leg_box[0] - 25 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_kh1.paste(torso_img, (torso_box[0] - 15 * dir_sign, torso_box[1] + 10), torso_img)
    f_kh1.paste(head_img, (head_box[0] - 12 * dir_sign, head_box[1] + 10), head_img)
    f_kh1.paste(lead_arm_img, (lead_arm_box[0] - 25 * dir_sign, lead_arm_box[1] + 15), lead_arm_img)
    leg_high = lead_leg_img.rotate(-95 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
    f_kh1.paste(leg_high, (lead_leg_box[0] + 35 * dir_sign, lead_leg_box[1] - 120), leg_high)
    draw_kh = ImageDraw.Draw(f_kh1)
    kx = lead_leg_box[0] + 35 * dir_sign + (leg_high.width - 20 if is_p1 else 20)
    ky = lead_leg_box[1] - 100
    draw_kh.ellipse([kx - 28, ky - 28, kx + 28, ky + 28], fill=(*accent_rgb, 200), outline=(255, 255, 255, 240), width=3)
    kh_strip.paste(f_kh1, (FRAME_W, 0))
    kh_strip.paste(f_kh1, (FRAME_W * 2, 0))
    kh_strip.paste(f_kl2, (FRAME_W * 3, 0))
    save_strip(kh_strip, "Kick_Heavy", "attacks", 4, frame_rate=14, loop=False)
    save_strip(kh_strip, "Attack2", "attacks", 4, frame_rate=14, loop=False)

    klow_strip = Image.new('RGBA', (FRAME_W * 3, FRAME_H), (0, 0, 0, 0))
    f_klow0 = f_c0.copy()
    klow_strip.paste(f_klow0, (0, 0))
    f_klow1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_klow1.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] + 55), rear_leg_img)
    f_klow1.paste(torso_img, (torso_box[0], torso_box[1] + 65), torso_img)
    f_klow1.paste(head_img, (head_box[0], head_box[1] + 65), head_img)
    f_klow1.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1] + 60), lead_arm_img)
    leg_sweep = lead_leg_img.rotate(-25 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
    f_klow1.paste(leg_sweep, (lead_leg_box[0] + 40 * dir_sign, GROUND_CONTACT_Y - leg_sweep.height + 5), leg_sweep)
    klow_strip.paste(f_klow1, (FRAME_W, 0))
    klow_strip.paste(f_c1, (FRAME_W * 2, 0))
    save_strip(klow_strip, "Kick_Low", "attacks", 3, frame_rate=14, loop=False)

    # ==============================================================
    # 9. BLOCK & BLOCK CROUCH
    # ==============================================================
    blk_strip = Image.new('RGBA', (FRAME_W * 2, FRAME_H), (0, 0, 0, 0))
    f_b0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_b0.paste(rear_leg_img, (rear_leg_box[0] - 5 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_b0.paste(lead_leg_img, (lead_leg_box[0] + 5 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_b0.paste(torso_img, (torso_box[0] - 12 * dir_sign, torso_box[1]), torso_img)
    f_b0.paste(head_img, (head_box[0] - 10 * dir_sign, head_box[1] + 4), head_img)
    f_b0.paste(rear_arm_img, (rear_arm_box[0] + 15 * dir_sign, rear_arm_box[1] - 15), rear_arm_img)
    f_b0.paste(lead_arm_img, (lead_arm_box[0] - 10 * dir_sign, lead_arm_box[1] - 25), lead_arm_img)
    blk_strip.paste(f_b0, (0, 0))
    blk_strip.paste(f_b0, (FRAME_W, 0))
    save_strip(blk_strip, "Block", "reactions", 2, frame_rate=10, loop=True)

    blk_cr_strip = Image.new('RGBA', (FRAME_W * 2, FRAME_H), (0, 0, 0, 0))
    f_bc = f_c1.copy()
    blk_cr_strip.paste(f_bc, (0, 0))
    blk_cr_strip.paste(f_bc, (FRAME_W, 0))
    save_strip(blk_cr_strip, "Block_Crouch", "reactions", 2, frame_rate=10, loop=True)

    # ==============================================================
    # 10. REACTIONS: TAKE HIT & DEATH / KNOCKDOWN
    # ==============================================================
    hit_strip = Image.new('RGBA', (FRAME_W * 3, FRAME_H), (0, 0, 0, 0))
    f_h0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_h0.paste(rear_leg_img, (rear_leg_box[0] - 10 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_h0.paste(lead_leg_img, (lead_leg_box[0] - 5 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_h0.paste(torso_img, (torso_box[0] - 25 * dir_sign, torso_box[1]), torso_img)
    f_h0.paste(head_img, (head_box[0] - 35 * dir_sign, head_box[1] - 10), head_img)
    f_h0.paste(lead_arm_img, (lead_arm_box[0] - 20 * dir_sign, lead_arm_box[1] - 15), lead_arm_img)
    hit_strip.paste(f_h0, (0, 0))

    f_h1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_h1.paste(rear_leg_img, (rear_leg_box[0] - 18 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_h1.paste(lead_leg_img, (lead_leg_box[0] - 12 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_h1.paste(torso_img, (torso_box[0] - 35 * dir_sign, torso_box[1] + 5), torso_img)
    f_h1.paste(head_img, (head_box[0] - 45 * dir_sign, head_box[1] - 5), head_img)
    f_h1.paste(lead_arm_img, (lead_arm_box[0] - 30 * dir_sign, lead_arm_box[1] - 5), lead_arm_img)
    hit_strip.paste(f_h1, (FRAME_W, 0))

    f_h2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_h2.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_h2.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
    f_h2.paste(torso_img, (torso_box[0] - 10 * dir_sign, torso_box[1]), torso_img)
    f_h2.paste(head_img, (head_box[0] - 10 * dir_sign, head_box[1]), head_img)
    f_h2.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1]), lead_arm_img)
    hit_strip.paste(f_h2, (FRAME_W * 2, 0))
    save_strip(hit_strip, "Take Hit", "reactions", 3, frame_rate=14, loop=False)

    death_strip = Image.new('RGBA', (FRAME_W * 4, FRAME_H), (0, 0, 0, 0))
    death_strip.paste(f_h0, (0, 0))
    death_strip.paste(f_h1, (FRAME_W, 0))
    # Falling & Flat on ground
    f_d2 = base_frame.rotate(-45 * dir_sign, expand=False, resample=Image.Resampling.BICUBIC)
    death_strip.paste(f_d2, (FRAME_W * 2, 0))
    f_d3 = base_frame.rotate(-85 * dir_sign, expand=False, resample=Image.Resampling.BICUBIC)
    death_strip.paste(f_d3, (FRAME_W * 3, 0))
    save_strip(death_strip, "Death", "reactions", 4, frame_rate=8, loop=False)

    # ==============================================================
    # 11. SPECIALS & VICTORY
    # ==============================================================
    spec_strip = Image.new('RGBA', (FRAME_W * 4, FRAME_H), (0, 0, 0, 0))
    f_s0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0)) # Cast charge
    f_s0.paste(rear_leg_img, (rear_leg_box[0] - 10 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_s0.paste(lead_leg_img, (lead_leg_box[0] + 10 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_s0.paste(torso_img, (torso_box[0] - 15 * dir_sign, torso_box[1] + 10), torso_img)
    f_s0.paste(head_img, (head_box[0] - 10 * dir_sign, head_box[1] + 10), head_img)
    f_s0.paste(rear_arm_img, (rear_arm_box[0] - 25 * dir_sign, rear_arm_box[1] + 15), rear_arm_img)
    f_s0.paste(lead_arm_img, (lead_arm_box[0] - 20 * dir_sign, lead_arm_box[1] + 20), lead_arm_img)
    spec_strip.paste(f_s0, (0, 0))

    f_s1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0)) # Energy release burst
    f_s1.paste(rear_leg_img, (rear_leg_box[0] - 20 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_s1.paste(lead_leg_img, (lead_leg_box[0] + 25 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_s1.paste(torso_img, (torso_box[0] + 20 * dir_sign, torso_box[1]), torso_img)
    f_s1.paste(head_img, (head_box[0] + 15 * dir_sign, head_box[1]), head_img)
    arm_fwd = lead_arm_img.resize((int(lead_arm_img.width * 1.35), lead_arm_img.height), Image.Resampling.BILINEAR)
    f_s1.paste(arm_fwd, (lead_arm_box[0] + 55 * dir_sign, lead_arm_box[1] - 5), arm_fwd)
    draw_s = ImageDraw.Draw(f_s1)
    sx = lead_arm_box[0] + 55 * dir_sign + (arm_fwd.width if is_p1 else 0)
    sy = lead_arm_box[1] + arm_fwd.height // 2
    draw_s.ellipse([sx - 36, sy - 36, sx + 36, sy + 36], fill=(*aura_rgb, 190), outline=(255, 255, 255, 250), width=3)
    spec_strip.paste(f_s1, (FRAME_W, 0))
    spec_strip.paste(f_s1, (FRAME_W * 2, 0))
    spec_strip.paste(f_s0, (FRAME_W * 3, 0))
    save_strip(spec_strip, "Special", "specials", 4, frame_rate=14, loop=False)

    vic_strip = Image.new('RGBA', (FRAME_W * 2, FRAME_H), (0, 0, 0, 0))
    f_v0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_v0.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_v0.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
    f_v0.paste(torso_img, (torso_box[0], torso_box[1] - 10), torso_img)
    f_v0.paste(head_img, (head_box[0], head_box[1] - 10), head_img)
    arm_vic = lead_arm_img.rotate(110 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
    f_v0.paste(arm_vic, (lead_arm_box[0] + 15 * dir_sign, lead_arm_box[1] - 80), arm_vic)
    vic_strip.paste(f_v0, (0, 0))
    vic_strip.paste(f_v0, (FRAME_W, 0))
    save_strip(vic_strip, "Victory", "victory", 2, frame_rate=6, loop=True)

    # Save Atlas JSON descriptor
    atlas_json_path = os.path.join(dirs["atlases"], f"{'kai' if is_p1 else 'shadow'}_atlas.json")
    with open(atlas_json_path, "w") as f_json:
        json.dump(atlas_data, f_json, indent=2)
    print(f"Saved Atlas JSON: {atlas_json_path}")

if __name__ == "__main__":
    print("=== Generating Kai Complete Hybrid Animation Suite ===")
    build_complete_hybrid_suite(
        "public/assets/sprites/kai_idle.png",
        "public/assets/sprites/p1",
        "public/assets/fighters/kai",
        is_p1=True
    )

    print("\n=== Generating Shadow Complete Hybrid Animation Suite ===")
    build_complete_hybrid_suite(
        "public/assets/sprites/shadow_idle.png",
        "public/assets/sprites/p2",
        "public/assets/fighters/shadow",
        is_p1=False
    )
