const { getTodos, addTodo, getTodoByTitle, updateTodo, deleteTodo } = require('./controller.js');

// Lambda handler
exports.handler = async (event) => {
    // Extract HTTP method and path from the event
    const httpMethod = event.httpMethod;
    const path = event.path || ''; 

    const body = event.body ? JSON.parse(event.body) : {};
    const pathParts = path.split('/').filter(Boolean);
    const title = pathParts.length > 1 ? decodeURIComponent(pathParts[1]) : null;

    // Prepare logging information including type of httpMethod
    const logInfo = {
        httpMethod,
        httpMethodType: typeof httpMethod,
        path,
        pathParts,
        title,
        body
    };

    // Debugging information
    console.log(`HTTP Method Type: ${typeof httpMethod}`);
    console.log(`HTTP Method: ${httpMethod}`);
    console.log(`Path: ${path}`);
    console.log(`Path Parts: ${JSON.stringify(pathParts)}`);
    console.log(`Title: ${title}`);
    console.log(`Body: ${JSON.stringify(body)}`);

    let response;

    try {
        if (httpMethod === 'GET') {
            if (title) {
                console.log('Fetching specific todo');
                const todo = await getTodoByTitle(title);
                response = {
                    statusCode: 200,
                    body: JSON.stringify({
                        todo,
                        logInfo
                    })
                };
            } else {
                console.log('Fetching all todos');
                const todos = await getTodos();
                response = {
                    statusCode: 200,
                    body: JSON.stringify({
                        todos,
                        logInfo
                    })
                };
            }
        } else if (httpMethod === 'POST') {
            if (!body || !body.title || !body.description) {
                console.log('Invalid POST request body');
                response = {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: 'Bad Request: Missing title or description in body',
                        logInfo
                    })
                };
            } else {
                console.log('Adding a new todo');
                const addedTodo = await addTodo(body);
                response = {
                    statusCode: 201,
                    body: JSON.stringify({
                        addedTodo,
                        logInfo
                    })
                };
            }
        } else if (httpMethod === 'PUT') {
            if (!title || !body) {
                console.log('Invalid PUT request: Missing title or body');
                response = {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: 'Bad Request: Missing title or body',
                        logInfo
                    })
                };
            } else {
                console.log('Updating todo');
                const updatedTodo = await updateTodo(title, body);
                response = {
                    statusCode: 200,
                    body: JSON.stringify({
                        updatedTodo,
                        logInfo
                    })
                };
            }
        } else if (httpMethod === 'DELETE') {
            if (!title) {
                console.log('Invalid DELETE request: Missing title');
                response = {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: 'Bad Request: Missing title',
                        logInfo
                    })
                };
            } else {
                console.log('Deleting todo');
                await deleteTodo(title);
                response = {
                    statusCode: 204,
                    body: JSON.stringify({
                        message: 'Todo deleted successfully',
                        logInfo
                    })
                };
            }
        } else {
            console.log('Unsupported HTTP method');
            response = {
                statusCode: 405,
                body: JSON.stringify({
                    message: 'Method Not Allowed',
                    logInfo
                })
            };
        }
    } catch (error) {
        console.error('Error occurred:', error);
        response = {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal Server Error',
                error: error.message,
                logInfo
            })
        };
    }

    return {
        statusCode: response.statusCode || 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: response.body // Ensure the response body is a JSON string
    };
};
