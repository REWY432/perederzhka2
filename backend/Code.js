// ЭТОТ КОД НУЖНО ВСТАВИТЬ В GOOGLE APPS SCRIPT (Extensions -> Apps Script)

// Конфигурация
var SHEET_NAME = "Bookings";

// Инициализация листа
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Заголовки (совпадают с интерфейсом Booking)
    // ДОБАВЛЕНО: expenses
    var headers = [
      "id", "dogName", "breed", "size", "checkIn", "checkOut", 
      "pricePerDay", "diaperCost", "damageCost", "comment", 
      "tags", "checklist", "vaccineExpires", "photoUrl", "status", "createdAt", "expenses"
    ];
    sheet.appendRow(headers);
    // Жирным шрифтом
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    // Закрепить первую строку
    sheet.setFrozenRows(1);
  } else {
    // Если лист уже есть, но нет колонки expenses, добавим её (простая миграция)
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (headers.indexOf("expenses") === -1) {
      sheet.getRange(1, headers.length + 1).setValue("expenses");
      sheet.getRange(1, headers.length + 1).setFontWeight("bold");
    }
  }
}

// Обработка GET запросов (Чтение)
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify(getAllBookings()))
    .setMimeType(ContentService.MimeType.JSON);
}

// Обработка POST запросов (Создание, Обновление, Удаление)
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Ждем до 10 сек
  
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var data = payload.data;
    
    if (action === "create") {
      addBooking(data);
    } else if (action === "update") {
      updateBooking(data);
    } else if (action === "delete") {
      deleteBooking(data.id);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- Хелперы ---

function getAllBookings() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);
  
  return rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      var value = row[index];
      // Преобразуем JSON строки обратно в массивы
      if (header === "tags" || header === "checklist" || header === "expenses") {
        try { value = value ? JSON.parse(value) : []; } catch(e) { value = []; }
      }
      obj[header] = value;
    });
    return obj;
  });
}

function addBooking(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) { setup(); sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME); }
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newRow = headers.map(function(header) {
    var value = data[header];
    // Массивы храним как JSON строки
    if (Array.isArray(value) || (header === "expenses" && typeof value === 'object')) {
        return JSON.stringify(value);
    }
    return value === undefined ? "" : value;
  });
  
  sheet.appendRow(newRow);
}

function updateBooking(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idIndex = headers.indexOf("id");
  
  for (var i = 1; i < values.length; i++) {
    if (values[i][idIndex] == data.id) {
      // Обновляем ячейки
      headers.forEach(function(header, colIndex) {
        if (data[header] !== undefined) {
          var val = data[header];
          if (Array.isArray(val) || (header === "expenses" && typeof val === 'object')) {
              val = JSON.stringify(val);
          }
          sheet.getRange(i + 1, colIndex + 1).setValue(val);
        }
      });
      break;
    }
  }
}

function deleteBooking(id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idIndex = headers.indexOf("id");
  
  for (var i = 1; i < values.length; i++) {
    if (values[i][idIndex] == id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}