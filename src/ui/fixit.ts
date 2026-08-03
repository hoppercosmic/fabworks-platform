import type { TenantConfig, SessionUser, UserRole } from "../index";
import { page, SHARED_JS } from "./layout";

export function fixitPage(config: TenantConfig, user: SessionUser): string {
  const isLead = (["lead", "supervisor", "admin"] as UserRole[]).includes(user.role);
  return page("FixIt", `

    .controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .controls select { width: auto; padding: 8px 12px; font-size: 0.85rem; }
    .controls .label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .fixit-count { font-size: 0.85rem; color: var(--muted); }
    .fixit-list { display: flex; flex-direction: column; gap: 12px; }
    .fixit-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
      padding: 14px; display: flex; flex-direction: column; gap: 10px;
    }
    .fixit-card.has-photo { border-left: 3px solid var(--accent); }
    .fixit-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .fixit-cause { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
    .cause-cnc_error { background: rgba(239,68,68,0.2); color: var(--error); }
    .cause-material_defect { background: rgba(245,158,11,0.2); color: var(--warning, #f59e0b); }
    .cause-transit_damage { background: rgba(59,130,246,0.2); color: var(--accent); }
    .cause-other { background: rgba(148,163,184,0.2); color: var(--muted); }
    .fixit-cab { font-weight: 700; font-size: 1rem; }
    .fixit-job { font-size: 0.8rem; color: var(--muted); }
    .fixit-desc { font-size: 0.85rem; color: var(--text); white-space: pre-line; }
    .fixit-photo-thumb { max-width: 100%; max-height: 200px; border-radius: 8px; cursor: pointer; }
    .fixit-meta { font-size: 0.75rem; color: var(--muted); display: flex; justify-content: space-between; }
    .fixit-resolve-btn { padding: 8px 16px; font-size: 0.85rem; font-weight: 600; border: none; border-radius: var(--radius); background: var(--success); color: #fff; cursor: pointer; align-self: flex-start; }
    .fixit-resolve-btn:disabled { opacity: 0.5; }
    .resolve-form { display: flex; gap: 8px; align-items: center; }
    .resolve-form input { flex: 1; padding: 8px; font-size: 0.85rem; }
    .resolved-badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; background: rgba(34,197,94,0.2); color: var(--success); }
    .empty-state { text-align: center; padding: 3rem 1rem; color: var(--muted); }
    .photo-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 300; display: none; align-items: center; justify-content: center; cursor: pointer; }
    .photo-modal.active { display: flex; }

    .ai-qc-btn { padding: 6px 12px; font-size: 0.8rem; font-weight: 600; border: 1px solid var(--accent); border-radius: 6px; background: rgba(59,130,246,0.1); color: var(--accent); cursor: pointer; margin-top: 4px; display: inline-flex; align-items: center; gap: 4px; }
    .ai-qc-btn:hover { background: rgba(59,130,246,0.2); }
    .ai-qc-result { background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.3); border-radius: 8px; padding: 10px; margin-top: 8px; font-size: 0.8rem; }
    .ai-qc-header { display: flex; justify-content: space-between; align-items: center; font-weight: 700; color: var(--purple, #a855f7); margin-bottom: 4px; }
    .ai-severity { padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; text-transform: uppercase; font-weight: 700; }
    .sev-minor { background: rgba(34,197,94,0.2); color: var(--success); }
    .sev-moderate { background: rgba(245,158,11,0.2); color: var(--warning, #f59e0b); }
    .sev-critical { background: rgba(239,68,68,0.2); color: var(--error); }

    .photo-modal img { max-width: 95vw; max-height: 90vh; border-radius: 4px; }
  `, `
  <main>
    <div class="controls">
      <span class="label">Status</span>
      <select id="status-select">
        <option value="open">Open</option>
        <option value="resolved">Resolved</option>
      </select>
      <span class="fixit-count" id="count"></span>
    </div>
    <div id="fixit-list" class="fixit-list"></div>
    <div id="empty" class="empty-state" style="display:none">No FixIt requests</div>
  </main>
  <div class="photo-modal" id="photo-modal"><img id="photo-modal-img" src=""></div>
  `, `
    ${SHARED_JS}
    var IS_LEAD = ${isLead};
    var ROOT_CAUSE_LABELS = {};
    var listDiv = document.getElementById('fixit-list');
    var emptyDiv = document.getElementById('empty');
    var countSpan = document.getElementById('count');
    var statusSelect = document.getElementById('status-select');

    window.analyzeFixItAI = function(id, btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = '🤖 Analyzing Image...';
      fetch('/api/fixit/' + id + '/analyze', { method: 'POST' })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          btnEl.style.display = 'none';
          var res = d.analysis || {};
          var resultDiv = document.getElementById('ai-res-' + id);
          if (resultDiv) {
            var sevClass = 'sev-' + (res.severity || 'minor');
            resultDiv.innerHTML = '<div class="ai-qc-result">' +
              '<div class="ai-qc-header"><span>🤖 AI QC Inspector Analysis</span><span class="ai-severity ' + sevClass + '">' + (res.severity || 'minor') + '</span></div>' +
              '<div><strong>Defect Type:</strong> ' + escHtml(res.defect_type || 'General Issue') + '</div>' +
              '<div><strong>Rework Action:</strong> ' + escHtml(res.rework_action || 'Inspect part at station') + '</div>' +
              '<div style="font-size:0.7rem;color:var(--muted);margin-top:4px">Confidence: ' + Math.round((res.confidence || 0.8) * 100) + '%</div>' +
              '</div>';
          }
        })
        .catch(function() {
          btnEl.disabled = false;
          btnEl.textContent = '🤖 Retry AI QC Analyze';
        });
    };

    var photoModal = document.getElementById('photo-modal');
    var photoModalImg = document.getElementById('photo-modal-img');

    function fmtDate(d) {
      if (!d) return '';
      var dt = new Date(d + 'Z');
      return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function load() {
      var status = statusSelect.value;
      fetch('/api/fixit?status=' + status)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          ROOT_CAUSE_LABELS = data.root_cause_labels || {};
          var reqs = data.requests || [];
          countSpan.textContent = reqs.length + ' request' + (reqs.length !== 1 ? 's' : '');

          if (reqs.length === 0) {
            listDiv.innerHTML = '';
            emptyDiv.style.display = 'block';
            return;
          }
          emptyDiv.style.display = 'none';

          listDiv.innerHTML = reqs.map(function(r) {
            var causeLabel = ROOT_CAUSE_LABELS[r.root_cause] || r.root_cause;
            var causeClass = 'cause-' + r.root_cause;
            var photoHtml = r.photo_key
              ? '<img class="fixit-photo-thumb" data-id="' + r.id + '" src="/api/fixit/' + r.id + '/photo" alt="Photo">'
              : '';
            var descHtml = r.description ? '<div class="fixit-desc">' + escHtml(r.description) + '</div>' : '';

            var actionHtml = '';
            if (r.status === 'open' && IS_LEAD) {
              actionHtml = '<div class="resolve-form">'
                + '<input type="text" class="input resolve-note" data-id="' + r.id + '" placeholder="Resolution note (optional)">'
                + '<button class="fixit-resolve-btn" data-id="' + r.id + '">Resolve</button>'
                + '</div>';
            }
            if (r.status === 'resolved') {
              actionHtml = '<div><span class="resolved-badge">Resolved</span> '
                + '<span style="font-size:0.75rem;color:var(--muted)">'
                + (r.resolved_by_name || '') + ' — ' + fmtDate(r.resolved_at)
                + (r.resolution_note ? ' — ' + escHtml(r.resolution_note) : '')
                + '</span></div>';
            }

            return '<div class="fixit-card' + (r.photo_key ? ' has-photo' : '') + '">'
              + '<div class="fixit-header">'
              +   '<div><span class="fixit-cab">${config.entity_labels.l3} #' + r.cabinet_number + (r.cabinet_label ? ' — ' + escHtml(r.cabinet_label) : '') + '</span></div>'
              +   '<span class="fixit-cause ' + causeClass + '">' + causeLabel + '</span>'
              + '</div>'
              + '<div class="fixit-job">' + r.job_number + ' — ' + escHtml(r.job_name) + '</div>'
              + descHtml
              + photoHtml
              + '<div class="fixit-meta"><span>By ' + escHtml(r.requested_by_name) + '</span><span>' + fmtDate(r.created_at) + '</span></div>'
              + actionHtml
              + '</div>';
          }).join('');

          listDiv.querySelectorAll('.fixit-resolve-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
              var id = btn.dataset.id;
              var noteInput = listDiv.querySelector('.resolve-note[data-id="' + id + '"]');
              btn.disabled = true;
              btn.textContent = 'Resolving...';
              fetch('/api/fixit/' + id + '/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resolution_note: noteInput ? noteInput.value : '' }),
              }).then(function(r) { return r.json(); }).then(function(d) {
                if (d.ok) load();
                else { btn.disabled = false; btn.textContent = 'Resolve'; }
              });
            });
          });

          listDiv.querySelectorAll('.fixit-photo-thumb').forEach(function(img) {
            img.addEventListener('click', function() {
              photoModalImg.src = img.src;
              photoModal.classList.add('active');
            });
          });
        });
    }

    photoModal.addEventListener('click', function() { photoModal.classList.remove('active'); });
    statusSelect.addEventListener('change', load);
    load();
  `, user, "/fixit", [], config);
}
