#include <WiFi.h>
#include <HTTPClient.h>
#include <LiquidCrystal_I2C.h>

// WiFi + Server
const char* ssid = "server";
const char* password = "chainikhaini123";
const String server = "http://192.168.216.57:3000";

// LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Pins
#define BUTTON_A 18
#define BUTTON_B 19
#define BUTTON_C 13
#define BUTTON_D 14

#define LED1_PIN 5    // A
#define LED2_PIN 15   // B
#define LED3_PIN 26   // C
#define LED4_BLUE 23  // D
#define LED_RED 27    // Red (Wrong Answer indicator)
#define LED_BLUE 23
#define LED_GREEN 25      //  Universal Green
#define BTN_BACKSPACE 33  //  Backspace button


// State
String code = "";
String studentRoll = "";
bool inVoting = false;
bool voteSent = false;
bool btnBackspace = false;
char selectedVote = '\0';
unsigned long lastPollTime = 0;
unsigned long lastGlobalLogoutCheck = 0;
unsigned long lastTimerCheck = 0;
int timeLeft = 0;
bool awaitingConfirm = false;
char confirmChoice = '\0';
bool showResult = false;
String lastLCDMessage = "";


// Flags
bool btnA = false, btnB = false, btnC = false, btnD = false;
int logoutConfirmCount = 0;

void setup() {
  Serial.begin(115200);

  pinMode(BUTTON_A, INPUT_PULLUP);
  pinMode(BUTTON_B, INPUT_PULLUP);
  pinMode(BUTTON_C, INPUT_PULLUP);
  pinMode(BUTTON_D, INPUT_PULLUP);
  pinMode(BTN_BACKSPACE, INPUT_PULLUP);
  pinMode(LED_BLUE, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);

  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(LED3_PIN, OUTPUT);
  pinMode(LED4_BLUE, OUTPUT);


  digitalWrite(LED1_PIN, HIGH);
  digitalWrite(LED2_PIN, HIGH);
  digitalWrite(LED3_PIN, HIGH);
  digitalWrite(LED4_BLUE, HIGH);
  digitalWrite(LED_RED, HIGH);
  digitalWrite(LED_BLUE, HIGH);
  digitalWrite(LED_GREEN, HIGH);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi     ");

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  lcd.clear();
  lcd.print("Enter Code:     ");
}

void loop() {


  if (studentRoll == "") {
    handleCodeEntry();  // Only if not logged in
  } else if (!inVoting && !voteSent && !showResult) {
    lcd.setCursor(0, 0);
    lcd.print("Waiting Poll...     ");
  } else if (inVoting && !voteSent) {
    if (millis() - lastTimerCheck > 1000) {
      checkPollStatus();
      lastTimerCheck = millis();
    }
    handleVoting();
  } else if (voteSent && !showResult) {
    if (millis() - lastPollTime > 2000) {
      fetchResult();
      lastPollTime = millis();
    }
    if (millis() - lastTimerCheck > 1000) {
      checkPollStatus();  // keep timer updating
      lastTimerCheck = millis();
    }
  } else if (showResult) {
    postResultOptions();
  }

  // Check logoutAll trigger
  if (millis() - lastGlobalLogoutCheck > 5000) {
    checkGlobalLogout();
    lastGlobalLogoutCheck = millis();
  }
}
void checkGlobalLogout() {
  HTTPClient http;
  http.begin(server + "/should_logout");
  int httpCode = http.GET();  //renamed to httpCode

  if (httpCode > 0) {
    String response = http.getString();
    if (response.indexOf("\"logout\":true") != -1) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Forced Logout         ");
      lcd.setCursor(0, 1);
      lcd.print("Resetting...           ");
      delay(5000);  // wait 5 seconds before showing Enter Code to prevent immediate relog

      // Reset state
      studentRoll = "";
      code = "";
      voteSent = false;
      inVoting = false;
      showResult = false;
      logoutConfirmCount = 0;
      awaitingConfirm = false;

      // LEDs OFF
      digitalWrite(LED1_PIN, HIGH);
      digitalWrite(LED2_PIN, HIGH);
      digitalWrite(LED3_PIN, HIGH);
      digitalWrite(LED4_BLUE, HIGH);
      digitalWrite(LED_RED, HIGH);

      lcd.clear();
      lcd.print("Enter Code:     ");
    }
  }
  http.end();
}


void handleCodeEntry() {
  if (checkButton(BUTTON_A, btnA)) code += 'A';
  if (checkButton(BUTTON_B, btnB)) code += 'B';
  if (checkButton(BUTTON_C, btnC)) code += 'C';
  if (checkButton(BUTTON_D, btnD)) code += 'D';

  // 🔙 Backspace button
  if (checkButton(BTN_BACKSPACE, btnBackspace) && code.length() > 0) {
    code.remove(code.length() - 1);
  }

  lcd.setCursor(0, 1);
  lcd.print(code + "        ");  // clear excess chars

  if (code.length() == 6) {
    validateCode();
  }
}


bool checkButton(int pin, bool& flag) {
  if (digitalRead(pin) == LOW && !flag) {
    delay(50);
    flag = true;
    return true;
  } else if (digitalRead(pin) == HIGH) {
    flag = false;
  }
  return false;
}

void validateCode() {
  HTTPClient http;
  http.begin(server + "/validate");
  http.addHeader("Content-Type", "application/json");
  String payload = "{\"code\":\"" + code + "\"}";
  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    String response = http.getString();
    if (response.indexOf("success\":true") != -1) {
      studentRoll = extract(response, "rollNo");
      String name = extract(response, "name");

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print(studentRoll);
      lcd.setCursor(0, 1);
      lcd.print(name);
      delay(2000);

      inVoting = true;
      voteSent = false;
      selectedVote = '\0';
    } else {
      lcd.clear();
      lcd.print("Invalid Code          ");
      delay(2000);
    }
  }
  http.end();
  code = "";
  lcd.clear();
  lcd.print("Enter Code:        ");
}

void checkPollStatus() {
  HTTPClient http;
  http.begin(server + "/poll");
  int httpCode = http.GET();
  if (httpCode > 0) {
    String response = http.getString();

    if (response.indexOf("\"active\":true") != -1) {
      timeLeft = extract(response, "timeLeft").toInt();

      if (!voteSent) {
        lcd.setCursor(0, 0);
        lcd.print("Time: " + String(timeLeft) + "s         ");
        lcd.setCursor(0, 1);
        lcd.print("Vote: A B C D             ");
      } else {
        lcd.setCursor(1, 1);  // Don't clear "Voted: X" formatting on LCD
        lcd.print("Time: " + String(timeLeft) + "s        ");
      }

    } else if (voteSent) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Poll Over           ");
      lcd.setCursor(0, 1);
      lcd.print("Waiting result...       ");
      delay(2000);
      lcd.clear();
    } else {
      lcd.clear();
      lcd.print("Waiting Poll...     ");
    }
  }
  http.end();
}


void handleVoting() {
  if (awaitingConfirm) {
    // If confirmed by same button
    if (checkButtonFor(confirmChoice)) {
      sendVote(confirmChoice);
      awaitingConfirm = false;
      return;
    }

    // If a different button is pressed — cancel vote and take back to revote
    if ((confirmChoice != 'A' && checkButton(BUTTON_A, btnA)) || (confirmChoice != 'B' && checkButton(BUTTON_B, btnB)) || (confirmChoice != 'C' && checkButton(BUTTON_C, btnC)) || (confirmChoice != 'D' && checkButton(BUTTON_D, btnD))) {

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Vote Cancelled         ");
      delay(1000);

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Time: " + String(timeLeft) + "s         ");
      lcd.setCursor(0, 1);
      lcd.print("Vote: A B C D         ");

      awaitingConfirm = false;
      confirmChoice = '\0';
      return;
    }

    return;  // waiting for confirmation then vote will be sent
  }

  // Normal button press to start confirmation
  if (checkButton(BUTTON_A, btnA)) showConfirm('A');
  if (checkButton(BUTTON_B, btnB)) showConfirm('B');
  if (checkButton(BUTTON_C, btnC)) showConfirm('C');
  if (checkButton(BUTTON_D, btnD)) showConfirm('D');
}


bool checkButtonFor(char c) {
  if (c == 'A') return checkButton(BUTTON_A, btnA);
  if (c == 'B') return checkButton(BUTTON_B, btnB);
  if (c == 'C') return checkButton(BUTTON_C, btnC);
  if (c == 'D') return checkButton(BUTTON_D, btnD);
  return false;
}

void sendVote(char vote) {
  HTTPClient http;
  http.begin(server + "/vote");
  http.addHeader("Content-Type", "application/json");

  String json = "{\"rollNo\":\"" + studentRoll + "\",\"vote\":\"" + String(vote) + "\"}";
  Serial.println("Sending Vote: " + json);

  int httpCode = http.POST(json);
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Vote Response: " + response);

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Voted: " + String(vote) + "               ");
    // lcd.setCursor(0, 1);
    // lcd.print("Time left: --");  // timer updates will comes from checkPollStatus()

    int ledPin = getLedPinForChoice(vote);
    digitalWrite(ledPin, LOW);  // LED is ON

    selectedVote = vote;
    voteSent = true;
    inVoting = false;
  } else {
    lcd.clear();
    lcd.print("Vote Error!                ");
  }
  http.end();
  delay(500);
}

void fetchResult() {
  HTTPClient http;
  http.begin(server + "/student_result?rollNo=" + studentRoll);
  int code = http.GET();
  if (code > 0) {
    String response = http.getString();
    Serial.println("Result: " + response);

    if (response.indexOf("\"ready\":true") != -1) {
      bool isCorrect = response.indexOf("\"isCorrect\":true") != -1;
      String correct = extract(response, "correct");

      // Turn OFF all option LEDs before result display
      digitalWrite(LED1_PIN, HIGH);
      digitalWrite(LED2_PIN, HIGH);
      digitalWrite(LED3_PIN, HIGH);
      digitalWrite(LED4_BLUE, HIGH);

      lcd.clear();

      if (isCorrect) {
        lcd.setCursor(0, 0);
        lcd.print("CORRECT :)         ");
        lcd.setCursor(0, 1);
        lcd.print("Ans: " + correct + "           ");

        // ✅ Blink GREEN LED for correct
        for (int i = 0; i < 2; i++) {
          digitalWrite(LED_GREEN, LOW);
          delay(500);
          digitalWrite(LED_GREEN, HIGH);
          delay(500);
        }
      } else {
        lcd.setCursor(0, 0);
        lcd.print("WRONG :(           ");
        lcd.setCursor(0, 1);
        lcd.print("Ans: " + correct + "           ");

        // 🔴 Blink RED LED for wrong
        for (int i = 0; i < 2; i++) {
          digitalWrite(LED_RED, LOW);
          delay(500);
          digitalWrite(LED_RED, HIGH);
          delay(500);
        }

        // 🔵 Blink correct option's LED (A/B/C/D)
        int correctLED = getLedPinForChoice(correct.charAt(0));
        if (correctLED != -1) {
          digitalWrite(correctLED, LOW);
          delay(2000);
          digitalWrite(correctLED, HIGH);
        }
      }

      // Reset all LEDs after result
      digitalWrite(LED1_PIN, HIGH);
      digitalWrite(LED2_PIN, HIGH);
      digitalWrite(LED3_PIN, HIGH);
      digitalWrite(LED4_BLUE, HIGH);
      digitalWrite(LED_RED, HIGH);
      digitalWrite(LED_GREEN, HIGH);

      showResult = true;
    }
  }
  http.end();
}


void postResultOptions() {
  if (logoutConfirmCount == 1) {
    lcd.setCursor(0, 0);
    lcd.print("Confirm Logout?     ");
    lcd.setCursor(0, 1);
    lcd.print("Press D again...    ");
    lastLCDMessage = "";  // force re-render next time
  } else {
    String currentMsg = "C=Look for Poll.\nD=Logout          ";

    if (lastLCDMessage != currentMsg) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("C=Look for Poll.");
      lcd.setCursor(0, 1);
      lcd.print("D=Logout          ");
      lastLCDMessage = currentMsg;
    }
  }

  if (checkButton(BUTTON_C, btnC)) {
    voteSent = false;
    inVoting = true;
    showResult = false;
    logoutConfirmCount = 0;

    lcd.clear();
    lcd.print("Waiting Poll...     ");
    lastLCDMessage = "";  // reset display tracking
  }

  if (checkButton(BUTTON_D, btnD)) {
    logoutConfirmCount++;
    if (logoutConfirmCount >= 2) {
      lcd.clear();
      lcd.print("Logging Out...      ");
      delay(2000);

      studentRoll = "";
      code = "";
      voteSent = false;
      inVoting = false;
      showResult = false;
      awaitingConfirm = false;
      logoutConfirmCount = 0;
      lastLCDMessage = "";

      lcd.clear();
      lcd.print("Enter Code:         ");
    }
  }

  // Cancel logout confirm if other button is pressed
  if (checkButton(BUTTON_A, btnA) || checkButton(BUTTON_B, btnB) || checkButton(BUTTON_C, btnC)) {
    logoutConfirmCount = 0;
  }
}



String extract(String json, String key) {
  int index = json.indexOf("\"" + key + "\":");
  if (index == -1) return "";

  int start = index + key.length() + 3;
  while (json[start] == '\"') start++;  // skip starting quote if it's a string

  int end = start;
  while (end < json.length() && json[end] != ',' && json[end] != '}' && json[end] != '\"') end++;

  return json.substring(start, end);
}

void showConfirm(char vote) {
  confirmChoice = vote;
  awaitingConfirm = true;

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Confirm vote?            ");
  lcd.setCursor(0, 1);
  lcd.print("Press " + String(vote) + " again          ");
  delay(1000);
}

int getLedPinForChoice(char choice) {
  switch (choice) {
    case 'A': return LED1_PIN;
    case 'B': return LED2_PIN;
    case 'C': return LED3_PIN;
    case 'D': return LED4_BLUE;
    default: return -1;
  }
}
