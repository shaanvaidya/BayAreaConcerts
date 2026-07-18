(function () {
  "use strict";

  // --- theme toggle ---
  function effectiveTheme() {
    var explicit = document.documentElement.getAttribute("data-theme");
    if (explicit === "dark" || explicit === "light") return explicit;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyThemeClass() {
    document.body.classList.toggle("theme-is-dark", effectiveTheme() === "dark");
  }

  applyThemeClass();

  var themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", function () {
    var next = effectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    applyThemeClass();
  });

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if (!localStorage.getItem("theme")) applyThemeClass();
    });
  }

  // --- listings ---
  var data = JSON.parse(document.getElementById("show-data").textContent);
  var shows = data.shows;
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var REMINDER_WINDOW_DAYS = 10;

  var state = {
    query: "",
    venues: new Set(),
    range: "all"
  };

  function daysUntil(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    return Math.round((d - today) / 86400000);
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  function rangeMax(range) {
    switch (range) {
      case "week": return 7;
      case "2weeks": return 14;
      case "month": return 31;
      default: return Infinity;
    }
  }

  // --- venue pills ---
  var venuePillsEl = document.getElementById("venue-pills");
  data.venues.forEach(function (venue) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = venue;
    btn.dataset.venue = venue;
    btn.addEventListener("click", function () {
      if (state.venues.has(venue)) {
        state.venues.delete(venue);
        btn.classList.remove("active");
      } else {
        state.venues.add(venue);
        btn.classList.add("active");
      }
      render();
    });
    venuePillsEl.appendChild(btn);
  });

  // --- quick range buttons ---
  var rangeButtons = Array.prototype.slice.call(document.querySelectorAll(".quick-range button"));
  rangeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.range = btn.dataset.range;
      rangeButtons.forEach(function (b) { b.classList.toggle("active", b === btn); });
      render();
    });
  });

  // --- search ---
  var searchInput = document.getElementById("search");
  searchInput.addEventListener("input", function () {
    state.query = searchInput.value.trim().toLowerCase();
    render();
  });

  var listEl = document.getElementById("list");
  var emptyStateEl = document.getElementById("empty-state");

  function matches(show) {
    if (state.query) {
      var haystack = (show.title + " " + show.venue).toLowerCase();
      if (haystack.indexOf(state.query) === -1) return false;
    }
    if (state.venues.size > 0 && !state.venues.has(show.venue)) return false;
    var du = daysUntil(show.date);
    if (du < 0) return false; // never show past dates even if data is briefly stale
    if (du > rangeMax(state.range)) return false;
    return true;
  }

  function render() {
    var filtered = shows.filter(matches);
    filtered.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

    listEl.innerHTML = "";
    filtered.forEach(function (show) {
      var row = document.createElement("a");
      row.className = "show-row";
      row.href = show.url;
      row.target = "_blank";
      row.rel = "noopener noreferrer";

      var du = daysUntil(show.date);
      if (du <= REMINDER_WINDOW_DAYS) row.classList.add("soon");

      var dateEl = document.createElement("span");
      dateEl.className = "date";
      dateEl.textContent = formatDate(show.date);
      row.appendChild(dateEl);

      var venueEl = document.createElement("span");
      venueEl.className = "venue";
      venueEl.textContent = show.venue;
      row.appendChild(venueEl);

      var titleEl = document.createElement("span");
      titleEl.className = "title";
      titleEl.textContent = show.title;
      row.appendChild(titleEl);

      if (du <= REMINDER_WINDOW_DAYS) {
        var tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = du === 0 ? "Today" : du + "d";
        row.appendChild(tag);
      }

      listEl.appendChild(row);
    });

    emptyStateEl.style.display = filtered.length === 0 ? "block" : "none";
  }

  render();
})();
