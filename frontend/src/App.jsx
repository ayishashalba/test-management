import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000/api";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");

  const [assignedTo, setAssignedTo] = useState("");

  const api = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` }
  });

  const register = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API}/auth/register`, {
        email,
        password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setToken(res.data.token);
      setUser(res.data.user);

    } catch {
      alert("Invalid login details");
    }
  };
  const login = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API}/auth/login`, {
        email,
        password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setToken(res.data.token);
      setUser(res.data.user);

    } catch {
      alert("Invalid login details");
    }
  };

  const loadTasks = async () => {
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);
    } catch {
      alert("Unable to load tasks");
    }
  };

  useEffect(() => {
    if (token) loadTasks();
  }, [token]);

  const addTask = async (e) => {
    e.preventDefault();

    try {
      await api.post("/tasks", {
        title,
        description,
        dueDate,
        priority,
        assignedTo: assignedTo || undefined
      });

      setTitle("");
      setDescription("");
      setDueDate("");
      setAssignedTo("");

      loadTasks();

    } catch {
      alert("Task creation failed");
    }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/tasks/${id}`, { status });
    loadTasks();
  };

  const deleteTask = async (id) => {
    if (window.confirm("Delete this task?")) {
      await api.delete(`/tasks/${id}`);
      loadTasks();
    }
  };

  const logout = () => {
    localStorage.clear();
    setToken("");
    setUser(null);
    setTasks([]);
  };


  if (!token) {
    return (
      <div className="Register">
        <h1>TaskFlow</h1>
        <h2>Register</h2>

        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            await axios.post(`${API}/auth/register`, {
              name: e.target.name.value,
              email: e.target.email.value,
              password: e.target.password.value
            });
            alert("Registered successfully. Please login.");
          } catch {
            alert("Registration failed");
          }
        }}>
          <input placeholder="Name" name="name" required />
          <input placeholder="Email" type="email" name="email" required />
          <input placeholder="Password" type="password" name="password" required />
          <button>Register</button>
        </form>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login">
        <form onSubmit={login}>
          <h1>TaskFlow</h1>
          <h2>Login</h2>

          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button>Login</button>
        </form>
      </div>
    );
  }

  const canManage = ["Admin", "Manager"].includes(user?.role);

  return (
    <div className="dashboard">
      <header>
        <h1>TaskFlow</h1>
        <div>
          <span>{user?.name} ({user?.role})</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <h2>Dashboard</h2>

      <div className="stats">
        <div>Total Tasks: {tasks.length}</div>
        <div>Pending: {tasks.filter(t => t.status === "Pending").length}</div>
        <div>In Progress: {tasks.filter(t => t.status === "In Progress").length}</div>
        <div>Completed: {tasks.filter(t => t.status === "Completed").length}</div>
      </div>

      {canManage && (
        <form className="task-form" onSubmit={addTask}>
          <h2>Create New Task</h2>

          <input
            placeholder="Task Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <input
            placeholder="Assigned User ID"
            value={assignedTo}
            onChange={e => setAssignedTo(e.target.value)}
          />

          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />

          <button>Create Task</button>
        </form>
      )}

      <h2>Task List</h2>

      <div className="task-list">
        {tasks.map(task => (
          <div className="task-card" key={task._id}>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <p>Priority: {task.priority}</p>
            <p>Due: {task.dueDate?.slice(0, 10) || "Not set"}</p>

            <select
              value={task.status}
              onChange={e => updateStatus(task._id, e.target.value)}
            >
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>

            {canManage && (
              <button onClick={() => deleteTask(task._id)}>
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;