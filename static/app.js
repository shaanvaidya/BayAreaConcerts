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

  // --- scroll to top ---
  var scrollTopBtn = document.getElementById("scroll-top");
  var SCROLL_EDGE_THRESHOLD = 400;

  function updateScrollButtons() {
    scrollTopBtn.classList.toggle("visible", window.scrollY > SCROLL_EDGE_THRESHOLD);
  }

  scrollTopBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", updateScrollButtons, { passive: true });
  window.addEventListener("resize", updateScrollButtons);
  updateScrollButtons();

  // --- listings ---
  var data = JSON.parse(document.getElementById("show-data").textContent);
  var shows = data.shows;
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var REMINDER_WINDOW_DAYS = 10;
  var NEW_WINDOW_DAYS = 7;

  var state = {
    query: "",
    venues: new Set(),
    range: "all"
  };

  function daysUntil(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    return Math.round((d - today) / 86400000);
  }

  function daysSince(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    return Math.round((today - d) / 86400000);
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
      if (show.sold_out) row.classList.add("sold-out");

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

      var isNew = daysSince(show.first_seen) >= 0 && daysSince(show.first_seen) <= NEW_WINDOW_DAYS;
      // Once sold out, "book soon" no longer applies - drop the reminder
      // tag but keep "New" (still informative: it may have sold out
      // immediately).
      var showReminder = !show.sold_out && du <= REMINDER_WINDOW_DAYS;
      if (isNew || showReminder || show.sold_out) {
        var tagsEl = document.createElement("span");
        tagsEl.className = "tags";

        if (show.sold_out) {
          var soldOutTag = document.createElement("span");
          soldOutTag.className = "tag tag-sold-out";
          soldOutTag.textContent = "Sold Out";
          tagsEl.appendChild(soldOutTag);
        }

        if (isNew) {
          var newTag = document.createElement("span");
          newTag.className = "tag tag-new";
          newTag.textContent = "New";
          tagsEl.appendChild(newTag);
        }

        if (showReminder) {
          var soonTag = document.createElement("span");
          soonTag.className = "tag tag-soon";
          soonTag.textContent = du === 0 ? "Today" : du + "d";
          tagsEl.appendChild(soonTag);
        }

        row.appendChild(tagsEl);
      }

      listEl.appendChild(row);
    });

    emptyStateEl.style.display = filtered.length === 0 ? "block" : "none";
    updateScrollButtons();
  }

  render();
})();
