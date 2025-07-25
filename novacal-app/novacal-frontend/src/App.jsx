// novacal-app/frontend/src/App.jsx
import React, { useState } from 'react';
import CalendarView from './components/CalendarView';

function App() {
  const [viewType, setViewType] = useState(7); // Default to 7-day view
  const [tasks, setTasks] = useState([]); // This will store your tasks

  // Function to add a new task (called from CalendarView)
  const addNewTask = (newTask) => {
    console.log("Adding new task:", newTask);
    setTasks((prevTasks) => [...prevTasks, newTask]);
    // In a real app, you'd send this to your Flask backend here
    // fetch('/api/tasks', { method: 'POST', body: JSON.stringify(newTask) })
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800">NovaCal</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewType(3)}
            className={`px-4 py-2 rounded-lg text-lg font-semibold ${
              viewType === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            3 Day
          </button>
          <button
            onClick={() => setViewType(5)}
            className={`px-4 py-2 rounded-lg text-lg font-semibold ${
              viewType === 5 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            5 Day
          </button>
          <button
            onClick={() => setViewType(7)}
            className={`px-4 py-2 rounded-lg text-lg font-semibold ${
              viewType === 7 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            7 Day
          </button>
        </div>
      </header>

      <main className="bg-white rounded-lg shadow-xl p-6">
        <CalendarView viewType={viewType} tasks={tasks} onAddTask={addNewTask} />
      </main>

      {/* Optional: Display current tasks for debugging */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Current Tasks:</h2>
        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(tasks, null, 2)}</pre>
      </div>
    </div>
  );
}

export default App;