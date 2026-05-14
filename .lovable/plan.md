## CMS editor improvements

Six fixes/additions across the editor, tags input, and category picker.

### 1. Bullet & numbered lists rendering
Cause: editor uses `prose` classes, but `@tailwindcss/typography` is not enabled, so Tailwind's preflight strips list bullets. Fix by adding explicit list styles to the editor surface (and rendered article) so `<ul>` shows discs and `<ol>` shows numbers regardless of the typography plugin.

### 2. Headings H1–H6
Replace the two heading buttons (H2, H3) with a heading dropdown offering Paragraph + H1 through H6, each calling `toggleHeading({ level })`. Active level is highlighted.

### 3. Add new category from the editor
Next to the Category dropdown in `ContentEditor.tsx`, add a small "+ New" button that opens a dialog with a Name field, slugifies it, inserts into `cms_categories`, refreshes the list, and auto-selects the new category.

### 4. Enter key for tags
Replace the comma-separated `Input` with a chip-style tag input: typing a tag and pressing Enter (or comma) adds it as a chip; Backspace on empty input removes the last; each chip has an × to remove. Stored as the same `tags: string[]`.

### 5. Hyperlink for selected keyword
Keep the link button but improve it: open a small dialog (instead of `window.prompt`) with URL + "Open in new tab" checkbox. If text is selected, wrap it in the link; if not, insert the URL as link text. Adds `target="_blank" rel="noopener"` when checked. Unlink button shown when caret is inside a link.

### 6. Text formatting toolbar additions
Add the missing common controls:
- Underline (new `@tiptap/extension-underline`)
- Strikethrough (already in StarterKit)
- Inline code
- Text alignment: left / center / right / justify (`@tiptap/extension-text-align`)
- Text color + highlight (`@tiptap/extension-color`, `@tiptap/extension-highlight`, `@tiptap/extension-text-style`)
- Horizontal rule
- Clear formatting

Group toolbar into sections separated by thin dividers: Headings · Bold/Italic/Underline/Strike/Code · Color/Highlight · Lists · Align · Quote/HR/Link/Image · Undo/Redo.

### Files to change

- `src/components/admin/cms/RichTextEditor.tsx` — new toolbar, extensions, link dialog, list CSS class.
- `src/components/admin/cms/TagInput.tsx` (new) — chip tag input with Enter/Backspace.
- `src/components/admin/cms/CategoryPicker.tsx` (new) — Select + "New" dialog wrapper, or inline in `ContentEditor.tsx`.
- `src/components/admin/cms/ContentEditor.tsx` — wire new tag input, category creator.
- `src/pages/cms/CmsArticle.tsx` — add the same list/heading CSS so published articles render bullets, headings, alignment, colors correctly on the public site.
- `package.json` — add `@tiptap/extension-underline`, `@tiptap/extension-text-align`, `@tiptap/extension-color`, `@tiptap/extension-text-style`, `@tiptap/extension-highlight`.

### Notes

- No DB schema changes (`tags` is already `text[]`, `cms_categories` already has insert via super-admin RLS).
- Editor output remains plain HTML — no migration needed for existing posts.
- Public article styling will be updated to match so what authors see is what readers get.
