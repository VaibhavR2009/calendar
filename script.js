// Selectors
const monthYear = document.getElementById('month-year');
const daysContainer = document.getElementById('days');
const prevBtn = document.getElementById('prev-month');
const nextBtn = document.getElementById('next-month');

const dayModal = document.getElementById('day-modal');
const closeDayModalBtn = dayModal.querySelector('.close-button');
const selectedDateElem = document.getElementById('selected-date');
const dayView = document.getElementById('day-view');
const backButton = document.getElementById('back-button');

const taskModal = document.getElementById('task-modal');
const closeTaskModalBtn = taskModal.querySelector('.close-button');
const taskModalDate = document.getElementById('task-modal-date');
const taskModalTime = document.getElementById('task-modal-time');
const taskForm = document.getElementById('task-form');
const taskDescInput = document.getElementById('task-desc');
const taskRepeatSelect = document.getElementById('task-repeat');

const journalSidebar = document.getElementById('journal-sidebar');
const toggleJournalBtn = document.getElementById('toggle-journal');
const closeJournalBtn = document.getElementById('close-journal');
const journalText = document.getElementById('journal-text');

// Variables
let currentDate = new Date();
let selectedDate = null;
let selectedTime = null;

// Load tasks from localStorage or initialize
let tasks = JSON.parse(localStorage.getItem('tasks')) || {};

// Load recurring tasks from localStorage or initialize
let recurringTasks = JSON.parse(localStorage.getItem('recurringTasks')) || [];

// Load journal entry from localStorage or initialize
let journalEntry = localStorage.getItem('journalEntry') || '';
journalText.value = journalEntry;

// Functions

/**
 * Formats a date as YYYY-MM-DD
 * @param {number} year 
 * @param {number} month 
 * @param {number} day 
 * @returns {string}
 */
function formatDate(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Converts 24-hour time to 12-hour format with AM/PM
 * @param {string} time24 
 * @returns {string}
 */
function convertTo12Hour(time24) {
    const [hourStr, minute] = time24.split(':');
    let hour = parseInt(hourStr);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
}

/**
 * Renders the calendar for the current month and year
 * @param {Date} date 
 */
function renderCalendar(date) {
    daysContainer.innerHTML = '';
    const year = date.getFullYear();
    const month = date.getMonth();

    // Set month and year in header
    const options = { month: 'long', year: 'numeric' };
    monthYear.textContent = date.toLocaleDateString(undefined, options);

    // First day of the month
    const firstDay = new Date(year, month, 1).getDay();

    // Number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Previous month's days to fill the first week
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Total cells in the calendar (6 weeks)
    const totalCells = 42;

    for (let i = 0; i < totalCells; i++) {
        const dayElement = document.createElement('div');
        let dayNumber;

        if (i < firstDay) {
            // Days from previous month
            dayNumber = prevMonthDays - firstDay + i + 1;
            dayElement.classList.add('inactive');
            dayElement.textContent = dayNumber;
        } else if (i >= firstDay + daysInMonth) {
            // Days from next month
            dayNumber = i - firstDay - daysInMonth + 1;
            dayElement.classList.add('inactive');
            dayElement.textContent = dayNumber;
        } else {
            // Current month days
            dayNumber = i - firstDay + 1;
            const fullDate = formatDate(year, month + 1, dayNumber);
            dayElement.textContent = dayNumber;

            // Highlight today
            const today = new Date();
            if (
                dayNumber === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear()
            ) {
                dayElement.style.backgroundColor = '#a29bfe';
                dayElement.style.color = '#ffffff';
            }

            // Check if there are tasks for this day
            if (hasTasks(fullDate)) {
                dayElement.classList.add('has-task');
            }

            // Click event to open day modal
            dayElement.addEventListener('click', () => openDayModal(fullDate));
        }

        daysContainer.appendChild(dayElement);
    }
}

/**
 * Checks if a date has tasks (including recurring tasks)
 * @param {string} date 
 * @returns {boolean}
 */
function hasTasks(date) {
    // Check one-time tasks
    if (tasks[date] && Object.keys(tasks[date]).length > 0) {
        return true;
    }

    // Parse the date
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 (Sun) - 6 (Sat)
    const month = dateObj.getMonth() + 1; // Months are zero-based
    const day = dateObj.getDate();

    // Check recurring tasks
    for (let recurring of recurringTasks) {
        if (recurring.repeat === 'weekly') {
            if (recurring.dayOfWeek === dayOfWeek) {
                return true;
            }
        } else if (recurring.repeat === 'yearly') {
            if (recurring.month === month && recurring.day === day) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Opens the day modal for a specific date
 * @param {string} date 
 */
function openDayModal(date) {
    selectedDate = date;
    dayModal.style.display = 'block';
    selectedDateElem.textContent = `Tasks for ${date}`;
    renderDayView();
}

/**
 * Closes the day modal
 */
function closeDayModal() {
    dayModal.style.display = 'none';
    selectedDate = null;
}

/**
 * Renders the day view with time slots
 */
function renderDayView() {
    dayView.innerHTML = '';

    // Generate time slots (e.g., every hour)
    for (let hour = 0; hour < 24; hour++) {
        const time24 = `${String(hour).padStart(2, '0')}:00`;
        const time12 = convertTo12Hour(time24);

        const slotDiv = document.createElement('div');
        slotDiv.classList.add('time-slot');
        slotDiv.dataset.time = time24;

        const label = document.createElement('div');
        label.classList.add('time-label');
        label.textContent = time12;

        const taskList = document.createElement('div');
        taskList.classList.add('task-list');

        // Display one-time tasks
        if (tasks[selectedDate] && tasks[selectedDate][time24]) {
            tasks[selectedDate][time24].forEach((task, index) => {
                const taskDiv = document.createElement('div');
                taskDiv.classList.add('task');

                const taskDesc = document.createElement('span');
                taskDesc.textContent = task.desc ? `${task.desc}` : 'No Description';

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'X';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteTask(selectedDate, time24, index);
                });

                taskDiv.appendChild(taskDesc);
                taskDiv.appendChild(deleteBtn);
                taskList.appendChild(taskDiv);
            });
        }

        // Display recurring tasks
        recurringTasks.forEach((recurring, index) => {
            if (recurring.repeat === 'weekly') {
                if (recurring.dayOfWeek === new Date(selectedDate).getDay()) {
                    if (recurring.time === time24) {
                        const taskDiv = document.createElement('div');
                        taskDiv.classList.add('task', 'recurring');

                        const taskDesc = document.createElement('span');
                        taskDesc.textContent = recurring.desc ? `${recurring.desc} (Weekly)` : 'No Description (Weekly)';

                        const deleteBtn = document.createElement('button');
                        deleteBtn.textContent = 'X';
                        deleteBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            deleteRecurringTask(index);
                        });

                        taskDiv.appendChild(taskDesc);
                        taskDiv.appendChild(deleteBtn);
                        taskList.appendChild(taskDiv);
                    }
                }
            } else if (recurring.repeat === 'yearly') {
                const dateObj = new Date(selectedDate);
                if (recurring.month === (dateObj.getMonth() + 1) && recurring.day === dateObj.getDate()) {
                    if (recurring.time === time24) {
                        const taskDiv = document.createElement('div');
                        taskDiv.classList.add('task', 'recurring');

                        const taskDesc = document.createElement('span');
                        taskDesc.textContent = recurring.desc ? `${recurring.desc} (Yearly)` : 'No Description (Yearly)';

                        const deleteBtn = document.createElement('button');
                        deleteBtn.textContent = 'X';
                        deleteBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            deleteRecurringTask(index);
                        });

                        taskDiv.appendChild(taskDesc);
                        taskDiv.appendChild(deleteBtn);
                        taskList.appendChild(taskDiv);
                    }
                }
            }
        });

        slotDiv.appendChild(label);
        slotDiv.appendChild(taskList);

        // Click event to add task
        slotDiv.addEventListener('click', () => openTaskModal(time24));

        dayView.appendChild(slotDiv);
    }
}

/**
 * Opens the task modal for adding a task
 * @param {string} time24 
 */
function openTaskModal(time24) {
    selectedTime = time24;
    taskModal.style.display = 'block';
    taskModalDate.textContent = `Date: ${selectedDate}`;
    taskModalTime.textContent = `Time: ${convertTo12Hour(time24)}`;
    taskDescInput.value = '';
    taskRepeatSelect.value = 'none';
}

/**
 * Closes the task modal
 */
function closeTaskModal() {
    taskModal.style.display = 'none';
    selectedTime = null;
}

/**
 * Adds a task to the selected date and time
 * @param {Event} e 
 */
function addTask(e) {
    e.preventDefault();
    const desc = taskDescInput.value.trim();
    const repeat = taskRepeatSelect.value;

    if (!selectedDate || !selectedTime) return;

    if (repeat === 'none') {
        // Add one-time task
        if (!tasks[selectedDate]) {
            tasks[selectedDate] = {};
        }

        if (!tasks[selectedDate][selectedTime]) {
            tasks[selectedDate][selectedTime] = [];
        }

        tasks[selectedDate][selectedTime].push({ desc: desc });
    } else if (repeat === 'weekly') {
        // Add recurring weekly task
        const dayOfWeek = new Date(selectedDate).getDay(); // 0 (Sun) - 6 (Sat)
        recurringTasks.push({
            dayOfWeek: dayOfWeek,
            time: selectedTime,
            desc: desc,
            repeat: 'weekly'
        });
    } else if (repeat === 'yearly') {
        // Add recurring yearly task
        const dateObj = new Date(selectedDate);
        const month = dateObj.getMonth() + 1; // Months are zero-based
        const day = dateObj.getDate();
        recurringTasks.push({
            month: month,
            day: day,
            time: selectedTime,
            desc: desc,
            repeat: 'yearly'
        });
    }

    saveTasks();
    saveRecurringTasks();
    renderDayView();
    renderCalendar(currentDate);
    taskForm.reset();
    closeTaskModal();
}

/**
 * Deletes a one-time task
 * @param {string} date 
 * @param {string} time 
 * @param {number} index 
 */
function deleteTask(date, time, index) {
    if (tasks[date] && tasks[date][time]) {
        tasks[date][time].splice(index, 1);
        if (tasks[date][time].length === 0) {
            delete tasks[date][time];
        }
        if (Object.keys(tasks[date]).length === 0) {
            delete tasks[date];
        }
        saveTasks();
        renderDayView();
        renderCalendar(currentDate);
    }
}

/**
 * Deletes a recurring task
 * @param {number} index 
 */
function deleteRecurringTask(index) {
    if (index >= 0 && index < recurringTasks.length) {
        recurringTasks.splice(index, 1);
        saveRecurringTasks();
        renderDayView();
        renderCalendar(currentDate);
    }
}

/**
 * Saves one-time tasks to localStorage
 */
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

/**
 * Saves recurring tasks to localStorage
 */
function saveRecurringTasks() {
    localStorage.setItem('recurringTasks', JSON.stringify(recurringTasks));
}

/**
 * Changes the current month by delta
 * @param {number} delta 
 */
function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar(currentDate);
}

// Event Listeners
prevBtn.addEventListener('click', () => changeMonth(-1));
nextBtn.addEventListener('click', () => changeMonth(1));

closeDayModalBtn.addEventListener('click', closeDayModal);
backButton.addEventListener('click', closeDayModal);

closeTaskModalBtn.addEventListener('click', closeTaskModal);
window.addEventListener('click', (e) => {
    if (e.target == dayModal) {
        closeDayModal();
    }
    if (e.target == taskModal) {
        closeTaskModal();
    }
});

// Journal Functionality

/**
 * Toggles the journal sidebar open and closed
 */
function toggleJournal() {
    journalSidebar.classList.toggle('open');
}

/**
 * Saves the journal entry to localStorage
 */
function saveJournal() {
    const content = journalText.value;
    localStorage.setItem('journalEntry', content);
}

// Event Listeners for Journal
toggleJournalBtn.addEventListener('click', toggleJournal);
closeJournalBtn.addEventListener('click', toggleJournal);
journalText.addEventListener('input', saveJournal);

// Initial render
renderCalendar(currentDate);
