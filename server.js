// Import required packages
require('dotenv').config(); // Loads secret keys from .env file
const express = require('express');
const { MongoClient } = require('mongodb');

// Get the MongoDB connection string from our .env file
const dbUrl = process.env.DATABASE_URL;

// Create the Express app
const app = express();
const port = 3000; // The port our server will run on

// A simple "test" route to see if the server is working
app.get('/', (req, res) => {
  res.send('Hello, your backend server is running!');
  });

  // A test route to see if the database connection is working
  app.get('/testdb', async (req, res) => {
    try {
        // Try to connect to the database
            const client = new MongoClient(dbUrl);
                await client.connect();
                    
                        // If successful, send a success message
                            res.send('Successfully connected to MongoDB!');
                                
                                    // Close the connection
                                        await client.close();
                                          } catch (error) {
                                              // If it fails, send an error message
                                                  console.error(error);
                                                      res.status(500).send('Error connecting to the database');
                                                        }
                                                        });

                                                        // Start the server
                                                        app.listen(port, () => {
                                                          console.log(`Server is listening on http://localhost:${port}`);
                                                          });
                                                          