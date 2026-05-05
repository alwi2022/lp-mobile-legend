import crypto from "crypto";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "../../../../lib/auth/admin";
import { getCloudinaryEnv, hasCloudinaryEnv } from "../../../../lib/cloudinary/env";

const ADMIN_FOLDERS = new Set(["satria-gear/teams", "satria-gear/admins"]);
const PUBLIC_FOLDERS = new Set(["satria-gear/registrations"]);

function signParameters(params, apiSecret) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export async function POST(request) {
  if (!hasCloudinaryEnv()) {
    return NextResponse.json({ error: "Cloudinary belum dikonfigurasi." }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const folder = String(body.folder || "satria-gear/teams");

  if (!ADMIN_FOLDERS.has(folder) && !PUBLIC_FOLDERS.has(folder)) {
    return NextResponse.json({ error: "Folder upload tidak valid." }, { status: 400 });
  }

  if (ADMIN_FOLDERS.has(folder)) {
    const state = await getCurrentAdmin();

    if (!state.admin?.is_active) {
      return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 401 });
    }
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryEnv();
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { folder, timestamp };

  return NextResponse.json({
    apiKey,
    cloudName,
    folder,
    timestamp,
    signature: signParameters(paramsToSign, apiSecret),
  });
}
