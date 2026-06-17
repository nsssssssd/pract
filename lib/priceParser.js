import fs from 'fs';
import path from 'path';
import { readFileSync } from 'fs';

// ==================== HEADER NORMALIZATION ====================

const HEADER_MAP = {
  article: ['артикул', 'арт.', 'арт', 'код', 'sku', 'code', 'id', 'номер', 'артикул'],
  name: ['наименование', 'название', 'товар', 'продукт', 'name', 'title', 'product', 'название'],
  category: ['категория', 'раздел', 'группа', 'category', 'group', 'section', 'категория'],
  price: ['цена', 'стоимость', 'розница', 'price', 'cost', 'amount', 'sum', 'цена'],
  quantity: ['количество', 'остаток', 'наличие', 'quantity', 'stock', 'count', 'qty', 'available', 'кол-во'],
  description: ['описание', 'примечание', 'description', 'note', 'comment', 'desc', 'описание'],
  image: ['фото', 'изображение', 'картинка', 'photo', 'image', 'picture', 'img', 'url', 'фото'],
  unit: ['единица', 'ед.изм', 'ед', 'unit', 'units', 'measure', 'единица'],
  color: ['цвет', 'оттенок', 'color', 'colour', 'tint', 'цвет'],
  available: ['доступен', 'активен', 'статус', 'available', 'active', 'status', 'enabled', 'в наличии'],
};

export function normalizeHeaderName(header) {
  const h = String(header).toLowerCase().trim().replace(/[\s._-]+/g, '');
  for (const [field, aliases] of Object.entries(HEADER_MAP)) {
    for (const alias of aliases) {
      const a = alias.toLowerCase().trim().replace(/[\s._-]+/g, '');
      if (h === a || h.includes(a) || a.includes(h)) {
        return field;
      }
    }
  }
  return null;
}

// ==================== DATA NORMALIZATION ====================

export function normalizeName(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function normalizePrice(value) {
  const s = String(value || '').replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n);
}

export function normalizeQuantity(value) {
  const s = String(value || '').replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.floor(n);
}

export function normalizeUnit(value) {
  const s = String(value || '').trim().toLowerCase();
  if (!s) return 'шт';
  if (s === 'шт' || s === 'шт.' || s === 'pcs' || s === 'pc') return 'шт';
  if (s === 'букет' || s === 'bouquet' || s === 'bunch') return 'букет';
  if (s === 'кг' || s === 'kg') return 'кг';
  return s;
}

export function normalizeColor(value) {
  const s = String(value || '').trim();
  if (!s) return '#F4A7B9';
  // Если это hex
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s;
  // Цветовые названия → hex
  const colorMap = {
    красный: '#E8506A', red: '#E8506A',
    розовый: '#F4A7B9', pink: '#F4A7B9',
    белый: '#F5F0EB', white: '#F5F0EB',
    жёлтый: '#F9D56E', yellow: '#F9D56E',
    оранжевый: '#FFA726', orange: '#FFA726',
    фиолетовый: '#AB47BC', purple: '#AB47BC',
    синий: '#42A5F5', blue: '#42A5F5',
    зелёный: '#66BB6A', green: '#66BB6A',
    чёрный: '#212121', black: '#212121',
  };
  const lc = s.toLowerCase();
  return colorMap[lc] || '#F4A7B9';
}

export function normalizeImage(value) {
  const s = String(value || '').trim();
  if (!s) return null;
  if (s.startsWith('/uploads/') || s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('uploads/')) return '/' + s;
  return s;
}

export function normalizeAvailable(value, quantity) {
  const s = String(value || '').trim().toLowerCase();
  if (['да', 'yes', '1', 'true', '+', 'y', 'on'].includes(s)) return true;
  if (['нет', 'no', '0', 'false', '-', 'n', 'off'].includes(s)) return false;
  return quantity > 0;
}

export function cleanDescription(value) {
  return String(value || '')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/,+/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/\b(подробнее|описание|детали|информация)\b/gi, '')
    .trim()
    .replace(/^,|,$/g, '')
    .trim();
}

export function detectEmoji(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('тюльпан')) return '🌷';
  if (n.includes('роза')) return '🌹';
  if (n.includes('букет')) return '💐';
  if (n.includes('ромашка')) return '🌼';
  if (n.includes('пион')) return '🌺';
  if (n.includes('орхидея')) return '🌸';
  if (n.includes('подсолнух')) return '🌻';
  if (n.includes('лилия')) return '🪷';
  if (n.includes('хризантема')) return '🏵️';
  if (n.includes('гвоздика')) return '🌷';
  if (n.includes('ирис')) return '⚜️';
  if (n.includes('ландыш')) return '🌿';
  if (n.includes('нарцисс')) return '🌼';
  if (n.includes('гортензия')) return '🌸';
  if (n.includes('эустома')) return '🌺';
  if (n.includes('альстромерия')) return '🌷';
  if (n.includes('гербера')) return '🌼';
  if (n.includes('калла')) return '🌷';
  if (n.includes('антуриум')) return '🌺';
  if (n.includes('статица')) return '🌸';
  if (n.includes('эвкалипт')) return '🌿';
  if (n.includes('зелень')) return '🌿';
  if (n.includes('композиция')) return '💐';
  if (n.includes('корзина')) return '🧺';
  if (n.includes('шляпная')) return '👒';
  if (n.includes('коробка')) return '🎁';
  return '🌷';
}

// ==================== CSV PARSER ====================

function detectDelimiter(content) {
  const firstLines = content.split('\n').slice(0, 5).join('\n');
  const counts = {
    ';': (firstLines.match(/;/g) || []).length,
    '\t': (firstLines.match(/\t/g) || []).length,
    ',': (firstLines.match(/,/g) || []).length,
  };
  let best = ',';
  let max = counts[','];
  for (const [del, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      best = del;
    }
  }
  return best;
}

function parseCSV(content) {
  const delimiter = detectDelimiter(content);
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

export function parseCSVFile(filePath) {
  let content = readFileSync(filePath);
  // Try UTF-8 first
  let text = content.toString('utf-8');
  // Check for UTF-8 BOM
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }
  // If looks like Windows-1251 (has common CP1251 artifacts or invalid UTF-8 sequences)
  // Check if we have valid UTF-8 by looking for replacement characters or specific CP1251 patterns
  const hasInvalidUtf8 = /\uFFFD/.test(text) || /[\u0080-\u009F]/.test(text);
  // Check if Russian text looks garbled (common CP1251 indicator)
  const looksLikeCp1251 = /[\u0400-\u04FF]/.test(text) === false && text.includes('Ð');
  
  if (hasInvalidUtf8 || looksLikeCp1251) {
    try {
      // Use latin1 as a proxy for CP1251 - each byte maps to same code point
      text = content.toString('latin1');
      // Convert CP1251 to UTF-8 manually
      const cp1251ToUtf8 = (str) => {
        const cp1251Map = {
          0xC0: 'А', 0xC1: 'Б', 0xC2: 'В', 0xC3: 'Г', 0xC4: 'Д', 0xC5: 'Е', 0xC6: 'Ж', 0xC7: 'З',
          0xC8: 'И', 0xC9: 'Й', 0xCA: 'К', 0xCB: 'Л', 0xCC: 'М', 0xCD: 'Н', 0xCE: 'О', 0xCF: 'П',
          0xD0: 'Р', 0xD1: 'С', 0xD2: 'Т', 0xD3: 'У', 0xD4: 'Ф', 0xD5: 'Х', 0xD6: 'Ц', 0xD7: 'Ч',
          0xD8: 'Ш', 0xD9: 'Щ', 0xDA: 'Ъ', 0xDB: 'Ы', 0xDC: 'Ь', 0xDD: 'Э', 0xDE: 'Ю', 0xDF: 'Я',
          0xE0: 'а', 0xE1: 'б', 0xE2: 'в', 0xE3: 'г', 0xE4: 'д', 0xE5: 'е', 0xE6: 'ж', 0xE7: 'з',
          0xE8: 'и', 0xE9: 'й', 0xEA: 'к', 0xEB: 'л', 0xEC: 'м', 0xED: 'н', 0xEE: 'о', 0xEF: 'п',
          0xF0: 'р', 0xF1: 'с', 0xF2: 'т', 0xF3: 'у', 0xF4: 'ф', 0xF5: 'х', 0xF6: 'ц', 0xF7: 'ч',
          0xF8: 'ш', 0xF9: 'щ', 0xFA: 'ъ', 0xFB: 'ы', 0xFC: 'ь', 0xFD: 'э', 0xFE: 'ю', 0xFF: 'я',
          0xB8: 'ё', 0xA8: 'Ё',
        };
        let result = '';
        for (let i = 0; i < str.length; i++) {
          const code = str.charCodeAt(i);
          result += cp1251Map[code] || str[i];
        }
        return result;
      };
      text = cp1251ToUtf8(text);
    } catch {
      // fallback to utf-8
    }
  }
  return parseCSV(text);
}

// ==================== XLSX PARSER (ZipArchive + SimpleXML-like) ====================

function parseXLSX(filePath) {
  const { readFileSync } = require('fs');
  const buffer = readFileSync(filePath);
  
  // XLSX is a ZIP file - parse it manually
  // Find local file headers (signature 0x04034b50)
  const entries = [];
  let pos = 0;
  while (pos < buffer.length - 30) {
    if (buffer.readUInt32LE(pos) === 0x04034b50) {
      const compressedSize = buffer.readUInt32LE(pos + 18);
      const uncompressedSize = buffer.readUInt32LE(pos + 22);
      const nameLen = buffer.readUInt16LE(pos + 26);
      const extraLen = buffer.readUInt16LE(pos + 28);
      const name = buffer.toString('utf-8', pos + 30, pos + 30 + nameLen);
      const dataStart = pos + 30 + nameLen + extraLen;
      const data = buffer.slice(dataStart, dataStart + compressedSize);
      entries.push({ name, data, compressedSize, uncompressedSize });
      pos = dataStart + compressedSize;
    } else {
      pos++;
    }
  }

  // Find shared strings
  let sharedStrings = [];
  const ssEntry = entries.find((e) => e.name === 'xl/sharedStrings.xml');
  if (ssEntry) {
    // Simple inflate for stored (not compressed) entries
    let ssXml = ssEntry.data.toString('utf-8');
    if (ssEntry.compressedSize !== ssEntry.uncompressedSize) {
      // For compressed data, we'd need zlib - skip for now and use a simpler approach
      // Try to find strings directly in the compressed data
      const textMatches = ssEntry.data.toString('utf-8').match(/<t>([^<]*)<\/t>/g) || [];
      sharedStrings = textMatches.map((t) => t.replace(/<\/?t>/g, ''));
    } else {
      const siMatches = ssXml.match(/<si>([\s\S]*?)<\/si>/g) || [];
      sharedStrings = siMatches.map((si) => {
        const tMatch = si.match(/<t>([^<]*)<\/t>/g);
        return tMatch ? tMatch.map((t) => t.replace(/<\/?t>/g, '')).join('') : '';
      });
    }
  }

  // Find sheet1
  const sheetEntry = entries.find((e) => e.name.match(/xl\/worksheets\/sheet1\.xml/));
  if (!sheetEntry) {
    throw new Error('Sheet1 not found in XLSX');
  }

  let sheetXml = sheetEntry.data.toString('utf-8');
  // If compressed, strings might be garbled - try to extract cell values directly
  const rowMatches = sheetXml.match(/<row[^>]*>([\s\S]*?)<\/row>/g) || [];

  return rowMatches.map((row) => {
    const cellMatches = row.match(/<c[^>]*>([\s\S]*?)<\/c>/g) || [];
    return cellMatches.map((cell) => {
      const typeMatch = cell.match(/t="([^"]*)"/);
      const type = typeMatch ? typeMatch[1] : '';
      const vMatch = cell.match(/<v>([^<]*)<\/v>/);
      const v = vMatch ? vMatch[1] : '';
      if (type === 's') {
        const idx = parseInt(v, 10);
        return sharedStrings[idx] || '';
      }
      return v;
    });
  });
}

// ==================== XLS BIFF8 PARSER (simplified) ====================

function parseXLS(filePath) {
  const buffer = readFileSync(filePath);

  // Check OLE2 header
  if (buffer[0] !== 0xD0 || buffer[1] !== 0xCF || buffer[2] !== 0x11 || buffer[3] !== 0xE0) {
    // Not OLE2, try fallback
    return parseXLSFallback(buffer);
  }

  // Simple BIFF8 parser - find worksheet stream
  // This is a simplified implementation that may not handle all XLS files
  // For production, consider using a more robust parser or converting XLS to XLSX first

  // Try to find SST (Shared String Table) and extract strings
  const strings = [];
  for (let i = 0; i < buffer.length - 4; i++) {
    if (buffer[i] === 0xFC && buffer[i + 1] === 0x00) {
      // SST record
      const size = buffer.readUInt16LE(i + 2);
      // Extract strings from SST (simplified)
      let pos = i + 4;
      const count = buffer.readUInt32LE(pos);
      pos += 4;
      for (let j = 0; j < Math.min(count, 10000) && pos < buffer.length; j++) {
        const len = buffer.readUInt16LE(pos);
        pos += 2;
        const flags = buffer[pos++];
        const isUnicode = (flags & 0x01) !== 0;
        const hasRich = (flags & 0x08) !== 0;
        const hasFarEast = (flags & 0x04) !== 0;
        let richSize = 0;
        let farEastSize = 0;
        if (hasRich) {
          richSize = buffer.readUInt16LE(pos);
          pos += 2;
        }
        if (hasFarEast) {
          farEastSize = buffer.readUInt32LE(pos);
          pos += 4;
        }
        const byteLen = isUnicode ? len * 2 : len;
        if (pos + byteLen > buffer.length) break;
        const str = isUnicode
          ? buffer.toString('utf-16le', pos, pos + byteLen)
          : buffer.toString('latin1', pos, pos + byteLen);
        strings.push(str);
        pos += byteLen;
        pos += richSize * 4;
        pos += farEastSize;
      }
      break;
    }
  }

  // Find cell records and build rows
  const rows = [];
  let currentRow = -1;
  let currentRowData = [];

  for (let i = 0; i < buffer.length - 4; i++) {
    // RK record (0x7E) or Number record (0x03) or LabelSST (0xFD) or Label (0x04)
    const recType = buffer.readUInt16LE(i);
    const recSize = buffer.readUInt16LE(i + 2);

    if (recType === 0x0203) { // RK
      const row = buffer.readUInt16LE(i + 4);
      const col = buffer.readUInt16LE(i + 6);
      const rk = buffer.readUInt32LE(i + 8); // simplified, actually 8 bytes
      if (row !== currentRow) {
        if (currentRow >= 0) rows.push(currentRowData);
        currentRow = row;
        currentRowData = [];
      }
      currentRowData[col] = String(rk);
      i += 4 + recSize - 1;
    } else if (recType === 0x00FD) { // LabelSST
      const row = buffer.readUInt16LE(i + 4);
      const col = buffer.readUInt16LE(i + 6);
      const sstIdx = buffer.readUInt32LE(i + 8);
      if (row !== currentRow) {
        if (currentRow >= 0) rows.push(currentRowData);
        currentRow = row;
        currentRowData = [];
      }
      currentRowData[col] = strings[sstIdx] || '';
      i += 4 + recSize - 1;
    } else if (recType === 0x0004) { // Label (direct string)
      const row = buffer.readUInt16LE(i + 4);
      const col = buffer.readUInt16LE(i + 6);
      const len = buffer.readUInt16LE(i + 8);
      const flags = buffer[i + 10];
      const isUnicode = (flags & 0x01) !== 0;
      const byteLen = isUnicode ? len * 2 : len;
      const str = isUnicode
        ? buffer.toString('utf-16le', i + 11, i + 11 + byteLen)
        : buffer.toString('latin1', i + 11, i + 11 + byteLen);
      if (row !== currentRow) {
        if (currentRow >= 0) rows.push(currentRowData);
        currentRow = row;
        currentRowData = [];
      }
      currentRowData[col] = str;
      i += 4 + recSize - 1;
    }
  }

  if (currentRow >= 0) rows.push(currentRowData);

  if (rows.length === 0) {
    return parseXLSFallback(buffer);
  }

  return rows;
}

function parseXLSFallback(buffer) {
  // Try HTML table inside
  const text = buffer.toString('utf-8');
  const tableMatch = text.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (tableMatch) {
    const rows = [];
    const trMatches = tableMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    for (const tr of trMatches) {
      const cells = [];
      const tdMatches = tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
      for (const td of tdMatches) {
        cells.push(td.replace(/<[^>]+>/g, '').trim());
      }
      if (cells.length > 0) rows.push(cells);
    }
    if (rows.length > 0) return rows;
  }

  // Try as delimited text
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => line.split(/[;\t,]/));
}

// ==================== CONVERT ROWS TO PRODUCTS ====================

const DEFAULT_HEADERS = ['article', 'name', 'price', 'quantity', 'unit', 'description', 'image', 'color'];

export function convertRowsToProducts(rows) {
  if (!rows || rows.length === 0) return [];

  // Detect if first row is headers
  const firstRow = rows[0];
  const mappedHeaders = firstRow.map(normalizeHeaderName);
  const hasHeaders = mappedHeaders.some((h) => h !== null);

  let headers = [];
  let dataRows = rows;

  if (hasHeaders) {
    headers = mappedHeaders;
    dataRows = rows.slice(1);
  } else {
    // No headers - use default mapping
    headers = DEFAULT_HEADERS.map((h, i) => (i < firstRow.length ? h : null));
  }

  const products = [];

  for (const row of dataRows) {
    if (!row || row.length === 0) continue;

    const item = {};
    for (let i = 0; i < headers.length; i++) {
      const field = headers[i];
      if (!field) continue;
      item[field] = row[i] !== undefined ? row[i] : '';
    }

    // Normalize
    const name = normalizeName(item.name);
    const article = String(item.article || '').trim();

    if (!name && !article) continue; // Skip empty rows

    const price = normalizePrice(item.price);
    const quantity = normalizeQuantity(item.quantity);

    const product = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      article: article,
      name: name || `${article} — тюльпан`,
      description: cleanDescription(item.description),
      price: price,
      unit: normalizeUnit(item.unit),
      emoji: detectEmoji(name || article),
      color: normalizeColor(item.color),
      image: normalizeImage(item.image),
      available: normalizeAvailable(item.available, quantity),
      category: normalizeName(item.category) || '',
      quantity: quantity,
    };

    products.push(product);
  }

  return products;
}

// ==================== MAIN ENTRY POINT ====================

export async function parseUploadedPriceFile(filePath, extension) {
  const ext = extension.toLowerCase().replace(/^\./, '');
  let rows = [];

  try {
    if (ext === 'csv') {
      rows = parseCSVFile(filePath);
    } else if (ext === 'xlsx') {
      rows = parseXLSX(filePath);
    } else if (ext === 'xls') {
      rows = parseXLS(filePath);
    } else {
      throw new Error(`Unsupported file format: ${extension}`);
    }
  } catch (err) {
    throw new Error(`Failed to parse file: ${err.message}`);
  }

  return convertRowsToProducts(rows);
}
