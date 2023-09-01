### 在 markdown-preview-enhanced 7.0 預覽 quarto
- 在 `extension.js` 搜尋 `e.languageId==="markdown"` 並改成 `(e.languageId==="markdown" || e.languageId==="quarto")`.
- 去 keyboard shortcuts 設定
  ```json
  {
    "key": "cmd+k v",
    "command": "markdown-preview-enhanced.openPreviewToTheSide",
    "when": "editorLangId == 'markdown' || editorLangId == 'quarto' || editorLangId == 'rmarkdown'"
  }
  ```
