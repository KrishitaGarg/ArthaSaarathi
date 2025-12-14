"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function DocumentUpload({ sessionId, onUploaded }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles.length) return;

      setFiles(acceptedFiles);
      setUploading(true);
      setStatus(null);

      const formData = new FormData();
      acceptedFiles.forEach((f) => formData.append("files", f));
      formData.append("session_id", sessionId);

      try {
        const res = await fetch(`${API_BASE}/api/documents/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          setStatus("Upload failed. Try again.");
          setUploading(false);
          return;
        }

        const data = await res.json();
        setStatus("Uploaded & processed successfully");
        onUploaded && onUploaded(data);
      } catch (e) {
        setStatus("Upload failed. Try again.");
      } finally {
        setUploading(false);
      }
    },
    [sessionId, onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 3,
  });

  return (
    <div className="mt-2">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-4 text-center text-xs cursor-pointer transition ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
        }`}
      >
        <input {...getInputProps()} />
        <p className="font-medium">Upload PAN / Salary Slip</p>
        <p className="text-slate-500 mt-1">
          Drop files here or click to browse
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {files.map((file, i) => (
            <span
              key={i}
              className="px-2 py-1 rounded-full bg-blue-50 text-[11px] text-blue-700"
            >
              {file.name}
            </span>
          ))}
        </div>
      )}

      {uploading && (
        <p className="mt-1 text-[11px] text-blue-600">
          Uploading & processing…
        </p>
      )}
      {status && <p className="mt-1 text-[11px] text-emerald-600">{status}</p>}
    </div>
  );
}
