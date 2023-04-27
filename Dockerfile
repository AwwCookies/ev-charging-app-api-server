# Use an official Node.js runtime as a parent image
FROM node:latest

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed dependencies
RUN npm install

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run your app using CMD
CMD ["npm", "start"]
