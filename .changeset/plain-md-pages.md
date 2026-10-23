---
"starlight-md-txt": patch
---

Fix builds failing on plain `.md` pages that contain HTML which isn't valid MDX (for example `<br>` in a table). The MDX transform now runs only on `.mdx` entries, and a page whose MDX can't be parsed falls back to its raw body with a warning instead of failing the build.
