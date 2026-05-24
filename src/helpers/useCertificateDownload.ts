export interface CertificateData {
  courseTitle: string;
  instructorName: string;
  recipientName: string;
  issuedAt: string;
  certificateId?: string;
}

async function ensureFonts(): Promise<void> {
  const id = "cert-gfonts";
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,400;1,300&family=DM+Sans:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }
  await new Promise((r) => setTimeout(r, 150));
  await document.fonts.ready;
}

// Draw the LearnForge logo SVG paths onto the canvas.
// The SVG viewBox is 20x20 — we translate + scale to place it.
function drawLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  const scale = size / 20;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;

  const p1 = new Path2D(
    "M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z",
  );
  const p2 = new Path2D(
    "M9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z",
  );
  ctx.fill(p1);
  ctx.fill(p2);
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Rounded rectangle helper
function rr(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function generateCertificatePng(
  data: CertificateData,
): Promise<string> {
  await ensureFonts();

  const W = 1400;
  const H = 990;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Brand colours ───────────────────────────────────────────────────────────
  const purple      = "#6d28d9";
  const purpleDeep  = "#4c1d95";
  const purpleLight = "#8b5cf6";
  const purplePale  = "#ede9fe";
  const purpleMid   = "#ddd6fe";
  const ink         = "#1e1b4b";   // very dark indigo for headings
  const body        = "#374151";   // dark gray for body text
  const muted       = "#6b7280";
  const white       = "#ffffff";
  const offWhite    = "#fafaf9";

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = offWhite;
  ctx.fillRect(0, 0, W, H);

  // Subtle dot-grid texture
  ctx.fillStyle = "#6d28d908";
  for (let gx = 40; gx < W; gx += 36) {
    for (let gy = 40; gy < H; gy += 36) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Purple header bar ────────────────────────────────────────────────────────
  const headerH = 140;
  const hGrad = ctx.createLinearGradient(0, 0, W, headerH);
  hGrad.addColorStop(0, purpleDeep);
  hGrad.addColorStop(1, purple);
  ctx.fillStyle = hGrad;
  rr(ctx, 0, 0, W, headerH + 20, 0);
  ctx.fill();

  // Subtle shimmer stripe inside header
  ctx.fillStyle = "#ffffff08";
  ctx.fillRect(0, headerH - 18, W, 18);

  // Logo (white) in header — centred above text
  const logoSize = 56;
  drawLogo(ctx, W / 2 - logoSize / 2, 28, logoSize, white);

  // "LearnForge" wordmark
  ctx.font = "600 28px 'DM Sans', sans-serif";
  ctx.fillStyle = white;
  ctx.textAlign = "center";
  ctx.fillText("LearnForge", W / 2, 112);

  // ── Thin purple top border accent ────────────────────────────────────────────
  ctx.fillStyle = purpleLight;
  ctx.fillRect(0, 0, W, 4);

  // ── Outer frame ──────────────────────────────────────────────────────────────
  ctx.strokeStyle = purpleMid;
  ctx.lineWidth = 1.5;
  rr(ctx, 28, 28, W - 56, H - 56, 12);
  ctx.stroke();

  // Inner subtle frame
  ctx.strokeStyle = purpleMid;
  ctx.lineWidth = 0.6;
  ctx.globalAlpha = 0.5;
  rr(ctx, 38, 38, W - 76, H - 76, 10);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Corner accents (small filled squares)
  const corners: [number, number][] = [
    [28, 28], [W - 28, 28], [W - 28, H - 28], [28, H - 28],
  ];
  corners.forEach(([cx, cy]) => {
    ctx.fillStyle = purple;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  });

  // ── "Certificate of Completion" ──────────────────────────────────────────────
  ctx.font = "italic 400 72px 'Cormorant Garamond', serif";
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.fillText("Certificate of Completion", W / 2, 258);

  // Divider under title
  const divY = 278;
  const divW = 480;
  ctx.strokeStyle = purpleLight;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - divW / 2, divY);
  ctx.lineTo(W / 2 + divW / 2, divY);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // Centre diamond on divider
  ctx.fillStyle = purple;
  ctx.save();
  ctx.translate(W / 2, divY);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-5, -5, 10, 10);
  ctx.restore();

  // ── "This is to certify that" ────────────────────────────────────────────────
  ctx.font = "400 22px 'DM Sans', sans-serif";
  ctx.fillStyle = muted;
  ctx.fillText("This is to certify that", W / 2, 336);

  // ── Recipient name ───────────────────────────────────────────────────────────
  // Pale purple pill behind name
  const name = data.recipientName || "Student";
  ctx.font = "600 68px 'Cormorant Garamond', serif";
  const nameMetrics = ctx.measureText(name);
  const namePillW = Math.min(900, nameMetrics.width + 120);
  const namePillH = 90;
  const namePillX = W / 2 - namePillW / 2;
  const namePillY = 358;
  rr(ctx, namePillX, namePillY, namePillW, namePillH, 12);
  ctx.fillStyle = purplePale;
  ctx.fill();
  ctx.strokeStyle = purpleMid;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = purple;
  ctx.font = "600 64px 'Cormorant Garamond', serif";
  ctx.fillText(name, W / 2, namePillY + 62);

  // ── "has successfully completed" ─────────────────────────────────────────────
  ctx.font = "400 22px 'DM Sans', sans-serif";
  ctx.fillStyle = muted;
  ctx.fillText("has successfully completed the course", W / 2, 498);

  // ── Course title ─────────────────────────────────────────────────────────────
  ctx.font = "600 48px 'Cormorant Garamond', serif";
  ctx.fillStyle = ink;
  const lines = wrapText(ctx, data.courseTitle, W - 300);
  const courseY = 566;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, courseY + i * 62));
  const afterCourse = courseY + lines.length * 62;

  // ── Instructor tag ───────────────────────────────────────────────────────────
  // Small pill
  ctx.font = "500 20px 'DM Sans', sans-serif";
  const instrText = `Instructed by  ${data.instructorName}`;
  const instrW = ctx.measureText(instrText).width + 48;
  const instrPillX = W / 2 - instrW / 2;
  const instrPillY = afterCourse + 20;
  rr(ctx, instrPillX, instrPillY, instrW, 44, 22);
  ctx.fillStyle = "#f3f4f6";
  ctx.fill();
  ctx.fillStyle = body;
  ctx.fillText(instrText, W / 2, instrPillY + 28);

  // ── Bottom section ────────────────────────────────────────────────────────────
  const bottomY = H - 200;

  // Thin separator
  ctx.strokeStyle = purpleMid;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(60, bottomY);
  ctx.lineTo(W - 60, bottomY);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ── Seal (left) ───────────────────────────────────────────────────────────────
  const sealCX = 220;
  const sealCY = bottomY + 82;
  const sealR = 68;

  // Outer glow ring
  const grd = ctx.createRadialGradient(sealCX, sealCY, sealR - 10, sealCX, sealCY, sealR + 20);
  grd.addColorStop(0, "#6d28d922");
  grd.addColorStop(1, "#6d28d900");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(sealCX, sealCY, sealR + 20, 0, Math.PI * 2);
  ctx.fill();

  // Disc fill
  const discGrd = ctx.createRadialGradient(sealCX - 10, sealCY - 10, 0, sealCX, sealCY, sealR);
  discGrd.addColorStop(0, purpleLight);
  discGrd.addColorStop(1, purpleDeep);
  ctx.fillStyle = discGrd;
  ctx.beginPath();
  ctx.arc(sealCX, sealCY, sealR, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring
  ctx.strokeStyle = white;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(sealCX, sealCY, sealR - 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Logo in seal
  const sealLogoSize = 42;
  drawLogo(ctx, sealCX - sealLogoSize / 2, sealCY - sealLogoSize / 2 - 8, sealLogoSize, white);

  // "VERIFIED" text inside seal
  ctx.font = "600 13px 'DM Sans', sans-serif";
  ctx.fillStyle = white;
  ctx.globalAlpha = 0.85;
  ctx.fillText("VERIFIED", sealCX, sealCY + 36);
  ctx.globalAlpha = 1;

  // ── Signature line (centre) ──────────────────────────────────────────────────
  const sigX = W / 2;
  const sigLineY = bottomY + 112;

  // Decorative signature line
  ctx.strokeStyle = purpleMid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sigX - 180, sigLineY);
  ctx.lineTo(sigX + 180, sigLineY);
  ctx.stroke();

  ctx.font = "italic 400 24px 'Cormorant Garamond', serif";
  ctx.fillStyle = ink;
  ctx.fillText("LearnForge Academy", sigX, sigLineY - 14);

  ctx.font = "400 16px 'DM Sans', sans-serif";
  ctx.fillStyle = muted;
  ctx.fillText("Authorised by LearnForge", sigX, sigLineY + 26);

  // ── Date (right) ─────────────────────────────────────────────────────────────
  const dateStr = new Date(data.issuedAt).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const dateX = W - 220;
  const dateY = bottomY + 70;

  // Date box
  rr(ctx, dateX - 130, dateY - 24, 260, 90, 10);
  ctx.fillStyle = purplePale;
  ctx.fill();
  ctx.strokeStyle = purpleMid;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = "500 14px 'DM Sans', sans-serif";
  ctx.fillStyle = purple;
  ctx.textAlign = "center";
  ctx.fillText("DATE OF ISSUE", dateX, dateY + 4);

  ctx.font = "600 22px 'Cormorant Garamond', serif";
  ctx.fillStyle = ink;
  ctx.fillText(dateStr, dateX, dateY + 40);

  // ── Certificate ID ────────────────────────────────────────────────────────────
  if (data.certificateId) {
    ctx.font = "400 14px 'DM Sans', sans-serif";
    ctx.fillStyle = muted;
    ctx.globalAlpha = 0.6;
    ctx.fillText(`Certificate ID: ${data.certificateId}`, W / 2, H - 36);
    ctx.globalAlpha = 1;
  }

  // ── Footer bar ────────────────────────────────────────────────────────────────
  const footerH = 6;
  const fGrad = ctx.createLinearGradient(0, 0, W, 0);
  fGrad.addColorStop(0, purpleDeep);
  fGrad.addColorStop(1, purple);
  ctx.fillStyle = fGrad;
  ctx.fillRect(0, H - footerH, W, footerH);

  return canvas.toDataURL("image/png");
}

export async function downloadCertificate(
  data: CertificateData,
  filename?: string,
): Promise<void> {
  const dataUrl = await generateCertificatePng(data);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download =
    filename ??
    `learnforge-certificate-${data.courseTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
  a.click();
}