#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WebServer.h>

const int SENSOR_PIN = 13; // GPIO pin where the sensor is connected
volatile long pulseCount = 0;
unsigned long lastTime = 0;
unsigned long lastUploadTime = 0;
float flowRate;
float currentPeriodVolume = 0; // Volume in litres in past 10 minutes

// Calibration factor (from manufacturer listing)
const float CALIBRATION_FACTOR = 8;

// WIFI and API details
const char* ssid = "";
const char* password = "";
const char* serverUrl = "";

String sourceId = "test_source"; // Default/placeholder sourceId

WebServer server(80); // Create web server on port 80

void IRAM_ATTR pulseCounter()
{
    pulseCount++;
}

// HTML for input page
const char* html = R"(
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Set Source ID</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=SUSE:wght@400;700&display=swap');
        
        body {
            background-color: #4da1e6;
            color: #232323;
            font-family: 'SUSE', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        h2 {
            font-weight: 700;
            margin-top: 0;
        }
        input[type="text"] {
            padding: 8px;
            margin: 10px 0;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        input[type="submit"] {
            background-color: #4da1e6;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
        }
        input[type="submit"]:hover {
            background-color: #3a7cb8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Input Setup Code</h2>
        <form action="/setSource" method="post">
            <input type="text" name="source" placeholder="Enter setup code">
            <input type="submit" value="Submit">
        </form>
    </div>
</body>
</html>
)";

// HTML for response page
const char* responseHtml = R"(
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup Code Response</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=SUSE:wght@400;700&display=swap');
        
        body {
            background-color: #4da1e6;
            color: #232323;
            font-family: 'SUSE', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        h2 {
            font-weight: 700;
            margin-top: 0;
        }
        p {
            margin-bottom: 20px;
        }
        a {
            background-color: #4da1e6;
            color: white;
            text-decoration: none;
            padding: 10px 15px;
            border-radius: 4px;
            display: inline-block;
        }
        a:hover {
            background-color: #3a7cb8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>MyWaterPal Sensor setup!</h2>
        <p>%MESSAGE%</p>
        <a href="/">Back to Input</a>
    </div>
</body>
</html>
)";

// Send HTML for root page
void handleRoot() {
  server.send(200, "text/html", html);
}

// Send HTML for response page and include sourceID variable
void handleSetSource() {
  String message;
  if (server.hasArg("source")) {
    sourceId = server.arg("source");
    message = "Setup Code: " + sourceId;
    // Print submitted sourceId
    Serial.print("Source ID set to: ");
    Serial.println(sourceId);
  } else {
    message = "Missing source parameter";
  }
  
  String response = String(responseHtml);
  response.replace("%MESSAGE%", message);
  server.send(200, "text/html", response);
}

void setup() {
    Serial.begin(115200);
    pinMode(SENSOR_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(SENSOR_PIN), pulseCounter, FALLING);
    
    // Connect to Wi-Fi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
      delay(1000);
      Serial.println("Connecting to WiFi...");
    }
    Serial.println("Connected to WiFi");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    // Set up web server routes
    server.on("/", handleRoot);
    server.on("/setSource", HTTP_POST, handleSetSource);
    server.begin();
    Serial.println("HTTP server started");
}

void loop() {
    server.handleClient();

    unsigned long currentTime = millis();

    if((currentTime - lastTime) > 1000) // Every second
    {
        detachInterrupt(digitalPinToInterrupt(SENSOR_PIN));
        
        // Calculate flow rate
        if ( pulseCount <= 4 ) {
          flowRate = ((1000.0 / (currentTime - lastTime)) * pulseCount) / 4;
        }
        else {
          flowRate = ( ((1000.0 / (currentTime - lastTime)) * pulseCount) + 4 ) / CALIBRATION_FACTOR;
        }

        // Calculate volume passed in this second + convert from L/min to L/sec
        float volumeThisSecond = flowRate / 60.0;
        
        // Add to total volume for current period (10 mins)
        currentPeriodVolume += volumeThisSecond;
        
        // Print the flow rate and total volume
        // Serial.print("Flow rate: ");
        // Serial.print(flowRate);
        // Serial.print(" L/min, Total Volume: ");
        // Serial.print(currentPeriodVolume);
        // Serial.print(" L, Total Pulses: ");
        // Serial.println(pulseCount);
        
        pulseCount = 0;
        lastTime = currentTime;
        
        // Attachs pulseCount increment to signal input pin
        attachInterrupt(digitalPinToInterrupt(SENSOR_PIN), pulseCounter, FALLING);
    }

    if((currentTime - lastUploadTime) >= 600000) // Every 10 minutes (600000 ms)
    {
        Serial.print("Volume in past 10 minutes: ");
        Serial.print(currentPeriodVolume);
        Serial.println(" L");
        
        lastUploadTime = currentTime; // Next upload attempt in 10 minutes
        
        if (currentPeriodVolume > 0) // Only upload if some water detected in last period
        {
            if (WiFi.status() == WL_CONNECTED)
            {
                HTTPClient http;
                
                // JSON payload
                StaticJsonDocument<200> doc;
                doc["userid"] = "test_user";
                doc["volume"] = currentPeriodVolume;
                doc["source"] = sourceId;
                
                String jsonString;
                serializeJson(doc, jsonString);
                
                // Send POST request
                http.begin(serverUrl);
                http.addHeader("Content-Type", "application/json");
                
                int httpResponseCode = http.POST(jsonString);
                
                if (httpResponseCode > 0) {
                  String response = http.getString();
                  Serial.println(httpResponseCode);
                  // Serial.println(response);
                } else {
                  Serial.print("Error on sending POST: ");
                  Serial.println(httpResponseCode);
                }
                
                http.end();

                currentPeriodVolume = 0; // Reset period volume if uploaded
            }
        }
    }
}
