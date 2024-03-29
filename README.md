# Real-Time Chat Messenger Documentation

## Introduction
This documentation provides an overview and guide for the implementation of an online real-time chat messenger using Socket.IO, HTML, CSS, and JavaScript. The server-side is built with Node.js, Express.js, Socket.IO, and other supporting libraries. The project is licensed under the ISC license.

## Prerequisites
Before proceeding with the setup and implementation, ensure that you have the following components installed:
- Node.js (version v18.19.0 or higher)
- npm (Node Package Manager)

## Installation
1. Clone the project repository from [GitHub](https://github.com/TemurEShtemirov/socket-io).
2. Navigate to the project directory using the command line.
3. Run the following command to install the required dependencies:
   ````
   npm install
   ```

## Configuration
1. Create a `.env` file in the project root directory.
2. Configure the following environment variables in the `.env` file:
   - `PORT`: The port number on which the server will run.
   - `HOST`: The host address of the PostgreSQL database.
   - `DBPORT`: The port number of the PostgreSQL database.
   - `DBNAME`: The name of the PostgreSQL database.
   - `USERNAME`: The username for connecting to the PostgreSQL database.
   - `DBPASS`: The password for connecting to the PostgreSQL database.
   - Other configuration variables specific to your project.

## Usage
1. Start the server by running the following command:
   ````
   npm start
   ```
2. Open your web browser and navigate to the specified address (e.g., `http://localhost:PORT`).
3. You should now see the real-time chat messenger interface.
4. Enter your desired username and start sending and receiving messages in real-time.

## File Structure
The project's file structure is organized as follows:
- `public/` - Contains static assets such as CSS and client-side JavaScript . Contains HTML templates for rendering server-side pages.
- `src/` - Contains server-side JavaScript files.
  - `index.js` - The main entry point for the server application.
  - Other supporting files.

## Additional Resources
Refer to the official documentation and resources below for further assistance:
- [Socket.IO Documentation](https://socket.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Documentation](https://nodejs.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/)

## License
This project is licensed under the ISC License. See the