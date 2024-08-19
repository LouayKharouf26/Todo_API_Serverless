const { DynamoDBClient, ScanCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const { randomUUID } = require('crypto');
//require('dotenv').config();

// Configuration
const config = {
    aws_table_name: 'Todo',
    region: 'us-east-1'
};

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({ region: config.region });

// Function to get all todos
const getTodos = async () => {
    const params = {
        TableName: config.aws_table_name
    };

    try {
        const data = await ddbClient.send(new ScanCommand(params));
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, todos: data.Items })
        };
    } catch (err) {
        console.error('Error getting todos:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Failed to retrieve todos', error: err.message })
        };
    }
};

// Function to add a new todo
const addTodo = async (body) => {
    const { title, description, completed } = body;

    if (!title) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'Title is required' })
        };
    }

    const params = {
        TableName: config.aws_table_name,
        Item: {
            id: { S: randomUUID() },
            title: { S: title },
            description: { S: description || '' },
            completed: { BOOL: completed || false },
        }
    };

    try {
        await ddbClient.send(new PutItemCommand(params));
        return {
            statusCode: 201,
            body: JSON.stringify({ success: true, message: 'Todo added successfully', todo: params.Item })
        };
    } catch (err) {
        console.error('Error adding todo:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Failed to add todo', error: err.message })
        };
    }
};

// Function to get a todo by title
const getTodoByTitle = async (title) => {
    if (!title) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'Title is required' })
        };
    }

    const params = {
        TableName: config.aws_table_name,
        FilterExpression: 'title = :title',
        ExpressionAttributeValues: {
            ':title': { S: title }
        }
    };

    try {
        const data = await ddbClient.send(new ScanCommand(params));
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, todo: data.Items.length > 0 ? data.Items[0] : null })
        };
    } catch (err) {
        console.error('Error getting todo by title:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Failed to retrieve todo by title', error: err.message })
        };
    }
};

// Function to update a todo
const updateTodo = async (title, body) => {
    if (!title) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'Title is required' })
        };
    }

    const { newTitle, description, completed } = body;

    const findParams = {
        TableName: config.aws_table_name,
        FilterExpression: 'title = :title',
        ExpressionAttributeValues: {
            ':title': { S: title }
        }
    };

    try {
        const data = await ddbClient.send(new ScanCommand(findParams));
        const { Items } = data;

        if (Items.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ success: false, message: 'Todo not found' })
            };
        }

        const todo = Items[0];

        const updateExpression = [];
        const expressionAttributeValues = {};

        if (newTitle) {
            updateExpression.push('title = :newTitle');
            expressionAttributeValues[':newTitle'] = { S: newTitle };
        }
        if (description) {
            updateExpression.push('description = :description');
            expressionAttributeValues[':description'] = { S: description };
        }
        if (completed !== undefined) {
            updateExpression.push('completed = :completed');
            expressionAttributeValues[':completed'] = { BOOL: completed };
        }

        const params = {
            TableName: config.aws_table_name,
            Key: { id: { S: todo.id.S } },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'UPDATED_NEW'
        };

        const result = await ddbClient.send(new UpdateItemCommand(params));

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Todo updated successfully', updatedAttributes: result.Attributes })
        };
    } catch (err) {
        console.error('Error updating todo:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Failed to update todo', error: err.message })
        };
    }
};

// Function to delete a todo
const deleteTodo = async (title) => {
    if (!title) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'Title is required' })
        };
    }

    const findParams = {
        TableName: config.aws_table_name,
        FilterExpression: 'title = :title',
        ExpressionAttributeValues: {
            ':title': { S: title }
        }
    };

    try {
        const data = await ddbClient.send(new ScanCommand(findParams));
        const { Items } = data;

        if (Items.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ success: false, message: 'Todo not found' })
            };
        }

        const todo = Items[0];

        const params = {
            TableName: config.aws_table_name,
            Key: { id: { S: todo.id.S } }
        };

        await ddbClient.send(new DeleteItemCommand(params));

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Todo deleted successfully' })
        };
    } catch (err) {
        console.error('Error deleting todo:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Failed to delete todo', error: err.message })
        };
    }
};

module.exports = {
    getTodos,
    addTodo,
    getTodoByTitle,
    updateTodo,
    deleteTodo
};
