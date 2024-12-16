const { MongoClient } = require('mongodb');

// Your full MongoDB connection string
const connectionString = 'mongodb+srv://chetan:Chetan_1234@cluster0.byxjp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  const client = new MongoClient(connectionString);

  try {
    // Attempt to connect
    await client.connect();
    console.log('Connected successfully to MongoDB.');
  } catch (err) {
    // If there's an error, it could be due to an incorrect password or other connection issues
    console.error('Failed to connect to MongoDB:', err.message);
  } finally {
    // Ensure the client closes
    await client.close();
  }
}

testConnection();
