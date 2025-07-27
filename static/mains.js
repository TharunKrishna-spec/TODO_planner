// ---------- USER AUTH ----------
let allTasks = [];
const taskList = document.getElementById("taskList");
const form = document.querySelector("form");
const searchInput = document.getElementById("search-tasks");
const filterSelect = document.getElementById("filter-priority");
const sortSelect = document.getElementById("sort-tasks");

const user = JSON.parse(localStorage.getItem("user"));
if (!user || !user.username) {
  window.location.href = "login.html";
}

// ---------- LOAD TASKS ----------
async function loadTasks() {
  try {
    const res = await fetch("http://localhost:5000/api/tasks", {
      headers: { "X-Username": user.username },
    });
    allTasks = await res.json();
    renderTasks();
  } catch (err) {
    console.error("Error loading tasks:", err);
  }
}

// ---------- RENDER TASKS ----------
function renderTasks() {
  const keyword = searchInput.value.toLowerCase();
  const filterPriority = filterSelect.value;
  const sortOption = sortSelect.value;

  let tasks = [...allTasks];

  // Search
  if (keyword) {
    tasks = tasks.filter(task => task.title.toLowerCase().includes(keyword));
  }

  // Filter
  if (filterPriority !== "All") {
    tasks = tasks.filter(task => task.priority === filterPriority);
  }

  // Sort
  if (sortOption === "asc") {
    tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  } else if (sortOption === "desc") {
    tasks.sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
  } else if (sortOption === "priority") {
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  // Render
  taskList.innerHTML = "";
  tasks.forEach(task => {
    const card = document.createElement("div");
    card.className = `task-card glassmorphism-card flex flex-col gap-4 border-l-4 p-5 ${
      task.priority === "High"
        ? "border-[var(--high-priority)]"
        : task.priority === "Medium"
        ? "border-[var(--medium-priority)]"
        : "border-[var(--low-priority)]"
    }`;

    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-xl font-bold ${task.is_completed ? "line-through text-gray-400" : ""}">${task.title}</h3>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">Due: ${task.deadline}</p>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" class="form-checkbox h-5 w-5" ${
            task.is_completed ? "checked" : ""
          } onchange="toggleComplete(${task.id}, this.checked)" />
        </div>
      </div>
      <p class="text-base ${task.is_completed ? "line-through" : ""}">${task.description}</p>
      <div class="mt-auto flex items-center justify-between pt-4">
        <span class="rounded-full px-3 py-1 text-xs font-semibold">${task.priority} Priority</span>
        <div class="flex gap-3">
          <button onclick="editTask(${task.id})">📝</button>
          <button onclick="deleteTask(${task.id})">❌</button>
        </div>
      </div>
    `;

    taskList.appendChild(card);
  });
}

// ---------- ADD TASK ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    title: document.getElementById("task-title").value,
    description: document.getElementById("task-description").value,
    priority: document.getElementById("task-priority").value,
    deadline: document.getElementById("task-deadline").value,
    is_completed: 0,
    username: user.username,
  };

  await fetch("http://localhost:5000/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  form.reset();
  loadTasks();
});

// ---------- DELETE TASK ----------
async function deleteTask(id) {
  await fetch(`http://localhost:5000/api/tasks/${id}`, {
    method: "DELETE",
  });
  loadTasks();
}

// ---------- TOGGLE COMPLETE ----------
async function toggleComplete(id, isCompleted) {
  const task = allTasks.find(t => t.id === id);
  if (!task) return;

  const updated = {
    ...task,
    is_completed: isCompleted ? 1 : 0,
  };

  await fetch(`http://localhost:5000/api/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updated),
  });
  task.is_completed = updated.is_completed;
  renderTasks();
}

// ---------- EDIT TASK PLACEHOLDER ----------
function editTask(id) {
  alert("Edit feature coming soon!");
}

// ---------- FILTER/SORT LISTENERS ----------
searchInput.addEventListener("input", renderTasks);
filterSelect.addEventListener("change", renderTasks);
sortSelect.addEventListener("change", renderTasks);

// ---------- INITIAL LOAD ----------
loadTasks();
