import { Highlight } from 'prism-react-renderer';
import { codeThemeDark, codeThemeLight } from './codeThemes';
import { useEffect, useState } from 'react';
import { CopyButton } from './CopyButton';
import styles from './CodeBlock.module.css';

type CodeBlockProps = {
  code: string;
  language: 'tsx' | 'css' | 'markdown' | 'json';
  filename: string;
};

export function usePrefersDark(): boolean {
  const query = '(prefers-color-scheme: dark)';
  const [dark, setDark] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return;
    const onChange = (e: MediaQueryListEvent): void => setDark(e.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return dark;
}

export function CodeBlock({ code, language, filename }: CodeBlockProps): JSX.Element {
  const dark = usePrefersDark();
  const trimmed = code.replace(/\n$/, '');
  return (
    <figure className={`${styles.frame} m-0`}>
      <figcaption className={styles.header}>
        <p className={styles.filename}>{filename}</p>
        <CopyButton text={code} label={`Copy ${filename}`} />
      </figcaption>
      <div className={styles.scroller} tabIndex={0} role="region" aria-label={`${filename} source`}>
        <Highlight code={trimmed} language={language} theme={dark ? codeThemeDark : codeThemeLight}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={`${className} ${styles.pre}`} style={style}>
              <code>
                {tokens.map((line, i) => (
                  <span key={i} {...getLineProps({ line })} className={styles.line}>
                    <span className={styles.lineNo} aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className={styles.lineContent}>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </span>
                  </span>
                ))}
              </code>
            </pre>
          )}
        </Highlight>
      </div>
    </figure>
  );
}
