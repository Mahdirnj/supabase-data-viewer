// Set the backend API URL
const API_URL = 'http://localhost:3000/api';

// Check if jQuery is loaded, if not, load it
if (typeof jQuery === 'undefined') {
    console.log('Loading jQuery...');
    const script = document.createElement('script');
    script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
    script.integrity = 'sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=';
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
}

// Check if Persian datepicker is loaded, if not, load it
if (typeof persianDatepicker === 'undefined') {
    console.log('Loading Persian datepicker...');
    
    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/persian-datepicker@1.2.0/dist/css/persian-datepicker.min.css';
    document.head.appendChild(link);
    
    // Load JS
    const script1 = document.createElement('script');
    script1.src = 'https://unpkg.com/persian-date@1.1.0/dist/persian-date.min.js';
    document.head.appendChild(script1);
    
    script1.onload = function() {
        const script2 = document.createElement('script');
        script2.src = 'https://unpkg.com/persian-datepicker@1.2.0/dist/js/persian-datepicker.min.js';
        document.head.appendChild(script2);
    };
}

// Global event handler for calendar icon buttons
document.addEventListener('click', function(e) {
    if (e.target.closest('.calendar-icon-btn')) {
        const button = e.target.closest('.calendar-icon-btn');
        const input = button.previousElementSibling;
        if (input && input.classList.contains('persian-date')) {
            window.showJalaliDatepicker(input);
        }
    }
});

// Global click handler to clean up datepickers
document.addEventListener('click', function(e) {
    // If clicking outside a datepicker, remove any existing ones
    if (!e.target.closest('.datepicker-container') && 
        !e.target.classList.contains('persian-date') && 
        !e.target.closest('.calendar-icon-btn')) {
        
        const existingPickers = document.querySelectorAll('.datepicker-container');
        existingPickers.forEach(picker => {
            picker.remove();
        });
        
        // Also remove overlay
        const overlay = document.querySelector('.datepicker-overlay');
        if (overlay) overlay.remove();
    }
});

// Helper function to show Jalali datepicker
window.showJalaliDatepicker = function(inputElement) {
    // Remove any existing datepickers first
    const existingPickers = document.querySelectorAll('.datepicker-container');
    existingPickers.forEach(picker => picker.remove());
    
    // Remove any existing overlays
    const existingOverlays = document.querySelectorAll('.datepicker-overlay');
    existingOverlays.forEach(overlay => overlay.remove());
    
    // Create overlay to catch clicks outside the datepicker
    const overlay = document.createElement('div');
    overlay.className = 'datepicker-overlay';
    document.body.appendChild(overlay);
    
    // Create container for the datepicker
    const container = document.createElement('div');
    container.className = 'datepicker-container';
    document.body.appendChild(container);
    
    // Position the container near the input
    const inputRect = inputElement.getBoundingClientRect();
    container.style.position = 'absolute';
    container.style.top = `${inputRect.bottom + window.scrollY + 5}px`;
    container.style.left = `${inputRect.left + window.scrollX}px`;
    container.style.zIndex = '1000';
    
    // Create a temporary input inside the container
    const tempInput = document.createElement('input');
    tempInput.type = 'text';
    tempInput.className = 'datepicker-temp-input';
    container.appendChild(tempInput);
    
    // Initialize the datepicker on the temp input
    $(tempInput).persianDatepicker({
        format: 'YYYY/MM/DD',
        autoClose: true,
        initialValue: inputElement.value ? true : false,
        initialValueType: 'persian',
        altField: inputElement,
        onSelect: function(unix) {
            // Format the date and set it to the original input
            const date = new persianDate(unix);
            inputElement.value = date.format('YYYY/MM/DD');
            
            // Remove the datepicker and overlay
            container.remove();
            overlay.remove();
            
            // Trigger change event on the original input
            const event = new Event('change', { bubbles: true });
            inputElement.dispatchEvent(event);
        }
    });
    
    // If the input already has a value, set it in the datepicker
    if (inputElement.value) {
        try {
            const parts = inputElement.value.split('/');
            if (parts.length === 3) {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // Months are 0-indexed
                const day = parseInt(parts[2]);
                
                const date = new persianDate([year, month, day]);
                $(tempInput).persianDatepicker('setDate', date.valueOf());
            }
        } catch (e) {
            console.error('Error setting initial date:', e);
        }
    }
    
    // Open the datepicker immediately
    $(tempInput).persianDatepicker('show');
};

// Function to initialize Persian datepickers
function initializePersianDatepickers() {
    // Note: Non-edit mode functionality was removed as it's now handled by the global event handler
    // and the showJalaliDatepicker function
}

// Data storage
let professorsData = [];
let itCoursesData = [];
let fileLinksData = [];
let eventsData = [];

// Define which fields are editable for each table
const editableFields = {
    professors: ['Name', 'Family', 'Email', 'Phone', 'Degree', 'Field', 'University', 'Rank', 'Status'],
    itcourses: ['Name', 'Unit', 'Type', 'Prerequisite', 'Corequisite', 'Professor_id', 'Semester', 'Status'],
    file_link: ['Name', 'Link', 'Course_id', 'Status'],
    events: ['Title', 'Start_date', 'Finish_date', 'Start_Hour', 'Description', 'Status']
};

// Define required fields for each table
const requiredFields = {
    professors: ['Name', 'Family', 'Email'],
    itcourses: ['Name', 'Unit', 'Type'],
    file_link: ['Name', 'Link', 'Course_id'],
    events: ['Title', 'Start_date']
};

// State variables
let currentEditingRow = null;
let isAddingNewRow = false;

// DOM elements
const tabButtons = document.querySelectorAll('.tab-button');
const editToggles = document.querySelectorAll('.edit-toggle');
const addRowBtns = document.querySelectorAll('.add-row-btn');
const deleteSelectedBtns = document.querySelectorAll('.delete-selected-btn');
const selectAllCheckboxes = document.querySelectorAll('.select-all-checkbox');

// Track selected rows for each table
const selectedRows = {
    professors: new Set(),
    itcourses: new Set(),
    file_link: new Set(),
    events: new Set()
};

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    htmlElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';
}

// Theme toggle event listener
themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        htmlElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        htmlElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
});

// Event listeners for tab switching
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Skip if already active
        if (button.classList.contains('active')) return;
        
        // Cancel any editing mode if switching tabs
        cancelEditing();
        
        const tabId = button.getAttribute('data-tab');
        const activePane = document.getElementById(tabId);
        const currentActive = document.querySelector('.tab-pane.active');
        
        // Remove active class from all buttons
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.style.transform = '';
        });
        
        // Add active class to clicked button
        button.classList.add('active');
        button.style.transform = 'translateY(-2px)';
        
        // Handle tab content switching with smooth transition
        if (currentActive) {
            // Fade out current tab
            currentActive.style.opacity = '0';
            currentActive.style.transform = 'translateY(10px)';
            
            // After animation completes, hide current and show new tab
            setTimeout(() => {
                currentActive.classList.remove('active');
                activePane.classList.add('active');
                
                // Trigger layout recalculation before fading in
                setTimeout(() => {
                    activePane.style.opacity = '1';
                    activePane.style.transform = 'translateY(0)';
                }, 20);
            }, 300);
        } else {
            // First time loading, just show the selected tab
            activePane.classList.add('active');
            activePane.style.opacity = '1';
            activePane.style.transform = 'translateY(0)';
        }
    });
});

// Event listeners for edit mode toggle switches
editToggles.forEach(toggle => {
    toggle.addEventListener('change', () => {
        const tableId = toggle.getAttribute('data-table');
        const table = document.getElementById(`${tableId}-table`);
        const addBtn = document.querySelector(`.add-row-btn[data-table="${tableId}"]`);
        const deleteBtn = document.querySelector(`.delete-selected-btn[data-table="${tableId}"]`);
        const actionsPanel = document.getElementById(`${tableId}-actions`);
        const selectAllCheckbox = document.querySelector(`.select-all-checkbox[data-table="${tableId}"]`);
        const checkboxes = table.querySelectorAll('.row-checkbox');
        
        if (toggle.checked) {
            // Enter edit mode
            table.classList.add('edit-mode');
            addBtn.style.display = 'flex';
            deleteBtn.style.display = 'flex';
            actionsPanel.classList.add('visible');
            document.body.classList.add('edit-mode-active');
            selectAllCheckbox.style.display = 'block';
            
            // Show all checkboxes
            checkboxes.forEach(checkbox => {
                checkbox.style.display = 'block';
            });
            
            // Clear any previous selections
            clearSelections(tableId);
            
            // Make cells editable
            setupEditableTable(tableId);
            
            // Check if floating buttons should be visible
            setTimeout(checkFloatingButtonsVisibility, 100);
        } else {
            // Exit edit mode - Ensure all editing is canceled
            // Cancel any active editing
            cancelEditing();
            
            // Remove the edit-mode class from the table
            table.classList.remove('edit-mode');
            
            // Hide action buttons
            addBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
            actionsPanel.classList.remove('visible');
            selectAllCheckbox.style.display = 'none';
            
            // Hide checkboxes
            checkboxes.forEach(checkbox => {
                checkbox.style.display = 'none';
            });
            
            // Clear selections
            clearSelections(tableId);
            
            // Hide floating buttons
            const floatingButtons = document.getElementById(`${tableId}-floating-buttons`);
            if (floatingButtons) floatingButtons.classList.remove('visible');
            
            // Important: Remove double-click handlers from rows
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                // Clone the row to remove all event listeners
                const newRow = row.cloneNode(true);
                row.parentNode.replaceChild(newRow, row);
            });
            
            // Force the table to refresh to ensure clean data
            if (tableId === 'professors') {
                renderTable(professorsData, '#professors-table');
            } else if (tableId === 'itcourses') {
                renderTable(itCoursesData, '#itcourses-table');
            } else if (tableId === 'file_link') {
                renderTable(fileLinksData, '#file_link-table');
            } else if (tableId === 'events') {
                renderTable(eventsData, '#events-table');
            }
            
            // Check if any table is still in edit mode before removing body class
            const anyTableInEditMode = document.querySelectorAll('table.edit-mode').length > 0;
            if (!anyTableInEditMode) {
                document.body.classList.remove('edit-mode-active');
            }
        }
    });
});

// Add event listeners for add row buttons
addRowBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tableId = btn.getAttribute('data-table');
        addNewRow(tableId);
    });
});

// Add event listeners for search inputs
document.getElementById('professors-search').addEventListener('input', e => {
    const searchTerm = e.target.value.toLowerCase();
    filterTable(professorsData, searchTerm, '#professors-table');
});

document.getElementById('itcourses-search').addEventListener('input', e => {
    const searchTerm = e.target.value.toLowerCase();
    filterTable(itCoursesData, searchTerm, '#itcourses-table');
});

document.getElementById('file_link-search').addEventListener('input', e => {
    const searchTerm = e.target.value.toLowerCase();
    filterTable(fileLinksData, searchTerm, '#file_link-table');
});

// Function to setup editable table
function setupEditableTable(tableId) {
    const table = document.getElementById(`${tableId}-table`);
    const rows = table.querySelectorAll('tbody tr');
    const actionsPanel = document.getElementById(`${tableId}-actions`);
    
    // Clear the actions panel
    actionsPanel.innerHTML = '';
    
    // Use event delegation to add double-click events to the table body
    const tbody = table.querySelector('tbody');
    tbody.addEventListener('dblclick', function(e) {
        // Find the closest tr to the clicked element
        const row = e.target.closest('tr');
        if (!row) return;
        
        // First check if edit mode is still active
        const editToggle = document.querySelector(`.edit-toggle[data-table="${tableId}"]`);
        if (!editToggle || !editToggle.checked) {
            console.log("Edit mode is off, ignoring double-click");
            return; // Don't allow editing if edit mode is off
        }
        
        if (currentEditingRow && currentEditingRow !== row) {
            // Cancel previous editing if a different row is clicked
            cancelEditing();
        }
        
        if (!row.classList.contains('editing')) {
            makeRowEditable(row, tableId);
        }
    });
    
    rows.forEach((row, index) => {
        // Create action buttons for this row (only save/cancel when editing)
        const rowActions = document.createElement('div');
        rowActions.className = 'row-actions';
        rowActions.setAttribute('data-row-id', index);
        
        // Initially empty, will be populated when row enters edit mode
        actionsPanel.appendChild(rowActions);
        
        // Add checkbox click handler
        const checkbox = row.querySelector('.row-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                const rowId = row.querySelector('td:nth-child(2)').textContent.trim();
                
                if (this.checked) {
                    // Add to selected
                    if (rowId && rowId !== 'Auto') {
                        selectedRows[tableId].add(parseInt(rowId));
                        row.classList.add('selected');
                    }
                } else {
                    // Remove from selected
                    if (rowId && rowId !== 'Auto') {
                        selectedRows[tableId].delete(parseInt(rowId));
                        row.classList.remove('selected');
                    }
                    
                    // Uncheck select all if any row is unchecked
                    const selectAllCheckbox = document.querySelector(`.select-all-checkbox[data-table="${tableId}"]`);
                    selectAllCheckbox.checked = false;
                }
                
                // Update delete button state
                const deleteBtn = document.querySelector(`.delete-selected-btn[data-table="${tableId}"]`);
                deleteBtn.disabled = selectedRows[tableId].size === 0;
            });
        }
    });
    
    // Ensure action panel stays in sync with table rows
    const tableContainer = table.closest('.table-container');
    if (tableContainer) {
        tableContainer.addEventListener('scroll', function() {
            // Sync scrollTop between table container and action panel
            if (actionsPanel) {
                actionsPanel.style.marginTop = `-${tableContainer.scrollTop}px`;
            }
        });
    }
}

// Function to make a row editable - Add check for edit mode
function makeRowEditable(row, tableId) {
    // Check if edit mode is still active
    const editToggle = document.querySelector(`.edit-toggle[data-table="${tableId}"]`);
    if (!editToggle || !editToggle.checked) {
        console.log("Edit mode is off, canceling edit operation");
        return; // Don't allow editing if edit mode is off
    }

    // Set as current editing row
    currentEditingRow = row;
    
    // Add editing class to the row
    row.classList.add('editing');
    
    // Get all editable cells
    const cells = Array.from(row.cells);
    const rowData = {};
    
    // Get the actual row index, accounting for any filtered/hidden rows
    const visibleRows = Array.from(row.parentNode.querySelectorAll('tr:not(.filtered)'));
    const rowIndex = visibleRows.indexOf(row);
    
    // Update action buttons in the action panel
    const actionsPanel = document.getElementById(`${tableId}-actions`);
    
    // Clear any existing action buttons first
    const allRowActions = actionsPanel.querySelectorAll('.row-actions');
    allRowActions.forEach(actions => {
        actions.innerHTML = '';
    });
    
    // Find the corresponding action buttons container for this row
    let actionButtons = actionsPanel.querySelector(`.row-actions[data-row-id="${rowIndex}"]`);
    
    // If we can't find an exact match, create a new one
    if (!actionButtons) {
        actionButtons = document.createElement('div');
        actionButtons.className = 'row-actions';
        actionButtons.setAttribute('data-row-id', rowIndex);
        actionsPanel.appendChild(actionButtons);
    }
    
    // Update action buttons
    actionButtons.innerHTML = `
        <button class="action-btn save-btn" title="Save">
            <i class="fas fa-check"></i>
        </button>
        <button class="action-btn cancel-btn" title="Cancel">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add event listeners to new buttons
    const saveBtn = actionButtons.querySelector('.save-btn');
    const cancelBtn = actionButtons.querySelector('.cancel-btn');
    
    saveBtn.addEventListener('click', function() {
        saveRow(row, tableId);
    });
    
    cancelBtn.addEventListener('click', function() {
        cancelEditing();
    });
    
    // Store original values and make cells editable
    cells.forEach((cell, index) => {
        // Skip checkbox cell
        if (index === 0) return;
        
        const headerCell = row.parentElement.parentElement.querySelector('th:nth-child(' + (index + 1) + ')');
        
        if (!headerCell) return;
        
        const fieldName = headerCell.getAttribute('data-sort');
        
        if (fieldName === 'id' || !editableFields[tableId].includes(fieldName)) {
            // ID field or other non-editable field
            rowData[fieldName] = cell.textContent.trim();
            return;
        }
        
        // Make this cell editable
        cell.classList.add('editable', 'editing');
        let originalValue = cell.textContent.trim();
        rowData[fieldName] = originalValue;
        
        // For events table date fields, use Persian datepicker
        if (tableId === 'events' && (fieldName === 'Start_date' || fieldName === 'Finish_date')) {
            // Create input element and add it to the cell with a calendar icon button (more clickable)
            cell.innerHTML = `
                <div class="date-input-container">
                    <input type="text" class="edit-input persian-date" value="${originalValue}" data-field="${fieldName}" data-original="${originalValue}" readonly>
                    <button type="button" class="calendar-icon-btn"><i class="fas fa-calendar-alt"></i></button>
                </div>
            `;
            
            // Get elements
            const dateInput = cell.querySelector('.persian-date');
            const calendarBtn = cell.querySelector('.calendar-icon-btn');
            
            // Add click handlers for both input and button
            dateInput.addEventListener('click', function() {
                window.showJalaliDatepicker(this);
            });
            
            calendarBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.showJalaliDatepicker(dateInput);
            });
            
        } else if (tableId === 'events' && fieldName === 'Start_Hour') {
            // For time fields, use time input
            cell.innerHTML = `<input type="time" class="edit-input" value="${originalValue}" data-field="${fieldName}" data-original="${originalValue}">`;
        } else {
            // Regular text input for other fields
            cell.innerHTML = `<input type="text" class="edit-input" value="${originalValue}" data-field="${fieldName}" data-original="${originalValue}">`;
        }
        
        // Focus on the first editable cell
        if (cells.indexOf(cell) === 2) {  // Name field (after checkbox and id)
            cell.querySelector('input').focus();
        }
    });
    
    // Store the original data on the row
    row.dataset.original = JSON.stringify(rowData);
    
    // Scroll to make the row visible if needed
    const tableContainer = row.closest('.table-container');
    if (tableContainer) {
        const rowRect = row.getBoundingClientRect();
        const containerRect = tableContainer.getBoundingClientRect();
        
        if (rowRect.bottom > containerRect.bottom || rowRect.top < containerRect.top) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}