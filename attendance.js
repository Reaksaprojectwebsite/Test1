// =====================
// Attendance System – Cambodia Time + Map Link (No API)
// =====================
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public')); // for static assets like css/js

// =====================
// Attendance Form
// =====================
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Attendance</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<style>
body { background: #f4f6f9; font-family: 'Segoe UI', sans-serif; }
.container { max-width: 400px; margin-top: 80px; background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
h2 { margin-bottom: 25px; color: #333; }
#status { margin-top: 15px; font-weight: bold; }
</style>
</head>
<body>
<div class="container text-center">
<h2>Attendance Form</h2>
<form id="attendanceForm">
<div class="mb-3">
<input type="text" id="name" class="form-control" placeholder="Enter your name" required>
</div>
<button type="submit" class="btn btn-primary w-100">Submit Attendance</button>
</form>
<div id="status"></div>
</div>

<script>
const form = document.getElementById("attendanceForm");
const status = document.getElementById("status");

form.addEventListener("submit", function(e){
  e.preventDefault();
  status.innerHTML = "📍 Locating... Please wait";
  status.style.color = "#0d6efd";

  let name = document.getElementById("name").value;

  if(!navigator.geolocation){
    status.innerHTML = "⚠️ Geolocation not supported";
    status.style.color = "#dc3545";
    return;
  }

  navigator.geolocation.getCurrentPosition(async function(position){
    let data = {
      name: name,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };

    try {
      let response = await fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      let result = await response.json();

      if(result.status === "success"){
        status.innerHTML = "✅ Attendance recorded successfully!";
        status.style.color = "#198754";
      } else {
        status.innerHTML = "⚠️ Something went wrong!";
        status.style.color = "#dc3545";
      }
    } catch(err){
      status.innerHTML = "⚠️ Error submitting attendance!";
      status.style.color = "#dc3545";
      console.error(err);
    }

    form.reset();
  }, function(error){
    status.innerHTML = "⚠️ Location error: " + error.message;
    status.style.color = "#dc3545";
  }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
});
</script>
</body>
</html>
  `);
});

// =====================
// Submit Attendance – Cambodia Time + Map Link
// =====================
app.post("/submit", (req, res) => {
  const { name, latitude, longitude } = req.body;

  // Get Cambodia time (GMT+7)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const cambodiaTime = new Date(utc + (7 * 60 * 60 * 1000));
  const timeStr = cambodiaTime.toLocaleString('en-GB', { hour12: false });

  // Google Maps link
  const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

  // Save record
  const record = `${name}, ${timeStr}, ${mapLink}\n`;
  fs.appendFileSync(path.join(__dirname, "attendance.csv"), record);

  console.log("📌 New attendance:", record.trim());
  res.send({ status: "success" });
});

// =====================
// Records Page – Show Map Links
// =====================
app.get("/records", (req, res) => {
  const filePath = path.join(__dirname, "attendance.csv");
  if(!fs.existsSync(filePath)){
    return res.send("<h3>No attendance records yet.</h3>");
  }

  const data = fs.readFileSync(filePath, "utf-8");
  const rows = data.trim().split("\n");

  let html = `
<!DOCTYPE html>
<html>
<head>
<title>Attendance Records</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<style>
body { background: #f4f6f9; font-family: 'Segoe UI', sans-serif; padding: 30px; }
table { background: #fff; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
h2 { margin-bottom: 20px; color: #333; }
</style>
</head>
<body>
<h2>Attendance Records</h2>
<div class="table-responsive">
<table class="table table-striped table-bordered">
<thead class="table-dark">
<tr><th>Name</th><th>Time (Cambodia)</th><th>Location</th></tr>
</thead>
<tbody>`;

  rows.forEach(row => {
    const cols = row.split(", ");
    html += `<tr><td>${cols[0]}</td><td>${cols[1]}</td><td><a href="${cols[2]}" target="_blank">View Map</a></td></tr>`;
  });

  html += `</tbody></table></div></body></html>`;
  res.send(html);
});

// =====================
// Start Server
// =====================
app.listen(PORT, () => {
  console.log(`🚀 Attendance system running at http://localhost:${PORT}`);
});
