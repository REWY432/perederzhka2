/**
 * DogStay Manager - Google Apps Script Backend
 * 
 * This script provides a REST-like API for the DogStay Manager app
 * using Google Sheets as the database.
 */

var SHEET_NAME = "Bookings";
var SETTINGS_SHEET_NAME = "Settings";

/**
 * Initial setup - creates the required sheets and headers
 */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Setup Bookings Sheet
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "id", "dogName", "breed", "size", "checkIn", "checkOut", 
      "pricePerDay", "status", "createdAt", "expenses", "tags", 
      "checklist", "comment", "ownerName", "ownerPhone", "diaperCost", 
      "damageCost", "vaccineExpires", "photoUrl"
    ]);
    sheet.setFrozenRows(1);
  }
  
  // Setup Settings Sheet (Key-Value storage)
  var settingsSheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SETTINGS_SHEET_NAME);
    settingsSheet.appendRow(["Key", "Value"]);
    settingsSheet.appendRow(["hotelName", "DogStay Hotel"]);
    settingsSheet.appendRow(["maxCapacity", "10"]);
    settingsSheet.appendRow(["theme", "light"]);
    settingsSheet.appendRow(["locale", "ru"]);
    settingsSheet.setFrozenRows(1);
  }
  
  Logger.log("Setup complete!");
}

/**
 * Handle POST requests
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  
  try {
    lock.tryLock(10000);
    
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var result = { status: "error", message: "Unknown action" };
    
    switch (action) {
      case "getBookings":
        result = getBookings();
        break;
      case "getSettings":
        result = getSettings();
        break;
      case "saveSettings":
        result = saveSettings(payload.data);
        break;
      case "createBooking":
        result = createBooking(payload.data);
        break;
      case "updateBooking":
        result = updateBooking(payload.data);
        break;
      case "deleteBooking":
        result = deleteBooking(payload.id);
        break;
      // Legacy support
      case "read":
        result = getBookings();
        break;
      case "create":
        result = createBooking(payload.data);
        break;
      case "update":
        result = updateBooking(payload.data);
        break;
      case "delete":
        result = deleteBooking(payload.id);
        break;
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: "error", 
        message: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: "ok", 
      message: "DogStay API is running",
      version: "3.0.0"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// BOOKINGS OPERATIONS
// ============================================

function getBookings() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return { status: "success", data: [] };
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: "success", data: [] };
  
  var headers = data[0];
  var rows = data.slice(1);
  
  var bookings = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      var value = row[i];
      
      // Parse JSON fields
      if (["expenses", "tags", "checklist"].indexOf(h) !== -1 && value) {
        try { 
          obj[h] = JSON.parse(value); 
        } catch(e) { 
          obj[h] = value; 
        }
      } else {
        obj[h] = value;
      }
    });
    return obj;
  });
  
  return { status: "success", data: bookings };
}

function createBooking(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  
  // Generate ID if not provided
  if (!data.id) {
    data.id = generateId();
  }
  
  // Set creation timestamp
  data.createdAt = new Date().getTime();
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) {
    var val = data[h];
    
    // Stringify objects/arrays
    if (typeof val === "object" && val !== null) {
      return JSON.stringify(val);
    }
    
    return val !== undefined ? val : "";
  });
  
  sheet.appendRow(row);
  
  return { status: "success", data: data };
}

function updateBooking(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var values = sheet.getDataRange().getValues();
  
  // Find row by ID (column 0)
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] == data.id) {
      var headers = values[0];
      
      headers.forEach(function(h, colIdx) {
        if (data[h] !== undefined && h !== "id" && h !== "createdAt") {
          var val = data[h];
          
          // Stringify objects/arrays
          if (typeof val === "object" && val !== null) {
            val = JSON.stringify(val);
          }
          
          sheet.getRange(i + 1, colIdx + 1).setValue(val);
        }
      });
      
      return { status: "success" };
    }
  }
  
  return { status: "error", message: "Booking not found" };
}

function deleteBooking(id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var values = sheet.getDataRange().getValues();
  
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { status: "success" };
    }
  }
  
  return { status: "error", message: "Booking not found" };
}

// ============================================
// SETTINGS OPERATIONS
// ============================================

function getSettings() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS_SHEET_NAME);
  if (!sheet) return { status: "success", data: {} };
  
  var data = sheet.getDataRange().getValues();
  var settings = {};
  
  // Skip header row
  for (var i = 1; i < data.length; i++) {
    var key = data[i][0];
    var value = data[i][1];
    
    if (key) {
      settings[key] = value;
    }
  }
  
  return { status: "success", data: settings };
}

function saveSettings(newSettings) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS_SHEET_NAME);
  if (!sheet) {
    return { status: "error", message: "Settings sheet not found" };
  }
  
  var data = sheet.getDataRange().getValues();
  var keyRowMap = {};
  
  // Build map of existing keys to row numbers
  for (var i = 1; i < data.length; i++) {
    keyRowMap[data[i][0]] = i + 1;
  }
  
  // Update or append each setting
  for (var key in newSettings) {
    if (newSettings.hasOwnProperty(key)) {
      var value = newSettings[key];
      
      if (keyRowMap[key]) {
        // Update existing
        sheet.getRange(keyRowMap[key], 2).setValue(value);
      } else {
        // Append new
        sheet.appendRow([key, value]);
        keyRowMap[key] = sheet.getLastRow();
      }
    }
  }
  
  return { status: "success" };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateId() {
  var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  var result = "";
  for (var i = 0; i < 9; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Test function for debugging
 */
function testApi() {
  // Test getBookings
  var bookings = getBookings();
  Logger.log("Bookings: " + JSON.stringify(bookings));
  
  // Test getSettings
  var settings = getSettings();
  Logger.log("Settings: " + JSON.stringify(settings));
}
