"use client";

import { useId, useRef, useState } from "react";
import styles from "./page.module.css";

const REGISTER_LOGO_FOLDER = "satria-gear/registrations";
const MAX_LOGO_SIZE = 2 * 1024 * 1024;

export function TeamLogoUpload() {
  const inputId = useId();
  const fileInputRef = useRef(null);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

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

    if (file.size > MAX_LOGO_SIZE) {
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
        body: JSON.stringify({ folder: REGISTER_LOGO_FOLDER }),
      });

      const signatureData = await signatureResponse.json();

      if (!signatureResponse.ok) {
        throw new Error(signatureData.error || "Gagal menyiapkan upload.");
      }

      const uploadForm = new FormData();
      uploadForm.set("file", file);
      uploadForm.set("api_key", signatureData.apiKey);
      uploadForm.set("timestamp", String(signatureData.timestamp));
      uploadForm.set("signature", signatureData.signature);
      uploadForm.set("folder", signatureData.folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        {
          method: "POST",
          body: uploadForm,
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

  function clearLogo() {
    setValue("");
    setStatus("");
    setError("");
  }

  return (
    <div className={`${styles.field} ${styles.fieldFull}`}>
      <span className={styles.fieldLabel}>Logo Team</span>
      <input type="hidden" name="logo_path" value={value} />

      <div className={styles.teamLogoUpload}>
        {value ? (
          <img className={styles.teamLogoPreview} src={value} alt="Preview logo team" />
        ) : (
          <div className={styles.teamLogoPlaceholder}>
            <span>No Logo</span>
          </div>
        )}

        <div className={styles.teamLogoBody}>
          <div className={styles.teamLogoControls}>
            <input
              id={inputId}
              ref={fileInputRef}
              className={styles.teamLogoInput}
              type="file"
              accept="image/*"
              disabled={status === "Mengupload..."}
              onChange={handleFileChange}
            />
            <label
              className={[
                styles.teamLogoButton,
                status === "Mengupload..." ? styles.teamLogoButtonDisabled : "",
              ]
                .filter(Boolean)
                .join(" ")}
              htmlFor={inputId}
            >
              {status === "Mengupload..." ? "Mengupload..." : value ? "Ganti Logo" : "Upload Logo"}
            </label>
            {value ? (
              <button type="button" className={styles.teamLogoRemove} onClick={clearLogo}>
                Hapus
              </button>
            ) : null}
          </div>

          <p
            className={[
              styles.teamLogoHint,
              status ? styles.teamLogoStatus : "",
              error ? styles.teamLogoError : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {error || status || "Maksimal 2MB."}
          </p>
        </div>
      </div>
    </div>
  );
}
