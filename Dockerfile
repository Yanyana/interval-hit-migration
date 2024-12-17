# Gunakan image Node.js LTS sebagai base image
FROM node:alpine:3.21

# Set working directory
WORKDIR /app

# Salin file package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin semua file ke dalam container
COPY . .

# Expose port aplikasi (sesuaikan dengan port aplikasi Anda)
EXPOSE 3000

# Jalankan aplikasi menggunakan Node.js
CMD ["node", "index.js"]
