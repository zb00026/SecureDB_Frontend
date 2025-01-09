import { IntlProvider } from 'react-intl';
import { useState, useEffect } from 'react';
import { state, useMyState } from '../../state';
import enLang from '../../../locales/en.json';

export function MyIntlProvider({ children }: any) {
  const { snap } = useMyState();
  const [lang, setLang] = useState('en');
  const [messages, setMessages] = useState({ ...enLang});

  useEffect(() => {
    const lang = snap.storage.locale ?? 'en';

    if (lang === 'en') return setMessages({ ...enLang});

    Promise.all([
      import(`../../../locales/${lang}.json`),
    ])
      .then(([langData]) => {
        setMessages(Object.assign(langData.default));
        setLang(lang);
        state.storage.locale = lang;
      })
      .catch((err) => {
        // Handle error
        console.log('Intl Error', err);
      });
  }, [snap.storage.locale]);

  return (
    <IntlProvider locale={lang} messages={messages} defaultLocale={lang}>
      {children}
    </IntlProvider>
  );
}
