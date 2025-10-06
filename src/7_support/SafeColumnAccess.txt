/**
 * MOH TIME OS v2.0 - SAFE COLUMN ACCESS
 *
 * Utility for robust worksheet column access with error handling.
 * Provides safe cell value retrieval and assignment with proper defaults.
 * Essential for handling dynamic sheet schemas and preventing array bounds errors.
 *
 * Original lines: 10431-10475 from scriptA.js
 */

class SafeColumnAccess {
  constructor(headers) {
    this.headers = headers || [];
    this.columnMap = new Map();
    this.buildColumnMap();
  }

  buildColumnMap() {
    this.headers.forEach((header, index) => {
      if (header) {
        this.columnMap.set(header.toLowerCase().trim(), index);
      }
    });
  }

  getColumnIndex(columnName) {
    if (!columnName) return -1;
    return this.columnMap.get(columnName.toLowerCase().trim()) || -1;
  }

  getValue(row, columnName) {
    const index = this.getColumnIndex(columnName);
    return index >= 0 && index < row.length ? row[index] : null;
  }

  setValue(row, columnName, value) {
    const index = this.getColumnIndex(columnName);
    if (index >= 0) {
      while (row.length <= index) {
        row.push('');
      }
      row[index] = value;
    }
    return row;
  }

  createEmptyRow() {
    return new Array(this.headers.length).fill('');
  }

  validateRow(row) {
    if (!Array.isArray(row)) return false;
    return row.length === this.headers.length;
  }

  mapRowToObject(row) {
    const obj = {};
    this.headers.forEach((header, index) => {
      if (header && index < row.length) {
        obj[header] = row[index];
      }
    });
    return obj;
  }

  mapObjectToRow(obj) {
    const row = this.createEmptyRow();
    Object.keys(obj).forEach(key => {
      this.setValue(row, key, obj[key]);
    });
    return row;
  }
}