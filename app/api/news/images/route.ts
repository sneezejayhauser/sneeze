import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPassword } from "@/lib/validation";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function sanitizeFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const adminPassword = formData.get("adminPassword");
    const file = formData.get("file");

    if (
      typeof adminPassword !== "string" ||
      !verifyPassword(adminPassword, process.env.NEWS_ADMIN_PASSWORD ?? "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are supported" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Image exceeds 5MB limit" }, { status: 400 });
    }

    const supabase = getServiceClient();
    const bucket = process.env.NEWS_IMAGES_BUCKET ?? "news-images";
    const { data: bucketData } = await supabase.storage.getBucket(bucket);
    if (!bucketData) {
      const { error: createBucketError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: `${MAX_IMAGE_SIZE_BYTES}`,
      });
      if (createBucketError) throw createBucketError;
    }

    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
    const alt = file.name.replace(/\.[^.]+$/, "");
    return NextResponse.json({
      url: publicUrlData.publicUrl,
      markdown: `![${alt}](${publicUrlData.publicUrl})`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
