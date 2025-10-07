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

  /**
   * Convert 1-based column number to Excel-style letter(s)
   * Handles single letters (A-Z) and multi-letter columns (AA, AB, BA, etc.)
   * @param {number} colNum - Column number (1=A, 26=Z, 27=AA, 53=BA, 703=AAA)
   * @returns {string} Column letter(s)
   * @private
   */
  _columnNumberToLetter(colNum) {
    if (!Number.isInteger(colNum) || colNum < 1) {
      throw new Error(`SafeColumnAccess._columnNumberToLetter: colNum must be integer >= 1, got ${colNum}`);
    }

    let result = '';
    let num = colNum;

    while (num > 0) {
      const remainder = (num - 1) % 26;
      result = String.fromCharCode(65 + remainder) + result;
      num = Math.floor((num - 1) / 26);
    }

    return result;
  }

  /**
   * Convert Excel-style letter(s) to 1-based column number
   * @param {string} letter - Column letter(s) (A=1, Z=26, AA=27, BA=53)
   * @returns {number} Column number
   * @private
   */
  _columnLetterToNumber(letter) {
    if (!letter || typeof letter !== 'string') {
      throw new Error(`SafeColumnAccess._columnLetterToNumber: letter must be non-empty string, got ${letter}`);
    }

    const upperLetter = letter.toUpperCase();
    let result = 0;

    for (let i = 0; i < upperLetter.length; i++) {
      const charCode = upperLetter.charCodeAt(i);
      if (charCode < 65 || charCode > 90) {
        throw new Error(`SafeColumnAccess._columnLetterToNumber: invalid character in "${letter}" at position ${i}`);
      }
      result = result * 26 + (charCode - 64);
    }

    return result;
  }

  /**
   * Get Excel column letter for a named column
   * @param {string} columnName - Header name (e.g., 'action_id')
   * @returns {string|null} Column letter (e.g., 'A', 'BA') or null if not found
   */
  getColumnLetter(columnName) {
    const index = this.getColumnIndex(columnName);
    if (index < 0) {
      return null;
    }
    return this._columnNumberToLetter(index + 1); // Convert 0-based index to 1-based column
  }

  /**
   * Build A1 notation range for entire row
   * Used for batch updates to prevent manual String.fromCharCode calculations
   * @param {number} sheetRowIndex - 1-based sheet row number
   * @returns {string} A1 range notation (e.g., "A5:BA5" for row 5 with 53 columns)
   */
  getRowRange(sheetRowIndex) {
    if (!Number.isInteger(sheetRowIndex) || sheetRowIndex < 1) {
      throw new Error(`SafeColumnAccess.getRowRange: sheetRowIndex must be integer >= 1, got ${sheetRowIndex}`);
    }

    if (this.headers.length === 0) {
      throw new Error('SafeColumnAccess.getRowRange: headers array is empty');
    }

    const lastColumnLetter = this._columnNumberToLetter(this.headers.length);
    return `A${sheetRowIndex}:${lastColumnLetter}${sheetRowIndex}`;
  }
}