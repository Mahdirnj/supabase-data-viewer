# Supabase Data Viewer

A modern web application for viewing, managing, and interacting with various academic data stored in Supabase. This project provides an intuitive interface for handling professor information, IT courses, file links, and academic events.

## Features

- **User Authentication** - Secure login system using Supabase Auth
- **Dark/Light Mode** - Toggle between visual themes based on preference
- **Real-time Data Management** - View, add, edit, and delete data with immediate updates
- **Sortable Tables** - Sort data by any column for easy organization
- **Search Functionality** - Quickly find specific information across all tables
- **Responsive Design** - Works seamlessly on both desktop and mobile devices
- **Persian Date Support** - Includes Persian (Jalali) date picker for event dates

## Tables/Data Categories

1. **Professors** - Manage faculty information including departments, contact details, and office locations
2. **IT Courses** - Track course information including codes, instructors, schedules, and prerequisites
3. **File Links** - Store and access important document links
4. **Events** - Manage academic events with dates, locations, and descriptions

## Technical Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js server (local API)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Date Handling**: Persian Datepicker
- **UI Components**: Font Awesome, custom CSS

## Getting Started

1. Clone this repository
2. Set up a Supabase project and configure your API keys
3. Update the `API_URL` in `script.js` to point to your backend service
4. Start your local server for the backend API
5. Open `index.html` in a browser or deploy to your preferred hosting service

## Project Structure

- `index.html` - Main application page
- `login.html` - Authentication page
- `style.css` - Main styling
- `login.css` - Login page styling
- `script.js` - Core application logic
- `login.js` - Authentication logic
- `backend/` - Backend API code