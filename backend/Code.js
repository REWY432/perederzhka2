var SHEET_NAME = "Bookings";
var SETTINGS_SHEET_NAME = "Settings";

// Init
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Setup Bookings Sheet
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["id", "dogName", "breed", "size", "checkIn", "checkOut", "pricePerDay", "status", "createdAt", "expenses", "tags", "checklist", "comment"]);
  }
  
  // Setup Settings Sheet (Key-Value storage)
  var settingsSheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SETTINGS_SHEET_NAME);
    settingsSheet.appendRow(["Key", "Value"]);
    settingsSheet.appendRow(["hotelName", "DogStay Hotel"]);
    settingsSheet.appendRow(["maxCapacity", "10"]);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var result = {};
    
    if (action === "getBookings") {
      result = getBookings();
    } else if (action === "getSettings") {
      result = getSettings();
    } else if (action === "saveSettings") {
      result = saveSettings(payload.data);
    } else if (action === "createBooking") {
      result = createBooking(payload.data);
    } else if (action === "updateBooking") {
      result = updateBooking(payload.data);
    } else if (action === "deleteBooking") {
      result = deleteBooking(payload.id);
    } else {
      // Fallback for older API calls
      if (action === "read") result = getBookings();
      if (action === "create") result = createBooking(payload.data);
      if (action === "update") result = updateBooking(payload.data);
      if (action === "delete") result = deleteBooking(payload.id);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: e.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- Bookings Logic ---

function getBookings() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return { data: [] };
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);
  var bookings = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { 
      // Handle JSON fields
      if (['expenses', 'tags', 'checklist'].indexOf(h) !== -1 && row[i]) {
        try { obj[h] = JSON.parse(row[i]); } catch(e) { obj[h] = row[i]; }
      } else {
        obj[h] = row[i]; 
      }
    });
    return obj;
  });
  return { data: bookings };
}

function createBooking(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!data.id) {
    data.id = Math.random().toString(36).substr(2, 9);
    data.createdAt = new Date().getTime();
  }
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) { 
    var val = data[h];
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
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
        if (data[h] !== undefined) {
          var val = data[h];
          if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
          sheet.getRange(i + 1, colIdx + 1).setValue(val);
        }
      });
      return { status: "success" };
    }
  }
  return { status: "error", message: "ID not found" };
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
  return { status: "error", message: "ID not found" };
}

// --- Settings Logic ---

function getSettings() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS_SHEET_NAME);
  if (!sheet) return { data: {} };
  var data = sheet.getDataRange().getValues();
  // Skip header
  var settings = {};
  for(var i = 1; i < data.length; i++) {
    settings[data[i][0]] = data[i][1];
  }
  return { data: settings };
}

function saveSettings(newSettings) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS_SHEET_NAME);
  if (!sheet) return { status: "error", message: "No settings sheet" };
  
  // Read existing to update or append
  var data = sheet.getDataRange().getValues();
  var map = {};
  for(var i = 1; i < data.length; i++) {
    map[data[i][0]] = i + 1; // store row index
  }
  
  for (var key in newSettings) {
    if (map[key]) {
      // Update existing row
      sheet.getRange(map[key], 2).setValue(newSettings[key]);
    } else {
      // Append new row
      sheet.appendRow([key, newSettings[key]]);
      map[key] = sheet.getLastRow();
    }
  }
  
  return { status: "success" };
}