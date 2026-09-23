"""Text extraction for document and mail inputs used by the P1 intake flow."""

from __future__ import annotations

import email
import io
from email import policy
from typing import Any


MAX_DOCUMENT_BYTES = 20 * 1024 * 1024


def extract_document(filename: str, content: bytes) -> dict[str, Any]:
    """Extract bounded text without executing document content.

    PDF support uses the optional pypdf dependency. Mail is intentionally an
    uploaded .eml message at this stage; IMAP credentials are never accepted.
    """
    if len(content) > MAX_DOCUMENT_BYTES:
        raise ValueError(f"Document exceeds {MAX_DOCUMENT_BYTES} byte limit")
    lower = filename.lower()
    if lower.endswith((".txt", ".md")):
        text = content.decode("utf-8-sig", errors="replace")
        return {"input_type": "text", "filename": filename, "text": text[:200000], "metadata": {}}
    if lower.endswith(".eml"):
        message = email.message_from_bytes(content, policy=policy.default)
        chunks: list[str] = []
        for part in message.walk() if message.is_multipart() else [message]:
            if part.get_content_disposition() == "attachment":
                continue
            if part.get_content_type() not in {"text/plain", "text/html"}:
                continue
            try:
                value = part.get_content()
            except (LookupError, UnicodeError):
                payload = part.get_payload(decode=True) or b""
                value = payload.decode(part.get_content_charset() or "utf-8", errors="replace")
            if part.get_content_type() == "text/html":
                import re

                value = re.sub(r"<[^>]+>", " ", str(value))
            chunks.append(str(value))
        text = "\n".join(chunks).strip()
        return {
            "input_type": "email",
            "filename": filename,
            "text": text[:200000],
            "metadata": {"subject": str(message.get("subject") or ""), "from": str(message.get("from") or "")},
        }
    if lower.endswith(".pdf"):
        try:
            from pypdf import PdfReader
        except ImportError as exc:
            raise ValueError("PDF support requires the pypdf package") from exc
        try:
            reader = PdfReader(io.BytesIO(content), strict=False)
            if len(reader.pages) > 100:
                raise ValueError("PDF has more than 100 pages")
            pages: list[str] = []
            total_chars = 0
            for page in reader.pages:
                value = page.extract_text() or ""
                remaining = max(0, 200000 - total_chars)
                pages.append(value[:remaining])
                total_chars += len(value)
                if total_chars >= 200000:
                    break
        except Exception as exc:
            raise ValueError("Invalid or unreadable PDF") from exc
        return {"input_type": "pdf", "filename": filename, "text": "\n\n".join(pages)[:200000], "metadata": {"page_count": len(reader.pages)}}
    raise ValueError("Unsupported document type; expected .pdf, .txt, .md, or .eml")
