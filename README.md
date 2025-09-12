## Description

This project is an API Performance Analyser built with NestJS. It provides tools to create and run performance tests using k6, and analyze the results.

## Project Setup

To set up the project, follow these steps:

1.  **Install Dependencies**:
    ```bash
    $ npm install
    ```

2.  **Build the Application and Copy Templates**:
    This command compiles the TypeScript code and copies the necessary k6 templates to the `dist` directory.
    ```bash
    $ npm run build && npm run copy-templates
    ```

## Running the Application

You can run the application in different modes:

*   **Development Mode (with watch)**:
    ```bash
    $ npm run start:dev
    ```

*   **Production Mode**:
    First, build the application (as shown in "Project Setup" step 2), then run the compiled JavaScript:
    ```bash
    $ node dist/main.js
    ```

## Swagger API Documentation

Once the application is running, you can access the interactive API documentation provided by Swagger at:
`http://localhost:3000/api` (assuming the application is running on port 3000).

## Running Tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
