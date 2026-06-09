#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>
#include <Preferences.h>

LiquidCrystal_I2C lcd(0x27, 20, 4);
WebServer server(80);
Preferences preferences;

String djangoIP = "";
String fetchURL = "";

// Store notices 
String notices[20];
int noticeCount   = 0;
int currentNotice = 0;

unsigned long lastSwitch = 0;
unsigned long lastFetch  = 0;
const long SWITCH_INTERVAL = 8000;   // show each notice 8 seconds
const long FETCH_INTERVAL  = 15000;  // fetch every 15 seconds

//  Clean text for LCD
String cleanForLCD(String text) {
  text.replace("\n", " ");
  text.replace("\r", " ");
  String result = "";
  for (int i = 0; i < text.length(); i++) {
    char c = text[i];
    if (c >= 32 && c <= 126) result += c;
    else result += " ";
  }
  result.trim();
  return result;
}

// Split notice into 20-char chunks 
// Breaks long notice into lines of 20 characters each
void getChunks(String text, String chunks[], int &count) {
  count = 0;
  // pad text to multiple of 20
  while (text.length() % 20 != 0) text += " ";
  
  for (int i = 0; i < text.length() && count < 20; i += 20) {
    chunks[count++] = text.substring(i, i + 20);
  }
}

//  Vertical scroll display 
void displayVerticalScroll(String notice) {
  // Split notice into 20-char chunks
  String chunks[20];
  int chunkCount = 0;
  getChunks(notice, chunks, chunkCount);

  // 4 rows on LCD — store what each row shows
  String rows[4] = {"", "", "", ""};

  // Clear screen first
  lcd.clear();

  // Scroll each chunk in from bottom
  for (int c = 0; c < chunkCount; c++) {
    
    // Shift existing rows UP
    rows[0] = rows[1];
    rows[1] = rows[2];
    rows[2] = rows[3];
    rows[3] = chunks[c];  // new chunk appears at bottom

    // Print all 4 rows
    for (int r = 0; r < 4; r++) {
      lcd.setCursor(0, r);
      // pad to 20 chars so old text gets overwritten
      String line = rows[r];
      while (line.length() < 20) line += " ";
      lcd.print(line);
    }

    delay(600);  // time between each line scroll
  }

  // After all chunks shown — show empty line then repeat header
  delay(1000);
  
  // Shift everything up one more time showing empty line
  rows[0] = rows[1];
  rows[1] = rows[2];
  rows[2] = rows[3];
  rows[3] = "                    ";  // empty line

  for (int r = 0; r < 4; r++) {
    lcd.setCursor(0, r);
    String line = rows[r];
    while (line.length() < 20) line += " ";
    lcd.print(line);
  }
  delay(800);
}

// Display notice with header
void displayNoticeByIndex(int index) {
  if (noticeCount == 0) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("  No notices yet    ");
    return;
  }

  // Show notice number header first
  lcd.clear();
  lcd.setCursor(0, 0);
  String header = "  ** Notice " + String(index + 1) + "/" + String(noticeCount) + " **  ";
  lcd.print(header);
  delay(800);  // brief pause on header

  // Vertical scroll the notice content
  displayVerticalScroll(notices[index]);
}

// ── Fetch notices from Django 
void fetchNotices() {
  if (fetchURL == "") return;  // safety check

  HTTPClient http;
  http.begin(fetchURL);
  int code = http.GET();

  if (code == 200) {
    String payload = http.getString();
    Serial.println("Fetched: " + payload);

    // Parse JSON
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      noticeCount = 0;
      JsonArray arr = doc["notices"].as<JsonArray>();
      for (String body : arr) {
        if (noticeCount >= 20) break;
        notices[noticeCount++] = cleanForLCD(body);
      }
      Serial.printf("Loaded %d notices\n", noticeCount);
    } else {
      Serial.println("JSON parse error!");
    }
  } else {
    Serial.println("HTTP Error: " + String(code));
  }
  http.end();
}

void handleRoot() {
  server.send(200, "text/plain", "ESP32 Notice Board Running!");
}

void checkResetButton() {
  if (digitalRead(0) == LOW) {
    delay(3000);
    if (digitalRead(0) == LOW) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Resetting WiFi...   ");
      WiFiManager wm;
      wm.resetSettings();
      preferences.clear();
      delay(1000);
      ESP.restart();
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  pinMode(0, INPUT_PULLUP);

  Wire.begin(21, 22);
  lcd.init();
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("E-Notice Board      ");
  lcd.setCursor(0, 1);
  lcd.print("Starting...         ");
  delay(1000);

  // Load saved Django IP
  preferences.begin("noticeboard", false);
  djangoIP = preferences.getString("djangoIP", "");
  Serial.println("Saved Django IP: " + djangoIP);

  WiFiManager wm;

  WiFiManagerParameter djangoIPParam(
    "djangoip",
    "Django Server IP",
    djangoIP.c_str(),
    40
  );
  wm.addParameter(&djangoIPParam);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connect to:         ");
  lcd.setCursor(0, 1);
  lcd.print("NoticeBoard-Setup   ");

  bool connected = wm.autoConnect("NoticeBoard-Setup");

  if (connected) {
    // Save Django IP from portal
    djangoIP = String(djangoIPParam.getValue());
    preferences.putString("djangoIP", djangoIP);

    // Build fetch URL
    fetchURL = "https://" + djangoIP + "/esp/notices";
    Serial.println("Fetch URL: " + fetchURL);
    Serial.println("Connected! IP: " + WiFi.localIP().toString());

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected!     ");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP().toString());
    delay(2000);

    // Fetch notices immediately on boot
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Loading notices...  ");
    delay(500);
    
    fetchNotices();  // get notices from Django

    // Start server
    server.on("/", handleRoot);
    server.begin();
    Serial.println("ESP32 server started!");

    // Display first notice immediately — NO blank screen!
    displayNoticeByIndex(0);

  } else {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed!        ");
    lcd.setCursor(0, 1);
    lcd.print("Restarting...       ");
    delay(3000);
    ESP.restart();
  }
}

void loop() {
  server.handleClient();
  checkResetButton();

  unsigned long now = millis();

  // Fetch fresh notices every 15 seconds
  if (now - lastFetch >= FETCH_INTERVAL) {
    lastFetch = now;
    fetchNotices();
  }

  // Switch to next notice every 8 seconds
  if (noticeCount > 0 && now - lastSwitch >= SWITCH_INTERVAL) {
    lastSwitch = now;
    currentNotice = (currentNotice + 1) % noticeCount;
    displayNoticeByIndex(currentNotice);
  }
}