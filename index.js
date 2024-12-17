import pkg from "pg";
import axios from "axios";
import dotenv from "dotenv";

// Muat variabel lingkungan dari .env
dotenv.config();

const { Pool } = pkg; // Destructure Pool from CommonJS module

// Konfigurasi koneksi PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10), // Port harus berupa angka
});

// Fungsi untuk koneksi ke database dan melakukan query sederhana
async function runQuery(query) {
  try {
    const client = await pool.connect();
    const res = await client.query(query);
    client.release();
    return res.rows; // Mengembalikan hasil query dalam bentuk array
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return [];
  }
}

async function findRegistrationForMigration() {
  const query = `SELECT tpr.uid, tpr.id, tpr.reg_num
FROM t_patient_registration tpr
WHERE EXISTS (
  SELECT 1 
  FROM t_patient_examination tpe 
  WHERE tpe.uid_registration = tpr.uid
) 
AND tpr.is_migrated = false
ORDER BY tpr.registration_date ASC
LIMIT 1`;

  const response = await runQuery(query);

  
  if (response.length > 0) {
    console.log("Found registration for migration:", response[0]);
    const responseApi = await hitApiMigration(response[0].reg_num);
    await updateRegistrationMigrated(response[0].id);
  } else {
    console.log("No registrations found for migration.");
  }
}

async function updateRegistrationMigrated(id) {
  const query = `UPDATE t_patient_registration SET is_migrated = true 
    WHERE id = ${id}`;


  const response = await runQuery(query);

  console.log("Updated registration status:", response);
}

// Fungsi untuk hit API
async function hitApiMigration(reg_num) {
  const apiUrl = `${process.env.BASE_URL_V1}/migration/patient?reg_num=${reg_num}`;
  try {
    const response = await axios.get(apiUrl);
    console.log('success ' + reg_num)
    return true
  } catch (error) {
    console.error("API request failed:", error.message);
  }
}

// Interval untuk menjalankan koneksi ke database dan hit API
const intervalTime = 5000; // 5 detik
setInterval(async () => {
  console.log("Running service...");
  await findRegistrationForMigration();
}, intervalTime);

// Menangani penghentian aplikasi dengan aman
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await pool.end();
  process.exit(0);
});
