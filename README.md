# Sage - Real-Time Quiz Hosting Application

## Overview
Sage is a real-time quiz hosting application that allows users to create, manage, and participate in quizzes. The application is designed to provide an interactive and engaging experience for users, leveraging WebSocket technology for real-time updates.

## Features
- Create and manage quizzes
- User registration and authentication
- Real-time quiz participation
- Dynamic question handling
- User-friendly interface

## Directory Structure
```
sage
├── src
│   ├── server.ts
│   ├── controllers
│   │   ├── quizController.ts
│   │   └── userController.ts
│   ├── routes
│   │   ├── quizRoutes.ts
│   │   └── userRoutes.ts
│   ├── models
│   │   ├── Quiz.ts
│   │   ├── User.ts
│   │   └── Question.ts
│   ├── services
│   │   ├── quizService.ts
│   │   └── socketService.ts
│   ├── types
│   │   └── index.ts
│   └── utils
│       └── helpers.ts
├── client
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── tests
│   ├── quiz.test.ts
│   └── user.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/sage.git
   ```
2. Navigate to the project directory:
   ```
   cd sage
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage
1. Start the server:
   ```
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000` to access the quiz application.

## Testing
To run the tests, use the following command:
```
npm test
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.