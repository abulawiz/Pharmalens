"use client";

import { useEffect, useState } from "react";
import { Upload } from "@/components/icons";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { normalizeImage } from "@/lib/services/image-quality";
import { getLocalVersions, addLocalReferenceImage } from "@/lib/local-store";

type Version = {
  id: string;
  version: number;
  packaging_version: string;
  status: string;
  products: { name: string } | Array<{ name: string }>;
};

export function ReferenceImageManager() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      try {
        createClient()
          .from("reference_versions")
          .select("id,version,packaging_version,status,products(name)")
          .order("created_at", { ascending: false })
          .then(({ data }) => setVersions((data ?? []) as unknown as Version[]));
        return;
      } catch {}
    }

    queueMicrotask(() => {
      const local = getLocalVersions();
      setVersions(
        local.map((v) => ({
          id: v.id,
          version: v.version,
          packaging_version: v.packaging_version,
          status: v.status,
          products: { name: v.products?.name ?? "Medicine" },
        }))
      );
    });
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const source = form.get("image") as File;

    if (!source || !["image/jpeg", "image/png", "image/webp"].includes(source.type) || source.size > 10 * 1024 * 1024) {
      setMessage("Choose a JPEG, PNG or WebP image no larger than 10 MB.");
      return;
    }

    setBusy(true);
    const versionId = String(form.get("versionId"));
    const side = String(form.get("side"));

    try {
      const file = await normalizeImage(source);
      const bitmap = await createImageBitmap(file);

      if (isSupabaseConfigured()) {
        const bytes = await file.arrayBuffer();
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        const sha256 = Array.from(new Uint8Array(digest))
          .map((value) => value.toString(16).padStart(2, "0"))
          .join("");

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const path = `${versionId}/${crypto.randomUUID()}-${side}.jpg`;

        const { error: uploadError } = await supabase.storage.from("reference-images").upload(path, file, {
          contentType: "image/jpeg",
        });

        if (uploadError) {
          setMessage(uploadError.message);
          bitmap.close();
          setBusy(false);
          return;
        }

        const { error: recordError } = await supabase.from("reference_images").insert({
          reference_version_id: versionId,
          storage_path: path,
          package_side: side,
          sha256,
          width: bitmap.width,
          height: bitmap.height,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        });

        bitmap.close();
        if (recordError) {
          await supabase.storage.from("reference-images").remove([path]);
          setMessage(recordError.message);
        } else {
          setMessage("Reference image uploaded and linked to the selected packaging record.");
          event.currentTarget.reset();
        }
      } else {
        // Local upload
        addLocalReferenceImage({
          reference_version_id: versionId,
          package_side: side,
          storage_path: `local/${versionId}/${side}.jpg`,
          width: bitmap.width,
          height: bitmap.height,
        });
        bitmap.close();
        setMessage("Reference image linked to packaging version successfully in local database.");
        event.currentTarget.reset();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Image could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card admin-panel">
      <h2>Reference packaging images</h2>
      <p>
        Upload clear photographs of genuine packaging panels (front, back, or side). These serve as visual reference standards for verification.
      </p>
      <form className="reference-image-form" onSubmit={submit}>
        <div className="field">
          <label>Packaging version</label>
          <select name="versionId" required>
            <option value="">Select packaging version...</option>
            {versions.map((version) => {
              const product = Array.isArray(version.products) ? version.products[0] : version.products;
              return (
                <option key={version.id} value={version.id}>
                  {product?.name} · v{version.version} · {version.status}
                </option>
              );
            })}
          </select>
        </div>
        <div className="field">
          <label>Package panel</label>
          <select name="side">
            <option value="front">Front Panel</option>
            <option value="back">Back Panel</option>
            <option value="side">Side / Foil Panel</option>
          </select>
        </div>
        <div className="field">
          <label>Approved genuine photo</label>
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp" required />
        </div>
        <button disabled={busy || !versions.length} className="button button-primary">
          <Upload size={17} />
          {busy ? "Saving..." : "Upload reference photo"}
        </button>
      </form>
      {message && (
        <div className="form-alert admin-feedback" role="status">
          {message}
        </div>
      )}
    </section>
  );
}
