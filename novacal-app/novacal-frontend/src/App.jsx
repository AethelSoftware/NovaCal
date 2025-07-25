import React, { useState } from 'react';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('');
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddTask = () => {
    if (newTaskName && newTaskDuration) {
      setTasks([...tasks, { name: newTaskName, duration: parseInt(newTaskDuration) }]);
      setNewTaskName('');
      setNewTaskDuration('');
    }
  };

  const handleSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/schedule', { // This hits the Vite proxy, then Flask
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setScheduledTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className='text-blue-300'>Calendar Scheduler</h1>

      <h2>Add Tasks</h2>
      <div>
        <input
          type="text"
          placeholder="Task Name"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Duration (minutes)"
          value={newTaskDuration}
          onChange={(e) => setNewTaskDuration(e.target.value)}
        />
        <button onClick={handleAddTask}>Add Task</button>
      </div>

      <h3>Current Tasks:</h3>
      <ul>
        {tasks.map((task, index) => (
          <li key={index}>
            {task.name} ({task.duration} mins)
          </li>
        ))}
      </ul>

      <button onClick={handleSchedule} disabled={loading || tasks.length === 0}>
        {loading ? 'Scheduling...' : 'Run Scheduling Algorithm'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <h2>Scheduled Calendar:</h2>
      {scheduledTasks.length > 0 ? (
        <ul>
          {scheduledTasks.map((task) => (
            <li key={task.id}>
              {task.name}: {task.start_time} (Duration: {task.duration} mins)
            </li>
          ))}
        </ul>
      ) : (
        <p>No tasks scheduled yet.</p>
      )}
    </div>
  );
}

export default App;