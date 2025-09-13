// =====================
// Attendance System (Testing Version)
// =====================
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Attendance page
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Attendance</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; text-align: center; padding: 50px; }
        form { background: #fff; padding: 20px; border-radius: 10px; display: inline-block; }
        input, button { padding: 10px; margin: 10px; width: 90%; }
        button { background: #007BFF; color: #fff; border: none; cursor: pointer; }
        button:hover { background: #0056b3; }
      </style>
    </head>
    <body>
      <h2>Attendance Form</h2>
      <form id="attendanceForm">
        <input type="text" id="name" placeholder="Enter your name" required><br>
        <button type="submit">Submit</button>
      </form>

      <script>
        document.getElementById("attendanceForm").addEventListener("submit", async function(e){
          e.preventDefault();
          let name = document.getElementById("name").value;

          navigator.geolocation.getCurrentPosition(async function(position) {
            let data = {
              name: name,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };

            let response = await fetch("/submit", {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify(data)
            });

            let result = await response.json();
            if(result.status === "success"){
              alert("✅ Attendance recorded!");
            } else {
              alert("⚠️ Something went wrong!");
            }

            document.getElementById("name").value = "";
          }, function(error){
            alert("⚠️ Please allow location access!");
          });
        });
      </script>
    </body>
    </html>
  `);
});

// Handle form submission (testing: allow any time)
app.post("/submit", (req, res) => {
  let { name, latitude, longitude } = req.body;
  let now = new Date();

  // ===== TESTING VERSION: allow all times =====
  // Remove the time restriction for testing
  // let hour = now.getHours();
  // let inMorning = (hour === 7);
  // let inAfternoon = (hour === 13);
  // if (!(inMorning || inAfternoon)) {
  //   return res.status(403).send({status: "closed"});
  // }

  // Save record
  let time = now.toLocaleString();
  let record = `${name}, ${time}, ${latitude}, ${longitude}\n`;
  fs.appendFileSync(path.join(__dirname, "attendance.csv"), record);

  console.log("📌 New record:", record.trim());
  res.send({status: "success"});
});

// Records page
app.get("/records", (req, res) => {
  let filePath = path.join(__dirname, "attendance.csv");
  if(!fs.existsSync(filePath)){
    return res.send("No attendance records yet.");
  }

  let data = fs.readFileSync(filePath, "utf-8");
  let rows = data.trim().split("\n");
  let html = "<h2>Attendance Records</h2><table border='1' cellpadding='5'><tr><th>Name</th><th>Time</th><th>Latitude</th><th>Longitude</th></tr>";

  rows.forEach(row => {
    let cols = row.split(", ");
    html += `<tr><td>${cols[0]}</td><td>${cols[1]}</td><td>${cols[2]}</td><td>${cols[3]}</td></tr>`;
  });

  html += "</table>";
  res.send(html);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
