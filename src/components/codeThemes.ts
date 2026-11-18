import type { PrismTheme } from 'prism-react-renderer';

/** Token colors chosen for at least 4.5:1 contrast on the code block backgrounds (#fbfbf9 light, #141517 dark). */
function theme(plain: { color: string; backgroundColor: string }, c: Record<'comment' | 'keyword' | 'string' | 'func' | 'number' | 'tag' | 'attr' | 'prop' | 'punct', string>): PrismTheme {
  return {
    plain,
    styles: [
      { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: c.comment, fontStyle: 'italic' } },
      { types: ['keyword', 'selector', 'important', 'atrule', 'builtin'], style: { color: c.keyword } },
      { types: ['string', 'char', 'template-string', 'regex', 'url'], style: { color: c.string } },
      { types: ['function', 'class-name', 'maybe-class-name'], style: { color: c.func } },
      { types: ['number', 'boolean', 'constant', 'symbol'], style: { color: c.number } },
      { types: ['tag'], style: { color: c.tag } },
      { types: ['attr-name'], style: { color: c.attr } },
      { types: ['attr-value'], style: { color: c.string } },
      { types: ['property', 'variable'], style: { color: c.prop } },
      { types: ['punctuation', 'operator'], style: { color: c.punct } },
    ],
  };
}

export const codeThemeLight = theme(
  { color: '#1f2328', backgroundColor: '#fbfbf9' },
  { comment: '#5a6069', keyword: '#a0111f', string: '#0a3069', func: '#6639ba', number: '#0550ae', tag: '#116329', attr: '#0550ae', prop: '#8a3700', punct: '#3d4148' },
);

export const codeThemeDark = theme(
  { color: '#e6edf3', backgroundColor: '#141517' },
  { comment: '#9ba3ad', keyword: '#ff7b72', string: '#a5d6ff', func: '#d2a8ff', number: '#79c0ff', tag: '#7ee787', attr: '#79c0ff', prop: '#ffa657', punct: '#c9d1d9' },
);
