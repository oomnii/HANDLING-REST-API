const statusEl = document.getElementById("status");
const tasksEl = document.getElementById("tasks");

const newTitleEl = document.getElementById("newTitle");
const addBtn = document.getElementById("addBtn");
const refreshBtn = document.getElementById("refreshBtn");

const findIdEl = document.getElementById("findId");
const findBtn = document.getElementById("findBtn");
const findResultEl = document.getElementById("findResult");

const wrapEl = document.querySelector(".wrap");

let statusTimer = null;

function playThud() {
  const audio = document.getElementById("stampSound");
  if (!audio) return;

  try {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

function triggerStamp() {
  const stamp = document.getElementById("stamp");
  if (!stamp) return;

  // Restart animation reliably
  stamp.classList.remove("show");
  wrapEl?.classList.remove("shake");
  void stamp.offsetWidth;

  stamp.classList.add("show");
  wrapEl?.classList.add("shake");
  playThud();

  setTimeout(() => {
    stamp.classList.remove("show");
    wrapEl?.classList.remove("shake");
  }, 2500);
}

function setStatus(msg, tone = "ok") {
  statusEl.textContent = msg;
  statusEl.style.color = tone === "err" ? "rgba(139,46,26,.95)" : "inherit";

  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusEl.textContent = "Ready";
    statusEl.style.color = "inherit";
  }, 2200);
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? data.message
        : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTasks(tasks) {
  if (!tasks.length) {
    tasksEl.innerHTML = `
      <div class="task">
        <div class="taskTop">
          <div class="taskTitle">No entries yet — add your first task.</div>
          <span class="badge no">Empty</span>
        </div>
      </div>
    `;
    return;
  }

  tasksEl.innerHTML = tasks
    .map(
      (t) => `
    <div class="task">
      <div class="taskTop">
        <div class="taskTitle"><strong>#${t.id}</strong> — ${escapeHtml(
        t.title
      )}</div>
        <span class="badge ${t.completed ? "ok" : "no"}">${
        t.completed ? "Completed" : "Pending"
      }</span>
      </div>

      <div class="actions">
        <button class="btn btn--ghost" onclick="toggleCompleted(${t.id}, ${
        t.completed
      })">
          ${t.completed ? "Mark Pending" : "Mark Completed"}
        </button>

        <input class="input smallInput" id="edit-${t.id}" placeholder="Rename this task…" />
        <button class="btn btn--ink" onclick="updateTitle(${t.id})">Update</button>

        <button class="btn" onclick="deleteTask(${t.id})">Delete</button>
      </div>
    </div>
  `
    )
    .join("");
}

async function loadTasks() {
  try {
    setStatus("Loading…");
    const tasks = await api("/tasks");
    renderTasks(tasks);
    setStatus("Synced");
  } catch (err) {
    setStatus(`Error: ${err.message}`, "err");
  }
}

addBtn.addEventListener("click", async () => {
  const title = newTitleEl.value.trim();
  if (!title) {
    setStatus("Write a task title first.");
    newTitleEl.focus();
    return;
  }

  addBtn.disabled = true;
  try {
    setStatus("Creating…");
    await api("/tasks", { method: "POST", body: JSON.stringify({ title }) });
    triggerStamp();
    newTitleEl.value = "";
    await loadTasks();
    setStatus("Added");
  } catch (err) {
    setStatus(`Error: ${err.message}`, "err");
  } finally {
    addBtn.disabled = false;
  }
});

newTitleEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addBtn.click();
});

refreshBtn.addEventListener("click", loadTasks);

findBtn.addEventListener("click", async () => {
  const id = Number.parseInt(findIdEl.value, 10);
  if (!id) {
    setStatus("Enter a valid ID.");
    findIdEl.focus();
    return;
  }

  try {
    setStatus("Fetching…");
    const task = await api(`/tasks/${id}`);
    findResultEl.textContent = JSON.stringify(task, null, 2);
    setStatus("Found");
  } catch (err) {
    findResultEl.textContent = "";
    setStatus(`Error: ${err.message}`, "err");
  }
});

findIdEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") findBtn.click();
});

window.toggleCompleted = async (id, current) => {
  try {
    setStatus("Updating…");
    await api(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ completed: !current }),
    });
    await loadTasks();
    setStatus("Updated");
  } catch (err) {
    setStatus(`Error: ${err.message}`, "err");
  }
};

window.updateTitle = async (id) => {
  const input = document.getElementById(`edit-${id}`);
  const title = input.value.trim();
  if (!title) {
    setStatus("Type a new title first.");
    input.focus();
    return;
  }

  try {
    setStatus("Renaming…");
    await api(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title }),
    });
    input.value = "";
    await loadTasks();
    setStatus("Renamed");
  } catch (err) {
    setStatus(`Error: ${err.message}`, "err");
  }
};

window.deleteTask = async (id) => {
  if (!confirm(`Delete task #${id}?`)) return;

  try {
    setStatus("Deleting…");
    await api(`/tasks/${id}`, { method: "DELETE" });
    await loadTasks();
    setStatus("Deleted");
  } catch (err) {
    setStatus(`Error: ${err.message}`, "err");
  }
};

loadTasks();
