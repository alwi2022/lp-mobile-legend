"use client";

import { useId, useRef, useState } from "react";
import styles from "./admin-shell.module.css";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export function CloudinaryUploadField({
  label,
  name,
  defaultValue = "",
  folder = "satria-gear/teams",
  variant = "logo",
  helper = "Maksimal 2MB.",
}) {
  const inputId = useId();
  const fileInputRef = useRef(null);
  const [value, setValue] = useState(defaultValue || "");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const isUploading = status === "Mengupload...";
  const isAvatar = variant === "avatar";
  const uploadLabel = isAvatar ? "Avatar" : "Logo";

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      setStatus("");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Ukuran gambar maksimal 2MB.");
      setStatus("");
      return;
    }

    setStatus("Mengupload...");
    setError("");

    try {
      const signatureResponse = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
      });

      const signatureData = await signatureResponse.json();

      if (!signatureResponse.ok) {
        throw new Error(signatureData.error || "Gagal menyiapkan upload.");
      }

      const formData = new FormData();
      formData.set("file", file);
      formData.set("api_key", signatureData.apiKey);
      formData.set("timestamp", String(signatureData.timestamp));
      formData.set("signature", signatureData.signature);
      formData.set("folder", signatureData.folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error?.message || "Upload Cloudinary gagal.");
      }

      setValue(uploadData.secure_url || "");
      setStatus("");
    } catch (uploadError) {
      setError(uploadError.message || "Upload gagal.");
      setStatus("");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className={`${styles.field} ${styles.fieldFull}`}>
      <span>{label}</span>
      <input type="hidden" name={name} value={value} />

      <div className={styles.uploadField}>
        {value ? (
          <img
            className={[
              styles.uploadPreview,
              isAvatar ? styles.uploadPreviewAvatar : "",
            ]
              .filter(Boolean)
              .join(" ")}
            src={value}
            alt={`${label} preview`}
          />
        ) : (
          <div
            className={[
              styles.uploadPlaceholder,
              isAvatar ? styles.uploadPlaceholderAvatar : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {isAvatar ? "No Image" : "No Logo"}
          </div>
        )}

        <div className={styles.uploadBody}>
          <div className={styles.uploadControls}>
            <input
              id={inputId}
              ref={fileInputRef}
              className={styles.fileInput}
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={handleFileChange}
            />
            <label
              className={[
                styles.uploadButton,
                isUploading ? styles.uploadButtonDisabled : "",
              ]
                .filter(Boolean)
                .join(" ")}
              htmlFor={inputId}
            >
              {isUploading ? "Mengupload..." : value ? `Ganti ${uploadLabel}` : `Upload ${uploadLabel}`}
            </label>
            {value ? (
              <button
                type="button"
                className={styles.uploadRemove}
                onClick={() => {
                  setValue("");
                  setStatus("");
                  setError("");
                }}
              >
                Hapus
              </button>
            ) : null}
          </div>

          <p
            className={[
              styles.uploadHint,
              status ? styles.uploadStatus : "",
              error ? styles.uploadError : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {error || status || helper}
          </p>
        </div>
      </div>
    </div>
  );
}
