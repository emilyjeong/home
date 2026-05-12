// Book Archive - Apps Script Web App
// 1. Aladin API proxy
// 2. Books / Quotes read & write
// Deploy: Extensions > Apps Script > Deploy > Web app > Anyone

var SS        = SpreadsheetApp.getActiveSpreadsheet();
var TTB_KEY   = "ttbkabi10041738001";
var SH_BOOKS  = "Books";
var SH_QUOTES = "Quotes";

// CORS preflight
function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}

// GET router
function doGet(e) {
  try {
    var action = e.parameter.action;
    if (action === "search")    return searchBooks(e.parameter.q);
    if (action === "getBooks")  return getBooks();
    if (action === "getQuotes") return getQuotes();
    return jsonRes({ error: "unknown action" });
  } catch(err) {
    return jsonRes({ error: err.message });
  }
}

// POST router
function doPost(e) {
  try {
    var body   = JSON.parse(e.postData.contents);
    var action = body.action;
    if (action === "saveBook")    return saveBook(body.data);
    if (action === "saveQuotes")  return saveQuotes(body.data);
    if (action === "deleteBook")  return deleteRowById(SH_BOOKS,  body.bookId);
    if (action === "deleteQuote") return deleteRowById(SH_QUOTES, body.quoteId);
    return jsonRes({ error: "unknown action" });
  } catch(err) {
    return jsonRes({ error: err.message });
  }
}

// Aladin book search
function searchBooks(query) {
  if (!query) return jsonRes({ error: "query required" });
  var url = "http://www.aladin.co.kr/ttb/api/ItemSearch.aspx"
    + "?ttbkey=" + TTB_KEY
    + "&Query=" + encodeURIComponent(query)
    + "&QueryType=Keyword"
    + "&MaxResults=8"
    + "&start=1"
    + "&SearchTarget=Book"
    + "&output=js"
    + "&Version=20131101"
    + "&Cover=Big";
  var res  = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var data = JSON.parse(res.getContentText("UTF-8"));
  if (!data.item) return jsonRes({ results: [] });
  var results = data.item.map(function(item) {
    return {
      title      : item.title,
      author     : item.author,
      cover      : item.cover,
      categoryRaw: item.categoryName,
      category   : mapCategory(item.categoryName),
      isbn       : item.isbn13,
      publisher  : item.publisher,
      pubDate    : item.pubDate
    };
  });
  return jsonRes({ results: results });
}

// Category mapping
function mapCategory(cn) {
  if (!cn) return "other";
  cn = cn.toLowerCase();
  if (cn.indexOf("경제") > -1 || cn.indexOf("투자") > -1 || cn.indexOf("재테크") > -1 || cn.indexOf("주식") > -1) return "invest";
  if (cn.indexOf("철학") > -1 || cn.indexOf("심리") > -1 || cn.indexOf("인문") > -1) return "phil";
  if (cn.indexOf("자기계발") > -1 || cn.indexOf("처세") > -1 || cn.indexOf("습관") > -1) return "self";
  if (cn.indexOf("소설") > -1 || cn.indexOf("문학") > -1 || cn.indexOf("에세이") > -1) return "lit";
  if (cn.indexOf("과학") > -1 || cn.indexOf("기술") > -1 || cn.indexOf("it") > -1) return "science";
  return "other";
}

// Save book
function saveBook(data) {
  var sheet = getOrCreateSheet(SH_BOOKS, ["id","title","author","category","categoryRaw","cover","start","end","memo","createdAt"]);
  var id    = Date.now().toString();
  sheet.appendRow([id, data.title||"", data.author||"", data.category||"other", data.categoryRaw||"", data.cover||"", data.start||"", data.end||"", data.memo||"", new Date().toISOString()]);
  return jsonRes({ success: true, id: id });
}

// Get all books
function getBooks() {
  var sheet = SS.getSheetByName(SH_BOOKS);
  if (!sheet) return jsonRes({ books: [] });
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return jsonRes({ books: [] });
  var headers = rows[0];
  var books = rows.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
  return jsonRes({ books: books });
}

// Save quotes
function saveQuotes(data) {
  var sheet = getOrCreateSheet(SH_QUOTES, ["id","bookId","bookTitle","category","text","createdAt"]);
  var now   = new Date().toISOString();
  data.texts.forEach(function(text) {
    sheet.appendRow([Date.now().toString(), data.bookId||"", data.bookTitle||"", data.category||"other", text, now]);
  });
  return jsonRes({ success: true, count: data.texts.length });
}

// Get all quotes
function getQuotes() {
  var sheet = SS.getSheetByName(SH_QUOTES);
  if (!sheet) return jsonRes({ quotes: [] });
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return jsonRes({ quotes: [] });
  var headers = rows[0];
  var quotes = rows.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
  return jsonRes({ quotes: quotes });
}

// Delete row by id
function deleteRowById(sheetName, id) {
  var sheet = SS.getSheetByName(sheetName);
  if (!sheet) return jsonRes({ error: "sheet not found" });
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return jsonRes({ success: true });
    }
  }
  return jsonRes({ error: "row not found" });
}

// Get or create sheet
function getOrCreateSheet(name, headers) {
  var sheet = SS.getSheetByName(name);
  if (!sheet) {
    sheet = SS.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// JSON response
function jsonRes(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run once to init sheets
function initSheets() {
  getOrCreateSheet(SH_BOOKS,  ["id","title","author","category","categoryRaw","cover","start","end","memo","createdAt"]);
  getOrCreateSheet(SH_QUOTES, ["id","bookId","bookTitle","category","text","createdAt"]);
  SpreadsheetApp.getUi().alert("Done! Books / Quotes sheets created.");
}
