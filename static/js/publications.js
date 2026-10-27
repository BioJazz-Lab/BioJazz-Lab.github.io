/* Publication lists for the BioJazz Lab site.
 * Renders every <div class="bj-pubs"> produced by the list_publications component.
 * Several lists can live on one page; each keeps its own filters and ordering.
 * (Re-implementation of the researchlab theme's publication list, MIT licence.)
 */
(function () {
  "use strict";
  var PALETTE = [
    ["#e6f0ea", "#154734"], ["#fff3d1", "#6b4e00"], ["#e8eef7", "#1e3a5f"], ["#f3e8f5", "#5b2a68"],
    ["#e3f4f4", "#14524f"], ["#f6e9e4", "#6b2d16"], ["#eef0e1", "#4a5214"], ["#ececec", "#333333"]
  ];
  var SVG = 'class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"';
  var ICON_BIB = '<svg ' + SVG + '><path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" /></svg>';
  var ICON_PDF = '<svg ' + SVG + '><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>';
  var ICON_LINK = '<svg ' + SVG + '><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var modal = null;
  function showBibtex(text) {
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "fixed inset-0 flex items-center justify-center p-4 hidden";
      modal.style.cssText = "background: rgba(31,41,51,.55); z-index: 60;";
      modal.innerHTML =
        '<div class="bg-white rounded-lg shadow-lg p-4 max-w-2xl w-full" role="dialog" aria-modal="true" aria-label="BibTeX">' +
        '<div class="flex justify-between items-center"><h3 class="text-lg font-semibold">BibTeX</h3>' +
        '<button type="button" class="bj-close text-gray-500 hover:text-gray-900" aria-label="Close">✕</button></div><hr>' +
        '<pre class="mt-4 text-sm overflow-x-auto whitespace-pre-wrap"><code></code></pre></div>';
      modal.addEventListener("click", function (e) {
        if (e.target === modal || e.target.closest(".bj-close")) modal.classList.add("hidden");
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") modal.classList.add("hidden");
      });
      document.body.appendChild(modal);
    }
    modal.querySelector("code").textContent = text;
    modal.classList.remove("hidden");
  }

  function init(root) {
    var bibs = JSON.parse(root.querySelector(".bj-pubs-data").textContent);
    var membersMap = JSON.parse(root.querySelector(".bj-pubs-members").textContent);
    var member = root.dataset.member || "";
    var membersUrl = root.dataset.membersUrl || "/members/";
    var filtersOn = root.dataset.filters === "1";
    var list = root.querySelector(".bj-pubs-list");
    var boxes = root.querySelectorAll(".bj-pubs-cat input[type=checkbox]");
    var label = root.querySelector(".bj-pubs-cat-label");
    var orderSel = root.querySelector(".bj-pubs-order");
    var selected = new Set();
    var order = "year";
    var shown = [];

    // Colour order: the lab list's tags first (shared by every list), then any others.
    var tagEl = root.querySelector(".bj-pubs-tags");
    var cats = tagEl ? JSON.parse(tagEl.textContent) : [];
    var extra = [];
    bibs.forEach(function (b) { b.category.forEach(function (c) { if (cats.indexOf(c) < 0 && extra.indexOf(c) < 0) extra.push(c); }); });
    cats = cats.concat(extra.sort());
    var colour = {};
    cats.forEach(function (c, i) { colour[c] = PALETTE[i % PALETTE.length]; });

    function chip(c) {
      var p = colour[c] || PALETTE[PALETTE.length - 1];
      return '<span class="bj-chip ring-1 ring-inset inline-flex items-center rounded-md px-2 py-1 text-xs font-medium" data-cat="' +
        esc(c) + '" style="background:' + p[0] + ";color:" + p[1] + (filtersOn ? ";cursor:pointer" : "") + '">' + esc(c) + "</span>";
    }
    function linkAuthors(authors) {
      var html = esc(authors);
      Object.keys(membersMap).forEach(function (user) {
        membersMap[user].forEach(function (name) {
          var n = esc(name);
          if (html.indexOf(n) >= 0) html = html.split(n).join('<a href="' + membersUrl + user + '/">' + n + "</a>");
        });
      });
      return html;
    }
    function belongsToMember(b) {
      if (!member) return true;
      return (membersMap[member] || []).some(function (n) { return b.author.indexOf(n) >= 0; });
    }
    function render() {
      shown = bibs.filter(belongsToMember).filter(function (b) {
        return selected.size === 0 || b.category.some(function (c) { return selected.has(c); });
      });
      shown.sort(order === "title"
        ? function (a, b) { return a.title.localeCompare(b.title, "en", { sensitivity: "base" }); }
        : function (a, b) { return b.year - a.year; });
      list.innerHTML = shown.map(function (b, i) {
        return '<div class="bj-card p-4">' +
          '<h3 class="text-lg font-semibold" style="color: var(--bj-green);">' + b.title + "</h3>" +
          (b.category.length ? '<div class="mt-3 flex flex-wrap gap-1">' + b.category.map(chip).join("") + "</div>" : "") +
          '<p class="prose max-w-none mt-3 mb-0">' + linkAuthors(b.author) + "</p>" +
          '<p class="text-gray-600 italic">' + esc(b.cite) + " (" + b.year + ")</p>" +
          '<div class="flex justify-end space-x-4 mt-2">' +
          '<button type="button" class="bj-bib inline-flex items-center" data-i="' + i + '" title="Show BibTeX" aria-label="Show BibTeX">' + ICON_BIB + "</button>" +
          (b.downloadUrl ? '<a href="' + esc(b.downloadUrl) + '" download class="inline-flex items-center" title="Download PDF" aria-label="Download PDF">' + ICON_PDF + "</a>" : "") +
          (b.doi ? '<a href="https://doi.org/' + esc(b.doi) + '" target="_blank" rel="noopener" class="inline-flex items-center" title="Open paper" aria-label="Open paper">' + ICON_LINK + "</a>" : "") +
          "</div></div>";
      }).join("") || '<p class="text-gray-600">No publications match the selected topics.</p>';
    }
    function updateLabel() {
      if (!label) return;
      if (selected.size === 0) {
        label.textContent = label.dataset.placeholder;
        label.classList.add("text-gray-500");
      } else {
        label.innerHTML = Array.from(selected).map(chip).join(" ");
        label.classList.remove("text-gray-500");
      }
    }
    function toggle(c) {
      if (selected.has(c)) selected.delete(c); else selected.add(c);
      if (label) label.addEventListener("click", function (e) {
      // Clicking a selected-topic chip in the dropdown header removes that filter.
      var c = e.target.closest(".bj-chip");
      if (c) { e.preventDefault(); toggle(c.dataset.cat); }
    });
    boxes.forEach(function (cb) { cb.checked = selected.has(cb.value); });
      updateLabel();
      render();
    }

    list.addEventListener("click", function (e) {
      var bib = e.target.closest(".bj-bib");
      if (bib) { showBibtex(shown[+bib.dataset.i].bibtex); return; }
      var c = e.target.closest(".bj-chip");
      if (c && filtersOn) toggle(c.dataset.cat);
    });
    boxes.forEach(function (cb) {
      cb.checked = false;
      cb.addEventListener("change", function () { toggle(cb.value); });
    });
    if (orderSel) orderSel.addEventListener("change", function () { order = orderSel.value; render(); });
    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".bj-pubs").forEach(init);
  });
  // Close an open topic dropdown when clicking elsewhere.
  document.addEventListener("click", function (e) {
    document.querySelectorAll(".bj-pubs details[open]").forEach(function (d) {
      if (!d.contains(e.target)) d.removeAttribute("open");
    });
  });
})();
