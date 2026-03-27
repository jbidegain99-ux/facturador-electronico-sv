import * as Handlebars from 'handlebars';
import { formatCurrency } from './currency.helper';
import { formatDate, formatTime } from './date.helper';
import { dteTypeName } from './dte-type-name.helper';
import { numberToWords } from './number-to-words.helper';

export function registerHelpers(hbs: typeof Handlebars): void {
  // Formatting helpers
  hbs.registerHelper('formatCurrency', (amount) => formatCurrency(amount));
  hbs.registerHelper('formatDate', (date) => formatDate(date));
  hbs.registerHelper('formatTime', (time) => formatTime(time));
  hbs.registerHelper('dteTypeName', (code) => dteTypeName(code));
  hbs.registerHelper('totalLetras', (amount) => numberToWords(amount));

  // Comparison helpers
  hbs.registerHelper('eq', (a, b) => a === b);
  hbs.registerHelper('neq', (a, b) => a !== b);
  hbs.registerHelper('gt', (a, b) => Number(a) > Number(b));
  hbs.registerHelper('gte', (a, b) => Number(a) >= Number(b));
  hbs.registerHelper('lt', (a, b) => Number(a) < Number(b));
  hbs.registerHelper('or', (...args) => {
    // Last arg is the Handlebars options object
    const values = args.slice(0, -1);
    return values.some(Boolean);
  });
  hbs.registerHelper('and', (...args) => {
    const values = args.slice(0, -1);
    return values.every(Boolean);
  });

  // Utility helpers
  hbs.registerHelper('json', (obj) => JSON.stringify(obj, null, 2));
  hbs.registerHelper('multiply', (a, b) => {
    const result = Number(a) * Number(b);
    return isNaN(result) ? 0 : result;
  });
  hbs.registerHelper('add', (a, b) => {
    const result = Number(a) + Number(b);
    return isNaN(result) ? 0 : result;
  });
  hbs.registerHelper('ifCond', function (
    this: unknown,
    v1: unknown,
    operator: string,
    v2: unknown,
    options: Handlebars.HelperOptions,
  ) {
    switch (operator) {
      case '===':
        return v1 === v2 ? options.fn(this) : options.inverse(this);
      case '!==':
        return v1 !== v2 ? options.fn(this) : options.inverse(this);
      case '>':
        return Number(v1) > Number(v2)
          ? options.fn(this)
          : options.inverse(this);
      case '<':
        return Number(v1) < Number(v2)
          ? options.fn(this)
          : options.inverse(this);
      case '>=':
        return Number(v1) >= Number(v2)
          ? options.fn(this)
          : options.inverse(this);
      case '<=':
        return Number(v1) <= Number(v2)
          ? options.fn(this)
          : options.inverse(this);
      default:
        return options.inverse(this);
    }
  });
}
