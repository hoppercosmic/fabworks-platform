import type { TenantConfig, StationMenu, SessionUser } from "../index";
import { page, stationNamesJS, displayStatusJS, STATUS_COLOR_JS } from "./layout";
import { NOTES_STYLES, notesHTML, notesJS } from "./components/notes";

export function stationMenuPage(config: TenantConfig, user: SessionUser, menu: StationMenu): string {
  const stationSlugs = JSON.stringify(menu.station_slugs);
  const hasNotes = menu.features.includes("notes");

  return page(`${menu.name}`, `
    main { flex: 1; padding: 10px 16px 16px; max-width: 600px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
    .menu-header { display: flex; align-items: center; justify-content: space-between; }
    .menu-header h2 { font-size: 1.2rem; font-weight: 800; }
    .menu-stations { display: flex; flex-wrap: wrap; gap: 6px; }
    .menu-station-badge { font-size: 0.65rem; font-weight: 600; padding: 3px 8px; border-radius: 4px; background: rgba(59,130,246,0.15); color: var(--accent); }
    .item-list { display: flex; flex-direction: column; gap: 8px; }
    .item-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .item-card .item-label { font-weight: 600; font-size: 0.9rem; }
    .item-card .item-sub { font-size: 0.7rem; color: var(--muted); margin-top: 2px; }
    .empty { color: var(--muted); font-size: 0.85rem; text-align: center; padding: 24px; }
    ${hasNotes ? NOTES_STYLES : ''}
  `, `
  <main>
    <div class="menu-header">
      <h2>${menu.name}</h2>
    </div>
    <div class="menu-stations" id="station-badges"></div>
    <div class="item-list" id="item-list"></div>
    ${hasNotes ? notesHTML('menu-notes') : ''}
  </main>
  `, `
    ${stationNamesJS(config)}
    ${displayStatusJS(config)}
    ${STATUS_COLOR_JS}

    var MENU_STATIONS = ${stationSlugs};

    function timeAgo(date) {
      var s = Math.floor((Date.now() - date.getTime()) / 1000);
      if (s < 60) return 'just now';
      if (s < 3600) return Math.floor(s / 60) + 'm ago';
      if (s < 86400) return Math.floor(s / 3600) + 'h ago';
      return Math.floor(s / 86400) + 'd ago';
    }

    var badgeDiv = document.getElementById('station-badges');
    MENU_STATIONS.forEach(function(slug) {
      var name = STATION_NAMES[slug] || slug;
      badgeDiv.innerHTML += '<span class="menu-station-badge">' + name + '</span>';
    });

    var itemList = document.getElementById('item-list');
    function loadItems() {
      itemList.innerHTML = '<div class="empty">Loading...</div>';
      var promises = MENU_STATIONS.map(function(slug) {
        return fetch('/api/stations/' + slug + '/items').then(function(r) { return r.json(); });
      });
      Promise.all(promises).then(function(results) {
        var all = [];
        results.forEach(function(data, i) {
          var slug = MENU_STATIONS[i];
          var name = STATION_NAMES[slug] || slug;
          (data.items || []).forEach(function(item) { item._station = name; all.push(item); });
        });
        if (all.length === 0) {
          itemList.innerHTML = '<div class="empty">No items at these stations</div>';
          return;
        }
        itemList.innerHTML = all.map(function(item) {
          var label = item.label || item.name || ('Item #' + (item.cabinet_number || item.id));
          var jobInfo = item.job_number ? ' \\u2014 Job ' + item.job_number : '';
          var statusPill = item.status ? '<span class="pill pill-' + pillColor(item.status) + '">' + displayStatus(item.status) + '</span>' : '';
          return '<div class="item-card"><div><div class="item-label">' + label + jobInfo + '</div><div class="item-sub">' + item._station + '</div></div>' + statusPill + '</div>';
        }).join('');
      });
    }
    loadItems();
    ${hasNotes ? notesJS('menu-notes', 'station_menu', menu.slug) : ''}
  `, user, `/menu/${menu.slug}`, [], config);
}
