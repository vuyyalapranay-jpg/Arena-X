import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

FRAME_W = 400
FRAME_H = 500
GROUND_CONTACT_Y = 475 # Exact pixel row where shoe soles touch ground floor

def build_phase3_animations(base_sprite_path, out_dir, is_p1=True):
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

    # 1. Anatomical Layers
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
    accent_rgb = (0, 212, 255) if is_p1 else (255, 30, 60)
    flame_rgb = (255, 120, 0) if is_p1 else (255, 20, 50)

    # ==============================================================
    # 1. IDLE (4 frames: breathing, stance bob)
    # ==============================================================
    idle_strip = Image.new('RGBA', (FRAME_W * 4, FRAME_H), (0, 0, 0, 0))
    for i in range(4):
        f = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
        phase = i / 4.0 * math.pi * 2
        breath_y = int(math.sin(phase) * 5)
        f.paste(rear_arm_img, (rear_arm_box[0], rear_arm_box[1] + breath_y // 2), rear_arm_img)
        f.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
        f.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
        f.paste(torso_img, (torso_box[0], torso_box[1] + breath_y), torso_img)
        f.paste(head_img, (head_box[0], head_box[1] + breath_y), head_img)
        f.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1] + breath_y // 2), lead_arm_img)
        idle_strip.paste(f, (i * FRAME_W, 0))
    idle_strip.save(os.path.join(out_dir, 'Idle.png'), 'PNG')
    idle_strip.save(os.path.join(out_dir, 'Idle_Blink.png'), 'PNG')

    # ==============================================================
    # 2. WALK FORWARD & BACKWARD (6 frames)
    # ==============================================================
    walk_strip = Image.new('RGBA', (FRAME_W * 6, FRAME_H), (0, 0, 0, 0))
    walk_bwd_strip = Image.new('RGBA', (FRAME_W * 6, FRAME_H), (0, 0, 0, 0))
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
        walk_bwd_strip.paste(f, ((5 - i) * FRAME_W, 0)) # reversed cycle for walk backward

    walk_strip.save(os.path.join(out_dir, 'Walk.png'), 'PNG')
    walk_strip.save(os.path.join(out_dir, 'Walk_Fwd.png'), 'PNG')
    walk_bwd_strip.save(os.path.join(out_dir, 'Walk_Bwd.png'), 'PNG')

    # ==============================================================
    # 3. RUN (6 frames)
    # ==============================================================
    run_strip = Image.new('RGBA', (FRAME_W * 6, FRAME_H), (0, 0, 0, 0))
    for i in range(6):
        f = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
        t = i / 6.0 * math.pi * 2
        stride_lead = int(math.sin(t) * 45 * dir_sign)
        stride_rear = int(-math.sin(t) * 45 * dir_sign)
        arm_swing = int(math.sin(t) * 35 * dir_sign)
        bob_y = int(abs(math.sin(t * 2)) * 10)
        tilt = 12 * dir_sign

        f.paste(rear_arm_img, (rear_arm_box[0] - arm_swing, rear_arm_box[1] + bob_y), rear_arm_img)
        f.paste(rear_leg_img, (rear_leg_box[0] + stride_rear, rear_leg_box[1] + bob_y // 2), rear_leg_img)
        f.paste(lead_leg_img, (lead_leg_box[0] + stride_lead, lead_leg_box[1] - bob_y // 2), lead_leg_img)
        f.paste(torso_img, (torso_box[0] + tilt, torso_box[1] + bob_y), torso_img)
        f.paste(head_img, (head_box[0] + tilt + 4 * dir_sign, head_box[1] + bob_y), head_img)
        f.paste(lead_arm_img, (lead_arm_box[0] + arm_swing + tilt, lead_arm_box[1] + bob_y), lead_arm_img)
        run_strip.paste(f, (i * FRAME_W, 0))
    run_strip.save(os.path.join(out_dir, 'Run.png'), 'PNG')

    # ==============================================================
    # 4. JUMP (3 frames: squat, airborne rise, apex) & FALL (2 frames)
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

    fall_strip = Image.new('RGBA', (FRAME_W * 2, FRAME_H), (0, 0, 0, 0))
    f_fall0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_fall0.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] - 20), rear_leg_img)
    f_fall0.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1] - 12), lead_leg_img)
    f_fall0.paste(torso_img, (torso_box[0], torso_box[1] - 16), torso_img)
    f_fall0.paste(head_img, (head_box[0], head_box[1] - 18), head_img)
    f_fall0.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1] - 24), lead_arm_img)
    fall_strip.paste(f_fall0, (0, 0))

    f_fall1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_fall1.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] - 8), rear_leg_img)
    f_fall1.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1] - 4), lead_leg_img)
    f_fall1.paste(torso_img, (torso_box[0], torso_box[1] - 8), torso_img)
    f_fall1.paste(head_img, (head_box[0], head_box[1] - 10), head_img)
    f_fall1.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1] - 12), lead_arm_img)
    fall_strip.paste(f_fall1, (FRAME_W, 0))
    fall_strip.save(os.path.join(out_dir, 'Fall.png'), 'PNG')

    # ==============================================================
    # 5. CROUCH (2 frames)
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
    crouch_strip.save(os.path.join(out_dir, 'Crouch.png'), 'PNG')

    # ==============================================================
    # 6. PUNCH LIGHT (3 frames: startup, active jab, recovery)
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
    draw_pj.ellipse([fx - 18, fy - 18, fx + 18, fy + 18], fill=(*accent_rgb, 200), outline=(255, 255, 255, 230), width=2)
    pj_strip.paste(f_pj1, (FRAME_W, 0))

    f_pj2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_pj2.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_pj2.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
    f_pj2.paste(torso_img, (torso_box[0], torso_box[1]), torso_img)
    f_pj2.paste(head_img, (head_box[0], head_box[1]), head_img)
    f_pj2.paste(lead_arm_img, (lead_arm_box[0] + 10 * dir_sign, lead_arm_box[1]), lead_arm_img)
    pj_strip.paste(f_pj2, (FRAME_W * 2, 0))
    pj_strip.save(os.path.join(out_dir, 'Punch_Light.png'), 'PNG')

    # ==============================================================
    # 7. ATTACK1: MARTIAL ARTS PUNCH HEAVY (5 frames: Kyo Kusanagi Style)
    # ==============================================================
    atk1_strip = Image.new('RGBA', (FRAME_W * 5, FRAME_H), (0, 0, 0, 0))
    f_atk1_0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_atk1_0.paste(rear_leg_img, (rear_leg_box[0] - 10 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_atk1_0.paste(lead_leg_img, (lead_leg_box[0] - 5 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_atk1_0.paste(torso_img, (torso_box[0] - 22 * dir_sign, torso_box[1] + 5), torso_img)
    f_atk1_0.paste(head_img, (head_box[0] - 18 * dir_sign, head_box[1] + 5), head_img)
    f_atk1_0.paste(lead_arm_img, (lead_arm_box[0] - 35 * dir_sign, lead_arm_box[1] + 12), lead_arm_img)
    atk1_strip.paste(f_atk1_0, (0, 0))

    f_atk1_1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_atk1_1.paste(rear_leg_img, (rear_leg_box[0] - 18 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_atk1_1.paste(lead_leg_img, (lead_leg_box[0] + 10 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_atk1_1.paste(torso_img, (torso_box[0] + 15 * dir_sign, torso_box[1]), torso_img)
    f_atk1_1.paste(head_img, (head_box[0] + 12 * dir_sign, head_box[1]), head_img)
    arm_smear = lead_arm_img.resize((int(lead_arm_img.width * 1.25), lead_arm_img.height), Image.Resampling.BILINEAR)
    f_atk1_1.paste(arm_smear, (lead_arm_box[0] + 35 * dir_sign, lead_arm_box[1] - 5), arm_smear)
    draw1 = ImageDraw.Draw(f_atk1_1)
    sx1 = lead_arm_box[0] + (10 if is_p1 else arm_smear.width)
    sx2 = sx1 + 95 * dir_sign
    sy = lead_arm_box[1] + arm_smear.height // 2
    draw1.line([(sx1, sy), (sx2, sy)], fill=(255, 255, 255, 220), width=4)
    atk1_strip.paste(f_atk1_1, (FRAME_W, 0))

    f_atk1_2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_atk1_2.paste(rear_leg_img, (rear_leg_box[0] - 25 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_atk1_2.paste(lead_leg_img, (lead_leg_box[0] + 25 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_atk1_2.paste(torso_img, (torso_box[0] + 30 * dir_sign, torso_box[1]), torso_img)
    f_atk1_2.paste(head_img, (head_box[0] + 24 * dir_sign, head_box[1]), head_img)
    arm_lock = lead_arm_img.resize((int(lead_arm_img.width * 1.45), lead_arm_img.height), Image.Resampling.BILINEAR)
    f_atk1_2.paste(arm_lock, (lead_arm_box[0] + 65 * dir_sign, lead_arm_box[1] - 10), arm_lock)
    draw2 = ImageDraw.Draw(f_atk1_2)
    fx = lead_arm_box[0] + 65 * dir_sign + (arm_lock.width - 15 if is_p1 else 15)
    fy = lead_arm_box[1] + arm_lock.height // 2 - 5
    draw2.ellipse([fx - 36, fy - 36, fx + 36, fy + 36], fill=(*flame_rgb, 180), outline=(255, 255, 255, 240), width=3)
    draw2.ellipse([fx - 22, fy - 22, fx + 22, fy + 22], fill=(255, 255, 200, 230))
    for a in range(0, 360, 45):
        rad = math.radians(a)
        draw2.line([(fx + math.cos(rad) * 15, fy + math.sin(rad) * 15),
                    (fx + math.cos(rad) * 45, fy + math.sin(rad) * 45)],
                   fill=(255, 220, 100, 240), width=3)
    atk1_strip.paste(f_atk1_2, (FRAME_W * 2, 0))

    f_atk1_3 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_atk1_3.paste(rear_leg_img, (rear_leg_box[0] - 20 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_atk1_3.paste(lead_leg_img, (lead_leg_box[0] + 20 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_atk1_3.paste(torso_img, (torso_box[0] + 22 * dir_sign, torso_box[1]), torso_img)
    f_atk1_3.paste(head_img, (head_box[0] + 18 * dir_sign, head_box[1]), head_img)
    f_atk1_3.paste(arm_lock, (lead_arm_box[0] + 50 * dir_sign, lead_arm_box[1] - 5), arm_lock)
    atk1_strip.paste(f_atk1_3, (FRAME_W * 3, 0))

    f_atk1_4 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_atk1_4.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_atk1_4.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
    f_atk1_4.paste(torso_img, (torso_box[0] + 5 * dir_sign, torso_box[1]), torso_img)
    f_atk1_4.paste(head_img, (head_box[0] + 5 * dir_sign, head_box[1]), head_img)
    f_atk1_4.paste(lead_arm_img, (lead_arm_box[0] + 10 * dir_sign, lead_arm_box[1]), lead_arm_img)
    atk1_strip.paste(f_atk1_4, (FRAME_W * 4, 0))
    atk1_strip.save(os.path.join(out_dir, 'Attack1.png'), 'PNG')

    # ==============================================================
    # 8. UPPERCUT (4 frames: crouch coil, rising strike, apex, recovery)
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
    draw_up.line([(ux, uy + 60), (ux, uy - 30)], fill=(255, 255, 255, 240), width=6)
    draw_up.ellipse([ux - 25, uy - 35, ux + 25, uy + 15], fill=(*accent_rgb, 220), outline=(255, 255, 255, 255), width=3)
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
    up_strip.save(os.path.join(out_dir, 'Uppercut.png'), 'PNG')

    # ==============================================================
    # 9. KICK LIGHT (3 frames: snap front kick) & KICK LOW (3 frames)
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
    f_kl1.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_kl1.paste(torso_img, (torso_box[0] - 15 * dir_sign, torso_box[1]), torso_img)
    f_kl1.paste(head_img, (head_box[0] - 15 * dir_sign, head_box[1]), head_img)
    f_kl1.paste(lead_arm_img, (lead_arm_box[0] - 10 * dir_sign, lead_arm_box[1]), lead_arm_img)
    snap_leg = lead_leg_img.rotate(35 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
    f_kl1.paste(snap_leg, (lead_leg_box[0] + (30 if is_p1 else -75), lead_leg_box[1] - 50), snap_leg)
    draw_kl = ImageDraw.Draw(f_kl1)
    kx = lead_leg_box[0] + (30 if is_p1 else -75) + (snap_leg.width - 15 if is_p1 else 15)
    ky = lead_leg_box[1] - 25
    draw_kl.ellipse([kx - 20, ky - 20, kx + 20, ky + 20], fill=(*accent_rgb, 200), outline=(255, 255, 255, 240), width=2)
    kl_strip.paste(f_kl1, (FRAME_W, 0))

    f_kl2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_kl2.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_kl2.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
    f_kl2.paste(torso_img, (torso_box[0], torso_box[1]), torso_img)
    f_kl2.paste(head_img, (head_box[0], head_box[1]), head_img)
    f_kl2.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1]), lead_arm_img)
    kl_strip.paste(f_kl2, (FRAME_W * 2, 0))
    kl_strip.save(os.path.join(out_dir, 'Kick_Light.png'), 'PNG')

    # Kick Low (3 frames: low sweep)
    klow_strip = Image.new('RGBA', (FRAME_W * 3, FRAME_H), (0, 0, 0, 0))
    f_klow1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_klow1.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] + 45), rear_leg_img)
    f_klow1.paste(torso_img, (torso_box[0], torso_box[1] + 55), torso_img)
    f_klow1.paste(head_img, (head_box[0], head_box[1] + 55), head_img)
    sweep_leg = lead_leg_img.rotate(-20 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
    f_klow1.paste(sweep_leg, (lead_leg_box[0] + 45 * dir_sign, GROUND_CONTACT_Y - sweep_leg.height), sweep_leg)
    draw_sw = ImageDraw.Draw(f_klow1)
    sw_x = lead_leg_box[0] + 45 * dir_sign + (sweep_leg.width - 20 if is_p1 else 20)
    sw_y = GROUND_CONTACT_Y - 20
    draw_sw.line([(sw_x - 45 * dir_sign, sw_y), (sw_x + 35 * dir_sign, sw_y)], fill=(255, 255, 255, 230), width=4)
    klow_strip.paste(f_c0, (0, 0))
    klow_strip.paste(f_klow1, (FRAME_W, 0))
    klow_strip.paste(f_c1, (FRAME_W * 2, 0))
    klow_strip.save(os.path.join(out_dir, 'Kick_Low.png'), 'PNG')

    # ==============================================================
    # 10. ATTACK2: MARTIAL ARTS HIGH KICK (5 frames: High Crescent Kick)
    # ==============================================================
    atk2_strip = Image.new('RGBA', (FRAME_W * 5, FRAME_H), (0, 0, 0, 0))
    f_atk2_0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_atk2_0.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    cham_knee = lead_leg_img.resize((lead_leg_img.width, int(lead_leg_img.height * 0.65)), Image.Resampling.BILINEAR)
    f_atk2_0.paste(cham_knee, (lead_leg_box[0] - 20 * dir_sign, lead_leg_box[1] - 55), cham_knee)
    f_atk2_0.paste(torso_img, (torso_box[0] - 18 * dir_sign, torso_box[1]), torso_img)
    f_atk2_0.paste(head_img, (head_box[0] - 15 * dir_sign, head_box[1]), head_img)
    f_atk2_0.paste(lead_arm_img, (lead_arm_box[0] - 15 * dir_sign, lead_arm_box[1] - 10), lead_arm_img)
    atk2_strip.paste(f_atk2_0, (0, 0))

    f_atk2_1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_atk2_1.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_atk2_1.paste(torso_img, (torso_box[0] - 25 * dir_sign, torso_box[1] + 8), torso_img)
    f_atk2_1.paste(head_img, (head_box[0] - 25 * dir_sign, head_box[1] + 8), head_img)
    f_atk2_1.paste(lead_arm_img, (lead_arm_box[0] - 25 * dir_sign, lead_arm_box[1]), lead_arm_img)
    spring_leg = lead_leg_img.rotate(45 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
    sp_x = lead_leg_box[0] + (25 if is_p1 else -95)
    sp_y = lead_leg_box[1] - 80
    f_atk2_1.paste(spring_leg, (sp_x, sp_y), spring_leg)
    draw_s = ImageDraw.Draw(f_atk2_1)
    foot_sx = sp_x + (spring_leg.width - 20 if is_p1 else 20)
    foot_sy = sp_y + 30
    arc_box_s = [foot_sx - 50, foot_sy - 50, foot_sx + 50, foot_sy + 50]
    draw_s.arc(arc_box_s, start=240 if is_p1 else 60, end=(240 if is_p1 else 60) + 120, fill=(255, 255, 255, 200), width=5)
    atk2_strip.paste(f_atk2_1, (FRAME_W, 0))

    f_atk2_2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_atk2_2.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_atk2_2.paste(torso_img, (torso_box[0] - 35 * dir_sign, torso_box[1] + 15), torso_img)
    f_atk2_2.paste(head_img, (head_box[0] - 38 * dir_sign, head_box[1] + 15), head_img)
    f_atk2_2.paste(lead_arm_img, (lead_arm_box[0] - 30 * dir_sign, lead_arm_box[1] + 5), lead_arm_img)
    hit_leg = lead_leg_img.rotate(72 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
    hk_x = lead_leg_box[0] + (45 if is_p1 else -135)
    hk_y = lead_leg_box[1] - 125
    f_atk2_2.paste(hit_leg, (hk_x, hk_y), hit_leg)
    draw_h = ImageDraw.Draw(f_atk2_2)
    hx = hk_x + (hit_leg.width - 20 if is_p1 else 20)
    hy = hk_y + 30
    arc_box = [hx - 70, hy - 70, hx + 70, hy + 70]
    st_ang = 270 if is_p1 else 90
    draw_h.arc(arc_box, start=st_ang, end=st_ang + 180, fill=(*accent_rgb, 240), width=8)
    draw_h.arc([hx - 60, hy - 60, hx + 60, hy + 60], start=st_ang, end=st_ang + 180, fill=(255, 255, 255, 220), width=4)
    draw_h.ellipse([hx - 25, hy - 25, hx + 25, hy + 25], fill=(255, 255, 255, 220), outline=(*accent_rgb, 255), width=3)
    atk2_strip.paste(f_atk2_2, (FRAME_W * 2, 0))

    f_atk2_3 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_atk2_3.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_atk2_3.paste(torso_img, (torso_box[0] - 15 * dir_sign, torso_box[1] + 5), torso_img)
    f_atk2_3.paste(head_img, (head_box[0] - 15 * dir_sign, head_box[1] + 5), head_img)
    f_atk2_3.paste(lead_arm_img, (lead_arm_box[0] - 10 * dir_sign, lead_arm_box[1]), lead_arm_img)
    ret_leg = lead_leg_img.rotate(30 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
    f_atk2_3.paste(ret_leg, (lead_leg_box[0] + (10 if is_p1 else -50), lead_leg_box[1] - 45), ret_leg)
    atk2_strip.paste(f_atk2_3, (FRAME_W * 3, 0))

    f_atk2_4 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_atk2_4.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_atk2_4.paste(lead_leg_img, (lead_leg_box[0] + 5 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_atk2_4.paste(torso_img, (torso_box[0], torso_box[1]), torso_img)
    f_atk2_4.paste(head_img, (head_box[0], head_box[1]), head_img)
    f_atk2_4.paste(lead_arm_img, (lead_arm_box[0], lead_arm_box[1]), lead_arm_img)
    atk2_strip.paste(f_atk2_4, (FRAME_W * 4, 0))
    atk2_strip.save(os.path.join(out_dir, 'Attack2.png'), 'PNG')
    atk2_strip.save(os.path.join(out_dir, 'Kick_Heavy.png'), 'PNG')

    # ==============================================================
    # 11. BLOCK & BLOCK CROUCH (2 frames)
    # ==============================================================
    block_strip = Image.new('RGBA', (FRAME_W * 2, FRAME_H), (0, 0, 0, 0))
    f_b0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_b0.paste(rear_leg_img, (rear_leg_box[0] - 10 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_b0.paste(lead_leg_img, (lead_leg_box[0] + 5 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_b0.paste(torso_img, (torso_box[0] - 12 * dir_sign, torso_box[1]), torso_img)
    f_b0.paste(head_img, (head_box[0] - 12 * dir_sign, head_box[1]), head_img)
    f_b0.paste(rear_arm_img, (rear_arm_box[0] + 20 * dir_sign, rear_arm_box[1] - 15), rear_arm_img)
    f_b0.paste(lead_arm_img, (lead_arm_box[0] + 10 * dir_sign, lead_arm_box[1] - 25), lead_arm_img)
    block_strip.paste(f_b0, (0, 0))
    block_strip.paste(f_b0, (FRAME_W, 0))
    block_strip.save(os.path.join(out_dir, 'Block.png'), 'PNG')

    block_cr_strip = Image.new('RGBA', (FRAME_W * 2, FRAME_H), (0, 0, 0, 0))
    f_bcr = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_bcr.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1] + 45), rear_leg_img)
    f_bcr.paste(torso_img, (torso_box[0], torso_box[1] + 50), torso_img)
    f_bcr.paste(head_img, (head_box[0], head_box[1] + 50), head_img)
    f_bcr.paste(lead_arm_img, (lead_arm_box[0] + 15 * dir_sign, lead_arm_box[1] + 35), lead_arm_img)
    block_cr_strip.paste(f_bcr, (0, 0))
    block_cr_strip.paste(f_bcr, (FRAME_W, 0))
    block_cr_strip.save(os.path.join(out_dir, 'Block_Crouch.png'), 'PNG')

    # ==============================================================
    # 12. TAKE HIT / STAGGER (3 frames)
    # ==============================================================
    hit_strip = Image.new('RGBA', (FRAME_W * 3, FRAME_H), (0, 0, 0, 0))
    f_hit0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_hit0.paste(rear_leg_img, (rear_leg_box[0], rear_leg_box[1]), rear_leg_img)
    f_hit0.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
    f_hit0.paste(torso_img, (torso_box[0] - 15 * dir_sign, torso_box[1]), torso_img)
    f_hit0.paste(head_img, (head_box[0] - 25 * dir_sign, head_box[1] - 5), head_img)
    f_hit0.paste(lead_arm_img, (lead_arm_box[0] - 20 * dir_sign, lead_arm_box[1] + 15), lead_arm_img)
    hit_strip.paste(f_hit0, (0, 0))

    f_hit1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_hit1.paste(rear_leg_img, (rear_leg_box[0] - 15 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_hit1.paste(lead_leg_img, (lead_leg_box[0] - 5 * dir_sign, lead_leg_box[1]), lead_leg_img)
    f_hit1.paste(torso_img, (torso_box[0] - 30 * dir_sign, torso_box[1] + 5), torso_img)
    f_hit1.paste(head_img, (head_box[0] - 40 * dir_sign, head_box[1] - 8), head_img)
    f_hit1.paste(lead_arm_img, (lead_arm_box[0] - 25 * dir_sign, lead_arm_box[1] + 25), lead_arm_img)
    hit_strip.paste(f_hit1, (FRAME_W, 0))

    f_hit2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_hit2.paste(rear_leg_img, (rear_leg_box[0] - 10 * dir_sign, rear_leg_box[1]), rear_leg_img)
    f_hit2.paste(lead_leg_img, (lead_leg_box[0], lead_leg_box[1]), lead_leg_img)
    f_hit2.paste(torso_img, (torso_box[0] - 10 * dir_sign, torso_box[1]), torso_img)
    f_hit2.paste(head_img, (head_box[0] - 10 * dir_sign, head_box[1]), head_img)
    f_hit2.paste(lead_arm_img, (lead_arm_box[0] - 5 * dir_sign, lead_arm_box[1]), lead_arm_img)
    hit_strip.paste(f_hit2, (FRAME_W * 2, 0))
    hit_strip.save(os.path.join(out_dir, 'Take Hit.png'), 'PNG')
    hit_strip.save(os.path.join(out_dir, 'Take hit.png'), 'PNG')

    # ==============================================================
    # 13. DEATH / KNOCKDOWN (4 frames)
    # ==============================================================
    death_strip = Image.new('RGBA', (FRAME_W * 4, FRAME_H), (0, 0, 0, 0))
    death_strip.paste(f_hit1, (0, 0))

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

    # ==============================================================
    # 14. SPECIAL / SUPER (5 frames: energy charge, forward rush burst)
    # ==============================================================
    spec_strip = Image.new('RGBA', (FRAME_W * 5, FRAME_H), (0, 0, 0, 0))
    # Frame 0: Super Charge
    f_sp0 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_sp0.paste(f_atk1_0, (0, 0))
    draw_sp0 = ImageDraw.Draw(f_sp0)
    draw_sp0.ellipse([120, 200, 280, 420], outline=(*accent_rgb, 200), width=4)
    spec_strip.paste(f_sp0, (0, 0))

    # Frame 1: Aura Flare
    f_sp1 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_sp1.paste(f_atk1_1, (0, 0))
    draw_sp1 = ImageDraw.Draw(f_sp1)
    draw_sp1.ellipse([90, 160, 310, 440], outline=(255, 255, 255, 240), width=6)
    draw_sp1.ellipse([110, 180, 290, 420], outline=(*flame_rgb, 220), width=3)
    spec_strip.paste(f_sp1, (FRAME_W, 0))

    # Frame 2: Maximum Super Blast Apex
    f_sp2 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_sp2.paste(f_atk1_2, (0, 0))
    draw_sp2 = ImageDraw.Draw(f_sp2)
    s_fx = lead_arm_box[0] + 65 * dir_sign + (arm_lock.width if is_p1 else 0)
    s_fy = lead_arm_box[1] + arm_lock.height // 2 - 5
    # Massive dual-colored energy supernova
    draw_sp2.ellipse([s_fx - 60, s_fy - 60, s_fx + 60, s_fy + 60], fill=(*flame_rgb, 200), outline=(255, 255, 255, 255), width=5)
    draw_sp2.ellipse([s_fx - 35, s_fy - 35, s_fx + 35, s_fy + 35], fill=(255, 255, 255, 240))
    for a in range(0, 360, 30):
        rad = math.radians(a)
        draw_sp2.line([(s_fx + math.cos(rad) * 20, s_fy + math.sin(rad) * 20),
                       (s_fx + math.cos(rad) * 75, s_fy + math.sin(rad) * 75)],
                      fill=(*accent_rgb, 240), width=4)
    spec_strip.paste(f_sp2, (FRAME_W * 2, 0))

    # Frame 3: Shockwave dispersal
    f_sp3 = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f_sp3.paste(f_atk1_3, (0, 0))
    draw_sp3 = ImageDraw.Draw(f_sp3)
    draw_sp3.ellipse([s_fx - 80, s_fy - 80, s_fx + 80, s_fy + 80], outline=(*accent_rgb, 180), width=3)
    spec_strip.paste(f_sp3, (FRAME_W * 3, 0))

    # Frame 4: Recovery
    spec_strip.paste(f_atk1_4, (FRAME_W * 4, 0))
    spec_strip.save(os.path.join(out_dir, 'Special.png'), 'PNG')

    # ==============================================================
    # 15. VICTORY (4 frames: flourish, fist raised)
    # ==============================================================
    vic_strip = Image.new('RGBA', (FRAME_W * 4, FRAME_H), (0, 0, 0, 0))
    for i in range(4):
        f = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
        arm_up = lead_arm_img.rotate(110 * dir_sign, expand=True, resample=Image.Resampling.BICUBIC)
        f.paste(rear_leg_img, (rear_leg_box[0] - 5 * dir_sign, rear_leg_box[1]), rear_leg_img)
        f.paste(lead_leg_img, (lead_leg_box[0] + 5 * dir_sign, lead_leg_box[1]), lead_leg_img)
        f.paste(torso_img, (torso_box[0], torso_box[1]), torso_img)
        f.paste(head_img, (head_box[0], head_box[1] - 4), head_img)
        f.paste(rear_arm_img, (rear_arm_box[0] - 10 * dir_sign, rear_arm_box[1] + 15), rear_arm_img)
        f.paste(arm_up, (lead_arm_box[0] + 15 * dir_sign, lead_arm_box[1] - 110), arm_up)
        # Anime victory glint
        draw_v = ImageDraw.Draw(f)
        vx = lead_arm_box[0] + 20 * dir_sign + arm_up.width // 2
        vy = lead_arm_box[1] - 115
        sz = 10 + (i % 2) * 6
        draw_v.line([(vx - sz, vy), (vx + sz, vy)], fill=(255, 255, 255, 240), width=3)
        draw_v.line([(vx, vy - sz), (vx, vy + sz)], fill=(255, 255, 255, 240), width=3)
        vic_strip.paste(f, (i * FRAME_W, 0))
    vic_strip.save(os.path.join(out_dir, 'Victory.png'), 'PNG')

    print(f'Successfully built Phase 3 animation suite for {out_dir}!')

if __name__ == '__main__':
    build_phase3_animations('public/assets/sprites/kai_idle.png', 'public/assets/sprites/p1', is_p1=True)
    build_phase3_animations('public/assets/sprites/shadow_idle.png', 'public/assets/sprites/p2', is_p1=False)
