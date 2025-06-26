const AWS = require('aws-sdk');

// Configure AWS SDK for local DynamoDB
AWS.config.update({
    region: 'us-east-1',
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy'
});

const dynamodb = new AWS.DynamoDB();

const tables = [
    {
        TableName: 'gpu-genie-reservations-dev',
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'status', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'user-id-index',
                KeySchema: [
                    { AttributeName: 'userId', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' }
            },
            {
                IndexName: 'status-index',
                KeySchema: [
                    { AttributeName: 'status', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },
    {
        TableName: 'gpu-genie-users-dev',
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'email', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'email-index',
                KeySchema: [
                    { AttributeName: 'email', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },
    {
        TableName: 'gpu-genie-gpu-servers-dev',
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'gpuType', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'gpu-type-index',
                KeySchema: [
                    { AttributeName: 'gpuType', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    }
];

const sampleData = [
    // Sample GPU Servers
    {
        TableName: 'gpu-genie-gpu-servers-dev',
        Item: {
            id: { S: 'server-v100-01' },
            name: { S: 'GPU Server V100-01' },
            gpuType: { S: 'V100' },
            totalGpus: { N: '8' },
            availableGpus: { N: '8' },
            status: { S: 'active' }
        }
    },
    {
        TableName: 'gpu-genie-gpu-servers-dev',
        Item: {
            id: { S: 'server-a100-01' },
            name: { S: 'GPU Server A100-01' },
            gpuType: { S: 'A100' },
            totalGpus: { N: '4' },
            availableGpus: { N: '4' },
            status: { S: 'active' }
        }
    },
    {
        TableName: 'gpu-genie-gpu-servers-dev',
        Item: {
            id: { S: 'server-rtx3090-01' },
            name: { S: 'GPU Server RTX3090-01' },
            gpuType: { S: 'RTX3090' },
            totalGpus: { N: '6' },
            availableGpus: { N: '6' },
            status: { S: 'active' }
        }
    },
    // Sample User
    {
        TableName: 'gpu-genie-users-dev',
        Item: {
            id: { S: 'test-user-01' },
            email: { S: 'test@example.com' },
            name: { S: 'Test User' },
            role: { S: 'user' },
            priority: { N: '50' },
            createdAt: { S: new Date().toISOString() }
        }
    }
];

async function createTable(tableParams) {
    try {
        console.log(`Creating table: ${tableParams.TableName}`);
        await dynamodb.createTable(tableParams).promise();
        console.log(`Table ${tableParams.TableName} created successfully`);

        // Wait for table to be active
        await dynamodb.waitFor('tableExists', { TableName: tableParams.TableName }).promise();
        console.log(`Table ${tableParams.TableName} is now active`);
    } catch (error) {
        if (error.code === 'ResourceInUseException') {
            console.log(`Table ${tableParams.TableName} already exists`);
        } else {
            console.error(`Error creating table ${tableParams.TableName}:`, error);
            throw error;
        }
    }
}

async function insertSampleData(item) {
    try {
        await dynamodb.putItem(item).promise();
        console.log(`Sample data inserted into ${item.TableName}: ${item.Item.id.S}`);
    } catch (error) {
        console.error(`Error inserting sample data into ${item.TableName}:`, error);
    }
}

async function initializeDynamoDB() {
    console.log('Initializing DynamoDB tables...');

    // Wait a bit for DynamoDB to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        // Create tables
        for (const table of tables) {
            await createTable(table);
        }

        // Insert sample data
        console.log('Inserting sample data...');
        for (const item of sampleData) {
            await insertSampleData(item);
        }

        console.log('DynamoDB initialization completed successfully!');
    } catch (error) {
        console.error('Error initializing DynamoDB:', error);
        process.exit(1);
    }
}

// Run initialization
initializeDynamoDB();