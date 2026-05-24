export const NOTES_STYLES = `
  .notes-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px; }
  .notes-panel h4 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
  .notes-panel h4 button { padding: 4px 10px; font-size: 0.7rem; font-weight: 600; background: var(--accent); color: #fff; border: none; border-radius: 5px; cursor: pointer; }
  .note-item { padding: 10px 0; border-bottom: 1px solid var(--border); }
  .note-item:last-child { border-bottom: none; }
  .note-title { font-weight: 600; font-size: 0.85rem; margin-bottom: 2px; }
  .note-body { font-size: 0.8rem; line-height: 1.4; white-space: pre-wrap; color: var(--text); }
  .note-meta { font-size: 0.68rem; color: var(--muted); margin-top: 4px; display: flex; justify-content: space-between; align-items: center; }
  .note-meta button { background: none; border: none; color: var(--danger, #e53e3e); font-size: 0.68rem; cursor: pointer; padding: 0; }
  .note-form { display: none; padding: 10px 0; }
  .note-form textarea { width: 100%; min-height: 70px; font-family: inherit; font-size: 0.8rem; padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--text); resize: vertical; box-sizing: border-box; }
  .note-form input { width: 100%; font-family: inherit; font-size: 0.8rem; padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--text); margin-bottom: 6px; box-sizing: border-box; }
  .note-form-actions { display: flex; gap: 6px; margin-top: 6px; }
  .note-form-actions button { padding: 5px 12px; font-size: 0.72rem; font-weight: 600; border-radius: 5px; border: 1px solid var(--border); cursor: pointer; }
  .note-form-actions .btn-save { background: var(--accent); color: #fff; border-color: var(--accent); }
  .note-form-actions .btn-cancel { background: var(--surface); color: var(--text); }
  .notes-empty { font-size: 0.8rem; color: var(--muted); padding: 8px 0; }
`;

export function notesHTML(containerId: string): string {
  const fnId = containerId.replace(/-/g, "_");
  return `<div class="notes-panel" id="${containerId}">
    <h4>Notes <button onclick="showNoteForm_${fnId}()">+ Add</button></h4>
    <div class="note-form" id="${containerId}-form">
      <input type="text" id="${containerId}-title" placeholder="Title (optional)">
      <textarea id="${containerId}-content" placeholder="Write a note..."></textarea>
      <div class="note-form-actions">
        <button class="btn-save" onclick="saveNote_${fnId}()">Save</button>
        <button class="btn-cancel" onclick="hideNoteForm_${fnId}()">Cancel</button>
      </div>
    </div>
    <div id="${containerId}-list"><div class="notes-empty">Loading...</div></div>
  </div>`;
}

export function notesJS(containerId: string, contextType: string, contextId: string): string {
  const fnId = containerId.replace(/-/g, "_");
  return `
    function escNote(str) {
      if (!str) return '';
      var d = document.createElement('div');
      d.textContent = str;
      return d.innerHTML;
    }
    function notesTimeAgo_${fnId}(date) {
      var s = Math.floor((Date.now() - date.getTime()) / 1000);
      if (s < 60) return 'just now';
      if (s < 3600) return Math.floor(s / 60) + 'm ago';
      if (s < 86400) return Math.floor(s / 3600) + 'h ago';
      return Math.floor(s / 86400) + 'd ago';
    }
    function loadNotes_${fnId}() {
      var list = document.getElementById('${containerId}-list');
      fetch('/api/notes?context_type=${contextType}&context_id=${contextId}')
        .then(function(r) { return r.json(); })
        .then(function(notes) {
          if (notes.length === 0) {
            list.innerHTML = '<div class="notes-empty">No notes yet</div>';
            return;
          }
          list.innerHTML = notes.map(function(n) {
            var ago = notesTimeAgo_${fnId}(new Date(n.created_at + 'Z'));
            return '<div class="note-item">' +
              (n.title ? '<div class="note-title">' + escNote(n.title) + '</div>' : '') +
              '<div class="note-body">' + escNote(n.content) + '</div>' +
              '<div class="note-meta"><span>' + escNote(n.author_name) + ' — ' + ago + '</span>' +
              '<button onclick="deleteNote_${fnId}(' + n.id + ')">delete</button></div></div>';
          }).join('');
        });
    }
    function showNoteForm_${fnId}() {
      document.getElementById('${containerId}-form').style.display = 'block';
      document.getElementById('${containerId}-content').focus();
    }
    function hideNoteForm_${fnId}() {
      document.getElementById('${containerId}-form').style.display = 'none';
      document.getElementById('${containerId}-title').value = '';
      document.getElementById('${containerId}-content').value = '';
    }
    function saveNote_${fnId}() {
      var title = document.getElementById('${containerId}-title').value.trim();
      var content = document.getElementById('${containerId}-content').value.trim();
      if (!content) return;
      fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context_type: '${contextType}', context_id: '${contextId}', title: title || undefined, content: content })
      }).then(function() {
        hideNoteForm_${fnId}();
        loadNotes_${fnId}();
      });
    }
    function deleteNote_${fnId}(id) {
      if (!confirm('Delete this note?')) return;
      fetch('/api/notes/' + id, { method: 'DELETE' }).then(function() { loadNotes_${fnId}(); });
    }
    loadNotes_${fnId}();
  `;
}
