import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

FRAME_W = 400
FRAME_H = 500
GROUND_CONTACT_Y = 475 # Exact pixel row where soles of shoes make contact with ground

def build_character_animations(base_sprite_path, out_dir, is_p1=True):
    os.makedirs(out_dir, exist_ok=True)
    base_raw = Image.open(base_sprite_path).convert('RGBA')
    bw_raw, bh_raw = base_raw.size

    # Target height 450 in 400x500 canvas
    target_h = 450
    scale = target_h / float(bh_raw)
    target_w = int(bw_raw * scale)
    base = base_raw.resize((target_w, target_h), Image.Resampling.LANCZOS)
    bw, bh = base.size

    # Position base frame so the sole of the shoes contacts GROUND_CONTACT_Y exactly
    base_frame = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    pos_x = (FRAME_W - bw) // 2
    pos_y = GROUND_CONTACT_Y - bh
    base_frame.paste(base, (pos_x, pos_y), base)

    # Segment anatomical layers (normalized to base_frame space)
    # 1. Head & Neck
    head_box = (pos_x + int(bw * 0.32), pos_y + int(bh * 0.02),
                pos_x + int(bw * 0.68), pos_y + int(bh * 0.26))
    head_img = base_frame.crop(head_box)

    # 2. Torso & Chest & Belt
    torso_box = (pos_x + int(bw * 0.28), pos_y + int(bh * 0.23),
                 pos_x + int(bw * 0.72), pos_y + int(bh * 0.58))
    torso_img = base_frame.crop(torso_box)

    # 3. Lead Arm (right arm for P1 facing right; left arm for P2 facing left)
    lead_arm_box = (pos_x + int(bw * 0.52), pos_y + int(bh * 0.26),
                    pos_x + int(bw * 0.95), pos_y + int(bh * 0.56)) if is_p1 else \
                   (pos_x + int(bw * 0.05), pos_y + int(bh * 0.26),
                    pos_x + int(bw * 0.48), pos_y + int(bh * 0.56))
    lead_arm_img = base_frame.crop(lead_arm_box)

    # 4. Rear Arm
    rear_arm_box = (pos_x + int(bw * 0.10), pos_y + int(bh * 0.26),
                    pos_x + int(bw * 0.48), pos_y + int(bh * 0.56)) if is_p1 else \
                   (pos_x + int(bw * 0.52), pos_y + int(bh * 0.26),
                    pos_x + int(bw * 0.90), pos_y + int(bh * 0.56))
    rear_arm_img = base_frame.crop(rear_arm_box)

    # 5. Lead Leg & Sneaker
    lead_leg_box = (pos_x + int(bw * 0.45), pos_y + int(bh * 0.54),
                    pos_x + int(bw * 0.95), GROUND_CONTACT_Y) if is_p1 else \
                   (pos_x + int(bw * 0.05), pos_y + int(bh * 0.54),
                    pos_x + int(bw * 0.55), GROUND_CONTACT_Y)
    lead_leg_img = base_frame.crop(lead_leg_box)

    # 6. Rear Leg & Sneaker
    rear_leg_box = (pos_x + int(bw * 0.08), pos_y + int(bh * 0.54),
                    pos_x + int(bw * 0.55), GROUND_CONTACT_Y) if is_p1 else \
                   (pos_x + int(bw * 0.45), pos_y + int(bh * 0.54),
                    pos_x + int(bw * 0.92), GROUND_CONTACT_Y)
    rear_leg_img = base_frame.crop(rear_leg_box)

    dir_sign = 1 if is_p1 else -1
    accent_rgb = (0, 212, 255) if is_p1 else (255, 30, 60)
    flame_rgb = (255, 120, 0) if is_p1 else (255, 20, 50)

    # ==============================================================
    # 1. IDLE (4 frames: breathing, chest expansion, stance bob)
    # ==============================================================
    idle_strip = Image.new('RGBA', (FRAME_W * 4, FRAME_H), (0, 0, 0, 0))
    for i in range(4):
        f = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
        phase = i / 4.0 * math.pi * 2
        breath_y = int(math.sin(phase) * 5)
        chest_expand = int(math.sin(phase) * 4)

        f.paste(rear_arm_img, (rear_arm_box[0], rear_arm_box[1] + breath_y // 2), rear_arm_img)
        f.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
        f.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
        t_scaled = torso_img.resize((torso_img.width + chest_expand, torso_img.height), Image.Resampling.BILINEAR)
        f.paste(t_scaled, (torso_box[0] - chest_expand // 2, torso_box[1] - breath_y), t_scaled)
        head_nod = -breath_y // 2
        f.paste(head_img, (head_box[0], head_box[1] + head_nod), head_img)
        f.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1] - breath_y), lead_arm_img)
        idle_strip.paste(f, (i * FRAME_W, 0))
    idle_strip.save(os.path.join(out_dir, 'Idle.png'), 'PNG')

    # ==============================================================
    # 2. WALK / RUN (6 frames: authentic alternating leg strides)
    # ==============================================================
    walk_strip = Image.new('RGBA', (FRAME_W * 6, FRAME_H), (0, 0, 0, 0))
    for i in range(6):
        f = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
        t = i / 6.0 * math.pi * 2
        stride_lead = int(math.sin(t) * 28 * dir_sign)
        stride_rear = int(-math.sin(t) * 28 * dir_sign)
        arm_swing = int(math.sin(t) * 20 * dir_sign)
        bob_y = int(abs(math.sin(t * 2)) * 6)

        f.paste(rear_arm_img, (rear_arm_box[0] - arm_swing, rear_arm_box[1] + bob_y), rear_arm_img)
        f.paste(rear_leg_img, (rear_leg_box[0] + stride_rear, rear_leg_box[1] + bob_y // 2), rear_leg_img)
        f.paste(lead_leg_img, (lead_leg_box[0] + stride_lead, lead_leg_box[1] - bob_y // 2), lead_leg_img)
        f.paste(torso_img, (torso_box[0], torso_box[1] + bob_y), torso_img)
        f.paste(head_img, (head_box[0], head_box[1] + bob_y), head_img)
        f.paste(lead_arm_img, (lead_arm_box[0] + arm_swing, lead_arm_box[1] + bob_y), lead_arm_img)
        walk_strip.paste(f, (i * FRAME_W, 0))
    walk_strip.save(os.path.join(out_dir, 'Run.png'), 'PNG')
    walk_strip.save(os.path.join(out_dir, 'Walk.png'), 'PNG')

    # ==============================================================
    # 3. JUMP (3 frames: squat takeoff, airborne tuck, apex)
    # ==============================================================
    jump_strip = Image.new('RGBA', (FRAME_W * 3, FRAME_H), (0, 0, 0, 0))
    f0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f0.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] + 18), rear_leg_img)
    f0.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1] + 18), lead_leg_img)
    f0.paste(torso_img, (torso_box[0], torso_box[1] + 22), torso_img)
    f0.paste(head_img, (head_box[0], head_box[1] + 22), head_img)
    f0.paste(lead_arm_img, (lead_arm_box[0] - 10 * dir_sign, lead_arm_box[1] + 26), lead_arm_img)
    jump_strip.paste(f0, (0, 0))

    f1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f1.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] - 40), rear_leg_img)
    f1.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1] - 50), lead_leg_img)
    f1.paste(torso_img, (torso_box[0], torso_box[1] - 45), torso_img)
    f1.paste(head_img, (head_box[0], head_box[1] - 50), head_img)
    f1.paste(lead_arm_img, (lead_arm_box[0] + 15 * dir_sign, lead_arm_box[1] - 55), lead_arm_img)
    jump_strip.paste(f1, (FRAME_W, 0))

    f2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f2.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] - 30), rear_leg_img)
    f2.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1] - 35), lead_leg_img)
    f2.paste(torso_img, (torso_box[0], torso_box[1] - 35), torso_img)
    f2.paste(head_img, (head_box[0], head_box[1] - 38), head_img)
    f2.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1] - 40), lead_arm_img)
    jump_strip.paste(f2, (FRAME_W * 2, 0))
    jump_strip.save(os.path.join(out_dir, 'Jump.png'), 'PNG')

    # ==============================================================
    # 4. FALL (2 frames)
    # ==============================================================
    fall_strip = Image.new('RGBA', (FRAME_W * 2, FRAME_H), (0, 0, 0, 0))
    f0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f0.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] - 20), rear_leg_img)
    f0.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1] - 12), lead_leg_img)
    f0.paste(torso_img, (torso_box[0], torso_box[1] - 16), torso_img)
    f0.paste(head_img, (head_box[0], head_box[1] - 18), head_img)
    f0.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1] - 24), lead_arm_img)
    fall_strip.paste(f0, (0, 0))

    f1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f1.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] - 8), rear_leg_img)
    f1.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1] - 4), lead_leg_img)
    f1.paste(torso_img, (torso_box[0], torso_box[1] - 8), torso_img)
    f1.paste(head_img, (head_box[0], head_box[1] - 10), head_img)
    f1.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1] - 12), lead_arm_img)
    fall_strip.paste(f1, (FRAME_W, 0))
    fall_strip.save(os.path.join(out_dir, 'Fall.png'), 'PNG')

    # ==============================================================
    # 5. CROUCH (2 frames: dropping, grounded low defense)
    # ==============================================================
    crouch_strip = Image.new('RGBA', (FRAME_W * 2, FRAME_H), (0, 0, 0, 0))
    f0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    leg_sq = lead_leg_img.resize((lead_leg_img.width + 15, int(lead_leg_img.height * 0.8)), Image.Resampling.BILINEAR)
    f0.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] + 30), rear_leg_img)
    f0.paste(leg_sq, (lead_leg_box[0], GROUND_CONTACT_Y - leg_sq.height), leg_sq)
    f0.paste(torso_img, (torso_box[0], torso_box[1] + 40), torso_img)
    f0.paste(head_img, (head_box[0], head_box[1] + 40), head_img)
    f0.paste(lead_arm_img, (lead_arm_box[0] + 10 * dir_sign, lead_arm_box[1] + 35), lead_arm_img)
    crouch_strip.paste(f0, (0, 0))

    f1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    leg_deep = lead_leg_img.resize((lead_leg_img.width + 30, int(lead_leg_img.height * 0.65)), Image.Resampling.BILINEAR)
    f1.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] + 60), rear_leg_img)
    f1.paste(leg_deep, (lead_leg_box[0], GROUND_CONTACT_Y - leg_deep.height), leg_deep)
    f1.paste(torso_img, (torso_box[0], torso_box[1] + 75), torso_img)
    f1.paste(head_img, (head_box[0], head_box[1] + 75), head_img)
    f1.paste(lead_arm_img, (lead_arm_box[0] + 15 * dir_sign, lead_arm_box[1] + 65), lead_arm_img)
    crouch_strip.paste(f1, (FRAME_W, 0))
    crouch_strip.save(os.path.join(out_dir, 'Crouch.png'), 'PNG')

    # ==============================================================
    # 6. ATTACK1: MARTIAL ARTS PUNCH (5 frames strictly matching User References 1, 3, 5)
    # ==============================================================
    atk1_strip = Image.new('RGBA', (FRAME_W * 5, FRAME_H), (0, 0, 0, 0))
    
    # Frame 0: Deep Coil & Windup (Image 3 & 5: Torso turns back, elbow back to hip, rear guard covers chin)
    f0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f0.paste(rear_leg_img, (rear_leg_box[0] - 10 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f0.paste(lead_leg_img, (lead_leg_box[0] - 5 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f0.paste(torso_img, (torso_box[0] - 22 * dir_sign, torso_box[1] + 5), torso_img)
    f0.paste(head_img, (head_box[0] - 18 * dir_sign, head_box[1] + 5), head_img)
    f0.paste(rear_arm_img, (rear_arm_box[0] - 15 * dir_sign, rear_arm_box[1] - 8), rear_arm_img)
    f0.paste(lead_arm_img, (lead_arm_box[0] - 35 * dir_sign, lead_arm_box[1] + 12), lead_arm_img)
    atk1_strip.paste(f0, (0, 0))

    # Frame 1: Acceleration & Dynamic Anime Smear (Image 3: Speed smear trail, forward torso drive)
    f1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f1.paste(rear_leg_img, (rear_leg_box[0] - 18 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f1.paste(lead_leg_img, (lead_leg_box[0] + 10 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f1.paste(torso_img, (torso_box[0] + 15 * dir_sign, torso_box[1]), torso_img)
    f1.paste(head_img, (head_box[0] + 12 * dir_sign, head_box[1]), head_img)
    arm_smear = lead_arm_img.resize((int(lead_arm_img.width * 1.25), lead_arm_img.height), Image.Resampling.BILINEAR)
    f1.paste(arm_smear, (lead_arm_box[0] + 35 * dir_sign, lead_arm_box[1] - 5), arm_smear)
    # Dynamic black & white anime smear line (like Image 3)
    draw1 = ImageDraw.Draw(f1)
    sx1 = lead_arm_box[0] + (10 if is_p1 else arm_smear.width)
    sx2 = sx1 + 95 * dir_sign
    sy = lead_arm_box[1] + arm_smear.height // 2
    draw1.line([(sx1, sy), (sx2, sy)], fill=(255, 255, 255, 220), width=4)
    draw1.line([(sx1, sy - 4), (sx2, sy - 2)], fill=(*accent_rgb, 180), width=2)
    draw1.line([(sx1, sy + 4), (sx2, sy + 2)], fill=(*accent_rgb, 180), width=2)
    atk1_strip.paste(f1, (FRAME_W, 0))

    # Frame 2: Peak Extension & Hit Impact (Images 1 & 5: Fist fully locked straight, clenched glove, fiery hit burst)
    f2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f2.paste(rear_leg_img, (rear_leg_box[0] - 25 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f2.paste(lead_leg_img, (lead_leg_box[0] + 25 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f2.paste(torso_img, (torso_box[0] + 30 * dir_sign, torso_box[1]), torso_img)
    f2.paste(head_img, (head_box[0] + 24 * dir_sign, head_box[1]), head_img)
    arm_lock = lead_arm_img.resize((int(lead_arm_img.width * 1.45), lead_arm_img.height), Image.Resampling.BILINEAR)
    f2.paste(arm_lock, (lead_arm_box[0] + 65 * dir_sign, lead_arm_box[1] - 10), arm_lock)
    draw2 = ImageDraw.Draw(f2)
    fx = lead_arm_box[0] + 65 * dir_sign + (arm_lock.width - 15 if is_p1 else 15)
    fy = lead_arm_box[1] + arm_lock.height // 2 - 5
    # Fiery anime impact burst (matching Kyo Kusanagi Image 1)
    draw2.ellipse([fx - 36, fy - 36, fx + 36, fy + 36], fill=(*flame_rgb, 180), outline=(255, 255, 255, 240), width=3)
    draw2.ellipse([fx - 22, fy - 22, fx + 22, fy + 22], fill=(255, 255, 200, 230))
    # Radial impact sparks
    for a in range(0, 360, 45):
        rad = math.radians(a)
        draw2.line([(fx + math.cos(rad) * 15, fy + math.sin(rad) * 15),
                    (fx + math.cos(rad) * 45, fy + math.sin(rad) * 45)],
                   fill=(255, 220, 100, 240), width=3)
    atk1_strip.paste(f2, (FRAME_W * 2, 0))

    # Frame 3: Follow-through (Torso rotation follow-through, hit sparks dispersing)
    f3 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f3.paste(rear_leg_img, (rear_leg_box[0] - 20 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f3.paste(lead_leg_img, (lead_leg_box[0] + 20 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f3.paste(torso_img, (torso_box[0] + 22 * dir_sign, torso_box[1]), torso_img)
    f3.paste(head_img, (head_box[0] + 18 * dir_sign, head_box[1]), head_img)
    f3.paste(arm_lock, (lead_arm_box[0] + 50 * dir_sign, lead_arm_box[1] - 5), arm_lock)
    atk1_strip.paste(f3, (FRAME_W * 3, 0))

    # Frame 4: Recovery (Arm chambers back to guard)
    f4 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f4.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f4.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
    f4.paste(torso_img, (torso_box[0] + 5 * dir_sign, torso_box[1]), torso_img)
    f4.paste(head_img, (head_box[0] + 5 * dir_sign, head_box[1]), head_img)
    f4.paste(lead_arm_img, (lead_arm_box[0] + 10 * dir_sign, lead_arm_box[1]), lead_arm_img)
    atk1_strip.paste(f4, (FRAME_W * 4, 0))
    atk1_strip.save(os.path.join(out_dir, 'Attack1.png'), 'PNG')

    # ==============================================================
    # 7. ATTACK2: MARTIAL ARTS HIGH KICK (5 frames strictly matching User References 2, 4, 6)
    # ==============================================================
    atk2_strip = Image.new('RGBA', (FRAME_W * 5, FRAME_H), (0, 0, 0, 0))

    # Frame 0: Load / Chamber (Images 2, 4, 6: Knee bent 90° and chambered high to chest, supporting foot pivoted)
    f0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f0.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    cham_knee = lead_leg_img.resize((lead_leg_img.width, int(lead_leg_img.height * 0.65)), Image.Resampling.BILINEAR)
    f0.paste(cham_knee, (lead_leg_box[0] - 20 * dir_sign, lead_leg_box[1] - 55), cham_knee)
    f0.paste(torso_img, (torso_box[0] - 18 * dir_sign, torso_box[1]), torso_img)
    f0.paste(head_img, (head_box[0] - 15 * dir_sign, head_box[1]), head_img)
    f0.paste(lead_arm_img, (lead_arm_box[0] - 15 * dir_sign, lead_arm_box[1] - 10), lead_arm_img)
    atk2_strip.paste(f0, (0, 0))

    # Frame 1: Spring & Dynamic Crescent Smear (Images 2 & 4: Leg snapping upward in circular arc with smear trail)
    f1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f1.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f1.paste(torso_img, (torso_box[0] - 25 * dir_sign, torso_box[1] + 8), torso_img)
    f1.paste(head_img, (head_box[0] - 25 * dir_sign, head_box[1] + 8), head_img)
    f1.paste(lead_arm_img, (lead_arm_box[0] - 25 * dir_sign, lead_arm_box[1]), lead_arm_img)
    spring_leg = lead_leg_img.rotate(45 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
    sp_x = lead_leg_box[0] + (25 if is_p1 else -95)
    sp_y = lead_leg_box[1] - 80
    f1.paste(spring_leg, (sp_x, sp_y), spring_leg)
    # Dynamic smear arc
    draw_s = ImageDraw.Draw(f1)
    foot_sx = sp_x + (spring_leg.width - 20 if is_p1 else 20)
    foot_sy = sp_y + 30
    arc_box_s = [foot_sx - 50, foot_sy - 50, foot_sx + 50, foot_sy + 50]
    draw_s.arc(arc_box_s, start=240 if is_p1 else 60, end=(240 if is_p1 else 60) + 120, fill=(255, 255, 255, 200), width=5)
    atk2_strip.paste(f1, (FRAME_W, 0))

    # Frame 2: Hit / Apex Extension (Images 2, 4, 6: Leg fully locked at head height, glowing crescent shockwave)
    f2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f2.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f2.paste(torso_img, (torso_box[0] - 35 * dir_sign, torso_box[1] + 15), torso_img)
    f2.paste(head_img, (head_box[0] - 38 * dir_sign, head_box[1] + 15), head_img)
    f2.paste(lead_arm_img, (lead_arm_box[0] - 30 * dir_sign, lead_arm_box[1] + 5), lead_arm_img)
    hit_leg = lead_leg_img.rotate(72 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
    hk_x = lead_leg_box[0] + (45 if is_p1 else -135)
    hk_y = lead_leg_box[1] - 125
    f2.paste(hit_leg, (hk_x, hk_y), hit_leg)
    draw_h = ImageDraw.Draw(f2)
    hx = hk_x + (hit_leg.width - 20 if is_p1 else 20)
    hy = hk_y + 30
    # Wide 180° glowing crescent shockwave arc
    arc_box = [hx - 70, hy - 70, hx + 70, hy + 70]
    st_ang = 270 if is_p1 else 90
    draw_h.arc(arc_box, start=st_ang, end=st_ang + 180, fill=(*accent_rgb, 240), width=8)
    draw_h.arc([hx - 60, hy - 60, hx + 60, hy + 60], start=st_ang, end=st_ang + 180, fill=(255, 255, 255, 220), width=4)
    draw_h.ellipse([hx - 25, hy - 25, hx + 25, hy + 25], fill=(255, 255, 255, 220), outline=(*accent_rgb, 255), width=3)
    atk2_strip.paste(f2, (FRAME_W * 2, 0))

    # Frame 3: Follow-through (Hip rotation follow-through, balance re-centering)
    f3 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f3.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f3.paste(torso_img, (torso_box[0] - 15 * dir_sign, torso_box[1] + 5), torso_img)
    f3.paste(head_img, (head_box[0] - 15 * dir_sign, head_box[1] + 5), head_img)
    f3.paste(lead_arm_img, (lead_arm_box[0] - 10 * dir_sign, lead_arm_box[1]), lead_arm_img)
    ret_leg = lead_leg_img.rotate(30 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
    f3.paste(ret_leg, (lead_leg_box[0] + (10 if is_p1 else -50), lead_leg_box[1] - 45), ret_leg)
    atk2_strip.paste(f3, (FRAME_W * 3, 0))

    # Frame 4: Recover & Plant (Foot returns cleanly to floor)
    f4 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f4.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f4.paste(lead_leg_img, (lead_leg_box[0] + 5 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f4.paste(torso_img, (torso_box[0], torso_box[1]), torso_img)
    f4.paste(head_img, (head_box[0], head_box[1]), head_img)
    f4.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1]), lead_arm_img)
    atk2_strip.paste(f4, (FRAME_W * 4, 0))
    atk2_strip.save(os.path.join(out_dir, 'Attack2.png'), 'PNG')

    # ==============================================================
    # 8. BLOCK (2 frames)
    # ==============================================================
    block_strip = Image.new('RGBA', (FRAME_W * 2, FRAME_H), (0, 0, 0, 0))
    f0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f0.paste(rear_leg_img, (rear_leg_box[0] - 10 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f0.paste(lead_leg_img, (lead_leg_box[0] + 10 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f0.paste(torso_img, (torso_box[0] - 10 * dir_sign, torso_box[1] + 10), torso_img)
    f0.paste(head_img, (head_box[0] - 10 * dir_sign, head_box[1] + 10), head_img)
    f0.paste(lead_arm_img, (lead_arm_box[0] - 25 * dir_sign, lead_arm_box[1] - 15), lead_arm_img)
    f0.paste(rear_arm_img, (rear_arm_box[0] + 15 * dir_sign, rear_arm_box[1] - 15), rear_arm_img)
    block_strip.paste(f0, (0, 0))

    f1 = f0.copy()
    draw_b = ImageDraw.Draw(f1)
    hx = lead_arm_box[0] + (50 if is_p1 else -20)
    hy = lead_arm_box[1] + 20
    draw_b.polygon([
        (hx, hy - 45), (hx + 35, hy - 22), (hx + 35, hy + 22),
        (hx, hy + 45), (hx - 35, hy + 22), (hx - 35, hy - 22)
    ], outline=(*accent_rgb, 220), fill=(*accent_rgb, 45), width=3)
    block_strip.paste(f1, (FRAME_W, 0))
    block_strip.save(os.path.join(out_dir, 'Block.png'), 'PNG')

    # ==============================================================
    # 9. TAKE HIT (3 frames)
    # ==============================================================
    hit_strip = Image.new('RGBA', (FRAME_W * 3, FRAME_H), (0, 0, 0, 0))
    f0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f0.paste(rear_leg_img, (rear_leg_box[0] - 15 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f0.paste(lead_leg_img, (lead_leg_box[0] - 10 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f0.paste(torso_img, (torso_box[0] - 25 * dir_sign, torso_box[1]), torso_img)
    head_hit = head_img.rotate(-20 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
    f0.paste(head_hit, (head_box[0] - 35 * dir_sign, head_box[1] - 10), head_hit)
    f0.paste(lead_arm_img, (lead_arm_box[0] - 20 * dir_sign, lead_arm_box[1] + 15), lead_arm_img)
    draw_h0 = ImageDraw.Draw(f0)
    draw_h0.ellipse([head_box[0] + 10, head_box[1] + 20, head_box[0] + 50, head_box[1] + 60], fill=(255, 255, 255, 210))
    hit_strip.paste(f0, (0, 0))

    f1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f1.paste(rear_leg_img, (rear_leg_box[0] - 35 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f1.paste(lead_leg_img, (lead_leg_box[0] - 25 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f1.paste(torso_img, (torso_box[0] - 45 * dir_sign, torso_box[1] + 10), torso_img)
    f1.paste(head_hit, (head_box[0] - 55 * dir_sign, head_box[1]), head_hit)
    f1.paste(lead_arm_img, (lead_arm_box[0] - 40 * dir_sign, lead_arm_box[1] + 25), lead_arm_img)
    hit_strip.paste(f1, (FRAME_W, 0))

    f2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f2.paste(rear_leg_img, (rear_leg_box[0] - 15 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f2.paste(lead_leg_img, (lead_leg_box[0] - 10 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f2.paste(torso_img, (torso_box[0] - 15 * dir_sign, torso_box[1] + 5), torso_img)
    f2.paste(head_img, (head_box[0] - 15 * dir_sign, head_box[1] + 5), head_img)
    f2.paste(lead_arm_img, (lead_arm_box[0] - 10 * dir_sign, lead_arm_box[1] + 10), lead_arm_img)
    hit_strip.paste(f2, (FRAME_W * 2, 0))
    hit_strip.save(os.path.join(out_dir, 'Take Hit.png'), 'PNG')
    hit_strip.save(os.path.join(out_dir, 'Take hit.png'), 'PNG')

    # ==============================================================
    # 10. DEATH / KNOCKDOWN (4 frames)
    # ==============================================================
    death_strip = Image.new('RGBA', (FRAME_W * 4, FRAME_H), (0, 0, 0, 0))
    death_strip.paste(f1, (0, 0))
    body_tilt1 = base_frame.rotate(-35 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
    f_d1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_d1.paste(body_tilt1, ((FRAME_W - body_tilt1.width) // 2 - 40 * dir_sign, 100), body_tilt1)
    death_strip.paste(f_d1, (FRAME_W, 0))

    body_flat = base_frame.rotate(-85 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
    f_d2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_d2.paste(body_flat, ((FRAME_W - body_flat.width) // 2 - 50 * dir_sign, GROUND_CONTACT_Y - body_flat.height), body_flat)
    draw_d2 = ImageDraw.Draw(f_d2)
    draw_d2.ellipse([100, 460, 300, 485], outline=(255, 255, 255, 180), width=3)
    death_strip.paste(f_d2, (FRAME_W * 2, 0))

    f_d3 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_d3.paste(body_flat, ((FRAME_W - body_flat.width) // 2 - 50 * dir_sign, GROUND_CONTACT_Y - body_flat.height), body_flat)
    death_strip.paste(f_d3, (FRAME_W * 3, 0))
    death_strip.save(os.path.join(out_dir, 'Death.png'), 'PNG')

    print(f'Successfully built complete animation suite for {out_dir}!')

build_character_animations('public/assets/sprites/kai_idle.png', 'public/assets/sprites/p1', is_p1=True)
build_character_animations('public/assets/sprites/shadow_idle.png', 'public/assets/sprites/p2', is_p1=False)
