---
name: pdf-handling
description: Practical guidance for extracting, combining, and rendering PDF content with Python.
---

# PDF Handling Skill

Use this skill when the task involves reading, transforming, or inspecting PDF files.

## When to Use

Use PDF-specific libraries when the user needs faithful document handling:

- Extract text from born-digital PDFs.
- Inspect tables or page-level layout.
- Merge, split, rotate, or reorder pages.
- Render pages to images for visual verification.

If the PDF is a scan, text extraction will be incomplete without OCR. State that limitation before continuing.

## Recommended Libraries

- `pypdf`: page operations, metadata, merging, splitting, and simple text extraction.
- `pdfplumber`: text extraction with layout awareness and table extraction.
- `pymupdf`: fast rendering and image conversion when visual output matters.

## Typical Patterns

Extract plain text:

```python
from pathlib import Path
import pdfplumber

def extract_text(path: str) -> str:
    parts: list[str] = []
    with pdfplumber.open(path) as pdf:
        for index, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            parts.append(f"--- Page {index} ---\n{text}")
    return "\n\n".join(parts)

print(extract_text("input.pdf"))
```

Merge multiple PDFs:

```python
from pypdf import PdfWriter

writer = PdfWriter()
for filename in ["chapter-1.pdf", "chapter-2.pdf", "appendix.pdf"]:
    writer.append(filename)

with open("combined.pdf", "wb") as output:
    writer.write(output)
```

Render pages for visual review:

```python
import fitz

doc = fitz.open("input.pdf")
for page_index, page in enumerate(doc):
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    pix.save(f"page-{page_index + 1}.png")
```

## Quality Checks

Always report whether the PDF appears text-based or scanned, whether page counts match expectations, and whether extraction preserved tables or lists.
